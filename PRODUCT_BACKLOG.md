# Web Audio Minimoog Synthesizer - Product Backlog

_Last Updated: October 21, 2025 - Added MIDI Input module acceptance criteria and VCO pitch CV base frequency fix_

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
- [x] Base module factories: VCO, VCF, ADSR, SequencerTrigger, MasterOut (functional implementations)
- [x] Patch management hook (`usePatch`) supporting create / connect / disconnect / remove
- [x] 1V/Oct pitch standard with frequency conversion utilities
- [x] Updated UI instantiates modular components with drag & drop, pan/zoom workspace
- [x] Default module configuration with pre-wired connections
- [x] Backwards compatibility layer (legacy `useSynthesizer` still functional until migration complete)
- [x] Documentation updated to explain module API and CV / Gate conventions

Recent Progress (UI & Interaction):

- [x] Patch workspace with pan/zoom, grid with snap, and background panning
- [x] Precise port center alignment (runtime measurement with world-space offsets)
- [x] Click-to-click cable connection with live pending path
- [x] Port eligibility highlighting based on signal-type rules (AUDIO↔AUDIO, CV→non-AUDIO, GATE/TRIGGER interop)
- [x] Cable deletion by clicking cable or a hover "×" handle near the midpoint
- [x] Cable colors by signal type (AUDIO, CV, GATE, TRIGGER)
- [x] Restored module draggability while keeping cables clickable (pointer-events layering)
- [x] Audio graph disconnection when a cable is removed (targeted disconnect of node/param)
- [x] VCO controls (waveform, pitch, detune, gain) with sliders + validated text inputs; values apply live via module.updateParams
- [x] VCO pitch CV input control: pitch slider disabled when CV connected, manual updates blocked via isPitchCVConnected flag
- [x] VCO gate control: free-running mode (gain=1) vs gate-controlled mode (gain=0, gate signal controls amplitude)
- [x] VCO pitch CV base frequency management: set to 0 when CV connected, restored when disconnected (fixes frequency addition bug)
- [x] Interactive AHDSR envelope (Attack, Hold, Decay, Sustain, Release) with SVG editor, draggable & keyboard-accessible handles
- [x] Hold stage added + total time display + sustain % vs dB toggle
- [x] Zero-length stage support (A/H/D/R can be 0ms) & default Hold 20ms
- [x] Cursor refinements (header-only drag, handle cursors) & compact ms numeric inputs
- [x] Handle hover/focus highlight styling for clarity
- [x] Parameter smoothing helper added (linear / exp / setTarget) to de-zipper UI param changes
- [x] Sequencer module with transport controls, BPM, gate length, swing, and loop controls
- [x] Piano roll editor for step programming with note grid and octave selection
- [x] MIDI Input module with Web MIDI API integration, device/channel selection, transpose, velocity curves
- [x] MIDI In signal generation: gate output (ConstantSource→GainNode), pitch CV (frequency in Hz), velocity CV, trigger pulse
- [x] Master Out module with waveform visualizer (oscilloscope) showing real-time audio output
- [x] VCF module with filter type selection, cutoff, resonance, envelope amount, and drive controls

Stretch:

- [ ] Visual patch inspector (list of modules + connections)
- [ ] Detachable / reorderable signal chain
- [ ] Cable style UI (drag to connect)

Technical Notes:

