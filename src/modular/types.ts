// Core modular synthesis type system
// Modules expose named Ports carrying:
//  - AUDIO (sample stream)
//  - CV (continuous control signal, normalised or 1V/Oct mapping)
//  - GATE (binary on/off)
//  - TRIGGER (momentary pulse)

export type PortSignalType = "AUDIO" | "CV" | "GATE" | "TRIGGER";

// Voltage conventions:
//  - Pitch CV: 1.0 per octave (1V/Oct). A4=440Hz defined at 4.75V by default (adjustable).
//  - General CV range: -1..+1 (bipolar) or 0..1 (unipolar)
export interface PortMetadata {
  min?: number; // Suggested min (engineering units)
  max?: number; // Suggested max
  defaultValue?: number; // Suggested default normalised value
  bipolar?: boolean; // True if -1..+1; else 0..1
  description?: string;
  voltageMapping?: "1V_OCT" | "HZ_PER_V" | "LINEAR";
}

export interface PortDefinition {
  id: string; // Unique within module
  label: string; // Human readable
  direction: "in" | "out";
  signal: PortSignalType;
  metadata?: PortMetadata;
}

export interface Connection {
  fromModuleId: string;
  fromPortId: string;
  toModuleId: string;
  toPortId: string;
}

export interface ModuleDescriptor {
  id: string; // Unique instance id
  type: string; // e.g. 'VCO', 'VCF', 'ADSR'
  label: string; // Display name
  ports: PortDefinition[]; // Port layout
}

export interface AudioModuleContext {
  audioContext: AudioContext;
  moduleId: string;
}

export interface ModuleInstance extends ModuleDescriptor {
  audioOut?: AudioNode; // Primary audio output (if any)
  portNodes: Record<string, AudioNode | AudioParam | undefined>; // port id -> node/param
  connect: (
    fromPortId: string,
    target: { module: ModuleInstance; portId: string },
  ) => void;
  dispose: () => void;
  updateParams?: (partial: Record<string, unknown>) => void;
  getParams?: () => Record<string, unknown>;
  getAnalyserData?: () => unknown; // Audio analysis data (waveform, frequency, etc.)
  gateOn?: () => void;
  gateOff?: () => void;
}

export type CreateModuleFn<P = unknown> = (
  ctx: AudioModuleContext,
  params?: P,
) => ModuleInstance;

// 1V/Oct utilities
export function voltsToFrequency(
  volts: number,
  referencePitch = 440,
  referenceVoltage = 4.75,
) {
  const octaveDelta = volts - referenceVoltage;
  return referencePitch * Math.pow(2, octaveDelta);
}

export function frequencyToVolts(
  freq: number,
  referencePitch = 440,
  referenceVoltage = 4.75,
) {
  return referenceVoltage + Math.log2(freq / referencePitch);
}
