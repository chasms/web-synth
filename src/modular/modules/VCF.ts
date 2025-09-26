import type { CreateModuleFn, ModuleInstance, PortDefinition } from "../types";
import { smoothParam } from "../utils/smoothing";

export interface VCFParams {
  type?: BiquadFilterType;
  cutoff: number; // Hz
  resonance: number; // Q
  envelopeAmt?: number; // Scaling for envelope CV
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
  const biquadFilterNode = audioContext.createBiquadFilter();
  biquadFilterNode.type = parameters?.type ?? "lowpass";
  biquadFilterNode.frequency.value = parameters?.cutoff ?? 1200;
  biquadFilterNode.Q.value = parameters?.resonance ?? 0.7;

  const portNodes: ModuleInstance["portNodes"] = {
    audio_in: biquadFilterNode,
    audio_out: biquadFilterNode,
    cutoff_cv: biquadFilterNode.frequency,
    env_cv: biquadFilterNode.frequency, // simple addition for now
  };

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
    },
    dispose() {
      biquadFilterNode.disconnect();
    },
  };
  return instance;
};
