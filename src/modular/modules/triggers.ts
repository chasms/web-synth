import type { PortDefinition } from "../types";

// MIDI Input Trigger Parameters
export interface MIDIInputTriggerParams {
  deviceId?: string; // MIDI input device ID (null for any device)
  channel?: number; // MIDI channel (1-16, or 0 for omni)
  velocityCurve?: "linear" | "exponential" | "logarithmic";
  transpose?: number; // Semitones to transpose (-24 to +24)
}

// Piano Roll Sequencer Parameters
export interface SequencerTriggerParams {
  bpm?: number; // Beats per minute (60-200)
  steps?: number; // Number of steps in sequence (1-32)
  gate?: number; // Gate length as fraction of step (0.1-1.0)
  swing?: number; // Swing amount (0-1, where 0.5 = straight)
  octave?: number; // Base octave for piano roll display (0-7)
  loop?: boolean; // Whether to loop the sequence
}

// Sequence step data for piano roll
export interface SequenceStep {
  note?: number; // MIDI note number (0-127, undefined = rest)
  velocity?: number; // Note velocity (0-127)
  gate?: number; // Gate length override for this step (0-1)
}

// Port definitions for MIDI Input Trigger
const midiInputPorts: PortDefinition[] = [
  {
    id: "gate_out",
    label: "Gate",
    direction: "out",
    signal: "GATE",
    metadata: { description: "Note on/off gate signal" },
  },
  {
    id: "pitch_cv_out",
    label: "Pitch CV",
    direction: "out",
    signal: "CV",
    metadata: {
      voltageMapping: "1V_OCT",
      description: "1V/Oct pitch CV from MIDI note",
    },
  },
  {
    id: "velocity_cv_out",
    label: "Velocity CV",
    direction: "out",
    signal: "CV",
    metadata: {
      bipolar: false,
      min: 0,
      max: 1,
      description: "Velocity as 0-1 CV",
    },
  },
  {
    id: "trigger_out",
    label: "Trigger",
    direction: "out",
    signal: "TRIGGER",
    metadata: { description: "Note-on trigger pulse" },
  },
];

// Port definitions for Sequencer Trigger (same outputs plus transport controls)
const sequencerPorts: PortDefinition[] = [
  ...midiInputPorts,
  {
    id: "clock_in",
    label: "Clock",
    direction: "in",
    signal: "TRIGGER",
    metadata: { description: "External clock input (optional)" },
  },
  {
    id: "reset_in",
    label: "Reset",
    direction: "in",
    signal: "TRIGGER",
    metadata: { description: "Sequence reset trigger" },
  },
  {
    id: "run_gate_in",
    label: "Run",
    direction: "in",
    signal: "GATE",
    metadata: { description: "Start/stop sequence playback" },
  },
];

export { midiInputPorts, sequencerPorts };
