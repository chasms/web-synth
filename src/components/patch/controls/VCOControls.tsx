import React from "react";

import type { ModuleInstance } from "../../../modular/types";

interface NumberControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
}

const NumberControl: React.FC<NumberControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
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

  return (
    <div className="module-control">
      <label className="module-control-label">{label}</label>
      <input
        className="module-control-input"
        aria-label={`${label} input`}
        type="text"
        inputMode="decimal"
        value={text}
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
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
        />
      </div>
    </div>
  );
};

interface VCOControlsProps {
  module: ModuleInstance;
}

export const VCOControls: React.FC<VCOControlsProps> = ({ module }) => {
  const initial = module.getParams?.() ?? {};
  const [waveform, setWaveform] = React.useState<string>(
    (initial["waveform"] as string) || "sawtooth",
  );
  const [baseFrequency, setBaseFrequency] = React.useState<number>(
    typeof initial["baseFrequency"] === "number"
      ? (initial["baseFrequency"] as number)
      : 220,
  );
  const [gain, setGain] = React.useState<number>(
    typeof initial["gain"] === "number" ? (initial["gain"] as number) : 0.2,
  );
  const [detuneCents, setDetuneCents] = React.useState<number>(
    typeof initial["detuneCents"] === "number"
      ? (initial["detuneCents"] as number)
      : 0,
  );

  const update = React.useCallback(
    (partial: Record<string, unknown>) => module.updateParams?.(partial),
    [module],
  );

  return (
    <div className="module-controls">
      <div className="module-control">
        <label className="module-control-label">Waveform</label>
        <select
          className="module-control-select"
          aria-label="Waveform"
          value={waveform}
          onChange={(e) => {
            const next = e.target.value;
            setWaveform(next);
            update({ waveform: next });
          }}
        >
          <option value="sine">Sine</option>
          <option value="square">Square</option>
          <option value="sawtooth">Sawtooth</option>
          <option value="triangle">Triangle</option>
        </select>
      </div>

      <NumberControl
        label="Pitch (Hz)"
        value={baseFrequency}
        min={10}
        max={20000}
        step={1}
        onChange={(v) => {
          setBaseFrequency(v);
          update({ baseFrequency: v });
        }}
      />

      <NumberControl
        label="Detune (cents)"
        value={detuneCents}
        min={-1200}
        max={1200}
        step={1}
        onChange={(v) => {
          setDetuneCents(v);
          update({ detuneCents: v });
        }}
      />

      <NumberControl
        label="Gain"
        value={gain}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => {
          setGain(v);
          update({ gain: v });
        }}
      />
    </div>
  );
};
