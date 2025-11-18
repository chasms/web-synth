/**
 * MIDI and music theory utility functions
 * All functions are pure (no side effects, same input = same output)
 */

/**
 * Array of black key offsets within an octave (semitones from C)
 * C#, D#, F#, G#, A#
 */
export const BLACK_KEY_OFFSETS = [1, 3, 6, 8, 10] as const;

/**
 * Array of note names in chromatic order
 */
export const NOTE_NAMES = [
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
] as const;

/**
 * MIDI note number for middle C (C4)
 */
export const MIDDLE_C_MIDI_NOTE = 60;

/**
 * Minimum valid MIDI note number
 */
export const MINIMUM_MIDI_NOTE = 0;

/**
 * Maximum valid MIDI note number
 */
export const MAXIMUM_MIDI_NOTE = 127;

/**
 * Checks if a MIDI note represents a black key on a piano
 * @param midiNote - The MIDI note number (0-127)
 * @returns True if the note is a black key
 */
export function isBlackKey(midiNote: number): boolean {
  const noteOffset = midiNote % 12;
  return (BLACK_KEY_OFFSETS as readonly number[]).includes(noteOffset);
}

/**
 * Checks if a MIDI note represents a white key on a piano
 * @param midiNote - The MIDI note number (0-127)
 * @returns True if the note is a white key
 */
export function isWhiteKey(midiNote: number): boolean {
  return !isBlackKey(midiNote);
}

/**
 * Converts a MIDI note number to its note name with octave
 * @param midiNote - The MIDI note number (0-127)
 * @returns The note name (e.g., "C4", "A#3")
 */
export function getMidiNoteName(midiNote: number): string {
  const noteOffset = midiNote % 12;
  const octaveNumber = Math.floor(midiNote / 12) - 1;
  return `${NOTE_NAMES[noteOffset]}${octaveNumber}`;
}

/**
 * Applies transposition to a MIDI note, constraining to valid MIDI range
 * @param midiNote - The original MIDI note number
 * @param semitones - The number of semitones to transpose (positive or negative)
 * @returns The transposed note, constrained to [0, 127]
 */
export function transposeMidiNote(midiNote: number, semitones: number): number {
  return Math.max(
    MINIMUM_MIDI_NOTE,
    Math.min(MAXIMUM_MIDI_NOTE, midiNote + semitones),
  );
}

/**
 * Checks if a MIDI note number is within the valid range
 * @param midiNote - The MIDI note number to validate
 * @returns True if the note is within [0, 127]
 */
export function isValidMidiNote(midiNote: number): boolean {
  return (
    Number.isInteger(midiNote) &&
    midiNote >= MINIMUM_MIDI_NOTE &&
    midiNote <= MAXIMUM_MIDI_NOTE
  );
}

/**
 * Converts a MIDI note number to frequency in Hz using equal temperament
 * A4 (MIDI 69) = 440 Hz
 * @param midiNote - The MIDI note number
 * @returns The frequency in Hz
 */
export function midiNoteToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Converts a frequency in Hz to the nearest MIDI note number
 * @param frequencyHz - The frequency in Hz
 * @returns The nearest MIDI note number
 */
export function frequencyToMidiNote(frequencyHz: number): number {
  const midiNote = 69 + 12 * Math.log2(frequencyHz / 440);
  return Math.round(midiNote);
}

/**
 * Gets the octave number for a MIDI note
 * @param midiNote - The MIDI note number
 * @returns The octave number (-1 to 9)
 */
export function getMidiNoteOctave(midiNote: number): number {
  return Math.floor(midiNote / 12) - 1;
}

/**
 * Gets the note offset within an octave (0-11, where 0 is C)
 * @param midiNote - The MIDI note number
 * @returns The note offset (0-11)
 */
export function getMidiNoteOffset(midiNote: number): number {
  return midiNote % 12;
}

/**
 * Checks if a MIDI velocity value is valid
 * @param velocity - The velocity value to check
 * @returns True if velocity is within [1, 127]
 */
export function isValidMidiVelocity(velocity: number): boolean {
  return Number.isInteger(velocity) && velocity >= 1 && velocity <= 127;
}

/**
 * Constrains a velocity value to the valid MIDI range [1, 127]
 * @param velocity - The velocity value to constrain
 * @returns The constrained velocity value
 */
export function constrainMidiVelocity(velocity: number): number {
  return Math.max(1, Math.min(127, Math.floor(velocity)));
}

/**
 * Normalizes a MIDI velocity (1-127) to a 0-1 range
 * @param velocity - The MIDI velocity value
 * @returns The normalized value (0-1)
 */
export function normalizeMidiVelocity(velocity: number): number {
  return velocity / 127;
}

/**
 * Converts a normalized value (0-1) to a MIDI velocity (1-127)
 * @param normalizedValue - The normalized value (0-1)
 * @returns The MIDI velocity value (1-127)
 */
export function denormalizeMidiVelocity(normalizedValue: number): number {
  return Math.max(1, Math.floor(normalizedValue * 127));
}
