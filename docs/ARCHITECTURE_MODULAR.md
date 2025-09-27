# Modular Synthesis Architecture

This document describes the conceptual and implementation model used to realize a modular, patchable subtractive synthesizer in this project.

## Guiding Principles

1. Patchability First: Every modulation source that should be user-routable is exposed as an AudioNode output (never only an internal AudioParam) so it can be cabled to multiple destinations.
2. Explicit Signal Types: Ports declare one of four signal domains (AUDIO, CV, GATE, TRIGGER) to express intent and enable future validation / visualization (color coding, connection constraints).
3. No Hidden Attenuverters: Core modules do not silently scale or invert external control signals. Conditioning (attenuate, attenuvert, offset, invert) belongs in dedicated utility modules to keep module contracts simple and predictable.
4. Voltage & Pitch Standardization: Pitch control adopts a 1V/Oct model (A4=440Hz at 4.75V reference) allowing external CV math and patch serialization stability.
5. Composable Voice Abstraction: Polyphony (future) will instantiate per‑voice module chains managed by a voice allocator, keeping individual module contracts single‑voice and stateless across voices.
6. Audio-Rate Modulation Where Feasible: Modulation flows as continuous audio‑rate control signals for accuracy and to allow downstream processing (slew limiting, waveshaping) without special cases.

## Core Data Model

| Concept     | Implementation                                                                                               | Rationale                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Module      | `ModuleInstance` (id, type, label, ports, portNodes, connect, dispose, optional gateOn/gateOff/updateParams) | Single source of truth for runtime graph units               |
| Port        | `PortDefinition` (id, label, direction: in/out, signal: AUDIO/CV/GATE/TRIGGER, metadata)                     | Declarative patch surface; simplifies rendering & validation |
| Connection  | Plain object (fromModuleId, fromPortId, toModuleId, toPortId)                                                | Immutable record; enables persistence & visualization        |
| Patch Graph | `usePatch` hook (modules map + connections array + creation / connection helpers)                            | React state driving UI and audio lifecycles                  |

## Signal Domains

- AUDIO: Time‑varying sample streams (oscillators, filters, envelope audio carriers) routed through Web Audio nodes.
- CV: Control voltage abstractions (continuous scalar signals). In implementation these are also AudioNodes (usually DC‑offset carriers shaped by automation) enabling unified routing.
- GATE: Binary (0/1) state transitions representing key on/off (often not continuous cables; instead methods gateOn/gateOff for envelope triggering). May later expose as TRIGGER pulses + latched state.
- TRIGGER: Momentary pulses (e.g., sync, reset). Generally very short signals used for edge detection.

## 1V/Oct Pitch Standard

Helpers: `voltsToFrequency(volts, referencePitch=440, referenceVoltage=4.75)` and `frequencyToVolts(...)` centralize mapping logic. Modules consuming pitch CV do not re‑implement conversion; upstream modules or utility CV processors perform translation, promoting uniform scaling and easier global retuning.

## Why Control Signals Are AudioNodes

Using AudioNodes (usually a ConstantSourceNode feeding a Gain or custom node) for CV allows:

- Unified connection logic (AudioNode→AudioNode / AudioNode→AudioParam) without bespoke CV patch code.
- Audio‑rate resolution for modulation (avoiding control‑rate stair‑stepping and enabling post‑processing).
- Reusability: The same CV output can be multed, attenuated, inverted, waveshaped.
- Introspection: Future analyzers (scopes, meters) can attach without adapters.

## Envelope Generation Design (ADSR)

### Problem

A naive ADSR implemented only via scheduling on an AudioParam (e.g., directly automating `GainNode.gain`) yields a parameter change but **not** a routable signal. Downstream modules cannot cable an AudioParam as a source, and the envelope cannot be processed (e.g., scaled or mixed) uniformly with other signals.

### Solution: ConstantSource + Gain

We generate a continuous DC stream (value = 1) using a `ConstantSourceNode` and pass it through a `GainNode` whose gain is automated with the ADSR timeline. The output of that GainNode _is_ the envelope curve as a 0..1 audio signal.

Benefits:

1. Patchable Output: The envelope becomes a first‑class source (`cv_out`) that can connect to any AUDIO or CV input (e.g., filter cutoff CV) with existing connection rules.
2. Uniform Abstraction: Envelopes align with oscillators and LFOs—everything outputs an AudioNode for modulation.
3. Audio‑Rate Modulation: Parameter transitions render at sample accuracy; downstream smoothing or shaping is possible.
4. Extensibility: Adding scaling, bias, inversion, or worklet‑based shaping requires only inserting utility nodes, not redesigning the envelope API.
5. Reduced Special Cases: The patch graph never needs to detect “envelope param vs node;” it treats all modulation sources equivalently.

### Alternative Approaches & Trade‑offs

| Approach                                     | Pros                               | Cons                                                          |
| -------------------------------------------- | ---------------------------------- | ------------------------------------------------------------- |
| Direct AudioParam automation only            | Simple, minimal nodes              | Not patchable; cannot post‑process; special handling required |
| ScriptProcessor/AudioWorklet custom envelope | Arbitrary shapes, advanced timing  | More boilerplate, threading overhead, premature complexity    |
| ConstantSource + Gain (chosen)               | Lightweight, patchable, extensible | Extra node (tiny overhead)                                    |

### Gate Handling

Currently `gateOn()` / `gateOff()` schedule ramps on the envelope Gain’s `AudioParam`. Future enhancements may:

- Accept velocity scaling (multiply peak amplitude)
- Provide retrigger modes (hard vs soft)
- Offer curve shaping (exponential stages) via parameterized automation or a custom shaping node.

## Connection Semantics

When `connect(fromModule, fromPort, toModule, toPort)` is invoked:

1. Retrieve source and destination entities from `portNodes`.
2. If both are `AudioNode`, call `connect`.
3. If source is `AudioNode` and destination an `AudioParam`, connect directly (Web Audio supports node→param connections).
4. AudioParam→AudioParam is deliberately disallowed (introduce a ConstantSource + Gain adapter instead) to preserve explicit modulation flow.

## Future Polyphony Strategy (Preview)

- Voice Allocator: Maintains pool of voice objects (each a small patch: VCO(s) → VCF → VCA / Envelope chain).
- Note On: Allocator selects a free or steals a voice; sets pitch CV (via ConstantSource based CV node or param automation), triggers gates.
- Note Off: Triggers release; voice returns to idle after envelope completes.
- Shared vs Per‑Voice Filter: Configurable; shared filter reduces CPU at cost of inter‑voice interaction.

## Utility CV Modules (Planned)

A single module type providing: attenuate, attenuvert, invert, offset, scale, mult outputs. These operate on AUDIO or CV signals (metadata ensures correctness) and remain linear / low‑latency.

## Parameter Smoothing (Planned)

A `smoothParam` helper will wrap abrupt value changes with selectable strategies: linear, exponential, setTarget. This will be applied both in UI interactions (knob drags) and programmatic modulation depth changes to avoid zipper noise.

## Visual Patch Workspace

- Module Containers: Render port topology from `ports` definitions.
- Cable Rendering: SVG cubic Beziers with signal type color coding (future enhancement).
- Pending Connection: Temporary path follows pointer until dropped on a compatible input.
- Planned Improvements: Connection validation, workspace panning/zoom, selection + multi‑drag, module palette for insertion.

## Rationale Summary

Representing envelopes and other CV sources as AudioNodes via a lightweight ConstantSource carrier standardizes modulation, enabling a true modular UX with minimal complexity overhead and clear extensibility paths.

---

_This document will evolve as polyphony, utility modules, and smoothing ship._
