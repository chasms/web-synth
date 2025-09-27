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