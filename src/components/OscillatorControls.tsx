import type { OscillatorParams, OscillatorType } from "../types/synth";
import { Knob, NumberInput, Select } from "./Controls";

interface OscillatorControlsProps {
  label: string;
  params: OscillatorParams;
  onParamChange: (
    param: keyof OscillatorParams,
    value: number | OscillatorType,
  ) => void;
}

const WAVEFORM_OPTIONS = [
  { value: "sine", label: "Sine" },
  { value: "square", label: "Square" },
  { value: "sawtooth", label: "Sawtooth" },
  { value: "triangle", label: "Triangle" },
];

export function OscillatorControls({
  label,
  params,
  onParamChange,
}: OscillatorControlsProps) {
  return (
    <div className="oscillator-controls">
      <h3>{label}</h3>

      <NumberInput
        label="Frequency (Hz)"
        value={params.frequency}
        min={20}
        max={20000}
        step={1}
        onChange={(value) => onParamChange("frequency", value)}
      />

      <Select
        label="Waveform"
        value={params.type}
        options={WAVEFORM_OPTIONS}
        onChange={(value) => onParamChange("type", value as OscillatorType)}
      />

      <Knob
        label="Gain"
        value={params.gain}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => onParamChange("gain", value)}
      />

      <Knob
        label="Detune (cents)"
        value={params.detune}
        min={-1200}
        max={1200}
        step={1}
        onChange={(value) => onParamChange("detune", value)}
      />
    </div>
  );
}
