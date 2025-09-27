import { useCallback, useEffect, useRef, useState } from "react";

import { smoothParam } from "../modular/utils/smoothing";
import type { OscillatorParams, SynthParams } from "../types/synth";
import { DEFAULT_SYNTH_PARAMS } from "../types/synth";
import { useAudioContext } from "./useAudioContext";
import { useOscillator } from "./useOscillator";

export function useSynthesizer() {
  const { audioContext } = useAudioContext();
  const [synthParams, setSynthParams] =
    useState<SynthParams>(DEFAULT_SYNTH_PARAMS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNote, setCurrentNote] = useState<number | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Create master gain node
  useEffect(() => {
    if (audioContext && !masterGainRef.current) {
      masterGainRef.current = audioContext.createGain();
      masterGainRef.current.gain.value = synthParams.masterVolume;
      masterGainRef.current.connect(audioContext.destination);
    }
  }, [audioContext, synthParams.masterVolume]);

  // Update master volume when it changes
  useEffect(() => {
    if (audioContext && masterGainRef.current) {
      smoothParam(
        audioContext,
        masterGainRef.current.gain,
        synthParams.masterVolume,
        {
          mode: "linear",
          time: 0.03,
        },
      );
    }
  }, [audioContext, synthParams.masterVolume]);

  // Create three oscillators
  const oscillatorOne = useOscillator(synthParams.oscillator1);
  const oscillatorTwo = useOscillator(synthParams.oscillator2);
  const oscillatorThree = useOscillator(synthParams.oscillator3);

  const stopNote = useCallback(() => {
    oscillatorOne.stop();
    oscillatorTwo.stop();
    oscillatorThree.stop();
    setIsPlaying(false);
    setCurrentNote(null);
  }, [oscillatorOne, oscillatorTwo, oscillatorThree]);

  const updateOscillator = useCallback(
    (oscillatorIndex: 1 | 2 | 3, params: Partial<OscillatorParams>) => {
      const key = `oscillator${oscillatorIndex}` as keyof Pick<
        SynthParams,
        "oscillator1" | "oscillator2" | "oscillator3"
      >;

      setSynthParams((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...params },
      }));

      // Update the running oscillator if playing
      if (isPlaying) {
        const targetOscillator =
          oscillatorIndex === 1
            ? oscillatorOne
            : oscillatorIndex === 2
              ? oscillatorTwo
              : oscillatorThree;
        targetOscillator.updateParams(params);
      }
    },
    [oscillatorOne, oscillatorTwo, oscillatorThree, isPlaying],
  );

  const playNote = useCallback(
    (frequency: number) => {
      if (isPlaying) {
        stopNote();
      }

      // Make sure we have a master gain node
      if (!masterGainRef.current) return;

      // Start all three oscillators, connecting them to master gain
      oscillatorOne.start(frequency, masterGainRef.current);
      oscillatorTwo.start(
        frequency + synthParams.oscillator2.detune,
        masterGainRef.current,
      );
      oscillatorThree.start(
        frequency *
          (synthParams.oscillator3.frequency /
            synthParams.oscillator1.frequency),
        masterGainRef.current,
      );

      setIsPlaying(true);
      setCurrentNote(frequency);
    },
    [
      isPlaying,
      oscillatorOne,
      oscillatorTwo,
      synthParams.oscillator2.detune,
      synthParams.oscillator3.frequency,
      synthParams.oscillator1.frequency,
      oscillatorThree,
      stopNote,
    ],
  );

  const setMasterVolume = useCallback((volume: number) => {
    setSynthParams((prev) => ({
      ...prev,
      masterVolume: Math.max(0, Math.min(1, volume)),
    }));
  }, []);

  // Helper function to convert MIDI note to frequency
  const midiToFrequency = useCallback((midiNote: number): number => {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }, []);

  // Quick test notes (C4, E4, G4)
  const playTestNote = useCallback(
    (note: "C4" | "E4" | "G4") => {
      const frequencies = {
        C4: 261.63,
        E4: 329.63,
        G4: 392.0,
      };
      playNote(frequencies[note]);
    },
    [playNote],
  );

  return {
    synthParams,
    isPlaying,
    currentNote,
    playNote,
    stopNote,
    updateOscillator,
    setMasterVolume,
    midiToFrequency,
    playTestNote,
    oscillators: {
      oscillatorOne: { ...oscillatorOne, params: synthParams.oscillator1 },
      oscillatorTwo: { ...oscillatorTwo, params: synthParams.oscillator2 },
      oscillatorThree: { ...oscillatorThree, params: synthParams.oscillator3 },
    },
  };
}
