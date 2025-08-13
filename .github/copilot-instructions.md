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
