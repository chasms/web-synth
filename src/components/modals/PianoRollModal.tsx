import "./PianoRollModal.css";

import React from "react";
import { createPortal } from "react-dom";

// Sequence step data structure (matching triggers module)
interface SequenceStep {
  note?: number; // MIDI note number (0-127, undefined = rest)
  velocity?: number; // Note velocity (0-127)
  gate?: number; // Gate length override for this step (0-1)
}

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

// Piano key helpers
const BLACK_KEYS = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#

function isBlackKey(noteIndex: number): boolean {
  return BLACK_KEYS.includes(noteIndex % 12);
}

function getNoteName(midiNote: number): string {
  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const noteIndex = midiNote % 12;
  const octaveNumber = Math.floor(midiNote / 12) - 1;
  return `${noteNames[noteIndex]}${octaveNumber}`;
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
      // C4 is MIDI note 60, counting from 0 (C-1), so it's at index 60
      // Each row is ~26px (25px height + 1px gap)
      // We want C4 centered, so scroll to approximately its position
      // Total notes: 128, C4 is at index 60 from bottom
      // From top: 128 - 60 - 1 = 67
      const rowHeight = 26; // 25px + 1px gap
      const c4IndexFromTop = 128 - 60 - 1;
      const scrollPosition = c4IndexFromTop * rowHeight - 150; // Offset to center
      gridContainerRef.current.scrollTop = scrollPosition;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // All MIDI notes (0-127, C-1 to G9)
  const allNotes = Array.from({ length: 128 }, (_, i) => i);

  const handleCellClick = (stepIndex: number, midiNote: number) => {
    const newSequence = [...sequence];

    // Ensure sequence is long enough
    while (newSequence.length <= stepIndex) {
      newSequence.push({});
    }

    const currentStep = newSequence[stepIndex];
    if (currentStep.note === midiNote) {
      // Remove note if clicking on existing note
      newSequence[stepIndex] = { ...currentStep, note: undefined };
    } else {
      // Add or change note
      newSequence[stepIndex] = {
        ...currentStep,
        note: midiNote,
        velocity: currentStep.velocity ?? 100,
      };
    }

    onSequenceChange(newSequence);
  };

  const handleVelocityChange = (stepIndex: number, velocity: number) => {
    const newSequence = [...sequence];
    // Ensure sequence is long enough
    while (newSequence.length <= stepIndex) {
      newSequence.push({});
    }

    if (newSequence[stepIndex]) {
      newSequence[stepIndex] = { ...newSequence[stepIndex], velocity };
    } else {
      // If there's no note, don't set velocity
      return;
    }
    onSequenceChange(newSequence);
  };

  const clearSequence = () => {
    onSequenceChange(new Array(steps).fill({}));
  };

  const randomizeSequence = () => {
    const newSequence = Array.from({ length: steps }, () => {
      // 70% chance of having a note
      if (Math.random() > 0.3) {
        const randomNote = Math.floor(Math.random() * 128); // Random note 0-127
        const randomVelocity = 60 + Math.random() * 67; // 60-127
        return { note: randomNote, velocity: Math.floor(randomVelocity) };
      }
      return {};
    });
    onSequenceChange(newSequence);
  };

  // Get the displayed note for a given programmed note (with transpose applied)
  const getDisplayedNote = (programmedNote: number): number => {
    return Math.max(0, Math.min(127, programmedNote + transpose));
  };

  // Check if a cell should be active (note is programmed and transposed to this position)
  const isCellActive = (stepIndex: number, displayMidiNote: number): boolean => {
    const step = sequence[stepIndex];
    if (!step || step.note === undefined) return false;
    return getDisplayedNote(step.note) === displayMidiNote;
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
              <span>{steps}</span>
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
              <span>
                {transpose >= 0 ? "+" : ""}
                {transpose}
              </span>
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
                        {getNoteName(midiNote)}
                      </div>

                      {/* Grid cells for this row */}
                      <div className="note-cells">
                        {Array.from({ length: steps }, (_, stepIndex) => {
                          const hasNote = isCellActive(stepIndex, midiNote);
                          const step = sequence[stepIndex];
                          const velocity = step?.velocity ?? 100;
                          return (
                            <button
                              key={stepIndex}
                              className={`grid-cell ${hasNote ? "active" : ""}`}
                              onClick={() => handleCellClick(stepIndex, midiNote)}
                              style={{
                                opacity: hasNote ? velocity / 127 : 0.1,
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
                const hasNote = step?.note !== undefined;
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
                        const numValue = Math.max(
                          1,
                          Math.min(127, parseInt(value, 10) || 1),
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
