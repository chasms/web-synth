import type { ChangeEvent } from "react";

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export function Knob({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
}: KnobProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  return (
    <div className="knob-container">
      <label htmlFor={`knob-${label}`}>{label}</label>
      <input
        id={`knob-${label}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="knob"
      />
      <span className="knob-value">{value.toFixed(2)}</span>
    </div>
  );
}

interface NumberInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export function NumberInput({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
}: NumberInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

  return (
    <div className="number-input-container">
      <label htmlFor={`input-${label}`}>{label}</label>
      <input
        id={`input-${label}`}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="number-input"
      />
    </div>
  );
}

interface SelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function Select({ label, value, options, onChange }: SelectProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="select-container">
      <label htmlFor={`select-${label}`}>{label}</label>
      <select
        id={`select-${label}`}
        value={value}
        onChange={handleChange}
        className="select"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
