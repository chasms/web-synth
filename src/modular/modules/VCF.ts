import type { CreateModuleFn, ModuleInstance, PortDefinition } from "../types";
import { smoothParam } from "../utils/smoothing";

export interface VCFParams {
  type?: BiquadFilterType;
  cutoff: number; // Hz
  resonance: number; // Q
  envelopeAmount?: number; // Scaling for envelope CV (-100% to +100%)
  drive?: number; // Input drive/saturation (1.0 = unity, >1 = drive)
}

const ports: PortDefinition[] = [
  { id: "audio_in", label: "Audio In", direction: "in", signal: "AUDIO" },
  { id: "audio_out", label: "Audio Out", direction: "out", signal: "AUDIO" },
  {
    id: "cutoff_cv",
    label: "Cutoff CV",
    direction: "in",
    signal: "CV",
    metadata: { bipolar: false },
  },
  { id: "env_cv", label: "Env CV", direction: "in", signal: "CV" },
];

export const createVCF: CreateModuleFn<VCFParams> = (context, parameters) => {
  const { audioContext, moduleId } = context;

  // Create input drive gain (for saturation/overdrive effect)
  const inputGainNode = audioContext.createGain();
  inputGainNode.gain.value = parameters?.drive ?? 1.0;

  const biquadFilterNode = audioContext.createBiquadFilter();
  biquadFilterNode.type = parameters?.type ?? "lowpass";
  biquadFilterNode.frequency.value = parameters?.cutoff ?? 1200;
  biquadFilterNode.Q.value = parameters?.resonance ?? 0.7;

  // Create envelope amount scaling gain
  // For low-pass filters, positive envelope amount means the filter OPENS from the base cutoff
  // Envelope signal (0→1) needs to be inverted so that:
  // - At envelope=1 (peak): filter is fully open (base + amount)
  // - At envelope=0 (start): filter is at base cutoff
  // We invert by: output = -input, then scale by amount
  // This way: env=0 → scaled=0 (no change), env=1 → scaled=-amount (subtracts from base)
  // Then we ADD the full envelope amount to the base cutoff to compensate
  const ENVELOPE_FREQUENCY_SCALE = 10000;
  const envelopeInverterNode = audioContext.createGain();
  envelopeInverterNode.gain.value = -1; // Invert the envelope signal
  
  const envelopeScaleNode = audioContext.createGain();
  const envelopeAmount = parameters?.envelopeAmount ?? 0.0;
  envelopeScaleNode.gain.value = envelopeAmount * ENVELOPE_FREQUENCY_SCALE;
  
  // Chain: env_cv_input → inverter → scaler → frequency
  envelopeInverterNode.connect(envelopeScaleNode);

  // Connect input drive -> filter
  inputGainNode.connect(biquadFilterNode);

  // Offset the base cutoff frequency by the envelope amount so that when envelope=1 (fully open),
  // the filter is at the original cutoff + amount, and when envelope=0, it's at original cutoff
  const baseCutoff = parameters?.cutoff ?? 1200;
  const envelopeAmountHz = envelopeAmount * ENVELOPE_FREQUENCY_SCALE;
  biquadFilterNode.frequency.value = baseCutoff + envelopeAmountHz;

  const portNodes: ModuleInstance["portNodes"] = {
    audio_in: inputGainNode, // Audio goes through drive first
    audio_out: biquadFilterNode,
    cutoff_cv: biquadFilterNode.frequency,
    env_cv: envelopeInverterNode, // Envelope goes through inverter → scaler chain
  };

  // Connect envelope chain to filter cutoff
  envelopeScaleNode.connect(biquadFilterNode.frequency);

  // Debug logging
  console.log(`[VCF ${moduleId}] Created with:`, {
    baseCutoff,
    envelopeAmount,
    envelopeAmountHz,
    effectiveCutoffAtEnv1: biquadFilterNode.frequency.value,
    inverterGain: envelopeInverterNode.gain.value,
    scalerGain: envelopeScaleNode.gain.value,
  });

  const instance: ModuleInstance = {
    id: moduleId,
    type: "VCF",
    label: `VCF ${moduleId}`,
    ports,
    audioOut: biquadFilterNode,
    portNodes,
    connect(fromPortId, target) {
      const fromConnectionNode = portNodes[fromPortId];
      const toConnectionEntity = target.module.portNodes[target.portId];
      if (!fromConnectionNode || !toConnectionEntity) return;
      
      console.log(`[VCF ${moduleId}] Connecting from ${fromPortId} to ${target.module.id}.${target.portId}`, {
        fromNode: fromConnectionNode,
        toEntity: toConnectionEntity,
      });
      
      if (
        fromConnectionNode instanceof AudioNode &&
        toConnectionEntity instanceof AudioNode
      ) {
        fromConnectionNode.connect(toConnectionEntity);
        console.log(`[VCF ${moduleId}] ✓ AudioNode → AudioNode connection made`);
      } else if (
        fromConnectionNode instanceof AudioNode &&
        toConnectionEntity instanceof AudioParam
      ) {
        fromConnectionNode.connect(toConnectionEntity);
        console.log(`[VCF ${moduleId}] ✓ AudioNode → AudioParam connection made`);
      }
    },
    updateParams(partial) {
      if (
        partial["cutoff"] !== undefined &&
        typeof partial["cutoff"] === "number"
      ) {
        const next = Math.max(0, partial["cutoff"]);
        smoothParam(audioContext, biquadFilterNode.frequency, next, {
          mode: "setTarget",
          timeConstant: 0.03,
        });
      }
      if (
        partial["resonance"] !== undefined &&
        typeof partial["resonance"] === "number"
      ) {
        const nextQ = Math.max(0, partial["resonance"]);
        smoothParam(audioContext, biquadFilterNode.Q, nextQ, {
          mode: "linear",
          time: 0.02,
        });
      }
      if (partial["type"] && typeof partial["type"] === "string") {
        try {
          biquadFilterNode.type = partial["type"] as BiquadFilterType;
        } catch {
          /* ignore */
        }
      }
      if (
        partial["envelopeAmount"] !== undefined &&
        typeof partial["envelopeAmount"] === "number"
      ) {
        const nextAmount = Math.max(-1, Math.min(1, partial["envelopeAmount"]));
        // Scale by frequency range for audible effect
        const nextScaledAmount = nextAmount * ENVELOPE_FREQUENCY_SCALE;
        smoothParam(audioContext, envelopeScaleNode.gain, nextScaledAmount, {
          mode: "linear",
          time: 0.02,
        });
      }
      if (
        partial["drive"] !== undefined &&
        typeof partial["drive"] === "number"
      ) {
        const nextDrive = Math.max(0.1, Math.min(10, partial["drive"]));
        smoothParam(audioContext, inputGainNode.gain, nextDrive, {
          mode: "linear",
          time: 0.02,
        });
      }
    },
    getParams() {
      return {
        type: biquadFilterNode.type,
        cutoff: biquadFilterNode.frequency.value,
        resonance: biquadFilterNode.Q.value,
        envelopeAmount: envelopeScaleNode.gain.value / ENVELOPE_FREQUENCY_SCALE,
        drive: inputGainNode.gain.value,
      };
    },
    dispose() {
      inputGainNode.disconnect();
      biquadFilterNode.disconnect();
      envelopeInverterNode.disconnect();
      envelopeScaleNode.disconnect();
    },
  };
  return instance;
};
