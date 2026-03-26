import {
  calculateSyncedRate,
  constrainLfoDepth,
  constrainLfoRate,
  isValidLfoWaveform,
  LFO_BPM_DEFAULT,
  LFO_DEPTH_DEFAULT,
  LFO_RATE_DEFAULT,
  LFO_SYNC_DIVISION_DEFAULT,
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
  const initialWaveform: OscillatorType = isValidLfoWaveform(
    parameters?.waveform ?? "sine",
  )
    ? (parameters?.waveform as OscillatorType)
    : "sine";
  let isBipolar = parameters?.bipolar ?? true;

  // Create the LFO oscillator
  const oscillatorNode = audioContext.createOscillator();
  oscillatorNode.type = initialWaveform;
  oscillatorNode.frequency.value = initialRate;

  // Depth control gain node (scales the oscillator output)
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
  // Oscillator → Unipolar Scale → Depth → Output
  oscillatorNode.connect(unipolarScaleNode);
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

  // Start the oscillator and DC offset
  oscillatorNode.start();
  dcOffsetNode.start();

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
        smoothParam(audioContext, oscillatorNode.frequency, syncedRate, {
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
        smoothParam(audioContext, oscillatorNode.frequency, nextRate, {
          mode: "setTarget",
          timeConstant: 0.05,
        });
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
          try {
            oscillatorNode.type = partial["waveform"] as OscillatorType;
          } catch {
            /* ignore invalid */
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
        rate: oscillatorNode.frequency.value,
        depth: depthGainNode.gain.value,
        waveform: oscillatorNode.type,
        bipolar: isBipolar,
        syncEnabled: isSyncEnabled,
        bpm: currentBpm,
        syncDivision: currentSyncDivision,
      };
    },
    dispose() {
      try {
        oscillatorNode.stop();
      } catch {
        /* already stopped */
      }
      try {
        dcOffsetNode.stop();
      } catch {
        /* already stopped */
      }
      oscillatorNode.disconnect();
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
