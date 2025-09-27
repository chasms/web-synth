import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import {
  AudioContextContext,
  AudioContextState,
  type AudioContextType,
} from "./useAudioContext";

interface AudioContextProviderProps {
  children: ReactNode;
}

export function AudioContextProvider({ children }: AudioContextProviderProps) {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  // We rely on audioContext.state instead of our own isPlaying flag

  const createContextIfNeeded = useCallback((): AudioContext => {
    if (audioContext) return audioContext;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const newAudioContext = new AudioCtx();
    setAudioContext(newAudioContext);
    return newAudioContext;
  }, [audioContext]);

  const startAudio = async () => {
    const context = createContextIfNeeded();
    if (context.state === AudioContextState.suspended) await context.resume();
  };

  const pauseAudio = async (): Promise<void> => {
    if (audioContext && audioContext.state === AudioContextState.running) {
      await audioContext.suspend();
    }
  };

  const resumeAudio = async () => {
    if (audioContext && audioContext.state === AudioContextState.suspended) {
      await audioContext.resume();
    }
  };

  const closeAudio = async (): Promise<void> => {
    if (audioContext) {
      try {
        await audioContext.close();
      } finally {
        setAudioContext(null);
      }
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext]);

  const contextValue: AudioContextType = {
    audioContext,
    startAudio,
    stopAudio: closeAudio, // maintain backward compatibility name
    pauseAudio,
    resumeAudio,
  };

  return (
    <AudioContextContext.Provider value={contextValue}>
      {children}
    </AudioContextContext.Provider>
  );
}
