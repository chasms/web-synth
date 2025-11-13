# Piano Roll Sequencer - Test Suite

## Purpose
This document provides detailed test cases with reproduction steps and acceptance criteria to validate the piano roll sequencer functionality and prevent regressions during future development.

---

## Test Environment Setup

1. Navigate to http://localhost:5173/
2. Add a Sequencer module to the patch if not already present
3. Connect Sequencer → VCO → Master Out (or use default patch)
4. Click "Edit Sequence" button on Sequencer module to open Piano Roll Modal

---

## Test Suite

### TEST-001: Column Alignment Verification

**Objective**: Verify that step number headers, grid cells, and velocity sliders are perfectly aligned vertically.

**Reproduction Steps**:
1. Open Piano Roll Modal
2. Set steps to 8 using the Steps slider
3. Visually inspect alignment between:
   - Step number headers (1, 2, 3, etc.)
   - Grid cell columns
   - Velocity slider positions

**Acceptance Criteria**:
- ✅ Each step number is centered directly above its corresponding grid column
- ✅ Vertical lines drawn from step numbers pass through center of grid cells
- ✅ Velocity sliders are centered under their corresponding columns
- ✅ No visible offset or misalignment at any step count (1-32)

**Measurement Validation** (using browser DevTools):
```
Step Number width: 30px + 1px border-right = 31px total
Grid Cell width: 30px + 1px gap = 31px spacing
Velocity Container width: 30px + 1px gap = 31px spacing
Note Label Spacer: 40px
```

**Test with Multiple Step Counts**:
- Steps = 4: ✅ Aligned
- Steps = 8: ✅ Aligned
- Steps = 16: ✅ Aligned
- Steps = 32: ✅ Aligned

---

### TEST-002: Velocity Controls Functionality

**Objective**: Verify velocity controls (numeric input + slider) work correctly and stay aligned.

**Reproduction Steps**:
1. Open Piano Roll Modal with 8 steps
2. Click on grid cell at Step 1, Note C4 to add a note
3. Observe velocity input field above Step 1 slider
4. Test numeric input:
   - Type "64" in the velocity input field
   - Press Enter or Tab
5. Test range slider:
   - Drag the velocity slider below Step 1
   - Observe the numeric input updates
6. Add notes to steps 2-8
7. Test each velocity control independently

**Acceptance Criteria**:
- ✅ Numeric input displays "100" (default) when note is added
- ✅ Numeric input accepts values 1-127
- ✅ Values below 1 or above 127 are clamped to valid range
- ✅ Non-integer values are converted to integers
- ✅ Empty input displays placeholder "-"
- ✅ Range slider updates when input changes
- ✅ Numeric input updates when slider changes
- ✅ Both controls are disabled when no note present
- ✅ Grid cell opacity reflects velocity (velocity / 127)
- ✅ All 8 velocity sliders are visible (not cut off)
- ✅ Sliders have adequate space at bottom (40px margin)

**Edge Cases**:
- Input "0" → Should clamp to 1
- Input "128" → Should clamp to 127
- Input "abc" → Should revert to previous value
- Input "-50" → Should clamp to 1

---

### TEST-003: Vertical Scrolling and Note Labels

**Objective**: Verify scrolling through all 128 MIDI notes with labels moving with rows.

**Reproduction Steps**:
1. Open Piano Roll Modal
2. Observe initial scroll position (should show C4 area)
3. Scroll down to see lower notes (C-1, C0, C1, etc.)
4. Scroll up to see higher notes (C5, C6, C7, C8, G9)
5. Observe note labels while scrolling
6. Observe step numbers while scrolling

