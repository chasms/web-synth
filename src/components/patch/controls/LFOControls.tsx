import React from "react";

import type { ModuleInstance } from "../../../modular/types";
import {
  constrainLfoDepth,
  constrainLfoRate,
  formatLfoRate,
  LFO_DEPTH_MAXIMUM,
  LFO_DEPTH_MINIMUM,
  LFO_RATE_MAXIMUM,
  LFO_RATE_MINIMUM,
  LFO_WAVEFORMS,
  type LfoWaveform,
} from "../../../utils/lfoUtils";
import { constrainToRange } from "../../../utils/mathUtils";
import { LfoWaveformPreview } from "./LfoWaveformPreview";

interface NumberControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  formatDisplay?: (value: number) => string;
}

const NumberControl: React.FC<NumberControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
  formatDisplay,
}) => {
  const [text, setText] = React.useState<string>(() =>
    formatDisplay ? formatDisplay(value) : String(value),
  );
  React.useEffect(() => {
    setText(formatDisplay ? formatDisplay(value) : String(value));
  }, [value, formatDisplay]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      setText(formatDisplay ? formatDisplay(value) : String(value));
      return;
    }
    const clamped = constrainToRange(parsed, min, max);
    setText(formatDisplay ? formatDisplay(clamped) : String(clamped));
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
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => commit(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(text);
          if (e.key === "Escape")
            setText(formatDisplay ? formatDisplay(value) : String(value));
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
          onChange={(e) =>
            onChange(constrainToRange(Number(e.target.value), min, max))
          }
        />
      </div>
    </div>
  );
};

interface LFOControlsProps {
  module: ModuleInstance;
}

export const LFOControls: React.FC<LFOControlsProps> = ({ module }) => {
  const initial = module.getParams?.() ?? {};
  const [rate, setRate] = React.useState<number>(
    typeof initial["rate"] === "number"
      ? constrainLfoRate(initial["rate"] as number)
      : 1.0,
  );
  const [depth, setDepth] = React.useState<number>(
    typeof initial["depth"] === "number"
      ? constrainLfoDepth(initial["depth"] as number)
      : 1.0,
  );
  const [waveform, setWaveform] = React.useState<LfoWaveform>(
    typeof initial["waveform"] === "string" &&
      LFO_WAVEFORMS.includes(initial["waveform"] as LfoWaveform)
      ? (initial["waveform"] as LfoWaveform)
      : "sine",
  );
  const [bipolar, setBipolar] = React.useState<boolean>(
    typeof initial["bipolar"] === "boolean"
      ? (initial["bipolar"] as boolean)
      : true,
  );

  const update = React.useCallback(
    (partial: Record<string, unknown>) => module.updateParams?.(partial),
    [module],
  );

  return (
    <div className="module-controls">
      <div className="lfo-preview-container">
        <LfoWaveformPreview
          waveform={waveform}
          rate={rate}
          depth={depth}
          bipolar={bipolar}
        />
      </div>

      <div className="module-control">
        <label className="module-control-label">Waveform</label>
        <select
          className="module-control-select"
          aria-label="Waveform"
          value={waveform}
          onChange={(e) => {
            const next = e.target.value as LfoWaveform;
            setWaveform(next);
            update({ waveform: next });
          }}
        >
          <option value="sine">Sine</option>
          <option value="triangle">Triangle</option>
          <option value="square">Square</option>
          <option value="sawtooth">Sawtooth</option>
        </select>
      </div>

      <NumberControl
        label="Rate (Hz)"
        value={rate}
        min={LFO_RATE_MINIMUM}
        max={LFO_RATE_MAXIMUM}
        step={0.01}
        formatDisplay={formatLfoRate}
        onChange={(v) => {
          setRate(v);
          update({ rate: v });
        }}
      />

      <NumberControl
        label="Depth"
        value={depth}
        min={LFO_DEPTH_MINIMUM}
        max={LFO_DEPTH_MAXIMUM}
        step={0.01}
        onChange={(v) => {
          setDepth(v);
          update({ depth: v });
        }}
      />

      <div className="module-control">
        <label className="module-control-label">Output Mode</label>
        <div className="toggle-button-group">
          <button
            type="button"
            className={`toggle-button ${bipolar ? "active" : ""}`}
            onClick={() => {
              setBipolar(true);
              update({ bipolar: true });
            }}
            aria-pressed={bipolar}
          >
            Bipolar
          </button>
          <button
            type="button"
            className={`toggle-button ${!bipolar ? "active" : ""}`}
            onClick={() => {
              setBipolar(false);
              update({ bipolar: false });
            }}
            aria-pressed={!bipolar}
          >
            Unipolar
          </button>
        </div>
        <div className="module-control-hint">
          {bipolar ? "-1 to +1" : "0 to +1"}
        </div>
      </div>
    </div>
  );
};
