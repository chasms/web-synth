import { createContext, useContext } from "react";

export interface AudioContextType {
  audioContext: AudioContext | null;
  isPlaying: boolean;
  startAudio: () => Promise<void>;
  stopAudio: () => void;
}

export const AudioContextContext = createContext<AudioContextType | null>(null);

export function useAudioContext(): AudioContextType {
  const context = useContext(AudioContextContext);
  if (!context) {
    throw new Error(
      "useAudioContext must be used within an AudioContextProvider",
    );
  }
  return context;
}