**Acceptance Criteria**:
- ✅ Initial view shows C4 (MIDI 60) approximately centered
- ✅ Can scroll to see C-1 (MIDI 0) at the bottom
- ✅ Can scroll to see G9 (MIDI 127) at the top
- ✅ Note labels scroll WITH the grid rows (not fixed)
- ✅ Step numbers remain STICKY at the top (don't scroll)
- ✅ White keys have light background (#f0f0f0)
- ✅ Black keys have dark background (#222)
- ✅ Note names are correct throughout range
- ✅ Scrollbar is visible and functional
- ✅ Custom scrollbar styling applied (8px width, styled thumb)

**Note Label Validation** (spot check):
- MIDI 0 = C-1
- MIDI 12 = C0
- MIDI 24 = C1
- MIDI 60 = C4
- MIDI 69 = A4
- MIDI 127 = G9

---

### TEST-004: Transpose Functionality

**Objective**: Verify transpose control shifts notes visually and in playback.

**Reproduction Steps**:
1. Open Piano Roll Modal
2. Program a C major scale: C4, D4, E4, F4, G4, A4, B4, C5 in steps 1-8
3. Note the visual positions of the notes
4. Adjust Transpose slider to +2
5. Observe visual changes in grid
6. Play the sequence (close modal, press Play button)
7. Listen to the output
8. Adjust Transpose slider to -5
9. Play the sequence again

**Acceptance Criteria**:
- ✅ Transpose slider range is -24 to +24
- ✅ Display shows "+2" for positive transpose, "-5" for negative
- ✅ At transpose +2: notes shift up 2 semitones (C→D, D→E, etc.)
- ✅ Visual positions in grid update in real-time
- ✅ At transpose -5: notes shift down 5 semitones
- ✅ Playback audio matches transposed notes
- ✅ Notes at boundaries are clamped (e.g., G9 +1 stays at G9)
- ✅ Transpose value persists when closing/reopening modal
- ✅ Transpose = 0 shows original programmed notes

**Boundary Testing**:
- Program note at MIDI 127 (G9), transpose +1 → stays at 127
- Program note at MIDI 0 (C-1), transpose -1 → stays at 0
- Program note at MIDI 64, transpose +24 → becomes MIDI 88
- Program note at MIDI 64, transpose -24 → becomes MIDI 40

---

### TEST-005: Fixed Modal Layout Stability

**Objective**: Verify modal dimensions remain stable during step slider manipulation.

**Reproduction Steps**:
1. Open Piano Roll Modal
2. Note the modal width and position
3. Set Steps slider to 8
4. Measure modal width (using DevTools or visual inspection)
5. Slowly drag Steps slider from 8 to 32
6. Observe modal width and control positions
7. Drag Steps slider from 32 back to 1
8. Repeat several times

**Acceptance Criteria**:
- ✅ Modal width is fixed (90vw, max 1200px)
- ✅ Modal height is fixed (85vh)
- ✅ Modal width does NOT change when steps changes
- ✅ Steps slider position (left offset) does NOT move
- ✅ Other controls in header do NOT move
- ✅ Slider thumb moves smoothly without jumping
- ✅ Grid width expands/contracts but modal stays same size
- ✅ Horizontal scrollbar appears for steps > ~35 (depending on viewport)

**Visual Validation**:
- Place a ruler or reference line on screen aligned with modal edge
- Change steps repeatedly - modal edge should not move

---

### TEST-006: Note Programming and Editing

**Objective**: Verify adding, removing, and editing notes in the grid.

**Reproduction Steps**:
1. Open Piano Roll Modal with 8 steps
2. Click on Step 1, Note C4 to add a note
3. Verify note appears (orange cell)
4. Click on Step 1, Note E4 to change the note
5. Click on Step 1, Note E4 again to remove the note
6. Click on Step 2, Note G4 to add another note
7. Use Random button
8. Use Clear button

**Acceptance Criteria**:
- ✅ Clicking empty cell adds note (cell turns orange #ff6b35)
- ✅ Clicking different note in same step changes the note
- ✅ Clicking same note removes it (cell returns to gray)
- ✅ Multiple notes can be programmed across different steps
- ✅ Only one note per step is allowed
- ✅ Random button creates pattern (~70% density)
- ✅ Clear button removes all notes
- ✅ Cell opacity reflects velocity value
- ✅ Changes are immediately reflected in sequence state

---

### TEST-007: Velocity and Note Opacity

**Objective**: Verify note cell opacity correctly reflects velocity values.

**Reproduction Steps**:
1. Open Piano Roll Modal
2. Add a note at Step 1, C4 (default velocity 100)
3. Observe cell opacity
4. Change velocity to 127 (maximum)
5. Observe cell opacity increase
6. Change velocity to 1 (minimum)
7. Observe cell opacity decrease
8. Add notes with different velocities across steps

**Acceptance Criteria**:
- ✅ Cell opacity = velocity / 127
- ✅ Velocity 127 → opacity = 1.0 (fully opaque)
- ✅ Velocity 64 → opacity ≈ 0.5 (half transparent)
- ✅ Velocity 1 → opacity ≈ 0.008 (very transparent but visible)
- ✅ Empty cells have opacity 0.1 (barely visible)
- ✅ Opacity updates in real-time with velocity changes
- ✅ Visual difference is noticeable between velocities

**Mathematical Validation**:
```javascript
// Cell opacity calculation
opacity = hasNote ? (velocity / 127) : 0.1
```

---

### TEST-008: Integration with Sequencer Playback

**Objective**: Verify programmed notes play back correctly with proper timing.

**Reproduction Steps**:
1. Open Piano Roll Modal
2. Program a simple sequence: C4, E4, G4, C5 in steps 1-4
3. Set different velocities: 127, 100, 80, 60
4. Close modal
5. Press Play button on Sequencer module
6. Listen to playback
7. Verify timing and velocity

**Acceptance Criteria**:
- ✅ Notes play in correct order (steps 1→2→3→4)
- ✅ Timing matches BPM setting
- ✅ Higher velocity notes are louder
- ✅ Sequence loops if Loop is enabled
- ✅ Step counter advances correctly (1/4 → 2/4 → 3/4 → 4/4)
- ✅ Current step highlights in mini-grid preview
- ✅ No audio clicks or pops during playback
- ✅ No stuck notes when stopping

---

### TEST-009: Transpose During Playback

**Objective**: Verify transpose can be changed during playback.

**Reproduction Steps**:
1. Program a sequence in Piano Roll Modal
2. Close modal
3. Start playback (press Play)
4. Reopen Piano Roll Modal
5. While sequence is playing, adjust Transpose slider
6. Listen for pitch changes in real-time

**Acceptance Criteria**:
- ✅ Can open modal while sequencer is playing
- ✅ Can adjust transpose slider while playing
- ✅ Pitch changes apply immediately on next step
- ✅ No audio glitches or interruptions
- ✅ Visual note positions update in real-time
- ✅ Playback continues smoothly

---

### TEST-010: Multiple Steps Slider Changes

**Objective**: Verify changing step count updates grid and velocity controls.

**Reproduction Steps**:
1. Open Piano Roll Modal
2. Set steps to 8
3. Program notes in steps 1-8
4. Change steps to 16
5. Observe grid and velocity controls
6. Change steps to 4
7. Change steps back to 8

**Acceptance Criteria**:
- ✅ Grid expands to show 16 columns when steps = 16
- ✅ Velocity controls expand to 16 sliders
- ✅ All 16 sliders are visible and properly aligned
- ✅ Previously programmed notes (1-8) are preserved
- ✅ New steps (9-16) are empty
- ✅ Changing to 4 truncates display but preserves notes 1-4
- ✅ Changing back to 8 restores notes 5-8 if they existed
- ✅ Velocity sliders remain aligned throughout changes

---

### TEST-011: Accessibility and Keyboard Navigation

**Objective**: Verify modal can be used with keyboard.

**Reproduction Steps**:
1. Open Piano Roll Modal
2. Tab through controls in header
3. Tab to velocity numeric inputs
4. Use arrow keys on velocity inputs
5. Press Escape to close modal
6. Reopen and verify focus handling

**Acceptance Criteria**:
- ✅ Tab order is logical (Steps → Transpose → Clear → Random → Close)
- ✅ Velocity inputs are focusable with Tab
- ✅ Arrow Up/Down keys change velocity values
- ✅ Enter key confirms input changes
- ✅ Escape key closes modal
- ✅ Focus indicators are visible (orange outline)
- ✅ Disabled controls are skipped in tab order

---

### TEST-012: Browser Compatibility

**Objective**: Verify modal works across different browsers.

**Test Browsers**:
- Chrome/Chromium (primary)
- Firefox
- Safari
- Edge

**Reproduction Steps**:
1. Open application in each browser
2. Run TEST-001 through TEST-010
3. Note any differences or issues

**Acceptance Criteria**:
- ✅ Layout appears consistent across browsers
- ✅ Scrolling works smoothly
- ✅ Input validation works correctly
- ✅ CSS transforms (rotated sliders) render correctly
- ✅ Sticky positioning works (step numbers)
- ✅ No console errors in any browser

---

## Regression Testing Checklist

Before merging any changes to the piano roll code, run this checklist:

- [ ] TEST-001: Column Alignment
- [ ] TEST-002: Velocity Controls
- [ ] TEST-003: Vertical Scrolling
- [ ] TEST-004: Transpose Functionality
- [ ] TEST-005: Fixed Modal Layout
- [ ] TEST-006: Note Programming
- [ ] TEST-007: Velocity and Opacity
- [ ] TEST-008: Sequencer Integration
- [ ] TEST-009: Transpose During Playback
- [ ] TEST-010: Steps Slider Changes
- [ ] TEST-011: Keyboard Navigation
- [ ] TEST-012: Browser Compatibility

---

## Known Issues and Limitations

### Current Limitations:
1. Maximum 32 steps (by design)
2. One note per step (monophonic sequencer)
3. No per-step gate length override UI (parameter exists but no control)
4. No pattern save/load within modal
5. No undo/redo functionality

### Future Enhancements:
1. Multi-pattern support
2. Pattern chaining
3. Note length per step
4. Copy/paste patterns
5. MIDI export

---

## Performance Benchmarks

### Expected Performance:
- Modal open time: < 100ms
- Scroll lag: < 16ms per frame (60fps)
- Note add/remove: < 10ms
- Velocity change: < 10ms
- Transpose update: < 50ms for all 128 notes

### Memory Usage:
- Modal open: ~2-5MB additional heap
- 32 steps with all notes: ~100KB sequence data

---

## Debugging Tips

### Visual Alignment Issues:
1. Open Chrome DevTools
2. Inspect `.step-number` element
3. Verify: `width: 30px`, `border-right: 1px solid #333`
4. Inspect `.grid-cell` element
5. Verify: `width: 30px`, gap between cells is 1px
6. Inspect `.velocity-slider-container`
7. Verify: `width: 30px`, gap is 1px

### Velocity Not Updating:
1. Check React DevTools
2. Verify `sequence` state updates
3. Check `handleVelocityChange` is called
4. Verify `module.updateParams` is called with correct sequence

### Transpose Not Working:
1. Verify `transpose` state in SequencerControls
2. Check `handleTransposeChange` is called
3. Verify `module.updateParams({ transpose })` is called
4. Check SequencerTrigger.ts `scheduleStep()` applies transpose
5. Verify `noteNumber = currentStepData.note + transpose` calculation

---

## Test Data

### Default C Major Scale (for testing):
```javascript
const testSequence = [
  { note: 60, velocity: 100 }, // C4
  { note: 62, velocity: 100 }, // D4
  { note: 64, velocity: 100 }, // E4
  { note: 65, velocity: 100 }, // F4
  { note: 67, velocity: 100 }, // G4
  { note: 69, velocity: 100 }, // A4
  { note: 71, velocity: 100 }, // B4
  { note: 72, velocity: 100 }, // C5
];
```

### Velocity Gradient (for opacity testing):
```javascript
const velocityGradient = [
  { note: 60, velocity: 127 },
  { note: 60, velocity: 110 },
  { note: 60, velocity: 90 },
  { note: 60, velocity: 70 },
  { note: 60, velocity: 50 },
  { note: 60, velocity: 30 },
  { note: 60, velocity: 10 },
  { note: 60, velocity: 1 },
];
```

---

## Test Report Template

```markdown
## Test Execution Report

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Branch**: [branch-name]
**Commit**: [commit-hash]

### Test Results

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| TEST-001 | Column Alignment | PASS/FAIL | |
| TEST-002 | Velocity Controls | PASS/FAIL | |
| TEST-003 | Vertical Scrolling | PASS/FAIL | |
| ... | ... | ... | |

### Issues Found
1. [Issue description]
2. [Issue description]

### Screenshots
[Attach relevant screenshots]
```
