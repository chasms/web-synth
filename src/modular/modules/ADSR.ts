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

export const createADSR: CreateModuleFn<ADSRParams> = (context, parameters) => {
  const { audioContext, moduleId } = context;
  const outputGainNode = audioContext.createGain();
  outputGainNode.gain.value = 0;
  const attackTime = parameters?.attack ?? 0.01;
  const decayTime = parameters?.decay ?? 0.2;
  const sustainLevel = parameters?.sustain ?? 0.7;
  const releaseTime = parameters?.release ?? 0.4;
  const peakScale = parameters?.gain ?? 1;

  const portNodes: ModuleInstance["portNodes"] = {
    gate_in: undefined,
    cv_out: outputGainNode.gain,
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
      const currentTime = audioContext.currentTime;
      const gainParam = outputGainNode.gain;
      gainParam.cancelScheduledValues(currentTime);
      gainParam.setValueAtTime(gainParam.value, currentTime);
      gainParam.linearRampToValueAtTime(peakScale, currentTime + attackTime);
      gainParam.linearRampToValueAtTime(
        sustainLevel * peakScale,
        currentTime + attackTime + decayTime,
      );
    },
    gateOff() {
      const currentTime = audioContext.currentTime;
      const gainParam = outputGainNode.gain;
      gainParam.cancelScheduledValues(currentTime);
      gainParam.setValueAtTime(gainParam.value, currentTime);
      gainParam.linearRampToValueAtTime(0, currentTime + releaseTime);
    },
    updateParams() {
      /* TODO: dynamic param changes */
    },
    dispose() {
      outputGainNode.disconnect();
    },
  };
  return instance;
};
