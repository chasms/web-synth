import "./PianoRollModal.css";

import React from "react";
import { createPortal } from "react-dom";

import { calculateMiddleCScrollPosition } from "../../utils/layoutUtils";
import { constrainToRange } from "../../utils/mathUtils";
import {
  constrainMidiVelocity,
  getMidiNoteName,
  isBlackKey,
  normalizeMidiVelocity,
} from "../../utils/midiUtils";
import type { SequenceStep } from "../../utils/sequenceUtils";
import {
  createEmptySequence,
  generateRandomSequence,
  isSequenceCellActive,
  setSequenceStepNote,
  setSequenceStepVelocity,
  stepHasNote,
} from "../../utils/sequenceUtils";

interface PianoRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  sequence: SequenceStep[];
  steps: number;
  transpose: number;
  onSequenceChange: (sequence: SequenceStep[]) => void;
  onStepsChange: (steps: number) => void;
  onTransposeChange: (transpose: number) => void;
}

export const PianoRollModal: React.FC<PianoRollModalProps> = ({
  isOpen,
  onClose,
  sequence,
  steps,
  transpose,
  onSequenceChange,
  onStepsChange,
  onTransposeChange,
}) => {
  const gridContainerRef = React.useRef<HTMLDivElement>(null);

  // Scroll to C4 (MIDI 60) on initial mount
  React.useEffect(() => {
    if (isOpen && gridContainerRef.current) {
      const rowHeight = 26; // 25px + 1px gap
      const containerHeight = gridContainerRef.current.clientHeight;
      const scrollPosition = calculateMiddleCScrollPosition(
        containerHeight,
        rowHeight,
      );
      gridContainerRef.current.scrollTop = scrollPosition;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // All MIDI notes (0-127, C-1 to G9)
  const allNotes = Array.from({ length: 128 }, (_, i) => i);

  const handleCellClick = (stepIndex: number, midiNote: number) => {
    const newSequence = setSequenceStepNote(sequence, stepIndex, midiNote);
    onSequenceChange(newSequence);
  };

  const handleVelocityChange = (stepIndex: number, velocity: number) => {
    const newSequence = setSequenceStepVelocity(sequence, stepIndex, velocity);
    onSequenceChange(newSequence);
  };

  const clearSequence = () => {
    onSequenceChange(createEmptySequence(steps));
  };

  const randomizeSequence = () => {
    const newSequence = generateRandomSequence(steps);
    onSequenceChange(newSequence);
  };

  return createPortal(
    <div className="piano-roll-modal-overlay" onClick={onClose}>
      <div className="piano-roll-modal" onClick={(e) => e.stopPropagation()}>
        <div className="piano-roll-header">
          <h2>Piano Roll Sequencer</h2>
          <div className="piano-roll-controls">
            <div className="control-group">
              <label>Steps:</label>
              <input
                type="range"
                min="1"
                max="32"
                value={steps}
                onChange={(e) => onStepsChange(Number(e.target.value))}
              />
              <input
                type="number"
                min="1"
                max="32"
                value={steps}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") return;
                  const numValue = constrainToRange(
                    parseInt(value, 10) || 1,
                    1,
                    32,
                  );
                  onStepsChange(numValue);
                }}
                className="value-input"
              />
            </div>
            <div className="control-group">
              <label>Transpose:</label>
              <input
                type="range"
                min="-24"
                max="24"
                value={transpose}
                onChange={(e) => onTransposeChange(Number(e.target.value))}
              />
              <input
                type="number"
                min="-24"
                max="24"
                value={transpose}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || value === "-") return;
                  const numValue = constrainToRange(
                    parseInt(value, 10) || 0,
                    -24,
                    24,
                  );
                  onTransposeChange(numValue);
                }}
                className="value-input"
              />
            </div>
            <button onClick={clearSequence}>Clear</button>
            <button onClick={randomizeSequence}>Random</button>
            <button onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="piano-roll-content">
          <div className="piano-roll-grid">
            {/* Grid container with scroll - contains both labels and cells */}
            <div className="grid-scroll-container" ref={gridContainerRef}>
              {/* Step numbers header - sticky */}
              <div className="step-numbers-header">
                <div className="note-label-spacer"></div>
                <div className="step-numbers">
                  {Array.from({ length: steps }, (_, i) => (
                    <div key={i} className="step-number">
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid content - labels and cells side by side */}
              <div className="grid-content">
                {allNotes
                  .slice()
                  .reverse()
                  .map((midiNote) => (
                    <div key={midiNote} className="grid-row">
                      {/* Note label for this row */}
                      <div
                        className={`note-label ${isBlackKey(midiNote) ? "black-key" : "white-key"}`}
                      >
                        {getMidiNoteName(midiNote)}
                      </div>

                      {/* Grid cells for this row */}
                      <div className="note-cells">
                        {Array.from({ length: steps }, (_, stepIndex) => {
                          const hasNote = isSequenceCellActive(
                            sequence,
                            stepIndex,
                            midiNote,
                            transpose,
                          );
                          const step = sequence[stepIndex];
                          const velocity = step?.velocity ?? 100;
                          return (
                            <button
                              key={stepIndex}
                              className={`grid-cell ${hasNote ? "active" : ""}`}
                              onClick={() =>
                                handleCellClick(stepIndex, midiNote)
                              }
                              style={{
                                opacity: hasNote
                                  ? normalizeMidiVelocity(velocity)
                                  : 0.1,
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Velocity controls for each step */}
          <div className="velocity-controls">
            {/* Spacer for note labels column */}
            <div className="velocity-label-spacer"></div>

            {/* Velocity sliders aligned with grid columns */}
            <div className="velocity-sliders">
              {Array.from({ length: steps }, (_, stepIndex) => {
                const step = sequence[stepIndex];
                const hasNote = stepHasNote(step);
                const velocity = step?.velocity ?? 100;
                return (
                  <div key={stepIndex} className="velocity-slider-container">
                    <input
                      type="number"
                      min="1"
                      max="127"
                      value={hasNote ? velocity : ""}
                      placeholder="-"
                      disabled={!hasNote}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") return;
                        const numValue = constrainMidiVelocity(
                          parseInt(value, 10) || 1,
                        );
                        handleVelocityChange(stepIndex, numValue);
                      }}
                      className="velocity-input"
                    />
                    <input
                      type="range"
                      min="1"
                      max="127"
                      value={hasNote ? velocity : 100}
                      disabled={!hasNote}
                      onChange={(e) =>
                        handleVelocityChange(stepIndex, Number(e.target.value))
                      }
                      className="velocity-slider"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
