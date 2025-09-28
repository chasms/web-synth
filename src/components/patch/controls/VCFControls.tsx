import React from "react";

import { type ModuleInstance } from "../../../modular/types";

interface VCFControlsProps {
  module: ModuleInstance;
}

// Filter type options for the dropdown
const FILTER_TYPES: Array<{ value: BiquadFilterType; label: string }> = [
  { value: "lowpass", label: "Low Pass" },
  { value: "highpass", label: "High Pass" },
  { value: "bandpass", label: "Band Pass" },
  { value: "notch", label: "Notch" },
  { value: "allpass", label: "All Pass" },
  { value: "peaking", label: "Peaking" },
  { value: "lowshelf", label: "Low Shelf" },
  { value: "highshelf", label: "High Shelf" },
];

// Frequency response visualization
const FrequencyResponseCurve: React.FC<{
  cutoff: number;
  resonance: number;
  filterType: BiquadFilterType;
}> = ({ cutoff, resonance, filterType }) => {
  const width = 160;
  const height = 40;
  const points = 80;

  // Generate frequency response curve
  const pathPoints: string[] = [];

  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * width;
    // Logarithmic frequency scale from 20Hz to 20kHz
    const freq = 20 * Math.pow(1000, i / (points - 1));
    const normalizedFreq = freq / cutoff;

    let magnitude = 1;

    // Simplified filter response approximation
    switch (filterType) {
      case "lowpass": {
        const rolloff = Math.pow(normalizedFreq, 2);
        magnitude = 1 / Math.sqrt(1 + rolloff * rolloff);
        // Add resonance peak
        if (resonance > 1) {
          magnitude *= 1 + (resonance - 1) * 0.3;
        }
        break;
      }
      case "highpass": {
        const rolloff = 1 / Math.pow(normalizedFreq, 2);
        magnitude = 1 / Math.sqrt(1 + rolloff * rolloff);
        if (normalizedFreq > 0.8 && normalizedFreq < 1.2) {
          magnitude *= 1 + (resonance - 1) * 0.3;
        }
        break;
      }
      case "bandpass": {
        const distance = Math.abs(Math.log(normalizedFreq));
        magnitude = 1 / (1 + distance * distance * 4);
        if (normalizedFreq > 0.9 && normalizedFreq < 1.1) {
          magnitude *= 1 + (resonance - 1) * 0.4;
        }
        break;
      }
      case "notch": {
        const distance = Math.abs(Math.log(normalizedFreq));
        magnitude = distance / (1 + distance);
        break;
      }
      default:
        magnitude = 1;
    }

    // Convert magnitude to dB and scale for display
    const dB = 20 * Math.log10(Math.max(magnitude, 0.001));
    const y = height - ((dB + 40) / 60) * height; // -40dB to +20dB range

    pathPoints.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
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
            id="grid"
            width="20"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 10"
              fill="none"
              stroke="#333"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />
        {/* Center line (0dB) */}
        <line
          x1="0"
          y1={height * 0.67}
          x2={width}
          y2={height * 0.67}
          stroke="#555"
          strokeWidth="1"
          opacity="0.5"
        />
        {/* Frequency response curve */}
        <path
          d={pathPoints.join(" ")}
          fill="none"
          stroke="#ff9500"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Cutoff frequency indicator */}
        <line
          x1={width / 2}
          y1="0"
          x2={width / 2}
          y2={height}
          stroke="#ff9500"
          strokeWidth="1"
          strokeDasharray="2,2"
          opacity="0.7"
        />
      </svg>
    </div>
  );
};

export const VCFControls: React.FC<VCFControlsProps> = ({ module }) => {
  const params = module.getParams?.() || {};

  const [cutoff, setCutoff] = React.useState<number>(
    typeof params.cutoff === "number" ? params.cutoff : 1200,
  );
  const [resonance, setResonance] = React.useState<number>(
    typeof params.resonance === "number" ? params.resonance : 0.7,
  );
  const [filterType, setFilterType] = React.useState<BiquadFilterType>(
    typeof params.type === "string"
      ? (params.type as BiquadFilterType)
      : "lowpass",
  );
  const [envelopeAmount, setEnvelopeAmount] = React.useState<number>(
    typeof params.envelopeAmount === "number" ? params.envelopeAmount : 0.0,
  );
  const [drive, setDrive] = React.useState<number>(
    typeof params.drive === "number" ? params.drive : 1.0,
  );

  const updateParam = React.useCallback(
    (key: string, value: number | string) => {
      module.updateParams?.({ [key]: value });
    },
    [module],
  );

  const handleCutoffChange = (value: number) => {
    setCutoff(value);
    updateParam("cutoff", value);
  };

  const handleResonanceChange = (value: number) => {
    setResonance(value);
    updateParam("resonance", value);
  };

  const handleTypeChange = (type: BiquadFilterType) => {
    setFilterType(type);
    updateParam("type", type);
  };

  const handleEnvelopeAmountChange = (value: number) => {
    setEnvelopeAmount(value);
    updateParam("envelopeAmount", value);
  };

  const handleDriveChange = (value: number) => {
    setDrive(value);
    updateParam("drive", value);
  };

  return (
    <div className="module-controls">
      {/* Frequency Response Visualization */}
      <FrequencyResponseCurve
        cutoff={cutoff}
        resonance={resonance}
        filterType={filterType}
      />

      {/* Filter Type */}
      <div className="module-control">
        <label className="module-control-label">Type</label>
        <select
          className="module-control-select"
          value={filterType}
          onChange={(e) => handleTypeChange(e.target.value as BiquadFilterType)}
        >
          {FILTER_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Cutoff Frequency */}
      <div className="module-control">
        <label className="module-control-label">
          Cutoff: {cutoff.toFixed(0)} Hz
        </label>
        <input
          type="range"
          className="module-control-slider"
          min={20}
          max={20000}
          step={1}
          value={cutoff}
          onChange={(e) => handleCutoffChange(Number(e.target.value))}
        />
      </div>

      {/* Resonance */}
      <div className="module-control">
        <label className="module-control-label">
          Resonance: {resonance.toFixed(2)}
        </label>
        <input
          type="range"
          className="module-control-slider"
          min={0.1}
          max={30}
          step={0.1}
          value={resonance}
          onChange={(e) => handleResonanceChange(Number(e.target.value))}
        />
      </div>

      {/* Envelope Amount */}
      <div className="module-control">
        <label className="module-control-label">
          Env Amount: {(envelopeAmount * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          className="module-control-slider"
          min={-1}
          max={1}
          step={0.01}
          value={envelopeAmount}
          onChange={(e) => handleEnvelopeAmountChange(Number(e.target.value))}
        />
      </div>

      {/* Drive */}
      <div className="module-control">
        <label className="module-control-label">
          Drive: {drive.toFixed(1)}x
        </label>
        <input
          type="range"
          className="module-control-slider"
          min={0.1}
          max={5}
          step={0.1}
          value={drive}
          onChange={(e) => handleDriveChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
};
