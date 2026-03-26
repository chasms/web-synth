import {
  calculateSyncedRate,
  constrainLfoDepth,
  constrainLfoPhaseOffset,
  constrainLfoRate,
  isValidLfoWaveform,
  LFO_BPM_DEFAULT,
  LFO_DEPTH_DEFAULT,
  LFO_PHASE_OFFSET_DEFAULT,
  LFO_RATE_DEFAULT,
  LFO_SYNC_DIVISION_DEFAULT,
  sampleHoldValueForStep,
  type LfoSyncDivision,
  type LfoWaveform,
} from "../../utils/lfoUtils";

/** Default fade-in time in seconds (0 = no fade) */
const FADE_IN_DEFAULT = 0;

/** Minimum fade-in time */
const FADE_IN_MINIMUM = 0;

/** Maximum fade-in time in seconds */
const FADE_IN_MAXIMUM = 10;

/** Default CV modulation range for rate (Hz) */
const RATE_CV_AMOUNT_DEFAULT = 10;

/** Minimum CV modulation range for rate */
const RATE_CV_AMOUNT_MINIMUM = 0;

/** Maximum CV modulation range for rate */
const RATE_CV_AMOUNT_MAXIMUM = 50;
import type { CreateModuleFn, ModuleInstance, PortDefinition } from "../types";
import { smoothParam } from "../utils/smoothing";

export interface LFOParams {
  rate?: number; // Hz (0.01 to 50), used when syncEnabled is false
  depth?: number; // 0 to 1
  waveform?: LfoWaveform;
  bipolar?: boolean; // true = -1..+1, false = 0..+1
  syncEnabled?: boolean; // If true, rate is derived from bpm + syncDivision
  bpm?: number; // Tempo in BPM (20-300), used when syncEnabled is true
  syncDivision?: LfoSyncDivision; // Note division for sync mode
  phaseOffset?: number; // Starting phase (0..1, where 0.5 = 180°)
  rateCvAmount?: number; // CV modulation range for rate (0–50 Hz), default 10
  fadeIn?: number; // Fade-in / attack time in seconds (0 = instant, max 10)
}

const ports: PortDefinition[] = [
  {
    id: "cv_out",
    label: "CV Out",
    direction: "out",
    signal: "CV",
    metadata: {
      bipolar: true,
      description: "Main LFO output signal",
    },
  },
  {
    id: "inverted_cv_out",
    label: "Inv CV",
    direction: "out",
    signal: "CV",
    metadata: {
      bipolar: true,
      description: "Inverted LFO output (180° phase)",
    },
  },
  {
    id: "rate_cv",
    label: "Rate CV",
    direction: "in",
    signal: "CV",
    metadata: {
      description: "Rate CV modulation input (CV × rateCvAmount added to base rate)",
    },
  },
  {
    id: "reset",
    label: "Reset",
    direction: "in",
    signal: "TRIGGER",
    metadata: {
      description: "Reset LFO phase (future)",
    },
  },
];

/**
 * Creates an LFO (Low Frequency Oscillator) module for modulating parameters.
 *
 * The LFO generates a low-frequency waveform that can be connected to CV inputs
 * on other modules for modulation effects (vibrato, tremolo, filter sweeps, etc.).
 *
 * Signal chain:
 * - Oscillator → Depth Gain → Output (bipolar: -1..+1)
 * - For unipolar output: scaled and offset to 0..+1
 * - Inverted output: Phase-inverted version of main output
 *
 * @param context - Audio module context containing audioContext and moduleId
 * @param parameters - Initial LFO parameters
 * @returns ModuleInstance for the LFO
 */
