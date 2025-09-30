import "./PianoRollModal.css";

import React from "react";

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
  octave: number;
  onSequenceChange: (sequence: SequenceStep[]) => void;
  onStepsChange: (steps: number) => void;
  onOctaveChange: (octave: number) => void;
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
  octave,
  onSequenceChange,
  onStepsChange,
  onOctaveChange,
}) => {
  const [selectedStep, setSelectedStep] = React.useState<number | null>(null);

  if (!isOpen) return null;

  // Calculate note range for display (one octave)
  const baseNote = octave * 12; // C of the selected octave
  const noteRange = Array.from({ length: 12 }, (_, i) => baseNote + i);

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
    setSelectedStep(stepIndex);
  };

  const handleVelocityChange = (stepIndex: number, velocity: number) => {
    const newSequence = [...sequence];
    if (newSequence[stepIndex]) {
      newSequence[stepIndex] = { ...newSequence[stepIndex], velocity };
      onSequenceChange(newSequence);
    }
  };

  const clearSequence = () => {
    onSequenceChange(new Array(steps).fill({}));
  };

  const randomizeSequence = () => {
    const newSequence = Array.from({ length: steps }, () => {
      // 70% chance of having a note
      if (Math.random() > 0.3) {
        const randomNote = noteRange[Math.floor(Math.random() * 12)];
        const randomVelocity = 60 + Math.random() * 67; // 60-127
        return { note: randomNote, velocity: Math.floor(randomVelocity) };
      }
      return {};
    });
    onSequenceChange(newSequence);
  };

  return (
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
              <label>Octave:</label>
              <select
                value={octave}
                onChange={(e) => onOctaveChange(Number(e.target.value))}
              >
                {Array.from({ length: 8 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={clearSequence}>Clear</button>
            <button onClick={randomizeSequence}>Random</button>
            <button onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="piano-roll-grid">
          {/* Note labels */}
          <div className="note-labels">
            {noteRange
              .slice()
              .reverse()
              .map((midiNote) => (
                <div
                  key={midiNote}
                  className={`note-label ${isBlackKey(midiNote) ? "black-key" : "white-key"}`}
                >
                  {getNoteName(midiNote)}
                </div>
              ))}
          </div>

          {/* Grid cells */}
          <div className="grid-container">
            <div className="step-numbers">
              {Array.from({ length: steps }, (_, i) => (
                <div key={i} className="step-number">
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="grid-cells">
              {noteRange
                .slice()
                .reverse()
                .map((midiNote) => (
                  <div key={midiNote} className="note-row">
                    {Array.from({ length: steps }, (_, stepIndex) => {
                      const step = sequence[stepIndex];
                      const hasNote = step?.note === midiNote;
                      const velocity = step?.velocity ?? 100;
                      return (
                        <button
                          key={stepIndex}
                          className={`grid-cell ${hasNote ? "active" : ""} ${
                            selectedStep === stepIndex ? "selected" : ""
                          }`}
                          onClick={() => handleCellClick(stepIndex, midiNote)}
                          style={{
                            opacity: hasNote ? velocity / 127 : 0.1,
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
            </div>
          </div>

          {/* Velocity editor for selected step */}
          {selectedStep !== null && sequence[selectedStep]?.note && (
            <div className="velocity-editor">
              <label>
                Step {selectedStep + 1} Velocity:
                <input
                  type="range"
                  min="1"
                  max="127"
                  value={sequence[selectedStep]?.velocity ?? 100}
                  onChange={(e) =>
                    handleVelocityChange(selectedStep, Number(e.target.value))
                  }
                />
                <span>{sequence[selectedStep]?.velocity ?? 100}</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
