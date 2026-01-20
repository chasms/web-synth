import type { CreateModuleFn, ModuleInstance, PortDefinition } from "../types";
import { calculateEqualPowerCrossfade, smoothParam } from "../utils/smoothing";

export interface SaturatorParams {
  drive?: number; // Input drive/saturation (0.5 to 10.0, 1.0 = unity)
  tone?: number; // High-pass filter frequency for brightness (20Hz to 5000Hz)
  mix?: number; // Dry/wet mix (0.0 = dry, 1.0 = wet)
  output?: number; // Output gain in dB (-12 to +12)
}

const ports: PortDefinition[] = [
  { id: "audio_in", label: "Audio In", direction: "in", signal: "AUDIO" },
  { id: "audio_out", label: "Audio Out", direction: "out", signal: "AUDIO" },
  {
    id: "drive_cv",
    label: "Drive CV",
    direction: "in",
    signal: "CV",
    metadata: {
      bipolar: true,
      description: "Drive modulation input (LFO, etc.)",
    },
  },
  {
    id: "mix_cv",
    label: "Mix CV",
    direction: "in",
    signal: "CV",
    metadata: {
      bipolar: true,
      description: "Mix/wet-dry modulation input",
    },
  },
];

/**
 * Creates a TR-303 style saturator module with drive, tone, mix, and output controls.
 *
 * Signal chain:
 * - Dry: input → dry gain → mixer
 * - Wet: input → drive gain → waveshaper → tone filter → wet gain → mixer
 * - mixer → output gain
 *
 * The waveshaper provides analog-style soft clipping characteristic of the TR-303.
 */
