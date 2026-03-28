import React from "react";

import type { ModuleInstance } from "../../../modular/types";
import {
  calculateSyncedRate,
  constrainLfoDepth,
  constrainLfoPhaseOffset,
  constrainLfoRate,
  formatLfoRate,
  formatPhaseOffset,
  LFO_BPM_DEFAULT,
  LFO_BPM_MAXIMUM,
  LFO_BPM_MINIMUM,
  LFO_DEPTH_MAXIMUM,
  LFO_DEPTH_MINIMUM,
  LFO_PHASE_OFFSET_DEFAULT,
  LFO_PHASE_OFFSET_MAXIMUM,
  LFO_PHASE_OFFSET_MINIMUM,
  LFO_RATE_MAXIMUM,
  LFO_RATE_MINIMUM,
  LFO_SYNC_DIVISION_DEFAULT,
  LFO_SYNC_DIVISIONS,
  LFO_WAVEFORMS,
  type LfoSyncDivision,
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
  const [syncEnabled, setSyncEnabled] = React.useState<boolean>(
    typeof initial["syncEnabled"] === "boolean"
      ? (initial["syncEnabled"] as boolean)
      : false,
  );
  const [bpm, setBpm] = React.useState<number>(
    typeof initial["bpm"] === "number"
      ? (initial["bpm"] as number)
      : LFO_BPM_DEFAULT,
  );
  const [rateCvAmount, setRateCvAmount] = React.useState<number>(
    typeof initial["rateCvAmount"] === "number"
      ? (initial["rateCvAmount"] as number)
      : 10,
  );
  const [fadeIn, setFadeIn] = React.useState<number>(
    typeof initial["fadeIn"] === "number" ? (initial["fadeIn"] as number) : 0,
  );
  const [phaseOffset, setPhaseOffset] = React.useState<number>(
    typeof initial["phaseOffset"] === "number"
      ? constrainLfoPhaseOffset(initial["phaseOffset"] as number)
      : LFO_PHASE_OFFSET_DEFAULT,
  );
  const [syncDivision, setSyncDivision] = React.useState<LfoSyncDivision>(
    typeof initial["syncDivision"] === "string" &&
      LFO_SYNC_DIVISIONS.includes(initial["syncDivision"] as LfoSyncDivision)
      ? (initial["syncDivision"] as LfoSyncDivision)
      : LFO_SYNC_DIVISION_DEFAULT,
  );

  const update = React.useCallback(
    (partial: Record<string, unknown>) => module.updateParams?.(partial),
    [module],
  );

  /** Effective rate shown in UI when in sync mode */
  const effectiveRate = syncEnabled
    ? calculateSyncedRate(bpm, syncDivision)
    : rate;

  return (
    <div className="module-controls">
      <div className="lfo-preview-container">
        <LfoWaveformPreview
          waveform={waveform}
          rate={effectiveRate}
          depth={depth}
          bipolar={bipolar}
          phaseOffset={phaseOffset}
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
          <option value="sample_hold">S&amp;H</option>
        </select>
      </div>

      <div className="module-control">
        <label className="module-control-label">Rate Mode</label>
        <div className="toggle-button-group">
          <button
            type="button"
            className={`toggle-button ${!syncEnabled ? "active" : ""}`}
            onClick={() => {
              setSyncEnabled(false);
              update({ syncEnabled: false });
            }}
            aria-pressed={!syncEnabled}
          >
            Free
          </button>
          <button
            type="button"
            className={`toggle-button ${syncEnabled ? "active" : ""}`}
            onClick={() => {
              setSyncEnabled(true);
              update({ syncEnabled: true });
            }}
            aria-pressed={syncEnabled}
          >
            Sync
          </button>
        </div>
      </div>

      {!syncEnabled && (
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
      )}

      {syncEnabled && (
        <>
          <NumberControl
            label="BPM"
            value={bpm}
            min={LFO_BPM_MINIMUM}
            max={LFO_BPM_MAXIMUM}
            step={1}
            onChange={(v) => {
              setBpm(v);
              update({ bpm: v });
            }}
          />
          <div className="module-control">
            <label className="module-control-label">Division</label>
            <select
              className="module-control-select"
              aria-label="Sync Division"
              value={syncDivision}
              onChange={(e) => {
                const next = e.target.value as LfoSyncDivision;
                setSyncDivision(next);
                update({ syncDivision: next });
              }}
            >
              {LFO_SYNC_DIVISIONS.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
            <div className="module-control-hint">
              {formatLfoRate(calculateSyncedRate(bpm, syncDivision))} Hz
            </div>
          </div>
        </>
      )}

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

      <NumberControl
        label="Rate CV Amt (Hz)"
        value={rateCvAmount}
        min={0}
        max={50}
        step={0.5}
        onChange={(v) => {
          setRateCvAmount(v);
          update({ rateCvAmount: v });
        }}
      />

      <NumberControl
        label="Phase"
        value={phaseOffset}
        min={LFO_PHASE_OFFSET_MINIMUM}
        max={LFO_PHASE_OFFSET_MAXIMUM}
        step={0.01}
        formatDisplay={formatPhaseOffset}
        onChange={(v) => {
          setPhaseOffset(v);
          update({ phaseOffset: v });
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

      <NumberControl
        label="Fade-In (s)"
        value={fadeIn}
        min={0}
        max={10}
        step={0.1}
        onChange={(v) => {
          setFadeIn(v);
          update({ fadeIn: v });
        }}
      />

      <div className="module-control">
        <button
          type="button"
          className="reset-button"
          onClick={() => update({ triggerReset: true })}
          aria-label="Reset LFO phase"
        >
          Reset Phase
        </button>
      </div>
    </div>
  );
};
