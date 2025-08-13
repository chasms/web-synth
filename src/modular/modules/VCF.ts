import type { CreateModuleFn, ModuleInstance, PortDefinition } from "../types";

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

export const createVCF: CreateModuleFn<VCFParams> = (ctx, params) => {
  const { audioContext, moduleId } = ctx;
  const biquad = audioContext.createBiquadFilter();
  biquad.type = params?.type ?? "lowpass";
  biquad.frequency.value = params?.cutoff ?? 1200;
  biquad.Q.value = params?.resonance ?? 0.7;

  const portNodes: ModuleInstance["portNodes"] = {
    audio_in: biquad,
    audio_out: biquad,
    cutoff_cv: biquad.frequency,
    env_cv: biquad.frequency, // simple addition for now
  };

  const instance: ModuleInstance = {
    id: moduleId,
    type: "VCF",
    label: `VCF ${moduleId}`,
    ports,
    audioOut: biquad,
    portNodes,
    connect(fromPortId, target) {
      const fromNode = portNodes[fromPortId];
      const toEntity = target.module.portNodes[target.portId];
      if (!fromNode || !toEntity) return;
      if (fromNode instanceof AudioNode && toEntity instanceof AudioNode) {
        fromNode.connect(toEntity);
      } else if (
        fromNode instanceof AudioNode &&
        toEntity instanceof AudioParam
      ) {
        fromNode.connect(toEntity);
      }
    },
    updateParams(partial) {
      if (
        partial["cutoff"] !== undefined &&
        typeof partial["cutoff"] === "number"
      )
        biquad.frequency.value = partial["cutoff"];
      if (
        partial["resonance"] !== undefined &&
        typeof partial["resonance"] === "number"
      )
        biquad.Q.value = partial["resonance"];
      if (partial["type"] && typeof partial["type"] === "string") {
        try {
          biquad.type = partial["type"] as BiquadFilterType;
        } catch {
          /* ignore */
        }
      }
    },
    dispose() {
      biquad.disconnect();
    },
  };
  return instance;
};
