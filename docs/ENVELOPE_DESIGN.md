# Envelope (ADSR) Design Rationale

This document focuses on the reasoning behind the ADSR implementation strategy used in the modular architecture.

## Goals

1. Provide a patchable envelope output (not just internal amplitude control)
2. Maintain audio‑rate (sample accurate) modulation capabilities
3. Keep the implementation lightweight and easily extensible
4. Avoid bespoke connection logic for envelope vs other modulation sources

## Chosen Pattern: ConstantSourceNode + GainNode Automation

The ADSR module creates:

- `ConstantSourceNode` (offset = 1) → drives a
- `GainNode` whose `gain` parameter is automated with the ADSR stages

The output of the GainNode becomes the **envelope CV signal** (0..1), exposed through the module's `cv_out` port as an AudioNode.

### Why Not Only Automate an AudioParam?

Automating just an AudioParam (e.g., `someGainNode.gain`) produces no routable signal—an AudioParam cannot be cabled to another module as a source. The modular system would need a special case for envelopes, breaking uniformity and limiting downstream processing.

### Advantages of the Chosen Approach

| Advantage                | Description                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| Patchability             | The envelope can be routed like any oscillator or LFO output (e.g., to filter cutoff, wave morph CV). |
| Uniform Connection Model | The same node→node / node→param logic applies; no special code for ADSR.                              |
| Post‑Processing          | Envelopes can be attenuated, inverted, waveshaped, or lag‑processed before reaching a destination.    |
| Audio‑Rate Fidelity      | Keeps modulation continuous and sample accurate.                                                      |
| Extensibility            | Future features (velocity scaling, curve morphs) are added around the same node chain.                |

### Trade‑offs Considered

| Alternative                    | Pros                            | Cons                                                     |
| ------------------------------ | ------------------------------- | -------------------------------------------------------- |
| Direct AudioParam automation   | Minimal nodes                   | Not patchable; no post‑processing                        |
| ScriptProcessor/AudioWorklet   | Arbitrary shapes, custom curves | Higher complexity, overhead for simple ADSR, extra files |
| ConstantSource + Gain (chosen) | Simple, flexible, patchable     | Adds a tiny node pair per envelope                       |

## Gate Handling

`gateOn()` schedules attack and decay toward sustain; `gateOff()` schedules release. Retriggering cancels prior automation before applying new ramps, preventing discontinuities.

Future enhancements:

- Velocity scaling (peak amplitude multiplier)
- Exponential segment curves (using setTargetAtTime or multi‑point ramps)
- Looping / multi-stage envelopes
- Sustain pedal latch integration

## Output Semantics

- Range: 0..1 (scaled by optional gain factor if introduced later)
- Domain: CV (but implemented as an audio stream for routing parity)
- Multiple Destinations: Web Audio allows one AudioNode output to connect to many AudioParams / AudioNodes; users can mult via utility modules once they exist.

## Key Invariants

- Envelope output never produces negative values (unipolar)
- Canceling ramps on retrigger preserves current instantaneous level to avoid clicks
- Disposal stops source and disconnects nodes to prevent leaks

## Example Usage (Conceptual)

```ts
const adsr = createADSR({ audioContext, moduleId: "env1" }, { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.4 });
const vcf = createVCF({ audioContext, moduleId: "filter1" }, { cutoff: 1000, resonance: 0.7 });
// Patch envelope to filter cutoff CV
adsr.connect("cv_out", { module: vcf, portId: "cutoff_cv" });
adsr.gateOn();
// later
adsr.gateOff();
```

## Summary

The ConstantSource + Gain approach turns an otherwise internal timing construct into a universally routable, composable modulation signal, reinforcing the project's modular synthesis philosophy with minimal added complexity.
