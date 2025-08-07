// Core synthesizer types
export type OscillatorType = "sine" | "square" | "sawtooth" | "triangle";

export interface OscillatorParams {
  frequency: number;
  type: OscillatorType;
  gain: number;
  detune: number;
}

export interface SynthParams {
  oscillator1: OscillatorParams;
  oscillator2: OscillatorParams;
  oscillator3: OscillatorParams;
  masterVolume: number;
}

export const DEFAULT_OSCILLATOR_PARAMS: OscillatorParams = {
  frequency: 440,
  type: "sawtooth",
  gain: 0.3,
  detune: 0,
};

export const DEFAULT_SYNTH_PARAMS: SynthParams = {
  oscillator1: DEFAULT_OSCILLATOR_PARAMS,
  oscillator2: { ...DEFAULT_OSCILLATOR_PARAMS, detune: -7 },
  oscillator3: { ...DEFAULT_OSCILLATOR_PARAMS, frequency: 220 },
  masterVolume: 0.7,
};
