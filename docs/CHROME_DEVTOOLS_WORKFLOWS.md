# Chrome DevTools MCP Workflows

## Overview
Specific MCP Chrome DevTools patterns for effective frontend debugging. These workflows prevent common mistakes and ensure thorough validation.

---

## Workflow 1: Before/After Screenshot Comparison

### When to Use
- Any visual/layout change
- UI alignment issues
- Styling modifications

### Steps

#### 1. Capture Baseline
```javascript
mcp__chrome-devtools__take_screenshot()
```
- Save mental note or actual annotation of what's wrong
- **Critical**: Do this BEFORE making any code changes

#### 2. Make Code Changes
- Edit CSS/HTML/JS files
- Keep changes focused

#### 3. Capture Post-Fix
```javascript
mcp__chrome-devtools__take_screenshot()
```
- Same viewport, zoom, and scroll position as baseline

#### 4. Visual Comparison
- Open both images side by side
- Look for the expected change
- Check for unintended changes
- **Decision point**: Does it LOOK right?
  - **Yes**: Proceed to programmatic validation
  - **No**: Debug further, take another screenshot when fixed

---

## Workflow 2: Element Alignment Verification

### When to Use
- Verifying elements are centered/aligned
- Checking spacing/positioning
- Validating layout after changes

### Pattern

```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    // Select the elements to compare
    const targetElement = document.querySelector('.target');
    const referenceElement = document.querySelector('.reference');

    // Get bounding rectangles
    const targetRect = targetElement.getBoundingClientRect();
    const refRect = referenceElement.getBoundingClientRect();

    // Calculate centers
    const targetCenter = {
      x: targetRect.left + targetRect.width / 2,
      y: targetRect.top + targetRect.height / 2
    };
    const refCenter = {
      x: refRect.left + refRect.width / 2,
      y: refRect.top + refRect.height / 2
    };

    // Calculate offsets
    const offset = {
      horizontal: (targetCenter.x - refCenter.x).toFixed(2),
      vertical: (targetCenter.y - refCenter.y).toFixed(2)
    };

    return {
      target: {
        left: targetRect.left.toFixed(2),
        top: targetRect.top.toFixed(2),
        width: targetRect.width.toFixed(2),
        height: targetRect.height.toFixed(2),
        center: targetCenter
      },
      reference: {
        left: refRect.left.toFixed(2),
        top: refRect.top.toFixed(2),
        width: refRect.width.toFixed(2),
        height: refRect.height.toFixed(2),
        center: refCenter
      },
      offset: offset,
      aligned_horizontally: Math.abs(parseFloat(offset.horizontal)) < 1,
      aligned_vertically: Math.abs(parseFloat(offset.vertical)) < 1
    };
  }`
})
```

### Interpretation
- `offset.horizontal`: Positive = target is right of reference, Negative = target is left
- `offset.vertical`: Positive = target is below reference, Negative = target is above
- `aligned_*`: Within 1px tolerance (adjustable based on requirements)

---

## Workflow 3: Multi-Element Batch Alignment Check

### When to Use
- Checking alignment across multiple elements (e.g., all columns in a grid)
- Verifying consistent spacing
- Testing responsive layouts

### Pattern

```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    // Get reference elements (e.g., column headers)
    const references = Array.from(document.querySelectorAll('.column-header'));

    // Get target elements (e.g., corresponding controls)
    const targets = Array.from(document.querySelectorAll('.column-control'));

    // Calculate alignments for each pair
    return targets.map((target, i) => {
      const ref = references[i];
      if (!ref || !target) return null;

      const targetRect = target.getBoundingClientRect();
      const refRect = ref.getBoundingClientRect();

      const targetCenterX = targetRect.left + targetRect.width / 2;
      const refCenterX = refRect.left + refRect.width / 2;
      const offset = (targetCenterX - refCenterX).toFixed(2);

      return {
        index: i + 1,
        reference_center: refCenterX.toFixed(2),
        target_center: targetCenterX.toFixed(2),
        offset: offset,
        aligned: Math.abs(parseFloat(offset)) < 1
      };
    }).filter(item => item !== null);
  }`
})
```

### Expected Output
```json
[
  { "index": 1, "reference_center": "105.75", "target_center": "105.75", "offset": "0.00", "aligned": true },
  { "index": 2, "reference_center": "135.75", "target_center": "135.75", "offset": "0.00", "aligned": true },
  ...
]
```

### Success Criteria
- All `aligned` values are `true`
- All `offset` values are within acceptable tolerance (typically < 1px)

