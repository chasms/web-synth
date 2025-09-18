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

### 0. Modular Architecture Refactor (Current Iteration) - IN PROGRESS

Goal: Transition from monolithic synthesizer hook to a modular, patchable architecture modeling real-world subtractive synthesis components with CV / Gate semantics.

Deliverables / Acceptance Criteria:

- [x] Core type system for Modules, Ports, Connections (AUDIO / CV / GATE / TRIGGER)
- [x] Base module factories: VCO, VCF, ADSR (initial functional implementations)
- [x] Patch management hook (`usePatch`) supporting create / connect / remove
- [x] 1V/Oct helper utilities (volts ↔ frequency)
- [x] Updated UI (experimental) instantiates 3 VCOs, 1 VCF, 1 ADSR and routes: VCO mix -> VCF -> destination; ADSR -> VCF cutoff (envelope as CV AudioNode); auto gateOn demo
- [x] Backwards compatibility layer (legacy `useSynthesizer` still functional until migration complete)
- [ ] Documentation updated to explain module API and CV / Gate conventions (IN PROGRESS)

Recent Progress (UI & Interaction):

- [x] Patch workspace with pan/zoom, grid with snap, and background panning
- [x] Precise port center alignment (runtime measurement with world-space offsets)
- [x] Click-to-click cable connection with live pending path
- [x] Port eligibility highlighting based on signal-type rules (AUDIO↔AUDIO, CV→non-AUDIO, GATE/TRIGGER interop)
- [x] Cable deletion by clicking cable or a hover “×” handle near the midpoint
- [x] Cable colors by signal type (AUDIO, CV, GATE, TRIGGER)
- [x] Restored module draggability while keeping cables clickable (pointer-events layering)
- [x] Audio graph disconnection when a cable is removed (targeted disconnect of node/param)

Stretch:

- [ ] Visual patch inspector (list of modules + connections)
- [ ] Detachable / reorderable signal chain
- [ ] Cable style UI (drag to connect)

Technical Notes:

- Pitch CV Standard: 1V/Oct (A4 = 440Hz @ 4.75V reference). Centralized constants mean a future change affects only conversion helpers + stored patch interpretation.
- No built-in attenuverters in core modules: signal conditioning handled by a Utility CV Module (mult / attenuator / attenuverter / inverter / offset / scale).
- Gate events call `gateOn` / `gateOff`; Velocity delivered as separate CV (0..1) for amplitude & modulation scaling.
- Envelopes output CV via an AudioParam (gain) initially; may expose ConstantSourceNode in future for patch flexibility.
- Performance: begin with straightforward automation ramps (control-rate); smoothing utility will wrap abrupt changes to prevent zipper noise.
- Polyphony: voice allocator manages per-voice module sets (oscillators, amp env, filter optional). Voice count configurable up to a cap.
- ADR-001 (Pitch CV Standard) DRAFT recorded; low migration risk.

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

**Acceptance Criteria (Updated for Polyphony & Velocity)**:

- [ ] Virtual piano keyboard (2–3 octaves)
- [ ] Computer keyboard mapping (QWERTY to chromatic notes)
- [ ] Octave up/down controls
- [ ] Sustain pedal simulation (spacebar) holding gate
- [ ] Polyphonic voice allocator (configurable voice count, default 8, cap configurable)
- [ ] Velocity generation (0–1) routed to amplitude & optional filter/env depth
- [ ] Visual feedback: pressed keys + active voices
- [ ] Voice stealing (oldest / release-phase preference)
- [ ] Emits Pitch CV + Gate + Velocity CV per note

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
- [ ] Document 1V/Oct standard & constants
- [ ] Document polyphony / voice allocation design
- [ ] Document utility CV module usage
- [ ] Document smoothing utility API & rationale

---

## New Modules & Features

### Utility CV Module (Mult / Attenuator / Attenuverter / Inverter)

Purpose: User-inserted signal conditioning (no hidden scaling inside target modules).

Acceptance Criteria:

- [ ] Mode: pass-through, attenuate (0..1), attenuvert (-1..1), invert, offset, scale+offset
- [ ] Multiple outputs (acts as mult) with identical conditioned signal
- [ ] Supports AUDIO and CV inputs (signal type metadata enforced)
- [ ] Bypass toggle
- [ ] Optional modulation CV input controlling amount
- [ ] Zero-added latency

Stretch:

- [ ] Waveshaping (soft clip) option
- [ ] DC offset generation when no input connected

### Polyphony & Voice Management

Acceptance Criteria:

- [ ] Voice allocator with configurable voice count (default 8, cap 16)
- [ ] Per voice: user-configurable oscillator count (1–3 initially)
- [ ] Per voice amp envelope; optional per-voice filter (shared vs per-voice configurable)
- [ ] Velocity scales amp envelope peak and optional filter env depth
- [ ] Voice stealing strategies selectable
- [ ] Safe downscale (dispose extra voices gracefully)
- [ ] Patch serialization includes voice config & oscillator count

### Draggable Cable Patch UI (Skeuomorphic)

Acceptance Criteria:

- [x] Module panels with jacks (input/output visual distinction)
- [x] Drag-out cables (SVG/Canvas) with bezier paths and click-to-click flow
- [x] Cable colors by signal type (AUDIO, CV, GATE, TRIGGER)
- [x] Hover highlight & invalid connection rejection
- [x] Pannable/scrollable workspace (pan/zoom implemented)
- [ ] Basic skeuomorphic styling (panel depth, knob highlights)
- [x] Cable removal UX: hover delete “×” affordance and direct cable click-to-remove

Stretch:

- [ ] Animated signal flow pulses
- [ ] Cable bundling / grouping
- [ ] Drag to background to disconnect

### Velocity & Expression Inputs

Acceptance Criteria:

- [ ] Velocity CV per note (0..1)
- [ ] Aftertouch placeholder API for future MIDI integration
- [ ] Mod wheel CV infrastructure (assignable destinations)

### Parameter Smoothing Utility

Purpose: Prevent audible zipper noise and clicks when parameters jump (mouse drags, modulation reroutes).

Acceptance Criteria:

- [ ] `smoothParam(param, targetValue, { mode: 'linear'|'exp'|'setTarget', time })` helper
- [ ] Cancellation safety: cancels prior ramps cleanly
- [ ] Minimum delta threshold to skip smoothing on trivial changes
- [ ] Works with AudioParam & wrapper for multiple params
- [ ] Tests measure step discontinuities below tolerance

Stretch:

- [ ] Adaptive time scaling based on delta size
- [ ] Worklet-based ultra-low-latency smoothing path

Implementation Notes:

- Linear: `linearRampToValueAtTime`
- Exp: chain of short exponential ramps (avoid hitting zero)
- SetTarget: `setTargetAtTime` with configurable timeConstant
- Global defaults via context; modules may override

---

## Pending ADRs

- ADR-001 Pitch CV Standard (1V/Oct) [DRAFT]
- ADR-002 Polyphony Strategy & Resource Limits [PLANNED]
- ADR-003 Cable UI Rendering (SVG vs Canvas) [PLANNED]

### Development Experience

- [ ] Hot reload for audio parameter changes
- [ ] Development tools for audio debugging
- [ ] Error boundary implementation
- [ ] Logging and monitoring setup
