import type { CreateModuleFn, ModuleInstance, PortDefinition } from "../types";
import { smoothParam } from "../utils/smoothing";

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
    id: "gate_in",
    label: "Gate",
    direction: "in",
    signal: "GATE",
    metadata: { description: "Gate input for amplitude control" },
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
  const vcaGainNode = audioContext.createGain(); // VCA for gate control

  // Create a constant source for the gate (defaults to 1 for free-running)
  const gateConstantSource = audioContext.createConstantSource();
  gateConstantSource.offset.value = 1; // Default to gate "on" for free-running
  gateConstantSource.start();

  // Connect gate source to VCA
  gateConstantSource.connect(vcaGainNode.gain);

  // Configure oscillator
  oscillatorNode.type = parameters?.waveform ?? "sawtooth";
  oscillatorNode.frequency.value = parameters?.baseFrequency ?? 440;
  if (parameters?.detuneCents)
    oscillatorNode.detune.value = parameters.detuneCents;

  // Configure gains
  outputGainNode.gain.value = parameters?.gain ?? 0.3;
  vcaGainNode.gain.value = 0; // VCA starts at 0, controlled by gate source

  // Audio chain: OSC -> VCA -> Output Gain -> [external connections]
  oscillatorNode.connect(vcaGainNode);
  vcaGainNode.connect(outputGainNode);
  oscillatorNode.start();

  const portNodes: ModuleInstance["portNodes"] = {
    pitch_cv: oscillatorNode.frequency, // Accept direct connection (assumes conversion upstream)
    fm_cv: oscillatorNode.frequency, // For linear FM
    gate_in: gateConstantSource.offset, // Gate controls the constant source offset
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
        partial["baseFrequency"] !== undefined &&
        typeof partial["baseFrequency"] === "number"
      ) {
        const nextHz = Math.max(0, partial["baseFrequency"]);
        smoothParam(audioContext, oscillatorNode.frequency, nextHz, {
          mode: "setTarget",
          timeConstant: 0.03,
        });
      }
      if (
        partial["detuneCents"] !== undefined &&
        typeof partial["detuneCents"] === "number"
      ) {
        smoothParam(
          audioContext,
          oscillatorNode.detune,
          partial["detuneCents"],
          {
            mode: "setTarget",
            timeConstant: 0.02,
          },
        );
      }
      if (
        partial["gain"] !== undefined &&
        typeof partial["gain"] === "number"
      ) {
        const nextGain = Math.max(0, partial["gain"]);
        smoothParam(audioContext, outputGainNode.gain, nextGain, {
          mode: "linear",
          time: 0.02,
        });
      }
    },
    getParams() {
      return {
        waveform: oscillatorNode.type,
        baseFrequency: oscillatorNode.frequency.value,
        detuneCents: oscillatorNode.detune.value,
        gain: outputGainNode.gain.value,
      };
    },
    dispose() {
      try {
        oscillatorNode.stop();
      } catch {
        /* already stopped */
      }
      try {
        gateConstantSource.stop();
      } catch {
        /* already stopped */
      }
      oscillatorNode.disconnect();
      vcaGainNode.disconnect();
      outputGainNode.disconnect();
      gateConstantSource.disconnect();
    },
  };

  return instance;
};
