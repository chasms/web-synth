# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a React TypeScript project for building a Web Audio API-based Minimoog synthesizer.

## Project Guidelines

- Use React functional components with hooks
- Implement Web Audio API modules as custom React hooks
- Follow strict TypeScript practices
- Use Vitest for testing with React Testing Library
- Start with 3 oscillators before expanding to full synthesizer modules
- Prefer modern Web Audio API patterns (AudioWorklet when needed, AudioContext best practices)
- Use CSS for styling initially, keeping it simple and functional
- When adding/modifying features: always update `PRODUCT_BACKLOG.md` (adjust acceptance criteria, mark progress) and relevant docs (`README.md`, ADRs under docs/ when added). Include rationale for architectural decisions (CV standard, polyphony) as brief ADR entries.

## Debugging and Development Tools

- **Prefer MCP tools over bash commands** for debugging and development tasks
- Use `mcp_eslint_lint-files` for code linting instead of `npm run lint`
- Use Chrome DevTools MCP for browser testing and debugging UI interactions
- Only fall back to terminal commands when specific MCP tools are not available
- MCP tools provide better integration, structured output, and error handling

## Code Quality Checks

**After completing any code changes, ALWAYS run the following commands in sequence and fix any errors:**

1. `npm run lintfix` - Auto-fix ESLint issues
2. `npm run stylelintfix` - Auto-fix CSS/styling issues
3. `npm run typecheck` - Verify TypeScript type correctness

**Workflow:**
- Run all three commands after making changes
- If any command reports errors that cannot be auto-fixed, manually fix them
- Re-run the failing command to verify the fix
- Only consider the task complete when all three checks pass successfully

## Frontend Debugging Protocol

**For all UI/layout changes, follow the systematic validation process documented in `docs/FRONTEND_TESTING_PROTOCOL.md`.**

### Core Principles

1. **Visual Validation First**: If it looks wrong to human eyes, it IS wrong - measurements can lie
2. **Before/After Screenshots**: ALWAYS capture baseline before making changes
3. **Measure What Users See**: Measure visual elements, not containers or parent elements
4. **Explicit Acceptance Criteria**: Document exactly what should be fixed before starting
5. **Evidence-Based Validation**: Every fix requires screenshot and measurement proof

### Mandatory Workflow

**Before making changes:**
- [ ] Document acceptance criteria explicitly
- [ ] Take baseline screenshot using `mcp__chrome-devtools__take_screenshot()`
- [ ] Measure current state with `mcp__chrome-devtools__evaluate_script()`

**After making changes:**
- [ ] Take post-fix screenshot
- [ ] Visual validation: Does it LOOK correct? (primary check)
- [ ] Programmatic validation: Do measurements confirm? (secondary check)
- [ ] Verify EACH acceptance criterion with evidence
- [ ] If visual and programmatic disagree, investigate why (trust visual)

### MCP Chrome DevTools Workflows

For specific tool usage patterns, see `docs/CHROME_DEVTOOLS_WORKFLOWS.md`. Key patterns:

**Before/After Comparison:**
```javascript
// 1. Before
mcp__chrome-devtools__take_screenshot()
// 2. Make changes
// 3. After
mcp__chrome-devtools__take_screenshot()
// 4. Visual comparison (primary validation)
```

**Element Alignment Check:**
```javascript
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    const elem1 = document.querySelector('.element-1');
    const elem2 = document.querySelector('.element-2');
    const rect1 = elem1.getBoundingClientRect();
    const rect2 = elem2.getBoundingClientRect();
    const center1 = rect1.left + rect1.width / 2;
    const center2 = rect2.left + rect2.width / 2;
    return {
      offset: (center1 - center2).toFixed(2),
      aligned: Math.abs(center1 - center2) < 1
    };
  }`
})
```

### Common Pitfalls to Avoid

- ❌ **Never skip baseline screenshot** - Without it, you can't prove the fix worked
- ❌ **Never measure containers instead of visual elements** - Containers can be aligned while contents are not
- ❌ **Never trust measurements over eyes** - If it looks wrong, investigate why measurements disagree
- ❌ **Never declare success without visual check** - Code can lie, pixels don't
- ❌ **Never test only one state** - Check multiple scenarios, zoom levels, screen sizes

### Documentation Requirements

Every frontend fix must include:
- Before screenshot (showing the problem)
- After screenshot (showing the fix)
- Measurement data (if applicable)
- Pass/fail for each acceptance criterion
- Evidence that visual and programmatic validation agree

See `docs/templates/FRONTEND_BUG_REPORT.md` for the required format.

## Audio Architecture

- Create custom hooks for each synthesizer module (useOscillator, useFilter, etc.)
- Maintain audio context at the app level
- Use React state for UI parameter control
- Implement proper audio node cleanup in useEffect cleanup functions
- Adopt modular patch architecture (Modules, Ports, Connections) with 1V/Oct pitch standard; avoid embedding attenuverters in core modules—use separate utility modules.
- Support polyphony by instantiating per-voice module chains managed by a voice allocator.
- Provide a parameter smoothing utility for audible parameter changes (linear, exp, setTarget modes) and document usage.

## Code Style

- Use descriptive names for audio-related variables and functions
- Comment complex Web Audio API chains
- Separate audio logic from UI rendering logic
- Use TypeScript interfaces for synthesizer parameter objects
- Avoid abbreviations and acronyms in variable, function, and type names; prefer fully spelled-out descriptive identifiers (e.g., `oscillatorNode` not `osc`, `outputGainNode` not `out`).

## Requirement-Oriented Development Framework

**Adopt a skeptical validation approach over optimistic assumptions. Every feature must be rigorously validated before being considered complete.**

### Mandatory Requirements Process

- **Acceptance Criteria**: Define specific, measurable criteria before implementation begins. Ask about any clarifications that may be needed.
- **Reproduction Steps**: Document exact steps to reproduce both success and failure scenarios.
- **Testing Protocol**: Create systematic test cases covering normal, edge, and error conditions
- **Evidence Collection**: Use screenshots, console logs, and measurable data to validate functionality
- **Validation Framework**: Establish tolerance thresholds (e.g., "no visual overlaps within 10px tolerance")

### Implementation Standards

- **Documentation First**: Write clear requirements and acceptance criteria before coding
- **Prove, Don't Assume**: Use browser testing, automated tests, or manual verification to prove functionality works
- **Edge Case Coverage**: Test boundary conditions, error states, and unexpected user interactions
- **Regression Prevention**: Verify existing functionality remains intact after changes
- **Measurement-Based Success**: Use quantifiable metrics rather than subjective assessments

### Skeptical Development Mindset

- Question optimistic assumptions about code behavior
- Assume features are broken until proven working through systematic testing
- Demand evidence-based validation rather than theoretical correctness
- Prioritize thorough testing over rapid delivery
- Document failure modes and their prevention strategies
