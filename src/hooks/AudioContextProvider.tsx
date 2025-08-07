import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { AudioContextContext, type AudioContextType } from "./useAudioContext";

interface AudioContextProviderProps {
  children: ReactNode;
}

export function AudioContextProvider({ children }: AudioContextProviderProps) {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const startAudio = async (): Promise<void> => {
    if (!audioContext) {
      // Use webkitAudioContext for Safari compatibility
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const newAudioContext = new AudioCtx();
      setAudioContext(newAudioContext);

      if (newAudioContext.state === "suspended") {
        await newAudioContext.resume();
      }
    } else if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    setIsPlaying(true);
  };

  const stopAudio = (): void => {
    setIsPlaying(false);
    // Note: We don't close the AudioContext here as we might want to reuse it
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
    isPlaying,
    startAudio,
    stopAudio,
  };

  return (
    <AudioContextContext.Provider value={contextValue}>
      {children}
    </AudioContextContext.Provider>
  );
}
