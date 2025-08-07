# Web Audio Minimoog Synthesizer - Product Backlog

## Current Implementation ✅

### Core Architecture

- **Audio Context Management**: React Context provider for Web Audio API lifecycle
- **Oscillator Engine**: Custom React hooks for individual oscillator management
- **Synthesizer Core**: Combined hook managing three oscillators with proper cleanup
- **Component Architecture**: Modular UI components with separation of concerns

### Audio Features

- **Three Oscillators**: Independent frequency, waveform, gain, and detune control
- **Waveform Types**: Sine, square, sawtooth, and triangle waves
- **Master Volume**: Global output level control
- **Real-time Parameter Updates**: Live adjustment of running oscillators
- **Safari Compatibility**: webkitAudioContext fallback for older Safari versions

### User Interface

- **Control Components**: Knobs, numeric inputs, and dropdowns for parameter adjustment
- **Test Interface**: C4, E4, G4 test buttons for quick sound testing
- **Audio Context Status**: Visual feedback for audio context state and sample rate
- **Responsive Design**: Mobile-friendly layout with CSS Grid
- **Visual Feedback**: Play/stop status indicators

### Development Setup

- **Vite + React + TypeScript**: Modern development stack
- **Testing Framework**: Vitest with React Testing Library and Web Audio API mocks
- **Code Quality**: ESLint + Prettier integration
- **Strict TypeScript**: Enhanced type safety and developer experience

---

## Product Backlog 🚀

### 1. Filter Section - HIGH PRIORITY

**Product Requirement**: Classic Moog-style 24dB/octave lowpass filter with resonance

**Acceptance Criteria**:

- [ ] Lowpass filter with cutoff frequency control (20Hz - 20kHz)
- [ ] Resonance control (0-100%, self-oscillation at high values)
- [ ] Filter envelope with ADSR controls
- [ ] Filter envelope amount control (positive/negative)
- [ ] Keyboard tracking control (0-100%)
- [ ] Visual filter frequency response display (nice-to-have)

**Technical Implementation**:

- Use `BiquadFilterNode` with lowpass type
- Implement custom `useFilter` hook
- Create `FilterControls` component
- Add filter parameters to synth state

### 2. Envelope Generators - HIGH PRIORITY

**Product Requirement**: ADSR envelope generators for amplitude and filter modulation

**Acceptance Criteria**:

- [ ] Amplitude ADSR envelope (Attack, Decay, Sustain, Release)
- [ ] Filter ADSR envelope (separate from amplitude)
- [ ] Visual envelope shape display
- [ ] Envelope times: Attack (1ms-10s), Decay (1ms-10s), Release (1ms-10s)
- [ ] Sustain level (0-100%)
- [ ] Note-on/note-off triggering system

**Technical Implementation**:

- Create `useEnvelope` hook with `GainNode` automation
- Implement envelope curve calculations
- Add note triggering system to synthesizer
- Create `EnvelopeControls` component with ADSR sliders

### 3. LFO (Low Frequency Oscillator) - MEDIUM PRIORITY

**Product Requirement**: Modulation source for creating vibrato, tremolo, and filter sweeps

**Acceptance Criteria**:

- [ ] LFO rate control (0.1Hz - 20Hz)
- [ ] Waveform selection (sine, square, sawtooth, triangle, sample & hold)
- [ ] Modulation destinations: pitch, filter cutoff, amplitude
- [ ] Modulation amount controls for each destination
- [ ] LFO sync to tempo (nice-to-have)

**Technical Implementation**:

- Create `useLFO` hook with dedicated oscillator
- Implement modulation routing system
- Use `AudioParam.value` automation for real-time modulation
- Create `LFOControls` component

### 4. Keyboard Interface - MEDIUM PRIORITY

**Product Requirement**: Virtual keyboard and computer keyboard input for note playing

**Acceptance Criteria**:

- [ ] Virtual piano keyboard (2-3 octaves)
- [ ] Computer keyboard mapping (QWERTY to chromatic notes)
- [ ] Octave up/down controls
- [ ] Sustain pedal simulation (spacebar)
- [ ] Polyphonic support (4-8 voices)
- [ ] Visual feedback for pressed keys

**Technical Implementation**:

