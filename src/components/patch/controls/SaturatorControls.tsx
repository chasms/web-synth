import React from "react";

import type { ModuleInstance } from "../../../modular/types";

// ============================================================================
// Pure Functions - Saturation Curve Mathematics
// ============================================================================

/**
 * Applies the TR-303 style saturation transfer function.
 * Uses tanh for smooth, musical soft clipping.
 *
 * @param inputAmplitude - Input signal amplitude in range [-1, 1]
 * @param driveAmount - Drive multiplier (0.5 to 10.0)
 * @returns Saturated output amplitude in range [-1, 1]
 */
function applySaturationTransferFunction(
  inputAmplitude: number,
  driveAmount: number,
): number {
  const SATURATION_CURVE_FACTOR = 1.5; // Matches Saturator.ts
  const drivenInput = inputAmplitude * driveAmount;
  return Math.tanh(drivenInput * SATURATION_CURVE_FACTOR);
}

/**
 * Maps a normalized audio amplitude value [-1, 1] to screen Y coordinate.
 * Inverts Y-axis so positive values appear at top of display.
 *
 * @param amplitude - Audio amplitude in range [-1, 1]
 * @param canvasHeight - Height of the canvas in pixels
 * @returns Y coordinate in pixels
 */
function mapAmplitudeToScreenY(
  amplitude: number,
  canvasHeight: number,
): number {
  return canvasHeight - ((amplitude + 1) / 2) * canvasHeight;
}

/**
 * Generates a coordinate for one point on the saturation curve.
 *
 * @param sampleIndex - Index of the sample point
 * @param totalSamples - Total number of samples across the curve
 * @param canvasWidth - Width of the canvas in pixels
 * @param canvasHeight - Height of the canvas in pixels
 * @param driveAmount - Current drive setting
 * @returns Object with screen coordinates and amplitude values
 */
function generateCurvePoint(
  sampleIndex: number,
  totalSamples: number,
  canvasWidth: number,
  canvasHeight: number,
  driveAmount: number,
): { x: number; inputY: number; outputY: number } {
  const x = (sampleIndex / (totalSamples - 1)) * canvasWidth;
  const inputAmplitude = (sampleIndex / (totalSamples - 1)) * 2 - 1;
  const outputAmplitude = applySaturationTransferFunction(
    inputAmplitude,
    driveAmount,
  );

  return {
    x,
    inputY: mapAmplitudeToScreenY(inputAmplitude, canvasHeight),
    outputY: mapAmplitudeToScreenY(outputAmplitude, canvasHeight),
  };
}

/**
 * Builds an SVG path string from an array of coordinate points.
 *
 * @param points - Array of {x, y} coordinates
 * @returns SVG path data string (e.g., "M 0 40 L 10 38 L 20 35...")
 */
function buildSvgPathFromPoints(
  points: Array<{ x: number; y: number }>,
): string {
  return points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.x} ${point.y}`;
    })
    .join(" ");
}

/**
 * Generates complete curve data for saturation visualization.
 *
 * @param driveAmount - Current drive setting
 * @param canvasWidth - Width of the canvas
 * @param canvasHeight - Height of the canvas
 * @param sampleCount - Number of points to calculate
 * @returns Object containing SVG path strings for input and output curves
 */
function generateSaturationCurveData(
  driveAmount: number,
  canvasWidth: number,
  canvasHeight: number,
  sampleCount: number,
): { inputPath: string; outputPath: string } {
  const points = Array.from({ length: sampleCount }, (_, i) =>
    generateCurvePoint(i, sampleCount, canvasWidth, canvasHeight, driveAmount),
  );

  const inputPath = buildSvgPathFromPoints(
    points.map((p) => ({ x: p.x, y: p.inputY })),
  );
  const outputPath = buildSvgPathFromPoints(
    points.map((p) => ({ x: p.x, y: p.outputY })),
  );

  return { inputPath, outputPath };
}

// ============================================================================
// Pure Functions - Value Conversions
// ============================================================================

/**
 * Converts a unit value (0.0 to 1.0) to percentage (0 to 100).
 *
 * @param unitValue - Value in range [0.0, 1.0]
 * @returns Percentage value in range [0, 100]
 */
function convertUnitToPercentage(unitValue: number): number {
  return unitValue * 100;
}

/**
 * Converts a percentage (0 to 100) to unit value (0.0 to 1.0).
 *
 * @param percentage - Percentage in range [0, 100]
 * @returns Unit value in range [0.0, 1.0]
 */
function convertPercentageToUnit(percentage: number): number {
  return percentage / 100;
}

// ============================================================================
// Components
// ============================================================================

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
  const sampleCount = 100;

  const { inputPath, outputPath } = generateSaturationCurveData(
    drive,
    width,
    height,
    sampleCount,
  );

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
          d={inputPath}
          fill="none"
          stroke="#666"
          strokeWidth="1"
          opacity="0.5"
        />

        {/* Saturation curve (orange) */}
        <path
          d={outputPath}
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

  return (
    <div className="module-control">
      <label className="module-control-label">{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
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
          style={{ flex: 1 }}
        />
        {suffix && (
          <span
            style={{
              fontSize: "11px",
              color: "#888",
              fontFamily: "monospace",
              minWidth: "30px",
            }}
          >
            {suffix}
          </span>
        )}
      </div>
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
        value={convertUnitToPercentage(mix)}
        min={0}
        max={100}
        step={1}
        suffix="%"
        onChange={(percentage) => {
          const unitValue = convertPercentageToUnit(percentage);
          setMix(unitValue);
          update({ mix: unitValue });
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
