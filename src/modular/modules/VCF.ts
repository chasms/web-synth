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
  const envelopeScaleNode = audioContext.createGain();
  envelopeScaleNode.gain.value = parameters?.envelopeAmount ?? 0.0;

  // Connect input drive -> filter
  inputGainNode.connect(biquadFilterNode);

  const portNodes: ModuleInstance["portNodes"] = {
    audio_in: inputGainNode, // Audio goes through drive first
    audio_out: biquadFilterNode,
    cutoff_cv: biquadFilterNode.frequency,
    env_cv: envelopeScaleNode, // Envelope goes through scaling gain first
  };

  // Connect envelope scaling to filter cutoff
  envelopeScaleNode.connect(biquadFilterNode.frequency);

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
      if (
        fromConnectionNode instanceof AudioNode &&
        toConnectionEntity instanceof AudioNode
      ) {
        fromConnectionNode.connect(toConnectionEntity);
      } else if (
        fromConnectionNode instanceof AudioNode &&
        toConnectionEntity instanceof AudioParam
      ) {
        fromConnectionNode.connect(toConnectionEntity);
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
        smoothParam(audioContext, envelopeScaleNode.gain, nextAmount, {
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
        envelopeAmount: envelopeScaleNode.gain.value,
        drive: inputGainNode.gain.value,
      };
    },
    dispose() {
      inputGainNode.disconnect();
      biquadFilterNode.disconnect();
      envelopeScaleNode.disconnect();
    },
  };
  return instance;
};
