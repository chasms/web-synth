# Frontend Bug Report Template

**Use this template for all frontend/UI/layout bug reports and fixes.**

---

## Problem Statement

**Brief description:**
[One sentence describing what's wrong]

**Affected component/area:**
[e.g., Piano Roll Modal, Sequencer Controls, etc.]

**Severity:**
- [ ] Critical (blocks functionality)
- [ ] High (major visual issue)
- [ ] Medium (noticeable but not blocking)
- [ ] Low (minor cosmetic issue)

---

## Acceptance Criteria

Define EXACTLY what needs to be fixed. Be specific and measurable.

- [ ] [Criterion 1: e.g., "The first velocity slider should be centered horizontally under step 1 of the piano roll"]
- [ ] [Criterion 2: e.g., "All velocity sliders should align with their corresponding piano roll columns"]
- [ ] [Criterion 3: e.g., "No visual overlaps or gaps greater than 1px"]

**Tolerance threshold:** [e.g., "within 1px", "pixel-perfect", etc.]

---

## Reproduction Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]
4. **Expected behavior:** [What should happen]
5. **Actual behavior:** [What actually happens]

---

## Phase 1: Baseline Evidence (BEFORE FIX)

### Baseline Screenshot
**File:** `before-[feature]-[issue]-[date].png`

**Screenshot location:**
[Path to screenshot or attach it here]

### Baseline Measurements

**MCP Tool Used:** `mcp__chrome-devtools__evaluate_script()`

```javascript
// Paste the exact measurement script used
() => {
  // Your measurement code here
}
```

**Results:**
```json
{
  "element1_position": "...",
  "element2_position": "...",
  "offset": "...",
  "aligned": false
}
```

**Visual annotation:**
[Describe what you see that's wrong]

---

## Phase 2: Implementation

### Changes Made

**Files modified:**
- [ ] [file_path:line_number] - [description of change]
- [ ] [file_path:line_number] - [description of change]

**Code changes:**
```css
/* BEFORE */
.selector {
  property: old-value;
}

/* AFTER */
.selector {
  property: new-value;
}
```

**Rationale:**
[Why this change fixes the issue]

---

## Phase 3: Post-Fix Evidence (AFTER FIX)

### Post-Fix Screenshot
**File:** `after-[feature]-[issue]-[date].png`

**Screenshot location:**
[Path to screenshot or attach it here]

### Post-Fix Measurements

**MCP Tool Used:** `mcp__chrome-devtools__evaluate_script()`

```javascript
// Same measurement script as baseline
() => {
  // Your measurement code here
}
```

**Results:**
```json
{
  "element1_position": "...",
  "element2_position": "...",
  "offset": "0.00",
  "aligned": true
}
```

---

## Phase 4: Validation Results

### Visual Validation (PRIMARY)

**Question: Does this LOOK right to a human?**
- [ ] YES - Proceed to programmatic validation
- [ ] NO - Continue debugging

**Side-by-side comparison:**
- [ ] Before screenshot reviewed
- [ ] After screenshot reviewed
- [ ] Change matches expected outcome
- [ ] No unintended side effects observed

### Programmatic Validation (SECONDARY)

**Elements measured:** [List actual visual elements, NOT containers]

**Alignment check results:**
```
Element 1: center at X.XX px
Element 2: center at X.XX px
Offset: X.XX px
Within tolerance: YES/NO
```

### Cross-Validation

**Do visual and programmatic validation agree?**
- [ ] YES - Both confirm fix is working
- [ ] NO - Investigation required

**If NO, explain discrepancy:**
[Why do measurements not match visual appearance?]

---

## Phase 5: Acceptance Criteria Verification

### Criterion 1: [Copy from above]
- [ ] **Visual validation:** PASS / FAIL
- [ ] **Programmatic validation:** [measurement result]
- [ ] **Screenshot evidence:** [filename]

### Criterion 2: [Copy from above]
- [ ] **Visual validation:** PASS / FAIL
- [ ] **Programmatic validation:** [measurement result]
- [ ] **Screenshot evidence:** [filename]

### Criterion 3: [Copy from above]
- [ ] **Visual validation:** PASS / FAIL
- [ ] **Programmatic validation:** [measurement result]
- [ ] **Screenshot evidence:** [filename]

---

## Edge Cases Tested

- [ ] Different viewport sizes (tested at: _____)
- [ ] Different zoom levels (tested at: ___%)
- [ ] Multiple elements (tested: ___ elements)
- [ ] Empty state
- [ ] Overflow/scrolling behavior
- [ ] Hover/interaction states
- [ ] [Other edge case: ___]

---

## Regression Check

**Existing functionality verified:**
- [ ] [Related feature 1] - Still works correctly
- [ ] [Related feature 2] - Still works correctly
- [ ] [Related feature 3] - Still works correctly

**Unintended side effects:**
- [ ] None observed
- [ ] [List any side effects and whether they're acceptable]

---

## Summary

**Problem:** [One sentence]

**Solution:** [One sentence]

**Evidence:**
- Before: ![before screenshot](path/to/before.png)
- After: ![after screenshot](path/to/after.png)

**Measurements:**
| Metric | Before | After | Expected |
|--------|--------|-------|----------|
| [Metric 1] | [value] | [value] | [value] |
| [Metric 2] | [value] | [value] | [value] |

**Final Validation:**
- [x] All acceptance criteria met
- [x] Visual validation passed
- [x] Programmatic validation passed
- [x] No unintended side effects
- [x] Edge cases tested
- [x] Regression check passed

---

## Checklist Before Closing

Before marking this bug as fixed:
- [ ] Baseline screenshot captured
- [ ] Post-fix screenshot captured
- [ ] Before/after comparison completed
- [ ] All acceptance criteria explicitly verified
- [ ] Both visual AND programmatic validation passed
- [ ] Cross-validation confirms agreement
- [ ] Edge cases tested
- [ ] Regression check completed
- [ ] Evidence documented
- [ ] Code changes committed

**If ALL checkboxes are checked:** ✅ **Fix is complete**

**If ANY checkbox is unchecked:** ⚠️ **Fix is incomplete - continue debugging**

---

## Notes

[Any additional context, learnings, or notes for future reference]

---

## MCP Tool Quick Reference

### Take Screenshot
```javascript
mcp__chrome-devtools__take_screenshot()
mcp__chrome-devtools__take_screenshot({ fullPage: true })
mcp__chrome-devtools__take_screenshot({ uid: 'element_uid' })
```

### Measure Single Element
```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const el = document.querySelector('.my-element');
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left.toFixed(2),
      top: rect.top.toFixed(2),
      width: rect.width.toFixed(2),
      height: rect.height.toFixed(2),
      center_x: (rect.left + rect.width / 2).toFixed(2),
      center_y: (rect.top + rect.height / 2).toFixed(2)
    };
  }`
})
```

### Compare Two Elements
```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const el1 = document.querySelector('.element-1');
    const el2 = document.querySelector('.element-2');
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();
    const center1 = rect1.left + rect1.width / 2;
    const center2 = rect2.left + rect2.width / 2;
    return {
      element1_center: center1.toFixed(2),
      element2_center: center2.toFixed(2),
      offset: (center1 - center2).toFixed(2),
      aligned: Math.abs(center1 - center2) < 1
    };
  }`
})
```

### Batch Check Multiple Elements
```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const elements = Array.from(document.querySelectorAll('.my-elements'));
    return elements.map((el, i) => {
      const rect = el.getBoundingClientRect();
      return {
        index: i,
        center: (rect.left + rect.width / 2).toFixed(2),
        width: rect.width.toFixed(2)
      };
    });
  }`
})
```