- **Pitch CV Standard**: Changed from 1V/Oct voltage to direct frequency in Hz for simplicity. Sequencer outputs frequency via `midiNoteToFrequency(note)` using formula `440 × 2^((note - 69) / 12)`. VCO accepts frequency directly on `oscillatorNode.frequency` AudioParam.
- **No built-in attenuverters** in core modules: signal conditioning handled by a Utility CV Module (mult / attenuator / attenuverter / inverter / offset / scale).
- **Gate Signal Architecture**: ConstantSource → GainNode pattern. ConstantSource provides signal (offset=1), GainNode acts as on/off switch (gain switches 0/1). This allows gate timing via `setValueAtTime()` on the GainNode's gain parameter.
- **Gate Control in VCO**: VCO uses `vcaGainNode` for amplitude control. Free-running mode: `gain.value = 1`. Gate-controlled mode: `gain.value = 0`, external gate signal adds to this base value to control amplitude.
- **Pitch CV Control in VCO**: When pitch CV is connected, VCO sets `isPitchCVConnected = true` and blocks manual frequency updates in `updateParams()`. UI disables pitch slider when connection detected via `patch.connections` check. **CRITICAL**: VCO sets `oscillatorNode.frequency.value = 0` when pitch CV connects to prevent frequency addition (Web Audio adds connected signals to AudioParam's base value). Manual frequency restored when CV disconnected.
- **Velocity CV**: Delivered as separate CV (0..1) for amplitude & modulation scaling.
- **Envelopes**: Output CV via an AudioParam (gain) initially; may expose ConstantSourceNode in future for patch flexibility.
- **Parameter Smoothing**: Smoothing utility wraps abrupt changes to prevent zipper noise (linear / exp / setTarget modes).
- **VCO parameter ranges**: Pitch 10–20,000 Hz, Detune ±1200 cents, Gain 0–1. Waveforms limited to built-in OscillatorNode types.
- **Polyphony** (future): voice allocator manages per-voice module sets (oscillators, amp env, filter optional). Voice count configurable up to a cap.

Validated Test Cases:

1. **VCO Free-Running Audio**:
   - ✅ Add VCO → MASTER OUT, start audio → waveform visible, audio audible
   - ✅ VCO shows "Free Running" status indicator

2. **Piano Roll Octave Display**:
   - ✅ Octave selector set to 4 → Piano roll displays C4-B4 (MIDI 60-71)
   - ✅ Note calculation: `baseNote = (octave + 1) * 12` correctly maps octave selector to MIDI notes

3. **Sequencer Gate Signal Generation**:
   - ✅ Load defaults → press play → audio triggers with each step
   - ✅ Gate signal uses ConstantSource(1V) → GainNode(gain 0/1) architecture
   - ✅ VCO switches from free-running to gate-controlled when gate connected
   - ✅ MASTER OUT waveform displays animated audio visualization

4. **Sequencer Pitch CV Control**:
   - ✅ Sequencer plays C major scale (C4, D4, E4, F4, G4, A4, B4, C5) with distinct pitches
   - ✅ Each step changes frequency using `midiNoteToFrequency()` conversion
   - ✅ Pitch CV connected directly to `oscillatorNode.frequency` parameter
   - ✅ No same-note bug (each step has audibly different pitch)

5. **VCO Pitch CV Input Control**:
   - ✅ When pitch CV connected → pitch slider disabled in UI (grayed out)
   - ✅ Manual pitch slider changes blocked in VCO module (`isPitchCVConnected` flag check)
   - ✅ Only CV signal controls frequency when connected
   - ✅ When CV disconnected → pitch slider re-enabled and functional

6. **Sequencer Transport & Timing**:
   - ✅ Play button starts sequencer, changes to pause button
   - ✅ Step counter advances (1/8 → 2/8 → ... → 8/8 → 1/8)
   - ✅ Loop mode causes sequence to repeat continuously
   - ✅ BPM control changes tempo (tested 60-200 BPM range)
   - ✅ Gate length control affects note duration (10-100%)
   - ✅ Swing control creates rhythmic variation (0-100%)

7. **ADSR Envelope Modulation**:
   - ✅ Sequencer gate triggers ADSR envelope
   - ✅ ADSR Env CV modulates VCF cutoff frequency
   - ✅ Attack/Decay/Sustain/Release stages audibly affect timbre
   - ✅ Envelope amount control scales modulation depth

8. **Audio Chain Integration**:
   - ✅ Full chain: SEQUENCER → VCO → VCF → MASTER OUT produces filtered audio
   - ✅ All connections visible with correct cable colors (GATE=green, CV=orange, AUDIO=blue)
   - ✅ No audio clicks or pops during parameter changes
   - ✅ No console errors during playback
   - ✅ Clean disposal when modules removed

9. **MIDI Input Integration**:
   - ✅ MIDI In module detects connected devices (MidiKeys shown in device selector)
   - ✅ MIDI keyboard input produces audible sound: MIDI IN → VCO → MASTER OUT
   - ✅ Correct pitch frequencies: MIDI note 60 = 261.63 Hz (C4), note 69 = 440 Hz (A4)
   - ✅ MIDI Gate → VCO Gate: VCO switches to "GATE CONTROLLED" mode
   - ✅ MIDI Pitch CV → VCO Pitch CV: pitch slider disabled, frequency controlled by MIDI
   - ✅ VCO base frequency set to 0 when CV connected (no frequency addition artifacts)
   - ✅ Different MIDI notes produce correct pitch changes (verified C3-C5 range)
   - ✅ Gate timing: notes start on key press, stop on key release
   - ✅ Last-note priority: holding multiple keys switches to most recent note
   - ✅ Waveform visible on Master Out during MIDI playback
   - ✅ No stuck notes or console errors during MIDI input
   - ✅ Transpose control shifts pitches correctly (±24 semitones)
   - ✅ Velocity curves (Linear/Exponential/Logarithmic) affect velocity CV output

10. **Trigger Module Architecture Consistency**:

- ✅ Sequencer and MIDI In use identical signal generation patterns
- ✅ Both output frequency in Hz using same formula: `440 × 2^((note - 69) / 12)`
- ✅ Both use ConstantSource → GainNode for gate signals
- ✅ Both work interchangeably with VCO pitch CV and gate inputs
- ✅ VCO correctly handles pitch CV from either source (base frequency = 0 when connected)

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

### 9. Sequencer Integration - IN PROGRESS

**Product Requirement**: Built-in step sequencer for pattern creation and playback

**Acceptance Criteria**:

Core Sequencer Functionality:

- [x] Configurable step count (1-32 steps)
- [x] BPM control (60-200 BPM)
- [x] Gate length control (10-100%)
- [x] Swing control (0-100%)
- [x] Octave selection (0-7)
- [x] Loop mode toggle
- [x] Play/pause/stop transport controls
- [x] Step counter display showing current step / total steps
- [x] Visual step indicators (mini-grid showing which steps have notes programmed)

Piano Roll Editor:

- [x] Piano roll modal with grid layout (steps × notes)
- [x] Click to toggle notes on/off
- [x] Chromatic scale display with proper note names (C4, C#4, D4, etc.)
- [x] Octave selector matching sequencer's octave parameter
- [x] Clear button to remove all notes
- [x] Random button to generate random patterns
- [x] Step count displayed and synchronized with sequencer settings
- [x] Note octave calculation: correctly displays octave 4 as MIDI notes 60-71 (C4-B4)

Signal Generation & Routing:

- [x] Gate output: ConstantSource → GainNode pattern for proper CV signal generation
- [x] Pitch CV output: Direct frequency in Hz (not voltage) for VCO frequency control
- [x] Velocity CV output: Normalized velocity values (0-1)
- [x] Trigger output: Short pulse (5ms) for triggering events
- [x] MIDI note to frequency conversion: `440 × 2^((note - 69) / 12)`
- [x] Proper AudioParam scheduling with `setValueAtTime()` for sample-accurate timing

Integration with VCO:

- [x] VCO accepts pitch CV directly on `oscillatorNode.frequency` parameter
- [x] VCO pitch slider disabled when pitch CV connected (visual feedback)
- [x] VCO blocks manual frequency updates when pitch CV connected (isPitchCVConnected flag)
- [x] Gate control switches VCO from free-running to gate-controlled mode
- [x] VCO shows "GATE CONTROLLED" indicator when gate input connected

Integration with ADSR:

- [x] Sequencer gate output triggers ADSR envelope
- [x] ADSR envelope modulates filter cutoff via Env CV connection
- [x] Proper gate on/off timing with sequencer step duration

Audio Output Validation:

- [x] Sequencer plays C major scale correctly (C4, D4, E4, F4, G4, A4, B4, C5)
- [x] Each note has distinct pitch (not stuck on same frequency)
- [x] Audio waveform visible on MASTER OUT oscilloscope
- [x] No console errors during playback
- [x] Gate triggers produce audible note envelopes
- [x] Sequencer loops continuously when loop mode enabled
- [x] Clean audio with no clicks or pops from parameter changes

Default Configuration:

- [x] Default C major scale sequence programmed (8 steps)
- [x] Default modules loaded: SEQUENCER → VCO → VCF → MASTER OUT
- [x] Default connections: Gate (SEQ → VCO, SEQ → ADSR), Pitch CV (SEQ → VCO), Env CV (ADSR → VCF)
- [x] Modules positioned with smart layout avoiding overlaps
- [x] All cables visible and properly color-coded by signal type

**Technical Implementation**:

- [x] SequencerTrigger module with timing engine using AudioContext.currentTime
- [x] Step scheduling with swing and gate length calculations
- [x] ConstantSource nodes for CV generation (pitch, velocity)
- [x] GainNode pattern for gate signal (ConstantSource → GainNode → VCO gate input)
- [x] Piano roll editor component with grid-based note input
- [x] Module connection state tracking in UI (isPitchCVConnected check)
- [x] VCO connection callbacks (onIncomingConnection/onIncomingDisconnection)
- [x] Parameter smoothing to prevent zipper noise
- [x] Proper audio node cleanup in dispose methods

Known Limitations & Future Enhancements:

- [ ] Multiple pattern slots
- [ ] Pattern chaining
- [ ] Real-time recording mode
- [ ] Note length per step (currently tied to gate length parameter)
- [ ] Pattern save/load functionality
- [ ] MIDI export

**Piano Roll UI Improvements - COMPLETED**:

Issue: Piano roll editor had several usability and layout problems including misaligned columns, hidden velocity controls, octave-limited note range, and unstable modal width.

Acceptance Criteria:

- [x] **Column Width Alignment**: Step number headers have identical width to grid cell columns
  - Implementation: Step numbers use 30px width + 1px border-right; grid cells use 30px width + 1px gap
  - Velocity sliders use 30px width + 1px gap to match column spacing exactly
  - Headers and columns align within 1px tolerance
  - Visual validation: Vertical lines from step numbers align perfectly with column boundaries

- [x] **Per-Step Velocity Controls**: Velocity controls positioned below each step column
  - Each step column has its own velocity slider directly below it
  - Velocity controls always visible (not conditional on step selection)
  - Velocity defaults to 100 for new notes
  - Editable numeric input field above each slider (1-127, integers only)
  - Input validation: values clamped to 1-127 range
  - Slider disabled when no note present in step
  - Sliders properly aligned and not cut off at bottom
  - 40px spacer added to align with note labels column

- [x] **Vertical Note Scrolling**: Full chromatic range (128 MIDI notes) with vertical scrolling
  - Displays all MIDI notes (0-127, C-1 to G9) in scrollable container
  - Octave selector dropdown removed from controls
  - Note labels scroll with grid rows (no longer fixed on side)
  - Step numbers remain sticky at top during vertical scroll
  - Auto-scrolls to center on C4 (MIDI note 60) on modal open
  - White/black key visual styling preserved throughout range
  - Smooth scrolling with custom scrollbar styling

- [x] **Transpose Control**: Real-time sequence transposition
  - Transpose slider in modal header (±24 semitones, default 0)
  - Transpose shifts all programmed notes up/down by semitone increments
  - Visual update: Notes move to new positions in grid in real-time as transpose changes
  - Transposition applies to playback immediately via SequencerTrigger module
  - Transposed notes clamped to valid MIDI range (0-127)
  - Display shows "+/-" prefix for clarity
  - Stored in module state and persisted across sessions

- [x] **Fixed Modal Layout**: Modal width and controls remain stable during manipulation
  - Modal has fixed width (90vw, max 1200px) and height (85vh)
  - Steps slider positioned in header with fixed layout
  - Modal width remains constant when steps value changes from 1 to 32
  - Slider thumb moves smoothly without control jumping
  - All controls remain stable during slider manipulation

**Test Plan (All Tests Passing)**:

1. **Column Alignment Test**:
   - ✅ Load piano roll editor
   - ✅ Set steps to various values (4, 8, 16, 32)
   - ✅ Step number headers align perfectly with grid columns
   - ✅ Velocity sliders align perfectly with their columns (30px + 1px gap)
   - ✅ Measurement: Step numbers (30px + 1px border), cells (30px + 1px gap), velocity sliders (30px + 1px gap) all match

2. **Velocity Controls Test**:
   - ✅ Add notes to multiple steps
   - ✅ Velocity slider appears below each step column
   - ✅ Editable numeric input appears above each slider
   - ✅ Input validation: only integers 1-127 accepted
   - ✅ Change velocity for each step independently via slider or input
   - ✅ Velocity changes reflected in note opacity (velocity / 127)
   - ✅ Velocity values saved and restored correctly
   - ✅ Sliders not cut off at bottom (40px bottom margin added)
   - ✅ Disabled state shows placeholder "-" when no note present

3. **Vertical Scrolling Test**:
   - ✅ Open piano roll editor
   - ✅ No octave dropdown present (removed from UI)
   - ✅ Scroll vertically to see all MIDI notes from C-1 to G9 (128 notes)
   - ✅ Initial view centered on C4 (MIDI 60)
   - ✅ Note labels scroll with grid rows
   - ✅ Step numbers remain sticky at top
   - ✅ Add notes across different octaves by scrolling
   - ✅ White/black key styling correct throughout range
   - ✅ Custom scrollbar styling applied

4. **Transpose Test**:
   - ✅ Program a sequence (e.g., C major scale: C4, D4, E4, F4, G4, A4, B4, C5)
   - ✅ Adjust transpose slider to +2 semitones
   - ✅ Notes visually shift up 2 positions in grid (C→D, D→E, etc.)
   - ✅ Play sequence and verify audio is transposed correctly
   - ✅ Transpose range limits work (±24 semitones)
   - ✅ Note clamping at MIDI boundaries (0 and 127)
   - ✅ Display shows "+/-" prefix (e.g., "+2", "-5")
   - ✅ Transpose persisted in module state

5. **Fixed Layout Test**:
   - ✅ Open piano roll editor with steps = 8
   - ✅ Modal has fixed width (90vw, max 1200px) and height (85vh)
   - ✅ Drag steps slider from 8 to 32
   - ✅ Modal width does not change
   - ✅ Steps slider position does not change
   - ✅ Slider thumb moves smoothly without control jumping
   - ✅ Repeat test from 32 to 1 - bidirectional stability confirmed

**Implementation Summary**:

- **Architecture Changes**:
  - Added `transpose` parameter to `SequencerTriggerParams` interface
  - Removed `octave` parameter (replaced by transpose)
  - Updated `SequencerTrigger.ts` to apply transpose during step scheduling
  - Modified `SequencerControls.tsx` to manage transpose state

- **UI Structure**:
  - Grid container now scrollable with all 128 MIDI notes
  - Note labels moved inside scroll container to scroll with rows
  - Step numbers made sticky at top of scroll container
  - Velocity controls restructured with 40px spacer to align with note labels
  - Each velocity slider container is 30px wide + 1px gap to match grid cells

- **Velocity Controls**:
  - Numeric input field (type="number") with validation
  - Range slider below input for fine control
  - Both controls sync bidirectionally
  - Input validation clamps values to 1-127
  - Spinner arrows removed via CSS for cleaner appearance
  - 40px bottom margin on slider prevents cutoff

- **Files Modified**:
  - `src/modular/modules/triggers.ts` - Updated interface
  - `src/modular/modules/SequencerTrigger.ts` - Transpose logic
  - `src/components/patch/controls/SequencerControls.tsx` - State management
  - `src/components/modals/PianoRollModal.tsx` - Complete UI rewrite
  - `src/components/modals/PianoRollModal.css` - Updated layout and styling

### 10. MIDI Input Module - COMPLETED

**Product Requirement**: External MIDI keyboard/controller interface for live performance and note input

**Acceptance Criteria**:

Core MIDI Functionality:

- [x] Web MIDI API integration with device selection
- [x] MIDI device dropdown showing available inputs
- [x] "Any Device" option to accept input from all connected MIDI devices
- [x] MIDI channel filtering (Omni mode + channels 1-16)
- [x] Real-time MIDI message processing (note on/off, velocity)
- [x] Visual status indicator showing "MIDI Available" or "No MIDI Devices"
- [x] Console logging of MIDI device connections for debugging

Signal Generation:

- [x] Gate output port generates gate signal when MIDI note is held
- [x] Gate signal uses ConstantSource → GainNode architecture (matching sequencer pattern)
- [x] Gate on: `gateGainNode.gain.value = 1` when note pressed
- [x] Gate off: `gateGainNode.gain.value = 0` when note released
- [x] Pitch CV output port sends frequency in Hz (not voltage)
- [x] MIDI note to frequency conversion: `440 × 2^((note - 69) / 12)`
- [x] Velocity CV output port sends normalized velocity (0-1)
- [x] Trigger output port sends 10ms pulse on note on
- [x] All CV outputs use ConstantSource for clean signal generation

VCO Integration:

- [x] MIDI Pitch CV → VCO Pitch CV connection works correctly
- [x] VCO receives frequency in Hz and plays correct pitches
- [x] VCO sets base frequency to 0 when pitch CV connected (prevents frequency addition)
- [x] VCO restores manual frequency when pitch CV disconnected
- [x] VCO pitch slider disabled when MIDI pitch CV connected
- [x] MIDI Gate → VCO Gate connection triggers proper gate-controlled mode
- [x] VCO shows "GATE CONTROLLED" status when MIDI gate connected
- [x] Different MIDI notes produce correct pitch changes (verified with console logging)
- [x] No frequency offset or pitch shifting artifacts

Parameter Controls:

- [x] Transpose control (±24 semitones) shifts all incoming notes
- [x] Transpose applied before frequency conversion
- [x] Transposed notes clamped to valid MIDI range (0-127)
- [x] Velocity curve selector (Linear, Exponential, Logarithmic)
- [x] Linear curve: direct mapping (velocity / 127)
- [x] Exponential curve: (velocity / 127)²
- [x] Logarithmic curve: √(velocity / 127)
- [x] Velocity curve affects velocity CV output only

Note Priority & Polyphony:

- [x] Monophonic operation with last-note priority
- [x] When multiple keys pressed, most recent note plays
- [x] When key released while others held, switches to most recent remaining note
- [x] Active notes tracked in Map for proper note-off handling
- [x] Gate remains on when switching between held notes
- [x] Gate only turns off when all notes released

Audio Validation:

- [x] MIDI keyboard input produces audible sound when connected to VCO → Master Out
- [x] Pitch corresponds to actual MIDI note played (verified correct frequencies)
- [x] Gate timing matches note on/off events (no stuck notes)
- [x] Audio stops when MIDI note released
- [x] Waveform visible on Master Out oscilloscope during playback
- [x] No console errors during MIDI playback
- [x] Clean note transitions without clicks or pops

Default Configuration:

- [x] Default MIDI device: "Any Device"
- [x] Default channel: Omni (accepts all channels)
- [x] Default velocity curve: Linear
- [x] Default transpose: 0 semitones
- [x] Module outputs: Gate, Pitch CV, Velocity CV, Trigger ports
- [x] Port colors match signal types (Gate=green, CV=yellow, Trigger=magenta)

Architecture Consistency:

- [x] MIDI In uses identical signal architecture as Sequencer module
- [x] Both modules output frequency in Hz (not voltage)
- [x] Both modules use ConstantSource → GainNode for gate signals
- [x] Gate signal generation pattern consistent across trigger modules
- [x] Pitch CV conversion formula identical: `midiNoteToFrequency(note)`
- [x] Both modules work interchangeably with VCO inputs

Future Enhancements:

- [ ] Polyphonic mode with configurable voice count
- [ ] MIDI CC (Continuous Controller) mapping to module parameters
- [ ] Pitch bend support
- [ ] Aftertouch/channel pressure support
- [ ] MIDI clock sync for tempo synchronization
- [ ] MIDI learn for parameter mapping
- [ ] Per-channel voice allocation for multi-timbral operation
- [ ] MIDI activity indicator (visual feedback for incoming messages)

### 11. Educational Features - FUTURE

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

- [x] `smoothParam(param, targetValue, { mode: 'linear'|'exp'|'setTarget', time })` helper
- [x] Cancellation safety: cancels prior ramps cleanly
- [x] Minimum delta threshold to skip smoothing on trivial changes
- [x] Works with AudioParam & wrapper for multiple params
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
