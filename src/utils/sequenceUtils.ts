/**
 * Sequence manipulation utilities for the sequencer
 * All functions are pure (no side effects, same input = same output)
 */

/**
 * Sequence step data structure
 */
export interface SequenceStep {
  note?: number; // MIDI note number (0-127, undefined = rest)
  velocity?: number; // Note velocity (0-127)
  gate?: number; // Gate length override for this step (0-1)
}

/**
 * Default velocity for new notes
 */
export const DEFAULT_VELOCITY = 100;

/**
 * Ensures a sequence has at least the specified length by padding with empty steps
 * @param sequence - The original sequence
 * @param minimumLength - The minimum required length
 * @returns A new sequence with at least minimumLength steps
 */
export function ensureSequenceLength(
  sequence: SequenceStep[],
  minimumLength: number,
): SequenceStep[] {
  if (sequence.length >= minimumLength) {
    return [...sequence];
  }

  const paddingLength = minimumLength - sequence.length;
  const padding = Array.from({ length: paddingLength }, () => ({}));
  return [...sequence, ...padding];
}

/**
 * Sets or toggles a note at a specific step in the sequence
 * If the step already has the specified note, it removes the note (toggle off)
 * If the step has a different note or no note, it sets the new note
 * @param sequence - The original sequence
 * @param stepIndex - The step index to modify
 * @param midiNote - The MIDI note to set
 * @param velocity - The velocity for the note (default: 100)
 * @returns A new sequence with the modified step
 */
export function setSequenceStepNote(
  sequence: SequenceStep[],
  stepIndex: number,
  midiNote: number,
  velocity: number = DEFAULT_VELOCITY,
): SequenceStep[] {
  // Ensure sequence is long enough
  const workingSequence = ensureSequenceLength(sequence, stepIndex + 1);
  const newSequence = [...workingSequence];

  const currentStep = newSequence[stepIndex];

  if (currentStep.note === midiNote) {
    // Remove note if clicking on existing note (toggle off)
    newSequence[stepIndex] = { ...currentStep, note: undefined };
  } else {
    // Add or change note
    newSequence[stepIndex] = {
      ...currentStep,
      note: midiNote,
      velocity: currentStep.velocity ?? velocity,
    };
  }

  return newSequence;
}

/**
 * Sets the velocity for a specific step in the sequence
 * Only updates velocity if the step has a note
 * @param sequence - The original sequence
 * @param stepIndex - The step index to modify
 * @param velocity - The new velocity value
 * @returns A new sequence with the modified step, or the original if step has no note
 */
export function setSequenceStepVelocity(
  sequence: SequenceStep[],
  stepIndex: number,
  velocity: number,
): SequenceStep[] {
  // Ensure sequence is long enough
  const workingSequence = ensureSequenceLength(sequence, stepIndex + 1);

  // Only update velocity if the step has a note
  if (workingSequence[stepIndex]?.note === undefined) {
    return workingSequence;
  }

  const newSequence = [...workingSequence];
  newSequence[stepIndex] = { ...newSequence[stepIndex], velocity };

  return newSequence;
}

/**
 * Clears all notes from a sequence, creating empty steps
 * @param numberOfSteps - The number of steps in the cleared sequence
 * @returns A new sequence with all empty steps
 */
export function createEmptySequence(numberOfSteps: number): SequenceStep[] {
  return Array.from({ length: numberOfSteps }, () => ({}));
}

/**
 * Generates a random sequence with notes
 * @param numberOfSteps - The number of steps in the sequence
 * @param noteProbability - Probability of a step having a note (0-1, default: 0.7)
 * @param minimumNote - Minimum MIDI note (default: 0)
 * @param maximumNote - Maximum MIDI note (default: 127)
 * @param minimumVelocity - Minimum velocity (default: 60)
 * @param maximumVelocity - Maximum velocity (default: 127)
 * @returns A new random sequence
 */
