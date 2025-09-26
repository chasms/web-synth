import type { CreateModuleFn, ModuleInstance, PortDefinition } from "../types";

export interface ADSRParams {
  attack: number; // seconds
  hold?: number; // seconds (peak hold before decay)
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
  // Envelope constructed as ConstantSource (value=1) feeding a Gain whose gain is automated.
  // This allows the envelope to be treated as an AUDIO / CV signal node for downstream connections.
  const constantSourceNode = audioContext.createConstantSource();
  constantSourceNode.offset.value = 1;
  constantSourceNode.start();
  const envelopeGainNode = audioContext.createGain();
  envelopeGainNode.gain.value = 0; // start at 0 (silent)
  constantSourceNode.connect(envelopeGainNode);
  let attackTime = parameters?.attack ?? 0.01;
  let holdTime = parameters?.hold ?? 0.02; // default 20ms hold
  let decayTime = parameters?.decay ?? 0.2;
  let sustainLevel = parameters?.sustain ?? 0.7;
  let releaseTime = parameters?.release ?? 0.4;
  let peakScale = parameters?.gain ?? 1;

  const portNodes: ModuleInstance["portNodes"] = {
    gate_in: undefined,
    cv_out: envelopeGainNode, // AudioNode output representing envelope CV (0..1)
  };

  const instance: ModuleInstance = {
    id: moduleId,
    type: "ADSR",
    label: `AHDSR ${moduleId}`,
    ports,
    portNodes,
    connect() {
      /* Envelope outputs are AudioParam only in v1 */
    },
    gateOn() {
      const currentTime = audioContext.currentTime;
      const gainParam = envelopeGainNode.gain;
      gainParam.cancelScheduledValues(currentTime);
      gainParam.setValueAtTime(gainParam.value, currentTime);
      // Attack to peak
      gainParam.linearRampToValueAtTime(peakScale, currentTime + attackTime);
      const decayStart = currentTime + attackTime + holdTime;
      // Hold stage: keep peak value flat during hold time (if > 0)
      if (holdTime > 0) {
        gainParam.setValueAtTime(
          peakScale,
          currentTime + attackTime + holdTime,
        );
      }
      // Decay down to sustain level
      gainParam.linearRampToValueAtTime(
        sustainLevel * peakScale,
        decayStart + decayTime,
      );
    },
    gateOff() {
      const currentTime = audioContext.currentTime;
      const gainParam = envelopeGainNode.gain;
      gainParam.cancelScheduledValues(currentTime);
      gainParam.setValueAtTime(gainParam.value, currentTime);
      gainParam.linearRampToValueAtTime(0, currentTime + releaseTime);
    },
    updateParams(partial) {
      if (
        partial["attack"] !== undefined &&
        typeof partial["attack"] === "number"
      ) {
        attackTime = Math.max(0, partial["attack"]);
      }
      if (
        partial["hold"] !== undefined &&
        typeof partial["hold"] === "number"
      ) {
        holdTime = Math.max(0, partial["hold"]);
      }
      if (
        partial["decay"] !== undefined &&
        typeof partial["decay"] === "number"
      ) {
        decayTime = Math.max(0, partial["decay"]);
      }
      if (
        partial["sustain"] !== undefined &&
        typeof partial["sustain"] === "number"
      ) {
        sustainLevel = Math.min(1, Math.max(0, partial["sustain"]));
      }
      if (
        partial["release"] !== undefined &&
        typeof partial["release"] === "number"
      ) {
        releaseTime = Math.max(0, partial["release"]);
      }
      if (
        partial["gain"] !== undefined &&
        typeof partial["gain"] === "number"
      ) {
        peakScale = Math.max(0, partial["gain"]);
      }
    },
    getParams() {
      return {
        attack: attackTime,
        hold: holdTime,
        decay: decayTime,
        sustain: sustainLevel,
        release: releaseTime,
        gain: peakScale,
      };
    },
    dispose() {
      constantSourceNode.disconnect();
      envelopeGainNode.disconnect();
    },
  };
  return instance;
};