---

## Workflow 4: Measuring Transformed Elements

### When to Use
- Elements with CSS transforms (rotate, scale, translate)
- Rotated sliders, controls
- Elements with transform-origin

### The Problem
Transformed elements' `getBoundingClientRect()` returns the **axis-aligned bounding box** of the transformed element, not its pre-transform dimensions.

### Pattern

```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const element = document.querySelector('.rotated-element');
    const container = element.parentElement;

    const elemRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // For rotated elements, measure their visual center
    const elemCenterX = elemRect.left + elemRect.width / 2;
    const elemCenterY = elemRect.top + elemRect.height / 2;

    const containerCenterX = containerRect.left + containerRect.width / 2;
    const containerCenterY = containerRect.top + containerRect.height / 2;

    // Get computed transform
    const transform = window.getComputedStyle(element).transform;

    return {
      element_visual_center: {
        x: elemCenterX.toFixed(2),
        y: elemCenterY.toFixed(2)
      },
      container_center: {
        x: containerCenterX.toFixed(2),
        y: containerCenterY.toFixed(2)
      },
      offset: {
        x: (elemCenterX - containerCenterX).toFixed(2),
        y: (elemCenterY - containerCenterY).toFixed(2)
      },
      transform: transform,
      centered_in_container: Math.abs(elemCenterX - containerCenterX) < 1
    };
  }`
})
```

### Key Points
- **Measure the visual bounding box** after transformation
- Use the center of the bounding box for alignment checks
- Consider the **container** for relative positioning

---

## Workflow 5: Interactive Element Testing

### When to Use
- Verifying hover states
- Testing click handlers
- Checking interactive feedback

### Pattern

#### Take Baseline
```javascript
mcp__chrome-devtools__take_screenshot()
```

#### Trigger Interaction
```javascript
mcp__chrome-devtools__click({ uid: 'element_uid' })
```

#### Capture Result
```javascript
mcp__chrome-devtools__take_screenshot()
```

#### Verify State Change
```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const element = document.querySelector('.interactive-element');
    return {
      classList: Array.from(element.classList),
      hasActiveClass: element.classList.contains('active'),
      style: {
        display: window.getComputedStyle(element).display,
        opacity: window.getComputedStyle(element).opacity
      }
    };
  }`
})
```

---

## Workflow 6: Debugging Misalignment Step-by-Step

### When: Element doesn't align as expected

### Step 1: Visual Confirmation
```javascript
mcp__chrome-devtools__take_screenshot()
```
**Question**: Can I SEE the misalignment?
- **Yes**: Proceed
- **No**: It might not be a real issue, verify acceptance criteria

### Step 2: Identify Elements
```javascript
mcp__chrome-devtools__take_snapshot()
```
- Find UIDs of misaligned elements
- Note their class names and hierarchy

### Step 3: Measure Both Elements
```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const elem1 = document.querySelector('.element-1');
    const elem2 = document.querySelector('.element-2');

    return {
      element1: {
        selector: '.element-1',
        bounds: elem1.getBoundingClientRect(),
        computed: {
          width: window.getComputedStyle(elem1).width,
          margin: window.getComputedStyle(elem1).margin,
          padding: window.getComputedStyle(elem1).padding,
          transform: window.getComputedStyle(elem1).transform,
          position: window.getComputedStyle(elem1).position
        }
      },
      element2: {
        selector: '.element-2',
        bounds: elem2.getBoundingClientRect(),
        computed: {
          width: window.getComputedStyle(elem2).width,
          margin: window.getComputedStyle(elem2).margin,
          padding: window.getComputedStyle(elem2).padding,
          transform: window.getComputedStyle(elem2).transform,
          position: window.getComputedStyle(elem2).position
        }
      }
    };
  }`
})
```

### Step 4: Analyze Differences
Look for:
- Different widths (including borders/padding)
- Margin differences
- Transform differences
- Positioning method differences

### Step 5: Calculate Expected Fix
```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const elem1 = document.querySelector('.element-1');
    const elem2 = document.querySelector('.element-2');
    const rect1 = elem1.getBoundingClientRect();
    const rect2 = elem2.getBoundingClientRect();

    const currentOffset = rect1.left - rect2.left;
    const desiredOffset = 0; // Or whatever alignment you want
    const adjustment = desiredOffset - currentOffset;

    return {
      current_offset: currentOffset.toFixed(2),
      desired_offset: desiredOffset,
      adjustment_needed: adjustment.toFixed(2),
      recommendation: `Shift element1 by ${adjustment.toFixed(2)}px to the ${adjustment > 0 ? 'right' : 'left'}`
    };
  }`
})
```

