import type { CreateModuleFn, ModuleInstance } from "../types";
import {
  sequencerPorts,
  type SequencerTriggerParams,
  type SequenceStep,
} from "./triggers";

// Default sequence - C major scale
const defaultSequence: SequenceStep[] = [
  { note: 60, velocity: 100 }, // C4
  { note: 62, velocity: 80 }, // D4
  { note: 64, velocity: 90 }, // E4
  { note: 65, velocity: 85 }, // F4
  { note: 67, velocity: 95 }, // G4
  { note: 69, velocity: 75 }, // A4
  { note: 71, velocity: 90 }, // B4
  { note: 72, velocity: 100 }, // C5
];

// MIDI note to frequency conversion (Hz)
function midiNoteToFrequency(noteNumber: number): number {
  // Standard MIDI tuning: A4 (note 69) = 440 Hz
  // Formula: freq = 440 * 2^((note - 69) / 12)
  return 440 * Math.pow(2, (noteNumber - 69) / 12);
}

export const createSequencerTrigger: CreateModuleFn<SequencerTriggerParams> = (
  context,
  parameters,
) => {
  const { audioContext, moduleId } = context;

  // Audio nodes for CV generation
  const gateConstantSource = audioContext.createConstantSource();
  const gateGainNode = audioContext.createGain();
  const pitchConstantSource = audioContext.createConstantSource();
  const velocityConstantSource = audioContext.createConstantSource();
  const triggerGainNode = audioContext.createGain();

  // Initialize CV values
  gateConstantSource.offset.value = 1; // Constant 1V signal
  gateGainNode.gain.value = 0; // Gate starts off
  pitchConstantSource.offset.value = 4.75; // A4 default
  velocityConstantSource.offset.value = 0;
  triggerGainNode.gain.value = 0;

  // Connect gate: constant source -> gain node (acts as on/off switch)
  gateConstantSource.connect(gateGainNode);

  // Start constant sources
  gateConstantSource.start();
  pitchConstantSource.start();
  velocityConstantSource.start();

  // Sequencer parameters
  let bpm = parameters?.bpm ?? 120;
  let steps = parameters?.steps ?? 8;
  let gateLength = parameters?.gate ?? 0.8;
  let swing = parameters?.swing ?? 0; // 0 = no swing, -0.5 to +0.5 range
  let octave = parameters?.octave ?? 4;
  let loop = parameters?.loop ?? true;

  // Sequence state
  let sequence: SequenceStep[] = [...defaultSequence].slice(0, steps);
  let currentStep = 0;
  let isPlaying = false;
  let nextStepTime = 0;
  let gateOffTime = 0;

  // Step timing calculation
  const getStepDuration = (stepIndex: number): number => {
    const baseDuration = 60 / bpm / 4; // 16th notes at BPM
    if (swing === 0) return baseDuration; // No swing

    // Apply swing to odd steps (off-beats)
    // swing range: -0.5 to +0.5, where 0 = no swing
    // positive swing delays off-beats, negative swing advances them
    const isOffBeat = stepIndex % 2 === 1;
    if (isOffBeat) {
      // Delayed by swing amount (positive = delay, negative = advance)
      return baseDuration * (1 + swing);
    } else {
      // Compensate by adjusting on-beats in opposite direction
      return baseDuration * (1 - swing);
    }
  };

  // Schedule next step
  const scheduleStep = () => {
    if (!isPlaying) return;

    const currentStepData = sequence[currentStep];

    if (currentStepData?.note !== undefined) {
      const noteNumber = currentStepData.note + (octave - 4) * 12;
      const velocity = (currentStepData.velocity ?? 100) / 127;
      const stepGateLength = currentStepData.gate ?? gateLength;

      // Update outputs
      const frequency = midiNoteToFrequency(noteNumber);
      pitchConstantSource.offset.setValueAtTime(frequency, nextStepTime);
      velocityConstantSource.offset.setValueAtTime(velocity, nextStepTime);

      // Gate on
      gateGainNode.gain.setValueAtTime(1, nextStepTime);

      // Trigger pulse
      triggerGainNode.gain.setValueAtTime(1, nextStepTime);
      triggerGainNode.gain.setValueAtTime(0, nextStepTime + 0.005);

      // Schedule gate off
      const stepDuration = getStepDuration(currentStep);
      gateOffTime = nextStepTime + stepDuration * stepGateLength;
      gateGainNode.gain.setValueAtTime(0, gateOffTime);
    }

    // Advance to next step
    currentStep = (currentStep + 1) % steps;
    if (currentStep === 0 && !loop) {
      stop();
      return;
    }

    // Schedule next step
    nextStepTime += getStepDuration(
      currentStep - 1 >= 0 ? currentStep - 1 : steps - 1,
    );
    setTimeout(
      () => scheduleStep(),
      Math.max(0, (nextStepTime - audioContext.currentTime) * 1000 - 10),
    );
  };

  const start = () => {
    if (isPlaying) return;
    isPlaying = true;
    currentStep = 0;
    nextStepTime = audioContext.currentTime + 0.01; // Small delay
    scheduleStep();
  };

  const stop = () => {
    isPlaying = false;
    gateGainNode.gain.setValueAtTime(0, audioContext.currentTime);
  };

  const portNodes: ModuleInstance["portNodes"] = {
    gate_out: gateGainNode,
    pitch_cv_out: pitchConstantSource,
    velocity_cv_out: velocityConstantSource,
    trigger_out: triggerGainNode,
    clock_in: undefined, // TODO: Implement external clock
    reset_in: undefined, // TODO: Implement reset trigger
    run_gate_in: undefined, // TODO: Implement run gate
  };

  const instance: ModuleInstance = {
    id: moduleId,
    type: "SEQUENCER",
    label: `Sequencer ${moduleId}`,
    ports: sequencerPorts,
    portNodes,

    connect(fromPortId, target) {
      const fromNode = portNodes[fromPortId];
      const toEntity = target.module.portNodes[target.portId];

      if (!fromNode || !toEntity) return;

      if (fromNode instanceof AudioNode && toEntity instanceof AudioNode) {
        fromNode.connect(toEntity);
      } else if (
        fromNode instanceof AudioNode &&
        toEntity instanceof AudioParam
      ) {
        fromNode.connect(toEntity);
      }
    },

    updateParams(partial) {
      if (partial.bpm !== undefined) {
        bpm = Math.max(60, Math.min(200, partial.bpm as number));
      }
      if (partial.steps !== undefined) {
        const newSteps = Math.max(1, Math.min(32, partial.steps as number));
        if (newSteps !== steps) {
          steps = newSteps;
          // Resize sequence array
          if (sequence.length < steps) {
            // Pad with empty steps
            while (sequence.length < steps) {
              sequence.push({});
            }
          } else {
            sequence = sequence.slice(0, steps);
          }
        }
      }
      if (partial.gate !== undefined) {
        gateLength = Math.max(0.1, Math.min(1.0, partial.gate as number));
      }
      if (partial.swing !== undefined) {
        swing = Math.max(-0.5, Math.min(0.5, partial.swing as number));
      }
      if (partial.octave !== undefined) {
        octave = Math.max(0, Math.min(7, partial.octave as number));
      }
      if (partial.loop !== undefined) {
        loop = partial.loop as boolean;
      }
      if (partial.sequence !== undefined) {
        sequence = partial.sequence as SequenceStep[];
      }
    },

    getParams() {
      return {
        bpm,
        steps,
        gate: gateLength,
        swing,
        octave,
        loop,
        sequence: [...sequence],
        isPlaying,
        currentStep,
      };
    },

    // Custom sequencer methods
    gateOn() {
      start();
    },

    gateOff() {
      stop();
    },

    dispose() {
      stop();

      try {
        gateConstantSource.stop();
        pitchConstantSource.stop();
        velocityConstantSource.stop();
      } catch {
        /* already stopped */
      }

      gateConstantSource.disconnect();
      gateGainNode.disconnect();
      pitchConstantSource.disconnect();
      velocityConstantSource.disconnect();
      triggerGainNode.disconnect();
    },
  };

  return instance;
};
