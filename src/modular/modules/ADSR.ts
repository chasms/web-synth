import type { CreateModuleFn, ModuleInstance, PortDefinition } from "../types";

export interface ADSRParams {
  attack: number; // seconds
  decay: number; // seconds
  sustain: number; // 0..1
  release: number; // seconds
  gain?: number; // Output gain scaling
}

const ports: PortDefinition[] = [
  { id: "gate_in", label: "Gate", direction: "in", signal: "GATE" },
  {
    id: "cv_out",
    label: "Envelope CV",
    direction: "out",
    signal: "CV",
    metadata: { bipolar: false, min: 0, max: 1 },
  },
];

export const createADSR: CreateModuleFn<ADSRParams> = (ctx, params) => {
  const { audioContext, moduleId } = ctx;
  const out = audioContext.createGain();
  out.gain.value = 0;
  const a = params?.attack ?? 0.01;
  const d = params?.decay ?? 0.2;
  const s = params?.sustain ?? 0.7;
  const r = params?.release ?? 0.4;
  const scale = params?.gain ?? 1;

  const portNodes: ModuleInstance["portNodes"] = {
    gate_in: undefined,
    cv_out: out.gain,
  };

  const instance: ModuleInstance = {
    id: moduleId,
    type: "ADSR",
    label: `ADSR ${moduleId}`,
    ports,
    portNodes,
    connect() {
      /* Envelope outputs are AudioParam only in v1 */
    },
    gateOn() {
      const now = audioContext.currentTime;
      const g = out.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(scale, now + a);
      g.linearRampToValueAtTime(s * scale, now + a + d);
    },
    gateOff() {
      const now = audioContext.currentTime;
      const g = out.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(0, now + r);
    },
    updateParams() {
      /* TODO: dynamic param changes */
    },
    dispose() {
      out.disconnect();
    },
  };
  return instance;
};
