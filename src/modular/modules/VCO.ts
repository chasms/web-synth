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

export const createVCO: CreateModuleFn<VCOParams> = (context, parameters) => {
  const { audioContext, moduleId } = context;
  const oscillatorNode = audioContext.createOscillator();
  const outputGainNode = audioContext.createGain();
  outputGainNode.gain.value = parameters?.gain ?? 0.3;

  oscillatorNode.type = parameters?.waveform ?? "sawtooth";
  oscillatorNode.frequency.value = parameters?.baseFrequency ?? 440;
  if (parameters?.detuneCents)
    oscillatorNode.detune.value = parameters.detuneCents;
  oscillatorNode.connect(outputGainNode);
  oscillatorNode.start();

  const portNodes: ModuleInstance["portNodes"] = {
    pitch_cv: oscillatorNode.frequency, // Accept direct connection (assumes conversion upstream)
    fm_cv: oscillatorNode.frequency, // For linear FM
    sync: undefined,
    wave_cv: undefined,
    audio_out: outputGainNode,
  };

  const instance: ModuleInstance = {
    id: moduleId,
    type: "VCO",
    label: `VCO ${moduleId}`,
    ports,
    audioOut: outputGainNode,
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
      if (partial["waveform"] && typeof partial["waveform"] === "string") {
        try {
          oscillatorNode.type = partial["waveform"] as OscillatorType;
        } catch {
          /* ignore invalid */
        }
      }
      if (
        partial["detuneCents"] !== undefined &&
        typeof partial["detuneCents"] === "number"
      ) {
        oscillatorNode.detune.value = partial["detuneCents"];
      }
      if (
        partial["gain"] !== undefined &&
        typeof partial["gain"] === "number"
      ) {
        outputGainNode.gain.value = partial["gain"];
      }
    },
    dispose() {
      try {
        oscillatorNode.stop();
      } catch {
        /* already stopped */
      }
      oscillatorNode.disconnect();
      outputGainNode.disconnect();
    },
  };

  return instance;
};
