import type { CreateModuleFn, ModuleInstance, PortDefinition } from "../types";
import { smoothParam } from "../utils/smoothing";

export interface MasterOutputParams {
  volume?: number; // 0 to 1
  mute?: boolean;
  testTone?: boolean; // Debug test tone
}

export interface MasterOutputAnalyserData {
  getWaveformData: () => Uint8Array;
  getFrequencyData: () => Uint8Array;
}

const ports: PortDefinition[] = [
  {
    id: "audio_in",
    label: "Audio In",
    direction: "in",
    signal: "AUDIO",
    metadata: { description: "Main audio input to speakers" },
  },
];

export const createMasterOutput: CreateModuleFn<MasterOutputParams> = (
  context,
  parameters,
) => {
  const { audioContext, moduleId } = context;

  // Create master volume control (affects what the analyser sees)
  const masterVolumeNode = audioContext.createGain();
  masterVolumeNode.gain.value = parameters?.volume ?? 0.7; // Default to 70% volume for safety

  // Create separate mute control (after analyser, so analyser always sees signal)
  const muteNode = audioContext.createGain();
  muteNode.gain.value = parameters?.mute ? 0 : 1;

  // Create analyser for waveform visualization (between volume and mute)
  const analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 2048;
  analyserNode.smoothingTimeConstant = 0.8;

  // Debug test tone (controllable)
  const testOscillator = audioContext.createOscillator();
  const testGain = audioContext.createGain();
  testOscillator.frequency.value = 220;
  testOscillator.type = "sawtooth";
  testGain.gain.value = parameters?.testTone ? 0.1 : 0; // Controlled by testTone parameter
  testOscillator.connect(testGain);
  testGain.connect(masterVolumeNode); // Connect test tone to volume control
  testOscillator.start();

  // Audio chain: input -> volume -> analyser -> mute -> destination
  // This ensures analyser sees the signal even when muted
  masterVolumeNode.connect(analyserNode);
  analyserNode.connect(muteNode);
  muteNode.connect(audioContext.destination);

  const portNodes: ModuleInstance["portNodes"] = {
    audio_in: masterVolumeNode, // Input connects to volume first
  };

  const instance: ModuleInstance = {
    id: moduleId,
    type: "MASTER_OUTPUT",
    label: `Master Out`,
    ports,
    audioOut: undefined, // This is the final destination - no audioOut
    portNodes,
    connect(fromPortId, target) {
      const fromConnectionNode = portNodes[fromPortId];
      const toConnectionEntity = target.module.portNodes[target.portId];
      if (!fromConnectionNode || !toConnectionEntity) return;

      if (
        fromConnectionNode instanceof AudioNode &&
        toConnectionEntity instanceof AudioNode
      ) {
        fromConnectionNode.connect(toConnectionEntity);
      } else if (
        fromConnectionNode instanceof AudioNode &&
        toConnectionEntity instanceof AudioParam
      ) {
        fromConnectionNode.connect(toConnectionEntity);
      }
    },
    updateParams(partial) {
      if (
        partial["volume"] !== undefined &&
        typeof partial["volume"] === "number"
      ) {
        const nextVolume = Math.max(0, Math.min(1, partial["volume"]));
        smoothParam(audioContext, masterVolumeNode.gain, nextVolume, {
          mode: "linear",
          time: 0.05, // Smooth volume changes to prevent clicks
        });
      }
      if (
        partial["mute"] !== undefined &&
        typeof partial["mute"] === "boolean"
      ) {
        // Mute controls separate mute node, not volume
        const nextMuteGain = partial["mute"] ? 0 : 1;
        smoothParam(audioContext, muteNode.gain, nextMuteGain, {
          mode: "linear",
          time: 0.02, // Quick mute/unmute
        });
      }
      if (
        partial["testTone"] !== undefined &&
        typeof partial["testTone"] === "boolean"
      ) {
        const nextTestToneVolume = partial["testTone"] ? 0.1 : 0;
        smoothParam(audioContext, testGain.gain, nextTestToneVolume, {
          mode: "linear",
          time: 0.05, // Smooth test tone on/off
        });
      }
    },
    getParams() {
      return {
        volume: masterVolumeNode.gain.value,
        mute: muteNode.gain.value === 0, // Check mute node, not volume node
        testTone: testGain.gain.value > 0,
      };
    },
    getAnalyserData(): MasterOutputAnalyserData {
      return {
        getWaveformData() {
          const bufferLength = analyserNode.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserNode.getByteTimeDomainData(dataArray);
          return dataArray;
        },
        getFrequencyData() {
          const bufferLength = analyserNode.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserNode.getByteFrequencyData(dataArray);
          return dataArray;
        },
      };
    },
    dispose() {
      testOscillator.stop();
      testOscillator.disconnect();
      testGain.disconnect();
      masterVolumeNode.disconnect();
      muteNode.disconnect();
      analyserNode.disconnect();
    },
  };

  return instance;
};
