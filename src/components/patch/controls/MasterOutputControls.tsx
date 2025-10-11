import React from "react";

import type { MasterOutputAnalyserData } from "../../../modular/modules/MasterOutput";
import type { ModuleInstance } from "../../../modular/types";
import { WaveformVisualizer } from "./WaveformVisualizer";

interface MasterOutputControlsProps {
  module: ModuleInstance;
}

export const MasterOutputControls: React.FC<MasterOutputControlsProps> = ({
  module,
}) => {
  const initial = module.getParams?.() ?? {};
  const [volume, setVolume] = React.useState<number>(
    typeof initial["volume"] === "number" ? initial["volume"] : 0.7,
  );
  const [mute, setMute] = React.useState<boolean>(
    typeof initial["mute"] === "boolean" ? initial["mute"] : false,
  );
  const [testTone, setTestTone] = React.useState<boolean>(
    typeof initial["testTone"] === "boolean" ? initial["testTone"] : false,
  );

  const update = React.useCallback(
    (partial: Record<string, unknown>) => module.updateParams?.(partial),
    [module],
  );

  const handleVolumeChange = (nextVolume: number) => {
    setVolume(nextVolume);
    update({ volume: nextVolume });
  };

  const handleMuteToggle = () => {
    const nextMute = !mute;
    setMute(nextMute);
    update({ mute: nextMute });
  };

  const handleTestToneToggle = () => {
    const nextTestTone = !testTone;
    setTestTone(nextTestTone);
    update({ testTone: nextTestTone });
  };

  return (
    <div className="module-controls">
      {/* Master Volume */}
      <div className="module-control">
        <label htmlFor={`volume-${module.id}`}>Master Volume</label>
        <input
          id={`volume-${module.id}`}
          className="module-control-input"
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={volume.toFixed(2)}
          onChange={(e) => {
            const val = Math.max(0, Math.min(1, Number(e.target.value)));
            handleVolumeChange(val);
          }}
        />
        <div className="module-control-slider-row">
          <input
            className="module-control-slider"
            aria-label="Master Volume slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
          />
        </div>
        <div className="volume-display">{Math.round(volume * 100)}%</div>
      </div>

      {/* Mute Button */}
      <div className="module-control">
        <button
          className={`mute-button ${mute ? "muted" : "unmuted"}`}
          onClick={handleMuteToggle}
          aria-label={mute ? "Unmute" : "Mute"}
        >
          {mute ? "🔇 MUTED" : "🔊 ON"}
        </button>
      </div>

      {/* Test Tone Button */}
      <div className="module-control">
        <button
          className={`test-tone-button ${testTone ? "active" : "inactive"}`}
          onClick={handleTestToneToggle}
          aria-label={testTone ? "Disable Test Tone" : "Enable Test Tone"}
        >
          {testTone ? "🎵 TEST ON" : "🎵 TEST OFF"}
        </button>
      </div>

      {/* Output Level Indicator */}
      <div className="module-control">
        <div className="output-indicator">
          <div className="output-label">Output</div>
          <div className={`output-status ${mute ? "muted" : "active"}`}>
            {mute ? "MUTED" : "TO SPEAKERS"}
          </div>
        </div>
      </div>

      {/* Waveform Visualizer */}
      {module.getAnalyserData && (
        <div className="module-control">
          <WaveformVisualizer
            getAnalyserData={
              module.getAnalyserData as () => MasterOutputAnalyserData
            }
            width={180}
            height={80}
            className="master-waveform"
          />
        </div>
      )}
    </div>
  );
};