- Create `VirtualKeyboard` component
- Implement `useKeyboardInput` hook for computer keyboard
- Add polyphonic voice management system
- Implement MIDI note to frequency conversion
- Add octave shifting controls

### 5. Preset Management - MEDIUM PRIORITY

**Product Requirement**: Save, load, and manage synthesizer presets

**Acceptance Criteria**:

- [ ] Save current settings as named preset
- [ ] Load preset from preset bank
- [ ] Delete presets
- [ ] Default factory presets (Lead, Bass, Pad, etc.)
- [ ] Import/export preset files (JSON format)
- [ ] Preset browser with categories

**Technical Implementation**:

- Create `usePresets` hook with localStorage persistence
- Implement preset serialization/deserialization
- Create `PresetManager` component
- Add factory preset definitions
- File import/export functionality

### 6. Performance Enhancements - LOW PRIORITY

**Product Requirement**: Optimize audio performance and add advanced features

**Acceptance Criteria**:

- [ ] AudioWorklet implementation for precise timing
- [ ] Web MIDI API support for external keyboards
- [ ] Audio recording/export functionality
- [ ] Performance monitoring and optimization
- [ ] Reduce audio latency

**Technical Implementation**:

- Migrate critical audio processing to AudioWorklet
- Implement `useMIDI` hook for external controller support
- Add `MediaRecorder` API integration
- Performance profiling and optimization
- Buffer size optimization

### 7. Visual Enhancements - LOW PRIORITY

**Product Requirement**: Enhanced visual feedback and skeuomorphic design

**Acceptance Criteria**:

- [ ] Oscilloscope display showing waveform output
- [ ] Spectrum analyzer for frequency visualization
- [ ] Vintage Moog-inspired UI skin option
- [ ] Animated knobs with rotation feedback
- [ ] LED-style indicators
- [ ] Dark/light theme toggle

**Technical Implementation**:

- Canvas-based oscilloscope using `AnalyserNode`
- Real-time FFT visualization
- CSS-in-JS for dynamic theming
- SVG-based knob components with rotation
- Theme context provider

### 8. Audio Effects Chain - LOW PRIORITY

**Product Requirement**: Additional audio effects for sound design

**Acceptance Criteria**:

- [ ] Distortion/overdrive effect
- [ ] Delay/echo effect with feedback control
- [ ] Chorus effect for ensemble sounds
- [ ] Reverb effect (room, hall, plate)
- [ ] Effects bypass switches
- [ ] Effects routing/ordering

**Technical Implementation**:

- Create individual effect hooks (`useDistortion`, `useDelay`, etc.)
- Implement effects chain routing system
- Use `ConvolverNode` for reverb impulse responses
- Create `EffectsRack` component
- Add effect parameter automation

### 9. Sequencer Integration - FUTURE

**Product Requirement**: Built-in step sequencer for pattern creation

**Acceptance Criteria**:

- [ ] 16-step sequencer with note input
- [ ] Pattern playback with tempo control
- [ ] Multiple pattern slots
- [ ] Pattern chaining
- [ ] Real-time recording mode

**Technical Implementation**:

- Create sequencer timing engine
- Implement pattern storage and playback
- Add step input interface
- Transport controls (play, stop, record)

### 10. Educational Features - FUTURE

**Product Requirement**: Learning tools for synthesis education

**Acceptance Criteria**:

- [ ] Interactive synthesis tutorials
- [ ] Parameter tooltips with educational content
- [ ] Synthesis theory explanations
- [ ] Guided preset creation walkthrough

**Technical Implementation**:

- Tutorial system with step-by-step guidance
- Contextual help system
- Educational content management
- Interactive learning modules

---

## Technical Debt & Improvements

### Code Quality

- [ ] Add comprehensive unit tests for all hooks
- [ ] Implement integration tests for audio functionality
- [ ] Add Storybook for component documentation
- [ ] Performance testing and benchmarking
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)

### Documentation

- [ ] API documentation for all hooks and components
- [ ] Architecture decision records (ADRs)
- [ ] Contribution guidelines
- [ ] User manual with synthesis basics

### Development Experience

- [ ] Hot reload for audio parameter changes
- [ ] Development tools for audio debugging
- [ ] Error boundary implementation
- [ ] Logging and monitoring setup
