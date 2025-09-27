import { useCallback, useEffect, useRef, useState } from "react";

import { smoothParam } from "../modular/utils/smoothing";
import type { OscillatorParams } from "../types/synth";
import { useAudioContext } from "./useAudioContext";

interface UseOscillatorReturn {
  start: (frequency?: number, destination?: AudioNode) => void;
  stop: () => void;
  updateParams: (params: Partial<OscillatorParams>) => void;
  isRunning: boolean;
}

export function useOscillator(params: OscillatorParams): UseOscillatorReturn {
  const { audioContext } = useAudioContext();
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Create and configure audio nodes
  const createAudioNodes = useCallback(() => {
    if (!audioContext) return null;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Configure oscillator
    oscillator.frequency.value = params.frequency;
    oscillator.type = params.type;
    oscillator.detune.value = params.detune;

    // Configure gain
    gainNode.gain.value = params.gain;

    // Connect the nodes
    oscillator.connect(gainNode);

    return { oscillator, gainNode };
  }, [audioContext, params]);

  const start = useCallback(
    (frequency?: number, destination?: AudioNode) => {
      if (!audioContext || isRunning) return;

      const nodes = createAudioNodes();
      if (!nodes) return;

      const { oscillator, gainNode } = nodes;

      // Override frequency if provided
      if (frequency !== undefined) {
        oscillator.frequency.value = frequency;
      }

      // Connect to destination (master gain or audio context destination)
      const outputDestination = destination || audioContext.destination;
      gainNode.connect(outputDestination);
      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;

      // Start the oscillator
      oscillator.start();
      setIsRunning(true);

      // Clean up when oscillator ends
      oscillator.onended = () => {
        setIsRunning(false);
        oscillatorRef.current = null;
        gainNodeRef.current = null;
      };
    },
    [audioContext, createAudioNodes, isRunning],
  );

  const stop = useCallback(() => {
    if (oscillatorRef.current && isRunning) {
      oscillatorRef.current.stop();
      setIsRunning(false);
    }
  }, [isRunning]);

  const updateParams = useCallback(
    (newParams: Partial<OscillatorParams>) => {
      if (!oscillatorRef.current || !gainNodeRef.current) return;

      const oscillator = oscillatorRef.current;
      const gainNode = gainNodeRef.current;

      // Update parameters on running oscillator
      if (newParams.frequency !== undefined && audioContext) {
        smoothParam(audioContext, oscillator.frequency, newParams.frequency, {
          mode: "setTarget",
          timeConstant: 0.03,
        });
      }
      if (newParams.detune !== undefined && audioContext) {
        smoothParam(audioContext, oscillator.detune, newParams.detune, {
          mode: "setTarget",
          timeConstant: 0.02,
        });
      }
      if (newParams.gain !== undefined && audioContext) {
        smoothParam(audioContext, gainNode.gain, newParams.gain, {
          mode: "linear",
          time: 0.02,
        });
      }
      // Note: type cannot be changed on a running oscillator
    },
    [audioContext],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRunning) {
        stop();
      }
    };
  }, [stop, isRunning]);

  return {
    start,
    stop,
    updateParams,
    isRunning,
  };
}
