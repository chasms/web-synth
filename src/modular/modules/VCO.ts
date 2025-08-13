import type { CreateModuleFn, ModuleInstance, PortDefinition } from "../types";

export interface VCOParams {
  waveform: OscillatorType;
  baseFrequency: number; // Hz when pitch CV = reference voltage
  detuneCents?: number;
  gain?: number;
}

// Minimal OscillatorType re-export to avoid circular type import
export type OscillatorType = "sine" | "square" | "sawtooth" | "triangle";

const ports: PortDefinition[] = [
  {
    id: "pitch_cv",
    label: "Pitch CV",
    direction: "in",
    signal: "CV",
    metadata: { voltageMapping: "1V_OCT", description: "1V/Oct pitch control" },
  },
  {
    id: "fm_cv",
    label: "FM CV",
    direction: "in",
    signal: "CV",
    metadata: { bipolar: true, description: "Linear FM (Hz offset scaled)" },
  },
  {
    id: "sync",
    label: "Sync",
    direction: "in",
    signal: "TRIGGER",
    metadata: { description: "Hard sync trigger (future)" },
  },
  {
    id: "wave_cv",
    label: "Wave CV",
    direction: "in",
    signal: "CV",
    metadata: { description: "(Future) Morph / selection" },
  },
  { id: "audio_out", label: "Audio", direction: "out", signal: "AUDIO" },
];

export const createVCO: CreateModuleFn<VCOParams> = (ctx, params) => {
  const { audioContext, moduleId } = ctx;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  gain.gain.value = params?.gain ?? 0.3;

  osc.type = params?.waveform ?? "sawtooth";
  osc.frequency.value = params?.baseFrequency ?? 440;
  if (params?.detuneCents) osc.detune.value = params.detuneCents;
  osc.connect(gain);
  osc.start();

  const portNodes: ModuleInstance["portNodes"] = {
    pitch_cv: osc.frequency, // Accept direct connection (assumes conversion upstream)
    fm_cv: osc.frequency, // For linear FM
    sync: undefined,
    wave_cv: undefined,
    audio_out: gain,
  };

  const instance: ModuleInstance = {
    id: moduleId,
    type: "VCO",
    label: `VCO ${moduleId}`,
    ports,
    audioOut: gain,
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
      if (partial["waveform"] && typeof partial["waveform"] === "string") {
        try {
          osc.type = partial["waveform"] as OscillatorType;
        } catch {
          /* ignore invalid */
        }
      }
      if (
        partial["detuneCents"] !== undefined &&
        typeof partial["detuneCents"] === "number"
      ) {
        osc.detune.value = partial["detuneCents"];
      }
      if (
        partial["gain"] !== undefined &&
        typeof partial["gain"] === "number"
      ) {
        gain.gain.value = partial["gain"];
      }
    },
    dispose() {
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
      osc.disconnect();
      gain.disconnect();
    },
  };

  return instance;
};
