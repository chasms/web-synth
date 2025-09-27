import { createContext, useContext } from "react";

export interface AudioContextType {
  audioContext: AudioContext | null;
  startAudio: () => Promise<void>;
  stopAudio: () => void;
  pauseAudio?: () => Promise<void>;
  resumeAudio?: () => Promise<void>;
}

export enum AudioContextState {
  running = "running",
  suspended = "suspended",
  closed = "closed",
  interrupted = "interrupted",
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
