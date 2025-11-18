import React from "react";

import type { ModuleInstance } from "../../../modular/types";
import type { SequenceStep } from "../../../utils/sequenceUtils";
import { formatPercentage } from "../../../utils/validationUtils";
import { PianoRollModal } from "../../modals/PianoRollModal";

interface SequencerControlsProps {
  module: ModuleInstance;
}

export const SequencerControls: React.FC<SequencerControlsProps> = ({
  module,
}) => {
  const initial = module.getParams?.() ?? {};
  const [bpm, setBpm] = React.useState<number>((initial.bpm as number) || 120);
  const [steps, setSteps] = React.useState<number>(
    (initial.steps as number) || 8,
  );
  const [gateLength, setGateLength] = React.useState<number>(
    (initial.gate as number) || 0.8,
  );
  const [swing, setSwing] = React.useState<number>(
    (initial.swing as number) ?? 0,
  );
  const [transpose, setTranspose] = React.useState<number>(
    (initial.transpose as number) ?? 0,
  );
  const [loop, setLoop] = React.useState<boolean>(
    (initial.loop as boolean) ?? true,
  );
  const [sequence, setSequence] = React.useState<SequenceStep[]>(
    (initial.sequence as SequenceStep[]) || [],
  );
  const [isPlaying, setIsPlaying] = React.useState<boolean>(
    (initial.isPlaying as boolean) || false,
  );
  const [currentStep, setCurrentStep] = React.useState<number>(
    (initial.currentStep as number) || 0,
  );

  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Sync with module state periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      const params = module.getParams?.() ?? {};
      if (params.isPlaying !== isPlaying) {
        setIsPlaying(params.isPlaying as boolean);
      }
      if (params.currentStep !== currentStep) {
        setCurrentStep(params.currentStep as number);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [module, isPlaying, currentStep]);

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    module.updateParams?.({ bpm: newBpm });
  };

  const handleStepsChange = (newSteps: number) => {
    setSteps(newSteps);
    module.updateParams?.({ steps: newSteps });
  };

  const handleGateLengthChange = (newGate: number) => {
    setGateLength(newGate);
    module.updateParams?.({ gate: newGate });
  };

  const handleSwingChange = (newSwing: number) => {
    setSwing(newSwing);
    module.updateParams?.({ swing: newSwing });
  };

  const handleTransposeChange = (newTranspose: number) => {
    setTranspose(newTranspose);
    module.updateParams?.({ transpose: newTranspose });
  };

  const handleLoopChange = (newLoop: boolean) => {
    setLoop(newLoop);
    module.updateParams?.({ loop: newLoop });
  };

  const handleSequenceChange = (newSequence: SequenceStep[]) => {
    setSequence(newSequence);
    module.updateParams?.({ sequence: newSequence });
  };

  const handlePlayStop = () => {
    if (isPlaying) {
      module.gateOff?.();
    } else {
      module.gateOn?.();
    }
  };

  // Calculate sequence visualization (mini grid)
  const getMiniGridCells = () => {
    return Array.from({ length: Math.min(steps, 16) }, (_, i) => {
      const step = sequence[i];
      const hasNote = step?.note !== undefined;
      const isCurrentStep = i === currentStep && isPlaying;
      return { hasNote, isCurrentStep, step: i };
    });
  };

  return (
    <div className="sequencer-controls">
      {/* Transport Controls */}
      <div className="transport-section">
        <button
          className={`play-button ${isPlaying ? "playing" : ""}`}
          onClick={handlePlayStop}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <div className="step-display">
          Step: {currentStep + 1}/{steps}
        </div>
      </div>

      {/* Mini sequence visualization */}
      <div className="sequence-preview">
        <div className="mini-grid">
          {getMiniGridCells().map((cell) => (
            <div
              key={cell.step}
              className={`mini-cell ${cell.hasNote ? "has-note" : ""} ${
                cell.isCurrentStep ? "current" : ""
              }`}
            />
          ))}
        </div>
        <button className="edit-button" onClick={() => setIsModalOpen(true)}>
          Edit Sequence
        </button>
      </div>

      {/* Parameter Controls */}
      <div className="parameter-grid">
        <div className="control-row">
          <label>BPM:</label>
          <div className="number-input-container">
            <input
              type="range"
              min="60"
              max="200"
              value={bpm}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
              className="control-slider"
            />
            <span className="value-display">{bpm}</span>
          </div>
        </div>

        <div className="control-row">
          <label>Steps:</label>
          <div className="number-input-container">
            <input
              type="range"
              min="1"
              max="32"
              value={steps}
              onChange={(e) => handleStepsChange(Number(e.target.value))}
              className="control-slider"
            />
            <span className="value-display">{steps}</span>
          </div>
        </div>

        <div className="control-row">
          <label>Gate:</label>
          <div className="number-input-container">
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={gateLength}
              onChange={(e) => handleGateLengthChange(Number(e.target.value))}
              className="control-slider"
            />
            <span className="value-display">
              {formatPercentage(gateLength)}
            </span>
          </div>
        </div>

        <div className="control-row">
          <label>Swing:</label>
          <div className="number-input-container">
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.01"
              value={swing}
              onChange={(e) => handleSwingChange(Number(e.target.value))}
              className="control-slider"
            />
            <span className="value-display">
              {formatPercentage(swing, true)}
            </span>
          </div>
        </div>

        <div className="control-row">
          <label>Loop:</label>
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => handleLoopChange(e.target.checked)}
          />
        </div>
      </div>

      {/* Piano Roll Modal */}
      <PianoRollModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sequence={sequence}
        steps={steps}
        transpose={transpose}
        onSequenceChange={handleSequenceChange}
        onStepsChange={handleStepsChange}
        onTransposeChange={handleTransposeChange}
      />
    </div>
  );
};
