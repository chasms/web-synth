import { describe, expect, it } from "vitest";

import {
  BLACK_KEY_OFFSETS,
  constrainMidiVelocity,
  denormalizeMidiVelocity,
  frequencyToMidiNote,
  getMidiNoteName,
  getMidiNoteOctave,
  getMidiNoteOffset,
  isBlackKey,
  isValidMidiNote,
  isValidMidiVelocity,
  isWhiteKey,
  MAXIMUM_MIDI_NOTE,
  MIDDLE_C_MIDI_NOTE,
  midiNoteToFrequency,
  MINIMUM_MIDI_NOTE,
  normalizeMidiVelocity,
  NOTE_NAMES,
  transposeMidiNote,
} from "./midiUtils";

describe("midiUtils", () => {
  describe("constants", () => {
    it("should have correct BLACK_KEY_OFFSETS", () => {
      expect(BLACK_KEY_OFFSETS).toEqual([1, 3, 6, 8, 10]);
    });

    it("should have correct NOTE_NAMES", () => {
      expect(NOTE_NAMES).toEqual([
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
      ]);
    });

    it("should have correct MIDI constants", () => {
      expect(MIDDLE_C_MIDI_NOTE).toBe(60);
      expect(MINIMUM_MIDI_NOTE).toBe(0);
      expect(MAXIMUM_MIDI_NOTE).toBe(127);
    });
  });

  describe("isBlackKey", () => {
    it("should identify black keys correctly", () => {
      // C# (1), D# (3), F# (6), G# (8), A# (10)
      expect(isBlackKey(1)).toBe(true); // C#
      expect(isBlackKey(3)).toBe(true); // D#
      expect(isBlackKey(6)).toBe(true); // F#
      expect(isBlackKey(8)).toBe(true); // G#
      expect(isBlackKey(10)).toBe(true); // A#
    });

    it("should identify white keys as not black keys", () => {
      expect(isBlackKey(0)).toBe(false); // C
      expect(isBlackKey(2)).toBe(false); // D
      expect(isBlackKey(4)).toBe(false); // E
      expect(isBlackKey(5)).toBe(false); // F
      expect(isBlackKey(7)).toBe(false); // G
      expect(isBlackKey(9)).toBe(false); // A
      expect(isBlackKey(11)).toBe(false); // B
    });

    it("should work across multiple octaves", () => {
      expect(isBlackKey(13)).toBe(true); // C# in octave 1 (12 + 1)
      expect(isBlackKey(25)).toBe(true); // C# in octave 2 (24 + 1)
      expect(isBlackKey(61)).toBe(true); // C# in octave 5 (60 + 1)
    });
  });

  describe("isWhiteKey", () => {
    it("should identify white keys correctly", () => {
      expect(isWhiteKey(0)).toBe(true); // C
      expect(isWhiteKey(2)).toBe(true); // D
      expect(isWhiteKey(4)).toBe(true); // E
      expect(isWhiteKey(5)).toBe(true); // F
      expect(isWhiteKey(7)).toBe(true); // G
      expect(isWhiteKey(9)).toBe(true); // A
      expect(isWhiteKey(11)).toBe(true); // B
    });

    it("should identify black keys as not white keys", () => {
      expect(isWhiteKey(1)).toBe(false); // C#
      expect(isWhiteKey(3)).toBe(false); // D#
      expect(isWhiteKey(6)).toBe(false); // F#
      expect(isWhiteKey(8)).toBe(false); // G#
      expect(isWhiteKey(10)).toBe(false); // A#
    });
  });

  describe("getMidiNoteName", () => {
    it("should return correct note names for middle C octave", () => {
      expect(getMidiNoteName(60)).toBe("C4"); // Middle C
      expect(getMidiNoteName(61)).toBe("C#4");
      expect(getMidiNoteName(62)).toBe("D4");
      expect(getMidiNoteName(63)).toBe("D#4");
      expect(getMidiNoteName(64)).toBe("E4");
      expect(getMidiNoteName(65)).toBe("F4");
      expect(getMidiNoteName(66)).toBe("F#4");
      expect(getMidiNoteName(67)).toBe("G4");
      expect(getMidiNoteName(68)).toBe("G#4");
      expect(getMidiNoteName(69)).toBe("A4");
      expect(getMidiNoteName(70)).toBe("A#4");
      expect(getMidiNoteName(71)).toBe("B4");
    });

    it("should handle different octaves correctly", () => {
      expect(getMidiNoteName(0)).toBe("C-1"); // Lowest MIDI note
      expect(getMidiNoteName(12)).toBe("C0");
      expect(getMidiNoteName(24)).toBe("C1");
      expect(getMidiNoteName(36)).toBe("C2");
      expect(getMidiNoteName(48)).toBe("C3");
      expect(getMidiNoteName(72)).toBe("C5");
      expect(getMidiNoteName(127)).toBe("G9"); // Highest MIDI note
    });

    it("should handle A440 correctly", () => {
      expect(getMidiNoteName(69)).toBe("A4"); // A440
    });
  });

  describe("transposeMidiNote", () => {
    it("should transpose notes up correctly", () => {
      expect(transposeMidiNote(60, 12)).toBe(72); // Up one octave
      expect(transposeMidiNote(60, 1)).toBe(61); // Up one semitone
      expect(transposeMidiNote(60, 7)).toBe(67); // Up a fifth
    });

    it("should transpose notes down correctly", () => {
      expect(transposeMidiNote(60, -12)).toBe(48); // Down one octave
      expect(transposeMidiNote(60, -1)).toBe(59); // Down one semitone
      expect(transposeMidiNote(60, -7)).toBe(53); // Down a fifth
    });

    it("should constrain to minimum MIDI note", () => {
      expect(transposeMidiNote(10, -20)).toBe(0);
      expect(transposeMidiNote(0, -1)).toBe(0);
    });

    it("should constrain to maximum MIDI note", () => {
      expect(transposeMidiNote(120, 20)).toBe(127);
      expect(transposeMidiNote(127, 1)).toBe(127);
    });

    it("should handle zero transposition", () => {
      expect(transposeMidiNote(60, 0)).toBe(60);
    });
  });

  describe("isValidMidiNote", () => {
    it("should return true for valid MIDI notes", () => {
      expect(isValidMidiNote(0)).toBe(true);
      expect(isValidMidiNote(60)).toBe(true);
      expect(isValidMidiNote(127)).toBe(true);
    });

    it("should return false for notes outside range", () => {
      expect(isValidMidiNote(-1)).toBe(false);
      expect(isValidMidiNote(128)).toBe(false);
      expect(isValidMidiNote(200)).toBe(false);
    });

    it("should return false for non-integer values", () => {
      expect(isValidMidiNote(60.5)).toBe(false);
      expect(isValidMidiNote(60.1)).toBe(false);
    });
  });

  describe("midiNoteToFrequency", () => {
    it("should convert A4 (MIDI 69) to 440 Hz", () => {
      expect(midiNoteToFrequency(69)).toBeCloseTo(440, 2);
    });

    it("should convert middle C (MIDI 60) correctly", () => {
      expect(midiNoteToFrequency(60)).toBeCloseTo(261.63, 2);
    });

    it("should handle octave relationships correctly", () => {
      const a3 = midiNoteToFrequency(57); // A3
      const a4 = midiNoteToFrequency(69); // A4
      const a5 = midiNoteToFrequency(81); // A5

      expect(a4 / a3).toBeCloseTo(2, 2); // One octave up doubles frequency
      expect(a5 / a4).toBeCloseTo(2, 2);
    });

    it("should handle low notes", () => {
      expect(midiNoteToFrequency(0)).toBeCloseTo(8.18, 2);
    });

    it("should handle high notes", () => {
      expect(midiNoteToFrequency(127)).toBeCloseTo(12543.85, 2);
    });
  });

  describe("frequencyToMidiNote", () => {
    it("should convert 440 Hz to A4 (MIDI 69)", () => {
      expect(frequencyToMidiNote(440)).toBe(69);
    });

    it("should convert middle C frequency correctly", () => {
      expect(frequencyToMidiNote(261.63)).toBe(60);
    });

    it("should round to nearest MIDI note", () => {
      expect(frequencyToMidiNote(439)).toBe(69); // Close to A4
      expect(frequencyToMidiNote(441)).toBe(69);
    });

    it("should be inverse of midiNoteToFrequency", () => {
      for (let note = 20; note < 108; note++) {
        const frequency = midiNoteToFrequency(note);
        const backToNote = frequencyToMidiNote(frequency);
        expect(backToNote).toBe(note);
      }
    });
  });

  describe("getMidiNoteOctave", () => {
    it("should return correct octave numbers", () => {
      expect(getMidiNoteOctave(0)).toBe(-1); // C-1
      expect(getMidiNoteOctave(12)).toBe(0); // C0
      expect(getMidiNoteOctave(24)).toBe(1); // C1
      expect(getMidiNoteOctave(60)).toBe(4); // C4 (middle C)
      expect(getMidiNoteOctave(127)).toBe(9); // G9
    });

    it("should handle notes within an octave correctly", () => {
      expect(getMidiNoteOctave(60)).toBe(4); // C4
      expect(getMidiNoteOctave(61)).toBe(4); // C#4
      expect(getMidiNoteOctave(71)).toBe(4); // B4
    });
  });

  describe("getMidiNoteOffset", () => {
    it("should return correct note offsets", () => {
      expect(getMidiNoteOffset(0)).toBe(0); // C
      expect(getMidiNoteOffset(1)).toBe(1); // C#
      expect(getMidiNoteOffset(11)).toBe(11); // B
    });

    it("should wrap around octaves correctly", () => {
      expect(getMidiNoteOffset(12)).toBe(0); // C
      expect(getMidiNoteOffset(13)).toBe(1); // C#
      expect(getMidiNoteOffset(60)).toBe(0); // C4
      expect(getMidiNoteOffset(69)).toBe(9); // A4
    });
  });

  describe("isValidMidiVelocity", () => {
    it("should return true for valid velocities", () => {
      expect(isValidMidiVelocity(1)).toBe(true);
      expect(isValidMidiVelocity(64)).toBe(true);
      expect(isValidMidiVelocity(127)).toBe(true);
    });

    it("should return false for zero", () => {
      expect(isValidMidiVelocity(0)).toBe(false);
    });

    it("should return false for values outside range", () => {
      expect(isValidMidiVelocity(-1)).toBe(false);
      expect(isValidMidiVelocity(128)).toBe(false);
    });

    it("should return false for non-integer values", () => {
      expect(isValidMidiVelocity(64.5)).toBe(false);
    });
  });

  describe("constrainMidiVelocity", () => {
    it("should return valid velocities unchanged", () => {
      expect(constrainMidiVelocity(1)).toBe(1);
      expect(constrainMidiVelocity(64)).toBe(64);
      expect(constrainMidiVelocity(127)).toBe(127);
    });

    it("should constrain to minimum of 1", () => {
      expect(constrainMidiVelocity(0)).toBe(1);
      expect(constrainMidiVelocity(-10)).toBe(1);
    });

    it("should constrain to maximum of 127", () => {
      expect(constrainMidiVelocity(128)).toBe(127);
      expect(constrainMidiVelocity(200)).toBe(127);
    });

    it("should floor decimal values", () => {
      expect(constrainMidiVelocity(64.9)).toBe(64);
      expect(constrainMidiVelocity(127.9)).toBe(127);
    });
  });

  describe("normalizeMidiVelocity", () => {
    it("should normalize velocity to 0-1 range", () => {
      expect(normalizeMidiVelocity(127)).toBeCloseTo(1, 2);
      expect(normalizeMidiVelocity(64)).toBeCloseTo(0.504, 2);
      expect(normalizeMidiVelocity(1)).toBeCloseTo(0.008, 2);
    });

    it("should handle edge cases", () => {
      expect(normalizeMidiVelocity(0)).toBe(0);
    });
  });

  describe("denormalizeMidiVelocity", () => {
    it("should convert normalized values to MIDI velocity", () => {
      expect(denormalizeMidiVelocity(1)).toBe(127);
      expect(denormalizeMidiVelocity(0.5)).toBe(63);
      expect(denormalizeMidiVelocity(0)).toBe(1); // Minimum is 1
    });

    it("should be approximately inverse of normalizeMidiVelocity", () => {
      const testVelocities = [1, 32, 64, 96, 127];
      testVelocities.forEach((velocity) => {
        const normalized = normalizeMidiVelocity(velocity);
        const denormalized = denormalizeMidiVelocity(normalized);
        expect(denormalized).toBeCloseTo(velocity, 0);
      });
    });
  });
});
