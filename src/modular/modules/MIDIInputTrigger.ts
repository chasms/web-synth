import type { CreateModuleFn, ModuleInstance } from "../types";
import { midiInputPorts, type MIDIInputTriggerParams } from "./triggers";

// MIDI note to 1V/Oct CV conversion
// A4 (440Hz) = MIDI note 69 = 4.75V (reference)
function midiNoteToCV(noteNumber: number): number {
  // MIDI note 69 (A4) = 4.75V
  // Each semitone = 1/12 volt
  const a4MidiNote = 69;
  const a4Voltage = 4.75;
  return a4Voltage + (noteNumber - a4MidiNote) / 12;
}

// Velocity curve transformations
function applyVelocityCurve(
  velocity: number,
  curve: "linear" | "exponential" | "logarithmic",
): number {
  const normalized = velocity / 127;
  switch (curve) {
    case "exponential":
      return normalized * normalized;
    case "logarithmic":
      return Math.sqrt(normalized);
    case "linear":
    default:
      return normalized;
  }
}

export const createMIDIInputTrigger: CreateModuleFn<MIDIInputTriggerParams> = (
  context,
  parameters,
) => {
  const { audioContext, moduleId } = context;

  // Audio nodes for CV generation
  const gateGainNode = audioContext.createGain();
  const pitchConstantSource = audioContext.createConstantSource();
  const velocityConstantSource = audioContext.createConstantSource();
  const triggerGainNode = audioContext.createGain();

  // Initialize CV values
  gateGainNode.gain.value = 0; // Gate off initially
  pitchConstantSource.offset.value = 4.75; // A4 default
  velocityConstantSource.offset.value = 0; // No velocity initially
  triggerGainNode.gain.value = 0; // Trigger off initially

  // Start constant sources
  pitchConstantSource.start();
  velocityConstantSource.start();

  // Module parameters
  let deviceId = parameters?.deviceId;
  let channel = parameters?.channel ?? 0; // 0 = omni
  let velocityCurve = parameters?.velocityCurve ?? "linear";
  let transpose = parameters?.transpose ?? 0;

  // MIDI state tracking
  let midiAccess: MIDIAccess | null = null;
  let selectedInput: MIDIInput | null = null;
  const activeNotes = new Map<number, number>(); // noteNumber -> velocity

  // Setup MIDI access
  const initializeMIDI = async () => {
    try {
      midiAccess = await navigator.requestMIDIAccess();
      console.log(`MIDI Access granted for module ${moduleId}`);

      // Setup device change listener
      midiAccess.onstatechange = () => {
        setupMIDIInput();
      };

      setupMIDIInput();
    } catch (error) {
      console.warn(`MIDI not available for module ${moduleId}:`, error);
    }
  };

  const setupMIDIInput = () => {
    if (!midiAccess) return;

    // Clear existing input
    if (selectedInput) {
      selectedInput.onmidimessage = null;
    }

    // Find input device
    if (deviceId) {
      selectedInput = midiAccess.inputs.get(deviceId) || null;
    } else {
      // Use first available input
      const inputs = Array.from(midiAccess.inputs.values());
      selectedInput = inputs[0] || null;
    }

    if (selectedInput) {
      selectedInput.onmidimessage = handleMIDIMessage;
      console.log(
        `MIDI Input connected: ${selectedInput.name} for module ${moduleId}`,
      );
    }
  };

  const handleMIDIMessage = (event: MIDIMessageEvent) => {
    if (!event.data || event.data.length < 3) return;

    const data = Array.from(event.data);
    const [status, note, velocity] = data;
    const messageChannel = (status & 0x0f) + 1;

    // Filter by channel if not omni
    if (channel !== 0 && messageChannel !== channel) return;

    const command = status & 0xf0;
    const transposedNote = note + transpose;

    // Clamp transposed note to valid MIDI range
    if (transposedNote < 0 || transposedNote > 127) return;

    if (command === 0x90 && velocity > 0) {
      // Note On
      handleNoteOn(transposedNote, velocity);
    } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      // Note Off
      handleNoteOff(transposedNote);
    }
  };

  const handleNoteOn = (noteNumber: number, velocity: number) => {
    // Store active note
    activeNotes.set(noteNumber, velocity);

    // Update CV outputs
    const pitchCV = midiNoteToCV(noteNumber);
    const velocityCV = applyVelocityCurve(velocity, velocityCurve);

    // Update audio parameters
    pitchConstantSource.offset.setValueAtTime(
      pitchCV,
      audioContext.currentTime,
    );
    velocityConstantSource.offset.setValueAtTime(
      velocityCV,
      audioContext.currentTime,
    );

    // Gate on
    gateGainNode.gain.setValueAtTime(1, audioContext.currentTime);

    // Trigger pulse (10ms)
    const now = audioContext.currentTime;
    triggerGainNode.gain.setValueAtTime(1, now);
    triggerGainNode.gain.setValueAtTime(0, now + 0.01);
  };

  const handleNoteOff = (noteNumber: number) => {
    activeNotes.delete(noteNumber);

    // If no notes are active, gate off
    if (activeNotes.size === 0) {
      gateGainNode.gain.setValueAtTime(0, audioContext.currentTime);
    } else {
      // Switch to most recent note (last note priority)
      const mostRecentNote = Array.from(activeNotes.keys()).pop();
      if (mostRecentNote !== undefined) {
        const pitchCV = midiNoteToCV(mostRecentNote);
        pitchConstantSource.offset.setValueAtTime(
          pitchCV,
          audioContext.currentTime,
        );
      }
    }
  };

  // Initialize MIDI on creation
  initializeMIDI();

  const portNodes: ModuleInstance["portNodes"] = {
    gate_out: gateGainNode,
    pitch_cv_out: pitchConstantSource,
    velocity_cv_out: velocityConstantSource,
    trigger_out: triggerGainNode,
  };

  const instance: ModuleInstance = {
    id: moduleId,
    type: "MIDI_INPUT",
    label: `MIDI In ${moduleId}`,
    ports: midiInputPorts,
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
      if (partial.deviceId !== undefined) {
        deviceId = partial.deviceId as string;
        setupMIDIInput();
      }
      if (partial.channel !== undefined) {
        channel = partial.channel as number;
      }
      if (partial.velocityCurve !== undefined) {
        velocityCurve = partial.velocityCurve as
          | "linear"
          | "exponential"
          | "logarithmic";
      }
      if (partial.transpose !== undefined) {
        transpose = partial.transpose as number;
      }
    },

    getParams() {
      return {
        deviceId,
        channel,
        velocityCurve,
        transpose,
      };
    },

    dispose() {
      // Clean up MIDI
      if (selectedInput) {
        selectedInput.onmidimessage = null;
      }

      // Clean up audio nodes
      try {
        pitchConstantSource.stop();
        velocityConstantSource.stop();
      } catch {
        /* already stopped */
      }

      gateGainNode.disconnect();
      pitchConstantSource.disconnect();
      velocityConstantSource.disconnect();
      triggerGainNode.disconnect();
    },
  };

  return instance;
};
