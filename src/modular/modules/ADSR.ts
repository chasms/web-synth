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

  // Create gate detector to monitor incoming gate signals
  // Uses an AnalyserNode to sample the gate signal and detect transitions
  const gateDetectorNode = audioContext.createGain();
  gateDetectorNode.gain.value = 1;
  
  const analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 32; // Minimal FFT size for fast analysis
  analyserNode.smoothingTimeConstant = 0;
  gateDetectorNode.connect(analyserNode);
  
  const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
  let isGateHigh = false;
  const GATE_THRESHOLD = 128; // Mid-point threshold for 0-255 range
  
  // Poll gate state at regular intervals
  let checkCount = 0;
  const checkGateState = () => {
    analyserNode.getByteTimeDomainData(dataArray);
    const gateValue = dataArray[0]; // Sample first value
    
    // Debug: log every 100 checks (every 500ms)
    if (checkCount++ % 100 === 0) {
      console.log(`[ADSR ${moduleId}] Gate check: value=${gateValue}, isHigh=${isGateHigh}`);
    }
    
    if (!isGateHigh && gateValue > GATE_THRESHOLD) {
      // Gate went high
      isGateHigh = true;
      instance.gateOn?.();
    } else if (isGateHigh && gateValue <= GATE_THRESHOLD) {
      // Gate went low
      isGateHigh = false;
      instance.gateOff?.();
    }
  };
  
  // Check gate state every 5ms (200Hz polling rate)
  const gateCheckInterval = setInterval(checkGateState, 5);

  const portNodes: ModuleInstance["portNodes"] = {
    gate_in: gateDetectorNode, // Gate input now has a real audio node
    cv_out: envelopeGainNode, // AudioNode output representing envelope CV (0..1)
  };

  const instance: ModuleInstance = {
    id: moduleId,
    type: "ADSR",
    label: `AHDSR ${moduleId}`,
    ports,
    portNodes,
    connect(fromPortId, target) {
      const fromConnectionNode = portNodes[fromPortId];
      const toConnectionEntity = target.module.portNodes[target.portId];
      
      console.log(`[ADSR ${moduleId}] Connecting ${fromPortId} to ${target.module.id}.${target.portId}`, {
        fromNode: fromConnectionNode,
        toEntity: toConnectionEntity,
      });
      
      if (!fromConnectionNode || !toConnectionEntity) {
        console.error(`[ADSR ${moduleId}] Connection failed - missing nodes`);
        return;
      }
      
      if (
        fromConnectionNode instanceof AudioNode &&
        toConnectionEntity instanceof AudioNode
      ) {
        fromConnectionNode.connect(toConnectionEntity);
        console.log(`[ADSR ${moduleId}] ✓ Connected AudioNode → AudioNode`);
      } else if (
        fromConnectionNode instanceof AudioNode &&
        toConnectionEntity instanceof AudioParam
      ) {
        fromConnectionNode.connect(toConnectionEntity);
        console.log(`[ADSR ${moduleId}] ✓ Connected AudioNode → AudioParam`);
      } else {
        console.warn(`[ADSR ${moduleId}] Unsupported connection types`, {
          from: fromConnectionNode?.constructor.name,
          to: toConnectionEntity?.constructor.name,
        });
      }
    },
    gateOn() {
      const currentTime = audioContext.currentTime;
      const gainParam = envelopeGainNode.gain;
      gainParam.cancelScheduledValues(currentTime);
      gainParam.setValueAtTime(gainParam.value, currentTime);
      
      console.log(`[ADSR ${moduleId}] Gate ON - envelope attacking from ${gainParam.value.toFixed(3)} to ${peakScale}`, {
        attack: attackTime,
        hold: holdTime,
        decay: decayTime,
        sustain: sustainLevel,
      });
      
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
      clearInterval(gateCheckInterval);
      constantSourceNode.disconnect();
      envelopeGainNode.disconnect();
      gateDetectorNode.disconnect();
      analyserNode.disconnect();
    },
  };
  return instance;
};
