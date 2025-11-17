# Frontend Testing Protocol

## Overview
This protocol ensures thorough validation of UI/layout changes by combining visual validation with programmatic measurements. **Always prioritize what users SEE over what code measures.**

## Core Principle
**Visual validation comes before programmatic validation.** If a UI looks wrong to human eyes, it IS wrong, regardless of what measurements say.

---

## Phase 1: Before Making Changes

### 1.1 Document Acceptance Criteria
Write down EXACTLY what should be fixed:
- ✅ **Good**: "The first velocity slider should be centered horizontally under step 1 of the piano roll"
- ❌ **Bad**: "Fix slider alignment"

**Template:**
```markdown
## Acceptance Criteria
- [ ] [Element A] should be [specific position/appearance] relative to [Element B]
- [ ] [Visual property] should be [specific value/state]
- [ ] User should see [specific behavior]
```

### 1.2 Capture Baseline Screenshot
```javascript
// MCP Chrome DevTools
take_screenshot()
```

**Requirements:**
- Full viewport showing the problem area
- Save with descriptive name: `before-[feature]-[issue].png`
- Annotate (mentally or in notes) what's wrong

### 1.3 Measure Current State
```javascript
// MCP Chrome DevTools - evaluate_script
() => {
  const element1 = document.querySelector('[selector]');
  const element2 = document.querySelector('[selector]');

  return {
    element1_center: element1.getBoundingClientRect().left + element1.getBoundingClientRect().width / 2,
    element2_center: element2.getBoundingClientRect().left + element2.getBoundingClientRect().width / 2,
    offset: (element1_center - element2_center).toFixed(2)
  };
}
```

**Save this data** for comparison after the fix.

---

## Phase 2: Implement the Fix

### 2.1 Make Code Changes
- Apply the CSS/HTML/JS changes
- Keep changes focused and minimal

### 2.2 Immediate Post-Fix Screenshot
```javascript
// MCP Chrome DevTools
take_screenshot()
```

**Requirements:**
- Same viewport/zoom as baseline
- Save as: `after-[feature]-[issue].png`

---

## Phase 3: Multi-Level Validation

### 3.1 Visual Validation (PRIMARY)
**Ask these questions while looking at the screenshot:**
1. Does this LOOK right to a human?
2. Can I visually see that [acceptance criterion] is met?
3. Are the elements where they should be?
4. Does this match the expected design?

**If ANY answer is NO, the fix is INCOMPLETE** - do not proceed to programmatic validation.

### 3.2 Side-by-Side Comparison
Open both screenshots and compare:
- Identify what changed
- Verify the change matches acceptance criteria
- Look for unintended side effects

### 3.3 Programmatic Validation (SECONDARY)

**Measure Visual Elements (what users see):**
```javascript
// CORRECT: Measure the actual visual element
() => {
  const stepNumber = document.querySelector('.step-number');
  const velocitySlider = document.querySelector('.velocity-slider'); // The visible slider

  const stepCenter = stepNumber.getBoundingClientRect().left + stepNumber.getBoundingClientRect().width / 2;
  const sliderCenter = velocitySlider.getBoundingClientRect().left + velocitySlider.getBoundingClientRect().width / 2;

  return {
    stepCenter: stepCenter.toFixed(2),
    sliderCenter: sliderCenter.toFixed(2),
    offset: (sliderCenter - stepCenter).toFixed(2),
    aligned: Math.abs(sliderCenter - stepCenter) < 1 // Within 1px tolerance
  };
}
```

**NOT containers or parent elements:**
```javascript
// INCORRECT: Measuring containers instead of visual elements
const container = document.querySelector('.velocity-slider-container'); // ❌ Container, not visual element
```

### 3.4 Cross-Validation
**If visual and programmatic validation disagree:**
1. **Trust visual validation** - it's showing the user experience
2. Investigate WHY measurements don't match what you see
3. Common causes:
   - Measuring wrong element (container vs visual element)
   - CSS transforms not accounted for (rotations, translations)
   - Hidden overflow/clipping
   - Z-index layering issues

