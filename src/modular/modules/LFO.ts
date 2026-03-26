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
      description: "Rate modulation input (future)",
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
  depthGainNode.connect(outputNode);

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
   * Resets the LFO phase to zero by recreating the oscillator.
   * Also resets the S&H step index.
   */
  const triggerReset = () => {
    sampleHoldStepIndex = 0;

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
    // Apply phase offset: start slightly in the past so the current phase matches offset
    const rateHz = newOscillator.frequency.value;
    const offsetSeconds = rateHz > 0 ? currentPhaseOffset / rateHz : 0;
    newOscillator.start(audioContext.currentTime - offsetSeconds);
    activeOscillatorNode = newOscillator;

    // Update portNodes rate_cv reference to point to new oscillator frequency
    portNodes.rate_cv = newOscillator.frequency;
  };

  // Start the oscillator with phase offset (start in the past to simulate phase offset)
  const initialOffsetSeconds =
    initialRate > 0 ? currentPhaseOffset / initialRate : 0;
  oscillatorNode.start(audioContext.currentTime - initialOffsetSeconds);
  dcOffsetNode.start();
  sampleHoldSourceNode.start();

  const portNodes: ModuleInstance["portNodes"] = {
    cv_out: outputNode,
    inverted_cv_out: invertedOutputNode,
    rate_cv: oscillatorNode.frequency, // Future: modulate rate
    reset: undefined, // Future: reset trigger
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
