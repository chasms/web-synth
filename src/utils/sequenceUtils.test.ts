import { describe, expect, it } from "vitest";

import type { SequenceStep } from "./sequenceUtils";
import {
  countNotesInSequence,
  createEmptySequence,
  DEFAULT_VELOCITY,
  ensureSequenceLength,
  extractSubsequence,
  generateRandomSequence,
  getDisplayedNote,
  isSequenceCellActive,
  repeatSequencePattern,
  setSequenceStepNote,
  setSequenceStepVelocity,
  stepHasNote,
  transposeSequence,
} from "./sequenceUtils";

describe("sequenceUtils", () => {
  describe("ensureSequenceLength", () => {
    it("should return copy of sequence if already long enough", () => {
      const sequence: SequenceStep[] = [{ note: 60 }, { note: 62 }, {}];
      const result = ensureSequenceLength(sequence, 3);

      expect(result).toHaveLength(3);
      expect(result).toEqual(sequence);
      expect(result).not.toBe(sequence); // Should be a new array
    });

    it("should pad sequence with empty steps if too short", () => {
      const sequence: SequenceStep[] = [{ note: 60 }];
      const result = ensureSequenceLength(sequence, 4);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ note: 60 });
      expect(result[1]).toEqual({});
      expect(result[2]).toEqual({});
      expect(result[3]).toEqual({});
    });

    it("should handle empty sequence", () => {
      const sequence: SequenceStep[] = [];
      const result = ensureSequenceLength(sequence, 3);

      expect(result).toHaveLength(3);
      expect(result).toEqual([{}, {}, {}]);
    });
  });

  describe("setSequenceStepNote", () => {
    it("should add note to empty step", () => {
      const sequence: SequenceStep[] = [{}, {}, {}];
      const result = setSequenceStepNote(sequence, 1, 60, 100);

      expect(result[1]).toEqual({ note: 60, velocity: 100 });
      expect(result).not.toBe(sequence); // Should be a new array
    });

    it("should use default velocity if not provided", () => {
      const sequence: SequenceStep[] = [{}];
      const result = setSequenceStepNote(sequence, 0, 60);

      expect(result[0].velocity).toBe(DEFAULT_VELOCITY);
    });

    it("should toggle off note if clicking on existing note", () => {
      const sequence: SequenceStep[] = [{ note: 60, velocity: 100 }];
      const result = setSequenceStepNote(sequence, 0, 60);

      expect(result[0].note).toBeUndefined();
      expect(result[0].velocity).toBe(100); // Velocity preserved
    });

    it("should change note if clicking different note", () => {
      const sequence: SequenceStep[] = [{ note: 60, velocity: 100 }];
      const result = setSequenceStepNote(sequence, 0, 62);

      expect(result[0].note).toBe(62);
      expect(result[0].velocity).toBe(100); // Preserve existing velocity
    });

    it("should extend sequence if step index is beyond length", () => {
      const sequence: SequenceStep[] = [{ note: 60 }];
      const result = setSequenceStepNote(sequence, 3, 62, 110);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ note: 60 });
      expect(result[1]).toEqual({});
      expect(result[2]).toEqual({});
      expect(result[3]).toEqual({ note: 62, velocity: 110 });
    });

    it("should preserve other step properties", () => {
      const sequence: SequenceStep[] = [{ note: 60, velocity: 100, gate: 0.5 }];
      const result = setSequenceStepNote(sequence, 0, 62);

      expect(result[0]).toEqual({ note: 62, velocity: 100, gate: 0.5 });
    });
  });

  describe("setSequenceStepVelocity", () => {
    it("should update velocity for step with note", () => {
      const sequence: SequenceStep[] = [{ note: 60, velocity: 100 }];
      const result = setSequenceStepVelocity(sequence, 0, 80);

      expect(result[0]).toEqual({ note: 60, velocity: 80 });
    });

    it("should not update velocity for step without note", () => {
      const sequence: SequenceStep[] = [{}];
      const result = setSequenceStepVelocity(sequence, 0, 80);

      expect(result[0]).toEqual({});
    });

    it("should extend sequence if needed", () => {
      const sequence: SequenceStep[] = [{ note: 60 }];
      const result = setSequenceStepVelocity(sequence, 2, 80);

      expect(result).toHaveLength(3);
      expect(result[2]).toEqual({}); // No note, so velocity not set
    });

    it("should preserve other step properties", () => {
      const sequence: SequenceStep[] = [{ note: 60, velocity: 100, gate: 0.8 }];
      const result = setSequenceStepVelocity(sequence, 0, 90);

      expect(result[0]).toEqual({ note: 60, velocity: 90, gate: 0.8 });
    });
  });

  describe("createEmptySequence", () => {
    it("should create sequence of specified length with empty steps", () => {
      const result = createEmptySequence(4);

      expect(result).toHaveLength(4);
      expect(result).toEqual([{}, {}, {}, {}]);
    });

    it("should handle zero length", () => {
      const result = createEmptySequence(0);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe("generateRandomSequence", () => {
    it("should generate sequence of specified length", () => {
      const result = generateRandomSequence(8);
      expect(result).toHaveLength(8);
    });

    it("should respect note probability", () => {
      // Test with 100% probability - all steps should have notes
      const result = generateRandomSequence(10, { noteProbability: 1 });
      const stepsWithNotes = result.filter((step) => step.note !== undefined);
      expect(stepsWithNotes).toHaveLength(10);
    });

    it("should respect minimum and maximum note range", () => {
      const result = generateRandomSequence(20, {
        minimumNote: 60,
        maximumNote: 72,
        noteProbability: 1,
      });

      result.forEach((step) => {
        if (step.note !== undefined) {
          expect(step.note).toBeGreaterThanOrEqual(60);
          expect(step.note).toBeLessThanOrEqual(72);
        }
      });
    });

    it("should respect minimum and maximum velocity range", () => {
      const result = generateRandomSequence(20, {
        minimumVelocity: 80,
        maximumVelocity: 100,
        noteProbability: 1,
      });

      result.forEach((step) => {
        if (step.velocity !== undefined) {
          expect(step.velocity).toBeGreaterThanOrEqual(80);
          expect(step.velocity).toBeLessThanOrEqual(100);
        }
      });
    });

    it("should create empty steps when note probability is low", () => {
      const result = generateRandomSequence(10, { noteProbability: 0 });
      const stepsWithNotes = result.filter((step) => step.note !== undefined);
      expect(stepsWithNotes).toHaveLength(0);
    });
  });

  describe("stepHasNote", () => {
    it("should return true for step with note", () => {
      expect(stepHasNote({ note: 60, velocity: 100 })).toBe(true);
      expect(stepHasNote({ note: 0 })).toBe(true); // Even note 0 is valid
    });

    it("should return false for step without note", () => {
      expect(stepHasNote({})).toBe(false);
      expect(stepHasNote({ velocity: 100 })).toBe(false);
    });

    it("should return false for undefined step", () => {
      expect(stepHasNote(undefined)).toBe(false);
    });
  });

  describe("getDisplayedNote", () => {
    it("should return original note when transpose is zero", () => {
      expect(getDisplayedNote(60, 0)).toBe(60);
    });

    it("should transpose note up", () => {
      expect(getDisplayedNote(60, 12)).toBe(72); // Up one octave
      expect(getDisplayedNote(60, 5)).toBe(65);
    });

    it("should transpose note down", () => {
      expect(getDisplayedNote(60, -12)).toBe(48); // Down one octave
      expect(getDisplayedNote(60, -5)).toBe(55);
    });

    it("should constrain to minimum MIDI note (0)", () => {
      expect(getDisplayedNote(5, -10)).toBe(0);
      expect(getDisplayedNote(0, -1)).toBe(0);
    });

    it("should constrain to maximum MIDI note (127)", () => {
      expect(getDisplayedNote(120, 10)).toBe(127);
      expect(getDisplayedNote(127, 1)).toBe(127);
    });
  });

  describe("isSequenceCellActive", () => {
    it("should return true when step has note at displayed position", () => {
      const sequence: SequenceStep[] = [{ note: 60 }, {}, { note: 62 }];
      expect(isSequenceCellActive(sequence, 0, 60, 0)).toBe(true);
      expect(isSequenceCellActive(sequence, 2, 62, 0)).toBe(true);
    });

    it("should return false when step has no note", () => {
      const sequence: SequenceStep[] = [{}, { note: 60 }, {}];
      expect(isSequenceCellActive(sequence, 0, 60, 0)).toBe(false);
      expect(isSequenceCellActive(sequence, 2, 60, 0)).toBe(false);
    });

    it("should account for transpose when checking", () => {
      const sequence: SequenceStep[] = [{ note: 60 }];
      // Note 60 transposed by +5 should display at 65
      expect(isSequenceCellActive(sequence, 0, 65, 5)).toBe(true);
      expect(isSequenceCellActive(sequence, 0, 60, 5)).toBe(false);
    });

    it("should return false for out of bounds step index", () => {
      const sequence: SequenceStep[] = [{ note: 60 }];
      expect(isSequenceCellActive(sequence, 5, 60, 0)).toBe(false);
    });
  });

  describe("countNotesInSequence", () => {
    it("should count steps with notes", () => {
      const sequence: SequenceStep[] = [
        { note: 60 },
        {},
        { note: 62 },
        {},
        { note: 64 },
      ];
      expect(countNotesInSequence(sequence)).toBe(3);
    });

    it("should return 0 for empty sequence", () => {
      expect(countNotesInSequence([])).toBe(0);
    });

    it("should return 0 for sequence with no notes", () => {
      const sequence: SequenceStep[] = [{}, {}, {}];
      expect(countNotesInSequence(sequence)).toBe(0);
    });

    it("should count all notes in full sequence", () => {
      const sequence: SequenceStep[] = [
        { note: 60 },
        { note: 62 },
        { note: 64 },
      ];
      expect(countNotesInSequence(sequence)).toBe(3);
    });
  });

  describe("transposeSequence", () => {
    it("should transpose all notes up", () => {
      const sequence: SequenceStep[] = [
        { note: 60 },
        { note: 62 },
        { note: 64 },
      ];
      const result = transposeSequence(sequence, 12);

      expect(result[0].note).toBe(72);
      expect(result[1].note).toBe(74);
      expect(result[2].note).toBe(76);
    });

    it("should transpose all notes down", () => {
      const sequence: SequenceStep[] = [
        { note: 60 },
        { note: 62 },
        { note: 64 },
      ];
      const result = transposeSequence(sequence, -12);

      expect(result[0].note).toBe(48);
      expect(result[1].note).toBe(50);
      expect(result[2].note).toBe(52);
    });

    it("should constrain transposed notes to valid MIDI range", () => {
      const sequence: SequenceStep[] = [{ note: 5 }, { note: 125 }];
      const result = transposeSequence(sequence, -10);

      expect(result[0].note).toBe(0); // Constrained to minimum
      expect(result[1].note).toBe(115);
    });

    it("should preserve empty steps", () => {
      const sequence: SequenceStep[] = [{ note: 60 }, {}, { note: 62 }];
      const result = transposeSequence(sequence, 5);

      expect(result[0].note).toBe(65);
      expect(result[1].note).toBeUndefined();
      expect(result[2].note).toBe(67);
    });

    it("should preserve velocity and other properties", () => {
      const sequence: SequenceStep[] = [{ note: 60, velocity: 100, gate: 0.8 }];
      const result = transposeSequence(sequence, 5);

      expect(result[0]).toEqual({ note: 65, velocity: 100, gate: 0.8 });
    });
  });

  describe("extractSubsequence", () => {
    it("should extract subsequence from middle", () => {
      const sequence: SequenceStep[] = [
        { note: 60 },
        { note: 62 },
        { note: 64 },
        { note: 65 },
        { note: 67 },
      ];
      const result = extractSubsequence(sequence, 1, 4);

      expect(result).toHaveLength(3);
      expect(result).toEqual([{ note: 62 }, { note: 64 }, { note: 65 }]);
    });

    it("should extract from beginning", () => {
      const sequence: SequenceStep[] = [
        { note: 60 },
        { note: 62 },
        { note: 64 },
      ];
      const result = extractSubsequence(sequence, 0, 2);

      expect(result).toEqual([{ note: 60 }, { note: 62 }]);
    });

    it("should extract to end", () => {
      const sequence: SequenceStep[] = [
        { note: 60 },
        { note: 62 },
        { note: 64 },
      ];
      const result = extractSubsequence(sequence, 1, 3);

      expect(result).toEqual([{ note: 62 }, { note: 64 }]);
    });
  });

  describe("repeatSequencePattern", () => {
    it("should repeat pattern specified number of times", () => {
      const pattern: SequenceStep[] = [{ note: 60 }, { note: 62 }];
      const result = repeatSequencePattern(pattern, 3);

      expect(result).toHaveLength(6);
      expect(result).toEqual([
        { note: 60 },
        { note: 62 },
        { note: 60 },
        { note: 62 },
        { note: 60 },
        { note: 62 },
      ]);
    });

    it("should handle single repetition", () => {
      const pattern: SequenceStep[] = [{ note: 60 }, { note: 62 }];
      const result = repeatSequencePattern(pattern, 1);

      expect(result).toEqual(pattern);
    });

    it("should handle zero repetitions", () => {
      const pattern: SequenceStep[] = [{ note: 60 }, { note: 62 }];
      const result = repeatSequencePattern(pattern, 0);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });

    it("should create independent copies", () => {
      const pattern: SequenceStep[] = [{ note: 60 }];
      const result = repeatSequencePattern(pattern, 2);

      // Modify one element
      result[0].note = 62;

      // Original pattern should be unchanged
      expect(pattern[0].note).toBe(60);
      // Second repetition should also be unchanged (independent copy)
      expect(result[1].note).toBe(60);
    });
  });
});