---

## Phase 4: Acceptance Criteria Verification

### 4.1 Explicit Checklist
Go through EACH criterion from Phase 1:

```markdown
## Verification Results

### Criterion 1: First velocity slider centered under step 1
- [x] Visual validation: PASS
- [x] Programmatic validation: offset = 0.5px (within tolerance)
- **Screenshot evidence:** `after-velocity-alignment.png`

### Criterion 2: All sliders aligned with their columns
- [x] Visual validation: PASS
- [x] Programmatic validation: All offsets < 1px
- **Screenshot evidence:** `after-velocity-alignment.png`
```

### 4.2 Evidence Requirements
For each criterion, provide:
- [ ] Screenshot showing the criterion is met
- [ ] Measurement data (if applicable)
- [ ] PASS/FAIL determination
- [ ] Notes on any edge cases

---

## Phase 5: Documentation

### 5.1 Before/After Summary
```markdown
## Fix Summary

**Problem:** [Brief description]

**Solution:** [What was changed]

**Evidence:**
- Before: ![screenshot](before-[feature]-[issue].png)
- After: ![screenshot](after-[feature]-[issue].png)

**Measurements:**
| Metric | Before | After | Expected |
|--------|--------|-------|----------|
| Offset | -31px  | 0px   | 0px      |

**Validation:**
- [x] All acceptance criteria met
- [x] Visual validation passed
- [x] Programmatic validation passed
- [x] No unintended side effects
```

---

## Common Pitfalls to Avoid

### ❌ Don't:
1. **Skip baseline screenshot** - "I'll just remember what it looked like"
2. **Measure containers instead of visual elements** - Containers can be aligned while contents are not
3. **Trust measurements over eyes** - If it looks wrong, it IS wrong
4. **Declare success without visual check** - Numbers can lie
5. **Test only one scenario** - Check multiple screen sizes, zoom levels
6. **Ignore transforms** - Rotated/scaled elements need special measurement handling

### ✅ Do:
1. **Always take before screenshot first**
2. **Measure what users actually see**
3. **Visually verify before measuring**
4. **Check all acceptance criteria explicitly**
5. **Document with screenshot evidence**
6. **Test edge cases** (empty states, overflow, etc.)

---

## MCP Chrome DevTools Quick Reference

### Take Screenshot
```javascript
take_screenshot()  // Current viewport
take_screenshot({ fullPage: true })  // Full page
```

### Measure Elements
```javascript
evaluate_script({
  function: `() => {
    const el = document.querySelector('.my-element');
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      center_x: rect.left + rect.width / 2,
      center_y: rect.top + rect.height / 2
    };
  }`
})
```

### Compare Two Elements
```javascript
evaluate_script({
  function: `() => {
    const el1 = document.querySelector('.element-1');
    const el2 = document.querySelector('.element-2');
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();

    return {
      horizontal_offset: (rect1.left - rect2.left).toFixed(2),
      vertical_offset: (rect1.top - rect2.top).toFixed(2),
      aligned_horizontally: Math.abs(rect1.left - rect2.left) < 1,
      aligned_vertically: Math.abs(rect1.top - rect2.top) < 1
    };
  }`
})
```

---

## Checklist Summary

Before making changes:
- [ ] Acceptance criteria documented
- [ ] Baseline screenshot captured
- [ ] Current measurements recorded

After making changes:
- [ ] Post-fix screenshot captured
- [ ] Visual validation: looks correct to human eyes
- [ ] Before/after comparison completed
- [ ] Programmatic measurements taken
- [ ] Each acceptance criterion verified
- [ ] Evidence documented

If all checkboxes are checked: ✅ **Fix is complete**

If any checkbox is unchecked: ⚠️ **Fix is incomplete - continue debugging**
