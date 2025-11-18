# Web Audio Synthesizer - [web-audio-synth.chas.ms](https://web-audio-synth.chas.ms/)

A modern web-based implementation of the classic Minimoog synthesizer, built with React, TypeScript, Vite, and the Web Audio API.

## Engineering Methodology

This project serves dual purposes: building a functional synthesizer **and** pioneering a rigorous, requirements-driven development framework for AI-assisted coding. Rather than treating AI assistants as code generators, this project establishes systematic engineering practices that enable AI to work like experienced human developers.

### Development Framework Highlights

**Requirements-First Approach**

- Every feature begins with explicit acceptance criteria documented in the [Product Backlog](PRODUCT_BACKLOG.md)
- No code written until requirements are clear, measurable, and validated
- Bi-directional traceability: requirements link to tests, tests reference requirements

**Test-Driven Development**

- Write failing tests first, then implement code to pass them
- Pure function extraction for business logic (easy to test, easy to reason about)
- Test suite with [Vitest](https://vitest.dev/) and React Testing Library
- Unit and integration test coverage for critical features

**Systematic Frontend Debugging**

- Evidence-based validation using Chrome DevTools MCP integration
- Visual validation protocol: screenshots before/after every change
- Programmatic measurement verification (but trust visual over metrics)
- Documented debugging workflows in [Frontend Testing Protocol](docs/FRONTEND_TESTING_PROTOCOL.md)

**Code Quality Automation**

- Four-stage quality gate: `lintfix` → `stylelintfix` → `typecheck` → `test`
- Strict TypeScript with no implicit any, strict null checks, and full type safety
- ESLint + Prettier for code consistency

**Architectural Documentation**

- Modular patch architecture with CV/Gate semantics (see [Modular Architecture](docs/ARCHITECTURE_MODULAR.md))
- 1V/Oct pitch standard with frequency conversion utilities
- Parameter smoothing system to prevent audio artifacts
- Systematic debugging protocols documented

This methodology produces maintainable, well-tested code with clear requirements traceability—demonstrating that AI can be taught to follow professional engineering practices when given proper tooling and guardrails.

## What We've Built

### Current Features

**Modular Synthesis Architecture**

- **Drag-and-Drop Patch Workspace**: Visual modular synthesizer with pan/zoom, grid snapping, and cable routing
- **Click-to-Click Cable Connections**: Connect modules with color-coded cables (AUDIO, CV, GATE, TRIGGER)
- **Real-time Audio Graph**: Web Audio API nodes dynamically created and routed based on patch configuration
- **Module Library**: VCO (oscillator), VCF (filter), ADSR envelope, sequencer, MIDI input, and master output

**Sound Generation & Control**

- **VCO Module**: Voltage-controlled oscillator with frequency, waveform, detune, and gain controls
- **VCF Module**: 24dB/octave lowpass filter with cutoff, resonance, envelope amount, and drive
- **AHDSR Envelope**: Attack, Hold, Decay, Sustain, Release with interactive SVG editor and draggable handles
- **Parameter Smoothing**: Automatic ramping prevents zipper noise on parameter changes (linear/exp/setTarget modes)

**Sequencing & Performance**

- **Step Sequencer**: 1-32 steps, BPM control, gate length, swing, loop mode, and transport controls
- **Piano Roll Editor**: Full 128-note MIDI range with velocity controls, transpose (±24 semitones), and vertical scrolling
- **MIDI Input**: Web MIDI API integration with device selection, channel filtering, transpose, and velocity curves
- **CV/Gate Signal Generation**: Industry-standard control voltage and gate timing for modular synthesis

**Visualization & Output**

- **Master Output Module**: Real-time waveform oscilloscope showing audio output
- **Visual Feedback**: Port highlighting, connection eligibility, module status indicators
- **Cross-browser Compatibility**: Works with modern browsers including Safari (webkitAudioContext support)

### Audio Architecture

**Module System**

- Factory pattern for creating audio modules with consistent lifecycle (init, update, dispose)
- Port-based connection system with signal type validation (AUDIO, CV, GATE, TRIGGER)
- Real-time audio graph manipulation without clicks or dropouts
- ConstantSource → GainNode pattern for CV/Gate signal generation

**Web Audio Integration**

- Custom React hooks for audio context management and module orchestration
- Proper node cleanup using useEffect lifecycle hooks
- Sample-accurate timing using AudioContext.currentTime
- Parameter automation with `setValueAtTime()` and `linearRampToValueAtTime()`

**Design Patterns**

- Separation of concerns: audio logic in modules, UI in components, state in hooks
- Pure function extraction for testable business logic
- Type-safe module parameters with TypeScript interfaces
- Immutable state updates with React best practices

## Roadmap

Potential enhancements to complete the modular synthesizer platform:

- **Saturator Module**: Saturator to beef up the waveform sound with drive and tone controls
- **LFO Module**: Low-frequency oscillator for vibrato, tremolo, and modulation effects
- **Utility CV Modules**: Attenuverters, mixers, multiples, and signal conditioning
- **Preset System**: Save/load patches with factory presets and JSON import/export
- **Virtual Keyboard**: Computer keyboard and on-screen keyboard
- **Effects Modules**: Delay, reverb, distortion, and chorus
- **Performance Tools**: MIDI CC mapping, parameter automation, and pattern chaining

See our [Product Backlog](PRODUCT_BACKLOG.md) for detailed acceptance criteria and technical specifications.

## Technology Stack

### Core Technologies

- **React 19** - Modern React with hooks and concurrent features
- **TypeScript 5.8** - Strict type safety with no implicit any, strict null checks
- **Vite 7** - Lightning-fast dev server with HMR, optimized production builds
- **Web Audio API** - Native browser audio synthesis with modular routing

### Development & Quality Tools

**Testing Infrastructure**

- **Vitest 3** - Fast unit testing with Web Audio API mocks
- **React Testing Library** - Component testing with user-centric queries
- **@testing-library/user-event** - Realistic user interaction simulation
- **jsdom** - DOM environment for headless testing

**Code Quality & Linting**

- **ESLint 9** - Static analysis with React hooks rules and import sorting
- **Prettier** - Opinionated code formatting for consistency
- **Stylelint** - CSS linting with standard config
- **TypeScript Compiler** - Continuous type checking with watch mode

**AI-Assisted Development**

- **Chrome DevTools MCP** - Programmatic browser control for systematic UI debugging
- **ESLint MCP** - Structured linting feedback for AI code analysis
- **Stylelint MCP** - CSS validation integrated into AI workflow
- **GitHub Copilot** - Context-aware code suggestions with workspace instructions

### Architecture Decisions

**Modular Synthesis Design**

- **Module Factory Pattern**: Consistent lifecycle (create, connect, update, dispose) for all audio modules
- **Port-based Routing**: Signal type validation ensures correct connections (AUDIO ↔ AUDIO, CV → any, GATE ↔ TRIGGER)
- **CV/Gate Standard**: 1V/Oct pitch standard with frequency-based CV (not voltage simulation)
- **Separation of Concerns**: Audio graph in Web Audio API, state in React, UI in components

**React Integration**

- **Context-based Audio Management**: Centralized AudioContext lifecycle with provider pattern
- **Custom Hooks**: `usePatch` for module graph, `useAudioContext` for shared audio context
- **Pure Functions**: Business logic extracted from components for testability
- **Immutable Updates**: State changes use immutable patterns, creating new objects rather than mutating

**Performance & Quality**

- **Parameter Smoothing**: `smoothParam` utility prevents zipper noise with configurable ramp modes
- **Lazy Initialization**: Modules only create audio nodes when needed
- **Proper Cleanup**: Audio nodes disconnected and disposed in useEffect cleanup
- **Type Safety**: TypeScript with strict compiler settings

## Documentation

**Product & Requirements**

- **[Product Backlog](PRODUCT_BACKLOG.md)** – Feature roadmap with acceptance criteria and validated test cases
- **[AGENTS.md](AGENTS.md)** – AI development guidelines and engineering standards

**Architecture & Design**

- **[Modular Architecture](docs/ARCHITECTURE_MODULAR.md)** – Module system, port types, signal routing, CV/Gate semantics
- **[Envelope Design](docs/ENVELOPE_DESIGN.md)** – AHDSR implementation with ConstantSource + GainNode pattern
- **[Frontend Testing Protocol](docs/FRONTEND_TESTING_PROTOCOL.md)** – Systematic UI validation methodology
- **[Chrome DevTools Workflows](docs/CHROME_DEVTOOLS_WORKFLOWS.md)** – Browser debugging patterns for AI assistants

## 🚦 Getting Started

### Prerequisites

- **Node.js 18+** - Runtime environment
- **npm 9+** - Package manager
- **Modern Browser** - Chrome, Firefox, Safari, or Edge with Web Audio API support
- **MIDI Device (Optional)** - External MIDI keyboard for live performance

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/chasms/web-audio-synth.git
cd web-audio-synth

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Quick Start Guide

**1. Initialize Audio Context**

- Click "Start Audio Context" button (required by browser security policy)
- Confirm audio context state shows "running"

**2. Load Default Patch**

- Default configuration: SEQUENCER → VCO → VCF → MASTER OUT
- Pre-programmed C major scale sequence ready to play

**3. Play Your First Sound**

- Click **Play** button on the sequencer module
- Watch the step counter advance and hear the sequence
- Observe waveform on the Master Out oscilloscope

**4. Experiment with Modules**

- Drag modules to reposition them on the workspace
- Click cable endpoints to delete connections
- Click ports to create new connections (matching signal types)
- Adjust VCO waveform, filter cutoff, envelope attack/release

### Available Scripts

**Development**

```bash
npm run dev          # Start dev server with HMR on http://localhost:5173
npm run build        # Build optimized production bundle
npm run preview      # Preview production build locally
```

**Testing**

```bash
npm run test         # Run all tests once (CI mode)
npm run test:run     # Run all tests in watch mode
npm run test:ui      # Interactive test UI with Vitest
```

**Code Quality**

```bash
npm run lint         # Check ESLint errors
npm run lintfix      # Auto-fix ESLint issues
npm run stylelint    # Check CSS/style errors
npm run stylelintfix # Auto-fix style issues
npm run typecheck    # Verify TypeScript types
npm run typewatch    # Type checking in watch mode
```

**Quality Gate (run before commits)**

```bash
npm run lintfix && npm run stylelintfix && npm run typecheck && npm run test
```
