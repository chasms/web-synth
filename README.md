# Web Audio Minimoog Synthesizer

A modern web-based implementation of the classic Minimoog synthesizer, built with React, TypeScript, Vite, and the Web Audio API. This project demonstrates advanced audio programming techniques while providing an intuitive interface for music creation.

## 🎵 What We've Built

### Current Features

- **Three-Oscillator Synthesis Engine**: Independent control over frequency, waveform, gain, and detuning
- **Real-time Parameter Control**: Live adjustment of synthesizer parameters while playing
- **Master Volume Control**: Proper audio routing through a master gain stage
- **Modern UI**: Clean, high-contrast interface optimized for audio work
- **Cross-browser Compatibility**: Works with modern browsers including Safari (webkitAudioContext support)

### Audio Architecture

- Custom React hooks for each synthesizer module (`useOscillator`, `useSynthesizer`, `useAudioContext`)
- Proper Web Audio API node management with cleanup
- Real-time parameter updates without audio dropouts
- Modular component architecture separating audio logic from UI

## 🚀 Future Vision

We're building towards a full-featured Minimoog emulation with:

- **Filter Section**: Classic 24dB/octave lowpass filter with resonance
- **ADSR Envelopes**: Amplitude and filter modulation
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

### Architecture Decisions

- **Custom Hooks Pattern**: Each audio module is a reusable React hook
- **Context-based Audio Management**: Centralized AudioContext lifecycle
- **Component Composition**: Modular UI components for different control types
- **State-driven Audio**: React state drives audio parameter changes

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