### Step 6: Apply Fix & Verify
- Make the calculated adjustment in CSS
- Take new screenshot
- Remeasure
- Compare before/after

---

## Common Measurement Patterns

### Pattern: Get Element Dimensions
```javascript
() => {
  const el = document.querySelector('.my-element');
  const rect = el.getBoundingClientRect();
  const computed = window.getComputedStyle(el);

  return {
    position: {
      left: rect.left.toFixed(2),
      top: rect.top.toFixed(2),
      right: rect.right.toFixed(2),
      bottom: rect.bottom.toFixed(2)
    },
    dimensions: {
      width: rect.width.toFixed(2),
      height: rect.height.toFixed(2)
    },
    center: {
      x: (rect.left + rect.width / 2).toFixed(2),
      y: (rect.top + rect.height / 2).toFixed(2)
    },
    computed_styles: {
      width: computed.width,
      margin: computed.margin,
      padding: computed.padding,
      border: computed.border,
      boxSizing: computed.boxSizing
    }
  };
}
```

### Pattern: Compare Multiple Elements
```javascript
() => {
  const elements = Array.from(document.querySelectorAll('.item'));
  return elements.map((el, i) => {
    const rect = el.getBoundingClientRect();
    return {
      index: i,
      left: rect.left.toFixed(2),
      width: rect.width.toFixed(2),
      center: (rect.left + rect.width / 2).toFixed(2)
    };
  });
}
```

### Pattern: Check Spacing Between Elements
```javascript
() => {
  const elements = Array.from(document.querySelectorAll('.spaced-element'));
  const spacings = [];

  for (let i = 0; i < elements.length - 1; i++) {
    const rect1 = elements[i].getBoundingClientRect();
    const rect2 = elements[i + 1].getBoundingClientRect();
    const gap = rect2.left - rect1.right;

    spacings.push({
      between: `element-${i} and element-${i + 1}`,
      gap: gap.toFixed(2)
    });
  }

  const isConsistent = spacings.every(s => Math.abs(parseFloat(s.gap) - parseFloat(spacings[0].gap)) < 1);

  return {
    spacings,
    consistent: isConsistent,
    expected_gap: spacings[0]?.gap || 'N/A'
  };
}
```

---

## Anti-Patterns (What NOT to Do)

### ❌ Measuring Containers Instead of Visual Elements
```javascript
// WRONG: Measuring the container
const container = document.querySelector('.velocity-slider-container');
const containerCenter = container.getBoundingClientRect().left + container.getBoundingClientRect().width / 2;

// RIGHT: Measuring the actual visual slider
const slider = document.querySelector('.velocity-slider');
const sliderCenter = slider.getBoundingClientRect().left + slider.getBoundingClientRect().width / 2;
```

### ❌ Skipping Visual Validation
```javascript
// WRONG: Only checking programmatic values
const offset = calculateOffset();
if (offset === 0) return "Fixed!"; // ❌ Never verified visually

// RIGHT: Visual check first
take_screenshot(); // Check visually first
const offset = calculateOffset(); // Then verify programmatically
```

### ❌ Using Incorrect Selectors
```javascript
// WRONG: Selecting wrong element
document.querySelector('.step-number'); // Might select wrong one if multiple exist

// RIGHT: Select specific element
document.querySelectorAll('.step-number')[0]; // First element
document.querySelector('.step-numbers .step-number:first-child'); // More specific
```

---

## Quick Reference Card

| Task | MCP Tool | Key Points |
|------|----------|------------|
| Visual check | `take_screenshot()` | Before & after every change |
| Measure element | `evaluate_script()` | Use `getBoundingClientRect()` |
| Find elements | `take_snapshot()` | Get UIDs and structure |
| Click element | `click({ uid })` | Test interactions |
| Check alignment | `evaluate_script()` | Compare center points |
| Batch check | `evaluate_script()` | Map over arrays |
| Transforms | `evaluate_script()` | Use visual bounding box |

---

## Success Checklist

For every frontend fix:
- [ ] Baseline screenshot captured
- [ ] Post-fix screenshot captured
- [ ] Visual validation: looks correct
- [ ] Programmatic measurements taken
- [ ] Measurements match visual appearance
- [ ] All alignment checks pass
- [ ] No unintended side effects observed