export function generateRandomSequence(
  numberOfSteps: number,
  options: {
    noteProbability?: number;
    minimumNote?: number;
    maximumNote?: number;
    minimumVelocity?: number;
    maximumVelocity?: number;
  } = {},
): SequenceStep[] {
  const {
    noteProbability = 0.7,
    minimumNote = 0,
    maximumNote = 127,
    minimumVelocity = 60,
    maximumVelocity = 127,
  } = options;

  return Array.from({ length: numberOfSteps }, () => {
    if (Math.random() > noteProbability) {
      return {}; // Empty step (rest)
    }

    const randomNote =
      minimumNote + Math.floor(Math.random() * (maximumNote - minimumNote + 1));
    const randomVelocity =
      minimumVelocity +
      Math.floor(Math.random() * (maximumVelocity - minimumVelocity + 1));

    return { note: randomNote, velocity: randomVelocity };
  });
}

/**
 * Checks if a sequence step has a note
 * @param step - The sequence step to check
 * @returns True if the step has a note defined
 */
export function stepHasNote(step: SequenceStep | undefined): boolean {
  return step?.note !== undefined;
}

/**
 * Gets the displayed note for a programmed note with transpose applied
 * @param programmedNote - The original MIDI note
 * @param transpose - The transpose amount in semitones
 * @returns The displayed note, constrained to valid MIDI range [0, 127]
 */
export function getDisplayedNote(
  programmedNote: number,
  transpose: number,
): number {
  return Math.max(0, Math.min(127, programmedNote + transpose));
}

/**
 * Checks if a grid cell should be active (note is programmed and transposed to this position)
 * @param sequence - The sequence to check
 * @param stepIndex - The step index
 * @param displayMidiNote - The displayed MIDI note (after transpose)
 * @param transpose - The transpose amount in semitones
 * @returns True if the cell should be active
 */
export function isSequenceCellActive(
  sequence: SequenceStep[],
  stepIndex: number,
  displayMidiNote: number,
  transpose: number,
): boolean {
  const step = sequence[stepIndex];
  if (!step || step.note === undefined) return false;
  return getDisplayedNote(step.note, transpose) === displayMidiNote;
}

/**
 * Counts the number of steps with notes in a sequence
 * @param sequence - The sequence to count
 * @returns The number of steps with notes
 */
export function countNotesInSequence(sequence: SequenceStep[]): number {
  return sequence.filter(stepHasNote).length;
}

/**
 * Transposes all notes in a sequence by a specified number of semitones
 * Notes are constrained to valid MIDI range [0, 127]
 * @param sequence - The original sequence
 * @param semitones - The number of semitones to transpose
 * @returns A new sequence with transposed notes
 */
export function transposeSequence(
  sequence: SequenceStep[],
  semitones: number,
): SequenceStep[] {
  return sequence.map((step) => {
    if (!step.note) return step;

    const transposedNote = Math.max(0, Math.min(127, step.note + semitones));

    return { ...step, note: transposedNote };
  });
}

/**
 * Extracts a subsequence from a sequence
 * @param sequence - The original sequence
 * @param startIndex - The start index (inclusive)
 * @param endIndex - The end index (exclusive)
 * @returns A new sequence containing the specified range
 */
export function extractSubsequence(
  sequence: SequenceStep[],
  startIndex: number,
  endIndex: number,
): SequenceStep[] {
  return sequence.slice(startIndex, endIndex);
}

/**
 * Repeats a sequence pattern a specified number of times
 * @param pattern - The pattern to repeat
 * @param repetitions - The number of times to repeat
 * @returns A new sequence with the repeated pattern
 */
export function repeatSequencePattern(
  pattern: SequenceStep[],
  repetitions: number,
): SequenceStep[] {
  return Array.from({ length: repetitions }, () =>
    pattern.map((step) => ({ ...step })),
  ).flat();
}
