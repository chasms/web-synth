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

  // Track whether pitch CV is connected to prevent manual frequency control interference
  let isPitchCVConnected = false;

  // Configure oscillator
  oscillatorNode.type = parameters?.waveform ?? "sawtooth";
  oscillatorNode.frequency.value = parameters?.baseFrequency ?? 440;
  if (parameters?.detuneCents)
    oscillatorNode.detune.value = parameters.detuneCents;

  // Configure gains
  outputGainNode.gain.value = parameters?.gain ?? 0.3;

  // VCA gain: Default to 1 for free-running mode
  // When external gate connects, onIncomingConnection will set it to 0
  vcaGainNode.gain.value = 1;

  // Audio chain: OSC -> VCA -> Output Gain -> [external connections]
  oscillatorNode.connect(vcaGainNode);
  vcaGainNode.connect(outputGainNode);

  // Start the oscillator
  oscillatorNode.start();

  const portNodes: ModuleInstance["portNodes"] = {
    pitch_cv: oscillatorNode.frequency, // CV controls frequency directly when connected
    fm_cv: oscillatorNode.frequency, // For linear FM (direct Hz modulation)
    gate_in: vcaGainNode.gain, // Gate controls VCA gain directly (external gate signal adds to base value of 0)
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
    onIncomingConnection(portId) {
      // When an external gate connects, switch from free-running to gate-controlled
      if (portId === "gate_in") {
        vcaGainNode.gain.value = 0; // Set base to 0 so external gate is sole controller
      }
      // Track pitch CV connection to prevent manual control interference
      if (portId === "pitch_cv") {
        isPitchCVConnected = true;
      }
    },
    onIncomingDisconnection(portId) {
      // When external gate disconnects, switch back to free-running
      if (portId === "gate_in") {
        vcaGainNode.gain.value = 1; // Set back to free-running
      }
      // Track pitch CV disconnection to allow manual control again
      if (portId === "pitch_cv") {
        isPitchCVConnected = false;
      }
    },
    connect(fromPortId, target) {
      const fromConnectionNode = portNodes[fromPortId];
      const toConnectionEntity = target.module.portNodes[target.portId];

      if (!fromConnectionNode || !toConnectionEntity) {
        return;
      }

      if (
        fromConnectionNode instanceof AudioNode &&
        toConnectionEntity instanceof AudioNode
      ) {
        fromConnectionNode.connect(toConnectionEntity);
      } else if (
        fromConnectionNode instanceof AudioNode &&
        toConnectionEntity instanceof AudioParam
      ) {
        // When a gate is connected, it will modulate the VCA gain
        // (The base gain.value is set to 1 for free-running, gate signal will override this)
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
        // Only allow manual frequency control when pitch CV is not connected
        if (!isPitchCVConnected) {
          const nextHz = Math.max(0, partial["baseFrequency"]);
          smoothParam(audioContext, oscillatorNode.frequency, nextHz, {
            mode: "setTarget",
            timeConstant: 0.03,
          });
        }
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
      oscillatorNode.disconnect();
      vcaGainNode.disconnect();
      outputGainNode.disconnect();
    },
  };

  return instance;
};
