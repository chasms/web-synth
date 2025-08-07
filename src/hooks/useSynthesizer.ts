import { useCallback, useEffect, useRef, useState } from "react";

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
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = synthParams.masterVolume;
    }
  }, [synthParams.masterVolume]);

  // Create three oscillators
  const osc1 = useOscillator(synthParams.oscillator1);
  const osc2 = useOscillator(synthParams.oscillator2);
  const osc3 = useOscillator(synthParams.oscillator3);

  const stopNote = useCallback(() => {
    osc1.stop();
    osc2.stop();
    osc3.stop();
    setIsPlaying(false);
    setCurrentNote(null);
  }, [osc1, osc2, osc3]);

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
        const osc =
          oscillatorIndex === 1 ? osc1 : oscillatorIndex === 2 ? osc2 : osc3;
        osc.updateParams(params);
      }
    },
    [osc1, osc2, osc3, isPlaying],
  );

  const playNote = useCallback(
    (frequency: number) => {
      if (isPlaying) {
        stopNote();
      }

      // Make sure we have a master gain node
      if (!masterGainRef.current) return;

      // Start all three oscillators, connecting them to master gain
      osc1.start(frequency, masterGainRef.current);
      osc2.start(
        frequency + synthParams.oscillator2.detune,
        masterGainRef.current,
      );
      osc3.start(
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
      osc1,
      osc2,
      synthParams.oscillator2.detune,
      synthParams.oscillator3.frequency,
      synthParams.oscillator1.frequency,
      osc3,
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
      osc1: { ...osc1, params: synthParams.oscillator1 },
      osc2: { ...osc2, params: synthParams.oscillator2 },
      osc3: { ...osc3, params: synthParams.oscillator3 },
    },
  };
}