export const createSaturator: CreateModuleFn<SaturatorParams> = (
  context,
  parameters,
) => {
  const { audioContext, moduleId } = context;

  // Input splitter
  const inputNode = audioContext.createGain();
  inputNode.gain.value = 1.0;

  // === DRY PATH ===
  const dryGainNode = audioContext.createGain();
  const mix = parameters?.mix ?? 1.0;
  const initialCrossfade = calculateEqualPowerCrossfade(mix);
  dryGainNode.gain.value = initialCrossfade.dryGain;

  // === WET PATH ===
  // Input drive gain (pre-saturation boost)
  const driveGainNode = audioContext.createGain();
  driveGainNode.gain.value = parameters?.drive ?? 1.0;

  // WaveShaper for saturation curve (TR-303 style soft clipping)
  const waveShaperNode = audioContext.createWaveShaper();
  waveShaperNode.curve = createSaturationCurve();
  waveShaperNode.oversample = "4x"; // High-quality oversampling to reduce aliasing

  // High-pass filter for tone control (brightness)
  const toneFilterNode = audioContext.createBiquadFilter();
  toneFilterNode.type = "highpass";
  toneFilterNode.frequency.value = parameters?.tone ?? 20; // Default: no filtering
  toneFilterNode.Q.value = 0.707; // Butterworth response

  // Wet gain for mix control
  const wetGainNode = audioContext.createGain();
  wetGainNode.gain.value = initialCrossfade.wetGain;

  // === MIXER ===
  const mixerNode = audioContext.createGain();
  mixerNode.gain.value = 1.0;

  // === OUTPUT ===
  const outputGainNode = audioContext.createGain();
  const outputDb = parameters?.output ?? 0;
  outputGainNode.gain.value = dbToGain(outputDb);

  // Connect the signal chains
  // Dry path
  inputNode.connect(dryGainNode);
  dryGainNode.connect(mixerNode);

  // Wet path
  inputNode.connect(driveGainNode);
  driveGainNode.connect(waveShaperNode);
  waveShaperNode.connect(toneFilterNode);
  toneFilterNode.connect(wetGainNode);
  wetGainNode.connect(mixerNode);

  // Output
  mixerNode.connect(outputGainNode);

  // === CV MODULATION INPUTS ===
  // Drive CV: Scale CV signal to affect drive amount
  // CV range -1..+1 maps to drive change of ±3 (adds to base drive)
  const DRIVE_CV_SCALE = 3;
  const driveCvScaleNode = audioContext.createGain();
  driveCvScaleNode.gain.value = DRIVE_CV_SCALE;
  driveCvScaleNode.connect(driveGainNode.gain);

  // Mix CV: Modulates wet gain directly
  // CV range -1..+1 maps to wet gain change of ±0.5
  const MIX_CV_SCALE = 0.5;
  const mixCvScaleNode = audioContext.createGain();
  mixCvScaleNode.gain.value = MIX_CV_SCALE;
  mixCvScaleNode.connect(wetGainNode.gain);

  const portNodes: ModuleInstance["portNodes"] = {
    audio_in: inputNode,
    audio_out: outputGainNode,
    drive_cv: driveCvScaleNode,
    mix_cv: mixCvScaleNode,
  };

  console.log(`[Saturator ${moduleId}] Created with:`, {
    drive: driveGainNode.gain.value,
    tone: toneFilterNode.frequency.value,
    mix,
    outputDb,
    outputGain: outputGainNode.gain.value,
  });

  const instance: ModuleInstance = {
    id: moduleId,
    type: "SATURATOR",
    label: `Saturator ${moduleId}`,
    ports,
    audioOut: outputGainNode,
    portNodes,
    connect(fromPortId, target) {
      const fromConnectionNode = portNodes[fromPortId];
      const toConnectionEntity = target.module.portNodes[target.portId];
      if (!fromConnectionNode || !toConnectionEntity) return;

      console.log(
        `[Saturator ${moduleId}] Connecting from ${fromPortId} to ${target.module.id}.${target.portId}`,
        {
          fromNode: fromConnectionNode,
          toEntity: toConnectionEntity,
        },
      );

      if (
        fromConnectionNode instanceof AudioNode &&
        toConnectionEntity instanceof AudioNode
      ) {
        fromConnectionNode.connect(toConnectionEntity);
        console.log(
          `[Saturator ${moduleId}] ✓ AudioNode → AudioNode connection made`,
        );
      } else if (
        fromConnectionNode instanceof AudioNode &&
        toConnectionEntity instanceof AudioParam
      ) {
        fromConnectionNode.connect(toConnectionEntity);
        console.log(
          `[Saturator ${moduleId}] ✓ AudioNode → AudioParam connection made`,
        );
      }
    },
    updateParams(partial) {
      if (
        partial["drive"] !== undefined &&
        typeof partial["drive"] === "number"
      ) {
        const nextDrive = Math.max(0.5, Math.min(10, partial["drive"]));
        smoothParam(audioContext, driveGainNode.gain, nextDrive, {
          mode: "linear",
          time: 0.02,
        });
      }
      if (
        partial["tone"] !== undefined &&
        typeof partial["tone"] === "number"
      ) {
        const nextTone = Math.max(20, Math.min(5000, partial["tone"]));
        smoothParam(audioContext, toneFilterNode.frequency, nextTone, {
          mode: "setTarget",
          timeConstant: 0.03,
        });
      }
      if (partial["mix"] !== undefined && typeof partial["mix"] === "number") {
        const nextMix = Math.max(0, Math.min(1, partial["mix"]));
        const { wetGain, dryGain } = calculateEqualPowerCrossfade(nextMix);
        smoothParam(audioContext, wetGainNode.gain, wetGain, {
          mode: "linear",
          time: 0.02,
        });
        smoothParam(audioContext, dryGainNode.gain, dryGain, {
          mode: "linear",
          time: 0.02,
        });
      }
      if (
        partial["output"] !== undefined &&
        typeof partial["output"] === "number"
      ) {
        const nextOutputDb = Math.max(-12, Math.min(12, partial["output"]));
        const nextGain = dbToGain(nextOutputDb);
        smoothParam(audioContext, outputGainNode.gain, nextGain, {
          mode: "linear",
          time: 0.02,
        });
      }
    },
    getParams() {
      // Convert equal-power wet gain back to mix value
      // Since wetGain = sqrt(mix), then mix = wetGain^2
      const wetGain = wetGainNode.gain.value;
      const mixValue = wetGain * wetGain;

      return {
        drive: driveGainNode.gain.value,
        tone: toneFilterNode.frequency.value,
        mix: mixValue,
        output: gainToDb(outputGainNode.gain.value),
      };
    },
    dispose() {
      inputNode.disconnect();
      dryGainNode.disconnect();
      driveGainNode.disconnect();
      waveShaperNode.disconnect();
      toneFilterNode.disconnect();
      wetGainNode.disconnect();
      mixerNode.disconnect();
      outputGainNode.disconnect();
      driveCvScaleNode.disconnect();
      mixCvScaleNode.disconnect();
    },
  };

  return instance;
};

/**
 * Creates a saturation curve for the WaveShaper node.
 * This implements a soft-clipping transfer function characteristic of analog saturation.
 *
 * Uses a tanh-based curve for smooth, musical distortion similar to tape saturation
 * and the TR-303's characteristic warmth.
 */
function createSaturationCurve(): Float32Array {
  const samples = 1024;
  const curve = new Float32Array(samples);

  for (let i = 0; i < samples; i++) {
    // Map sample index to input range [-1, 1]
    const x = (i * 2) / samples - 1;

    // Soft clipping using tanh function
    // This provides smooth saturation with gradual compression
    // Scale factor of 1.5 provides moderate saturation characteristic
    const saturated = Math.tanh(x * 1.5);

    curve[i] = saturated;
  }

  return curve;
}

/**
 * Convert decibels to linear gain.
 */
function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Convert linear gain to decibels.
 */
function gainToDb(gain: number): number {
  return 20 * Math.log10(Math.max(0.00001, gain));
}
