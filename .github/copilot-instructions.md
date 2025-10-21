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
