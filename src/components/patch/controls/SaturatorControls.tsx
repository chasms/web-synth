import React from "react";

import type { ModuleInstance } from "../../../modular/types";

interface NumberControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  suffix?: string;
}

const NumberControl: React.FC<NumberControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
  suffix = "",
}) => {
  const [text, setText] = React.useState<string>(() => String(value));
  React.useEffect(() => {
    setText(String(value));
  }, [value]);

  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      setText(String(value));
      return;
    }
    const clamped = clamp(parsed);
    setText(String(clamped));
    onChange(clamped);
  };

  const displayLabel = suffix
    ? `${label}: ${value.toFixed(step < 1 ? 2 : 1)}${suffix}`
    : label;

  return (
    <div className="module-control">
      <label className="module-control-label">{displayLabel}</label>
      <input
        className="module-control-input"
        aria-label={`${label} input`}
        type="text"
        inputMode="decimal"
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => commit(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(text);
          if (e.key === "Escape") setText(String(value));
        }}
      />
      <div className="module-control-slider-row">
        <input
          className="module-control-slider"
          aria-label={`${label} slider`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
        />
      </div>
    </div>
  );
};

interface SaturatorControlsProps {
  module: ModuleInstance;
}

/**
 * Control panel for the TR-303 style Saturator module.
 *
 * Provides controls for:
 * - Drive: Input saturation amount (0.5x to 10x)
 * - Tone: High-pass filter for brightness (20Hz to 5000Hz)
 * - Output: Output level compensation (-12dB to +12dB)
 */
export const SaturatorControls: React.FC<SaturatorControlsProps> = ({
  module,
}) => {
  const initial = module.getParams?.() ?? {};

  const [drive, setDrive] = React.useState<number>(
    typeof initial["drive"] === "number" ? (initial["drive"] as number) : 1.0,
  );
  const [tone, setTone] = React.useState<number>(
    typeof initial["tone"] === "number" ? (initial["tone"] as number) : 20,
  );
  const [output, setOutput] = React.useState<number>(
    typeof initial["output"] === "number" ? (initial["output"] as number) : 0,
  );

  const update = React.useCallback(
    (partial: Record<string, unknown>) => module.updateParams?.(partial),
    [module],
  );

  return (
    <div className="module-controls">
      <div className="module-control">
        <div className="module-info-text">
          <span className="module-info-label">TR-303 Saturator</span>
        </div>
      </div>

      <NumberControl
        label="Drive"
        value={drive}
        min={0.5}
        max={10}
        step={0.1}
        suffix="x"
        onChange={(v) => {
          setDrive(v);
          update({ drive: v });
        }}
      />

      <NumberControl
        label="Tone"
        value={tone}
        min={20}
        max={5000}
        step={10}
        suffix=" Hz"
        onChange={(v) => {
          setTone(v);
          update({ tone: v });
        }}
      />

      <NumberControl
        label="Output"
        value={output}
        min={-12}
        max={12}
        step={0.5}
        suffix=" dB"
        onChange={(v) => {
          setOutput(v);
          update({ output: v });
        }}
      />
    </div>
  );
};