export const createLFO: CreateModuleFn<LFOParams> = (context, parameters) => {
  const { audioContext, moduleId } = context;

  // Default parameters
  let currentPhaseOffset = constrainLfoPhaseOffset(
    parameters?.phaseOffset ?? LFO_PHASE_OFFSET_DEFAULT,
  );
  let isSyncEnabled = parameters?.syncEnabled ?? false;
  let currentBpm = parameters?.bpm ?? LFO_BPM_DEFAULT;
  let currentSyncDivision: LfoSyncDivision =
    parameters?.syncDivision ?? LFO_SYNC_DIVISION_DEFAULT;

  const getEffectiveRate = (): number => {
    if (isSyncEnabled) {
      return constrainLfoRate(calculateSyncedRate(currentBpm, currentSyncDivision));
    }
    return constrainLfoRate(parameters?.rate ?? LFO_RATE_DEFAULT);
  };

  let currentRateCvAmount = Math.min(
    RATE_CV_AMOUNT_MAXIMUM,
    Math.max(RATE_CV_AMOUNT_MINIMUM, parameters?.rateCvAmount ?? RATE_CV_AMOUNT_DEFAULT),
  );

  let fadeInTime = Math.min(
    FADE_IN_MAXIMUM,
    Math.max(FADE_IN_MINIMUM, parameters?.fadeIn ?? FADE_IN_DEFAULT),
  );

  const initialRate = getEffectiveRate();
  const initialDepth = constrainLfoDepth(
    parameters?.depth ?? LFO_DEPTH_DEFAULT,
  );
  const initialWaveformParam = parameters?.waveform ?? "sine";
  const isSampleHoldWaveform = initialWaveformParam === "sample_hold";
  const initialOscWaveform: OscillatorType = isValidLfoWaveform(
    initialWaveformParam,
  ) && !isSampleHoldWaveform
    ? (initialWaveformParam as OscillatorType)
    : "sine";
  let currentWaveform: LfoWaveform = initialWaveformParam;
  let isBipolar = parameters?.bipolar ?? true;

  // Create the LFO oscillator (always running, muted when in S&H mode)
  const oscillatorNode = audioContext.createOscillator();
  oscillatorNode.type = initialOscWaveform;
  oscillatorNode.frequency.value = initialRate;

  // Rate CV modulation: incoming CV (-1..+1) × rateCvAmount → added to oscillator frequency
  const rateCvGainNode = audioContext.createGain();
  rateCvGainNode.gain.value = currentRateCvAmount;
  // rateCvGainNode output is connected to oscillatorNode.frequency (AudioParam)
  rateCvGainNode.connect(oscillatorNode.frequency);

  // Route gain for oscillator: 1 in normal mode, 0 in S&H mode
  const oscillatorRouteGain = audioContext.createGain();
  oscillatorRouteGain.gain.value = isSampleHoldWaveform ? 0 : 1;

  // Sample & Hold source node (ConstantSourceNode stepped by timer)
  const sampleHoldSourceNode = audioContext.createConstantSource();
  sampleHoldSourceNode.offset.value = 0;

  // Route gain for S&H: 0 in normal mode, 1 in S&H mode
  const sampleHoldRouteGain = audioContext.createGain();
  sampleHoldRouteGain.gain.value = isSampleHoldWaveform ? 1 : 0;

  // S&H step state
  let sampleHoldStepIndex = 0;
  let sampleHoldTimerId: ReturnType<typeof setInterval> | null = null;

  const updateSampleHoldValue = () => {
    sampleHoldSourceNode.offset.setValueAtTime(
      sampleHoldValueForStep(sampleHoldStepIndex),
      audioContext.currentTime,
    );
    sampleHoldStepIndex += 1;
  };

  const startSampleHoldTimer = () => {
    if (sampleHoldTimerId !== null) {
      clearInterval(sampleHoldTimerId);
    }
    const rateHz = oscillatorNode.frequency.value;
    const intervalMs = (1 / rateHz) * 1000;
    updateSampleHoldValue(); // Set initial value immediately
    sampleHoldTimerId = setInterval(updateSampleHoldValue, intervalMs);
  };

  const stopSampleHoldTimer = () => {
    if (sampleHoldTimerId !== null) {
      clearInterval(sampleHoldTimerId);
      sampleHoldTimerId = null;
    }
  };

  if (isSampleHoldWaveform) {
    startSampleHoldTimer();
  }

  // Depth control gain node (scales the mixed oscillator/S&H output)
  const depthGainNode = audioContext.createGain();
  depthGainNode.gain.value = initialDepth;

  // For unipolar mode, we need to add a DC offset
  // Bipolar: oscillator output is -1..+1, multiplied by depth
  // Unipolar: we need to shift this to 0..+1
  // We use a ConstantSource for the DC offset
  const dcOffsetNode = audioContext.createConstantSource();
  dcOffsetNode.offset.value = isBipolar ? 0 : 0.5; // 0.5 shifts center from 0 to 0.5

  // For unipolar, we also need to halve the oscillator amplitude
  // so that (osc * 0.5 * depth) + (0.5 * depth) ranges from 0 to depth
  const unipolarScaleNode = audioContext.createGain();
  unipolarScaleNode.gain.value = isBipolar ? 1 : 0.5;

  // Fade-in gain node: starts at 0 and ramps to 1 over fadeInTime seconds
  const fadeInGainNode = audioContext.createGain();
  fadeInGainNode.gain.value = fadeInTime > 0 ? 0 : 1;

  // Output summing node
  const outputNode = audioContext.createGain();
  outputNode.gain.value = 1;

  // Inverted output node (multiplies signal by -1)
  const invertedGainNode = audioContext.createGain();
  invertedGainNode.gain.value = -1;

  const invertedOutputNode = audioContext.createGain();
  invertedOutputNode.gain.value = 1;

  // Connect the signal chain
  // (Oscillator → OscRoute + S&H → S&HRoute) → Unipolar Scale → Depth → Output
  oscillatorNode.connect(oscillatorRouteGain);
  oscillatorRouteGain.connect(unipolarScaleNode);
  sampleHoldSourceNode.connect(sampleHoldRouteGain);
  sampleHoldRouteGain.connect(unipolarScaleNode);
  unipolarScaleNode.connect(depthGainNode);
  depthGainNode.connect(fadeInGainNode);
  fadeInGainNode.connect(outputNode);

  // DC offset for unipolar mode → Output
  // The offset is scaled by depth for proper unipolar output
  const dcScaleNode = audioContext.createGain();
  dcScaleNode.gain.value = isBipolar ? 0 : initialDepth;
  dcOffsetNode.connect(dcScaleNode);
  dcScaleNode.connect(outputNode);

  // Inverted output
  outputNode.connect(invertedGainNode);
  invertedGainNode.connect(invertedOutputNode);

  // Mutable reference so it can be replaced on reset
  let activeOscillatorNode = oscillatorNode;

  /**
   * Starts the fade-in envelope from 0 to 1 over fadeInTime seconds.
   * If fadeInTime is 0, the gain is set to 1 immediately.
   */
  const triggerFadeIn = () => {
    fadeInGainNode.gain.cancelScheduledValues(audioContext.currentTime);
    if (fadeInTime > 0) {
      fadeInGainNode.gain.setValueAtTime(0, audioContext.currentTime);
      fadeInGainNode.gain.linearRampToValueAtTime(
        1,
        audioContext.currentTime + fadeInTime,
      );
    } else {
      fadeInGainNode.gain.setValueAtTime(1, audioContext.currentTime);
    }
  };

  /**
   * Resets the LFO phase to zero by recreating the oscillator.
   * Also resets the S&H step index.
   */
  const triggerReset = () => {
    sampleHoldStepIndex = 0;

    triggerFadeIn();

    if (currentWaveform === "sample_hold") {
      // For S&H, just restart from step 0
      startSampleHoldTimer();
      return;
    }

    // Recreate the oscillator to reset phase
    const oldOscillator = activeOscillatorNode;
    try {
      oldOscillator.stop();
    } catch {
      /* already stopped */
    }
    oldOscillator.disconnect();

    const newOscillator = audioContext.createOscillator();
    newOscillator.type = oldOscillator.type;
    newOscillator.frequency.value = oldOscillator.frequency.value;
    newOscillator.connect(oscillatorRouteGain);
    // Reconnect rate CV gain to the new oscillator frequency
    rateCvGainNode.connect(newOscillator.frequency);
    // Apply phase offset: start slightly in the past so the current phase matches offset
    const rateHz = newOscillator.frequency.value;
    const offsetSeconds = rateHz > 0 ? currentPhaseOffset / rateHz : 0;
    newOscillator.start(audioContext.currentTime - offsetSeconds);
    activeOscillatorNode = newOscillator;
  };

  // Start the oscillator with phase offset (start in the past to simulate phase offset)
  const initialOffsetSeconds =
    initialRate > 0 ? currentPhaseOffset / initialRate : 0;
  oscillatorNode.start(audioContext.currentTime - initialOffsetSeconds);
  dcOffsetNode.start();
  sampleHoldSourceNode.start();

  // Apply fade-in on startup
  triggerFadeIn();

  const portNodes: ModuleInstance["portNodes"] = {
    cv_out: outputNode,
    inverted_cv_out: invertedOutputNode,
    rate_cv: rateCvGainNode, // CV input for rate modulation
    reset: undefined,
  };

  /**
   * Updates the output configuration for bipolar/unipolar mode
   */
  const updateBipolarMode = (bipolar: boolean) => {
    isBipolar = bipolar;
    const currentDepth = depthGainNode.gain.value;

    if (bipolar) {
      // Bipolar: full oscillator range, no DC offset
      smoothParam(audioContext, unipolarScaleNode.gain, 1, {
        mode: "linear",
        time: 0.02,
      });
      smoothParam(audioContext, dcScaleNode.gain, 0, {
        mode: "linear",
        time: 0.02,
      });
    } else {
      // Unipolar: halve oscillator, add DC offset scaled by depth
      smoothParam(audioContext, unipolarScaleNode.gain, 0.5, {
        mode: "linear",
        time: 0.02,
      });
      smoothParam(audioContext, dcScaleNode.gain, currentDepth, {
        mode: "linear",
        time: 0.02,
      });
    }
  };

  console.log(`[LFO ${moduleId}] Created with:`, {
    rate: initialRate,
    depth: initialDepth,
    waveform: initialWaveform,
    bipolar: isBipolar,
  });

  const instance: ModuleInstance = {
    id: moduleId,
    type: "LFO",
    label: `LFO ${moduleId}`,
    ports,
    audioOut: outputNode, // Primary output for convenience
    portNodes,
    connect(fromPortId, target) {
      const fromConnectionNode = portNodes[fromPortId];
      const toConnectionEntity = target.module.portNodes[target.portId];
      if (!fromConnectionNode || !toConnectionEntity) return;

      console.log(
        `[LFO ${moduleId}] Connecting from ${fromPortId} to ${target.module.id}.${target.portId}`,
        {
          fromNode: fromConnectionNode,
          toEntity: toConnectionEntity,
        },
      );

      if (
        fromConnectionNode instanceof AudioNode &&
        toConnectionEntity instanceof AudioNode
      ) {
        fromConnectionNode.connect(toConnectionEntity);
        console.log(
          `[LFO ${moduleId}] ✓ AudioNode → AudioNode connection made`,
        );
      } else if (
        fromConnectionNode instanceof AudioNode &&
        toConnectionEntity instanceof AudioParam
      ) {
        fromConnectionNode.connect(toConnectionEntity);
        console.log(
          `[LFO ${moduleId}] ✓ AudioNode → AudioParam connection made`,
        );
      }
    },
    updateParams(partial) {
      // Handle sync parameters first so rate update reflects current sync state
      if (
        partial["syncEnabled"] !== undefined &&
        typeof partial["syncEnabled"] === "boolean"
      ) {
        isSyncEnabled = partial["syncEnabled"];
      }

      if (
        partial["bpm"] !== undefined &&
        typeof partial["bpm"] === "number"
      ) {
        currentBpm = partial["bpm"];
      }

      if (
        partial["syncDivision"] !== undefined &&
        typeof partial["syncDivision"] === "string"
      ) {
        currentSyncDivision = partial["syncDivision"] as LfoSyncDivision;
      }

      // If any sync-related param changed, recompute the rate
      if (
        partial["syncEnabled"] !== undefined ||
        partial["bpm"] !== undefined ||
        partial["syncDivision"] !== undefined
      ) {
        const syncedRate = getEffectiveRate();
        smoothParam(audioContext, activeOscillatorNode.frequency, syncedRate, {
          mode: "setTarget",
          timeConstant: 0.05,
        });
      }

      if (
        partial["rate"] !== undefined &&
        typeof partial["rate"] === "number" &&
        !isSyncEnabled
      ) {
        const nextRate = constrainLfoRate(partial["rate"]);
        smoothParam(audioContext, activeOscillatorNode.frequency, nextRate, {
          mode: "setTarget",
          timeConstant: 0.05,
        });
      }

      if (
        partial["phaseOffset"] !== undefined &&
        typeof partial["phaseOffset"] === "number"
      ) {
        currentPhaseOffset = constrainLfoPhaseOffset(partial["phaseOffset"]);
        // Apply immediately via reset
        triggerReset();
      }

      if (
        partial["rateCvAmount"] !== undefined &&
        typeof partial["rateCvAmount"] === "number"
      ) {
        currentRateCvAmount = Math.min(
          RATE_CV_AMOUNT_MAXIMUM,
          Math.max(RATE_CV_AMOUNT_MINIMUM, partial["rateCvAmount"]),
        );
        smoothParam(audioContext, rateCvGainNode.gain, currentRateCvAmount, {
          mode: "linear",
          time: 0.02,
        });
      }

      if (
        partial["fadeIn"] !== undefined &&
        typeof partial["fadeIn"] === "number"
      ) {
        fadeInTime = Math.min(
          FADE_IN_MAXIMUM,
          Math.max(FADE_IN_MINIMUM, partial["fadeIn"]),
        );
      }

      if (partial["triggerReset"] === true) {
        triggerReset();
      }

      if (
        partial["depth"] !== undefined &&
        typeof partial["depth"] === "number"
      ) {
        const nextDepth = constrainLfoDepth(partial["depth"]);
        smoothParam(audioContext, depthGainNode.gain, nextDepth, {
          mode: "linear",
          time: 0.02,
        });
        // Also update DC scale if in unipolar mode
        if (!isBipolar) {
          smoothParam(audioContext, dcScaleNode.gain, nextDepth, {
            mode: "linear",
            time: 0.02,
          });
        }
      }

      if (
        partial["waveform"] !== undefined &&
        typeof partial["waveform"] === "string"
      ) {
        if (isValidLfoWaveform(partial["waveform"])) {
          const nextWaveform = partial["waveform"] as LfoWaveform;
          const wasHold = currentWaveform === "sample_hold";
          const isNowHold = nextWaveform === "sample_hold";
          currentWaveform = nextWaveform;

          if (isNowHold && !wasHold) {
            // Switch to S&H: silence oscillator, activate S&H source
            oscillatorRouteGain.gain.setValueAtTime(0, audioContext.currentTime);
            sampleHoldRouteGain.gain.setValueAtTime(1, audioContext.currentTime);
            sampleHoldStepIndex = 0;
            startSampleHoldTimer();
          } else if (!isNowHold && wasHold) {
            // Switch from S&H: activate oscillator, silence S&H source
            stopSampleHoldTimer();
            oscillatorRouteGain.gain.setValueAtTime(1, audioContext.currentTime);
            sampleHoldRouteGain.gain.setValueAtTime(0, audioContext.currentTime);
            try {
              activeOscillatorNode.type = nextWaveform as OscillatorType;
            } catch {
              /* ignore invalid */
            }
          } else if (!isNowHold) {
            // Normal waveform change
            try {
              activeOscillatorNode.type = nextWaveform as OscillatorType;
            } catch {
              /* ignore invalid */
            }
          }
        }
      }

      if (
        partial["bipolar"] !== undefined &&
        typeof partial["bipolar"] === "boolean"
      ) {
        updateBipolarMode(partial["bipolar"]);
      }
    },
    getParams() {
      return {
        rate: activeOscillatorNode.frequency.value,
        depth: depthGainNode.gain.value,
        waveform: currentWaveform,
        bipolar: isBipolar,
        syncEnabled: isSyncEnabled,
        bpm: currentBpm,
        syncDivision: currentSyncDivision,
        phaseOffset: currentPhaseOffset,
        rateCvAmount: currentRateCvAmount,
        fadeIn: fadeInTime,
      };
    },
    dispose() {
      stopSampleHoldTimer();
      try {
        activeOscillatorNode.stop();
      } catch {
        /* already stopped */
      }
      try {
        dcOffsetNode.stop();
      } catch {
        /* already stopped */
      }
      try {
        sampleHoldSourceNode.stop();
      } catch {
        /* already stopped */
      }
      activeOscillatorNode.disconnect();
      rateCvGainNode.disconnect();
      fadeInGainNode.disconnect();
      oscillatorRouteGain.disconnect();
      sampleHoldSourceNode.disconnect();
      sampleHoldRouteGain.disconnect();
      unipolarScaleNode.disconnect();
      depthGainNode.disconnect();
      dcOffsetNode.disconnect();
      dcScaleNode.disconnect();
      outputNode.disconnect();
      invertedGainNode.disconnect();
      invertedOutputNode.disconnect();
    },
  };

  return instance;
};
