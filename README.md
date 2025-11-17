# Web Audio Minimoog Synthesizer

A modern web-based implementation of the classic Minimoog synthesizer, built with React, TypeScript, Vite, and the Web Audio API.

## 🧪 Engineering Methodology

This project serves dual purposes: building a functional synthesizer **and** pioneering a rigorous, requirements-driven development framework for AI-assisted coding. Rather than treating AI assistants as code generators, this project establishes systematic engineering practices that enable AI to work like experienced human developers.

### Development Framework Highlights

**Requirements-First Approach**

- Every feature begins with explicit acceptance criteria documented in the [Product Backlog](PRODUCT_BACKLOG.md)
- No code written until requirements are clear, measurable, and validated
- Bi-directional traceability: requirements link to tests, tests reference requirements

**Test-Driven Development**

- Write failing tests first, then implement code to pass them
- Pure function extraction for business logic (easy to test, easy to reason about)
- Comprehensive test suite with [Vitest](https://vitest.dev/) and React Testing Library
- ~90% code coverage with unit and integration tests

**Systematic Frontend Debugging**

- Evidence-based validation using Chrome DevTools MCP integration
- Visual validation protocol: screenshots before/after every change
- Programmatic measurement verification (but trust visual over metrics)
- Documented debugging workflows in [Frontend Testing Protocol](docs/FRONTEND_TESTING_PROTOCOL.md)

**Code Quality Automation**

- Four-stage quality gate: `lintfix` → `stylelintfix` → `typecheck` → `test`
- Strict TypeScript with no implicit any, strict null checks, and full type safety
- ESLint + Prettier for code consistency
- Automated pre-commit hooks ensure quality standards

**Architectural Documentation**

- Architecture Decision Records (ADRs) document key design choices
- Modular patch architecture with CV/Gate semantics (see [Modular Architecture](docs/ARCHITECTURE_MODULAR.md))
- 1V/Oct pitch standard with frequency conversion utilities
- Parameter smoothing system to prevent audio artifacts

This methodology produces maintainable, well-tested code with clear requirements traceability—demonstrating that AI can be taught to follow professional engineering practices when given proper tooling and guardrails.

## 🎵 What We've Built

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

- **16-Step Sequencer**: BPM control, gate length, swing, loop mode, and transport controls
- **Piano Roll Editor**: Full 128-note MIDI range with velocity controls, transpose (±24 semitones), and vertical scrolling
- **MIDI Input**: Web MIDI API integration with device selection, channel filtering, transpose, and velocity curves
- **CV/Gate Signal Generation**: Industry-standard control voltage and gate timing for modular synthesis

**Visualization & Output**

- **Master Output Module**: Real-time waveform oscilloscope showing audio output
- **Visual Feedback**: Port highlighting, connection eligibility, module status indicators
- **Cross-browser Compatibility**: Works with modern browsers including Safari (webkitAudioContext support)

### Audio Architecture

- Custom React hooks for each synthesizer module (`useOscillator`, `useSynthesizer`, `useAudioContext`)
- Proper Web Audio API node management with cleanup
- Real-time parameter updates without audio dropouts
- Modular component architecture separating audio logic from UI

## 🚀 Future Vision

We're building towards a full-featured Minimoog emulation with:

- **Filter Section**: Classic 24dB/octave lowpass filter with resonance
- **AHDSR Envelopes**: Amplitude and filter modulation (Hold stage + dB/percent sustain toggle)
- **LFO Modulation**: Vibrato, tremolo, and filter sweeps
- **Virtual Keyboard**: Play notes with mouse or computer keyboard
- **Preset Management**: Save, load, and share synthesizer patches

See our [Product Backlog](PRODUCT_BACKLOG.md) for detailed feature roadmap.

## 🛠️ Technology Stack

### Core Technologies

- **React 19** - Modern React with hooks and concurrent features
- **TypeScript** - Strict type safety for reliable audio code
- **Vite** - Fast development server and build tool
- **Web Audio API** - Native browser audio synthesis

### Development Tools

- **Vitest** - Fast unit testing with Web Audio API mocks
- **ESLint + Prettier** - Code quality and formatting
- **React Testing Library** - Component testing utilities
- **Playwright, [Playwright MCP](https://github.com/microsoft/playwright-mcp), and the [Playwright MCP Chrome Extension](https://github.com/microsoft/playwright-mcp/blob/main/extension/README.md)** - Enabling Copilot to interact with and debug the frontend via the browser and development server

### Architecture Decisions

- **Custom Hooks Pattern**: Each audio module is a reusable React hook
- **Context-based Audio Management**: Centralized AudioContext lifecycle
- **Component Composition**: Modular UI components for different control types
- **State-driven Audio**: React state drives audio parameter changes
- **Smoothing Layer**: `smoothParam`/`smoothParams` apply short ramps (linear/exp/setTarget) with cancellation to avoid zipper noise; envelopes schedule their own ramps and should not be smoothed directly

## 📚 Documentation

- **[Product Backlog](PRODUCT_BACKLOG.md)** – Feature roadmap and requirements
- **[Modular Architecture](docs/ARCHITECTURE_MODULAR.md)** – Patch graph, ports, signal domains, design rationale
- **[Envelope Design](docs/ENVELOPE_DESIGN.md)** – ADSR implementation strategy (ConstantSource + Gain) and trade‑offs
- **[Copilot Instructions](.github/copilot-instructions.md)** – AI-assisted development guidelines

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- Modern web browser with Web Audio API support

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start development server**

   ```bash
   npm run dev
   ```

3. **Open in browser**
   Navigate to `http://localhost:5173`

### First Steps

1. **Start Audio Context** - Click "Start Audio Context" button (required by browsers)
2. **Test Sound** - Use C4, E4, G4 buttons to hear the synthesizer
3. **Explore Controls** - Adjust oscillator parameters, waveforms, and master volume
4. **Experiment** - Try different detuning values for rich, layered sounds

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally
- `npm run test` - Run unit tests
- `npm run test:ui` - Run tests with UI interface
- `npm run lint` - Check code quality
- `npm run typecheck` - Check typescript compiler output
- `npm run typewatch` - Runs an active shell for checking ts compiler output on changes

## 🎛️ Using the Synthesizer

### Basic Operation

1. Start the audio context to enable sound
2. Click test note buttons (C4, E4, G4) to play predefined notes
3. Use the Stop button to silence all oscillators
4. Adjust master volume for overall output level

### Oscillator Controls

Each of the three oscillators has independent controls:

- **Frequency**: Base pitch in Hz (20-20,000Hz)
- **Waveform**: Choose from sine, square, sawtooth, or triangle waves
- **Gain**: Individual oscillator volume (0-1)
- **Detune**: Pitch offset in cents (-1200 to +1200)

### Sound Design Tips

- Use slight detuning (±7 cents) between oscillators for thickness
- Set oscillator 3 to a lower octave for bass foundation
- Experiment with different waveform combinations
- Start with sawtooth waves for classic analog sounds

## 🧪 Development

### Project Structure

```
src/
├── components/     # UI components (Controls, Synthesizer, etc.)
├── hooks/         # Custom React hooks for audio logic
├── types/         # TypeScript type definitions
└── test/          # Test setup and utilities
```

### Key Files

- `hooks/useAudioContext.tsx` - Audio context management
- `hooks/useOscillator.ts` - Individual oscillator logic
- `hooks/useSynthesizer.ts` - Three-oscillator synthesizer
- `components/Synthesizer.tsx` - Main synthesizer interface

### Testing

Web Audio API is mocked for testing using Vitest. All audio hooks include comprehensive unit tests.

```bash
npm run test        # Run all tests
npm run test:ui     # Interactive test runner
```

### Code Quality

The project uses strict TypeScript configuration and ESLint rules optimized for audio development:

- Strict null checks and type safety
- React hooks linting
- Prettier code formatting
- Web Audio API best practices

## 🤝 Contributing

This project follows modern React and Web Audio development patterns. See the [Product Backlog](PRODUCT_BACKLOG.md) for areas where contributions are needed.

### Development Guidelines

- Use TypeScript interfaces for all audio parameters
- Implement proper cleanup in useEffect hooks
- Test audio logic with mocked Web Audio API
- Follow the established custom hooks pattern
- Maintain separation between audio logic and UI components

## 📄 License

This project is open source and available under the MIT License.
