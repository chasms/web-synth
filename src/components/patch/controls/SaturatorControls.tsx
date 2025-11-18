import React from "react";

import type { ModuleInstance } from "../../../modular/types";

interface SaturationCurveVisualizerProps {
  drive: number;
}

/**
 * Visualizes the saturation transfer function curve.
 * Shows input vs output to demonstrate how the waveshaping affects the signal.
 */
const SaturationCurveVisualizer: React.FC<SaturationCurveVisualizerProps> = ({
  drive,
}) => {
  const width = 160;
  const height = 80;
  const points = 100;

  // Generate the saturation curve using the same tanh function as the audio module
  const pathPoints: string[] = [];
  const inputSignalPoints: string[] = [];

  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * width;
    // Input range: -1 to 1
    const input = (i / (points - 1)) * 2 - 1;

    // Apply drive and saturation (same as Saturator.ts)
    const drivenInput = input * drive;
    const saturated = Math.tanh(drivenInput * 1.5);

    // Map to screen coordinates (flip y-axis)
    const inputY = height - ((input + 1) / 2) * height;
    const outputY = height - ((saturated + 1) / 2) * height;

    pathPoints.push(i === 0 ? `M ${x} ${outputY}` : `L ${x} ${outputY}`);
    inputSignalPoints.push(i === 0 ? `M ${x} ${inputY}` : `L ${x} ${inputY}`);
  }

  return (
    <div
      style={{
        padding: "4px 8px",
        background: "#0a0a0a",
        borderRadius: "4px",
        margin: "4px 0",
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        <defs>
          <pattern
            id="saturation-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#333"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#saturation-grid)" />

        {/* Center line (0) */}
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="#555"
          strokeWidth="1"
          opacity="0.5"
        />

        {/* Unity gain line (input = output, no saturation) */}
        <line
          x1="0"
          y1={height}
          x2={width}
          y2="0"
          stroke="#666"
          strokeWidth="1"
          strokeDasharray="2,2"
          opacity="0.3"
        />

        {/* Input signal reference (light gray) */}
        <path
          d={inputSignalPoints.join(" ")}
          fill="none"
          stroke="#666"
          strokeWidth="1"
          opacity="0.5"
        />

        {/* Saturation curve (orange) */}
        <path
          d={pathPoints.join(" ")}
          fill="none"
          stroke="#ff9500"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Labels */}
        <text x="4" y="12" fontSize="9" fill="#888" fontFamily="monospace">
          +1
        </text>
        <text
          x="4"
          y={height - 2}
          fontSize="9"
          fill="#888"
          fontFamily="monospace"
        >
          -1
        </text>
        <text
          x={width - 18}
          y={height / 2 + 10}
          fontSize="8"
          fill="#666"
          fontFamily="monospace"
        >
          in
        </text>
      </svg>
    </div>
  );
};

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
 * - Mix: Dry/wet blend (0% to 100%)
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
  const [mix, setMix] = React.useState<number>(
    typeof initial["mix"] === "number" ? (initial["mix"] as number) : 1.0,
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
      {/* Saturation curve visualization */}
      <SaturationCurveVisualizer drive={drive} />

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
        label="Mix"
        value={mix * 100}
        min={0}
        max={100}
        step={1}
        suffix="%"
        onChange={(v) => {
          const normalized = v / 100;
          setMix(normalized);
          update({ mix: normalized });
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
