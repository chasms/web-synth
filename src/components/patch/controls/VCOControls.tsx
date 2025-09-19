import React from "react";

import type { ModuleInstance } from "../../../modular/types";

interface NumberControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
  format?: (v: number) => string;
}

const NumberControl: React.FC<NumberControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
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
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6 }}>
      <label style={{ fontSize: 12, color: "#ccc" }}>{label}</label>
      <div style={{ display: "contents" }}>
        <input
          aria-label={`${label} slider`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
        />
        <input
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
          style={{
            width: 70,
            padding: "2px 4px",
            background: "#222",
            color: "#eee",
            border: "1px solid #444",
            borderRadius: 4,
            fontSize: 12,
          }}
        />
      </div>
      {format ? (
        <div style={{ gridColumn: "1 / span 2", fontSize: 11, color: "#888" }}>
          {format(value)}
        </div>
      ) : null}
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
    <div
      style={{
        padding: "4px 6px",
        background: "#0b0b0b",
        border: "1px solid #222",
        borderRadius: 6,
        margin: "0 4px 6px",
        display: "grid",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: 6,
        }}
      >
        <label style={{ fontSize: 12, color: "#ccc" }}>Waveform</label>
        <select
          aria-label="Waveform"
          value={waveform}
          onChange={(e) => {
            const next = e.target.value;
            setWaveform(next);
            update({ waveform: next });
          }}
          style={{
            background: "#222",
            color: "#eee",
            border: "1px solid #444",
            borderRadius: 4,
            fontSize: 12,
            padding: "2px 4px",
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
        format={(v) => `${v.toFixed(1)} Hz`}
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
        format={(v) => `${v.toFixed(0)} cents`}
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
        format={(v) => `${Math.round(v * 100)}%`}
      />
    </div>
  );
};
