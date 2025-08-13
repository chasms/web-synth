import React from "react";

import { AudioContextState, useAudioContext } from "../hooks/useAudioContext";

const buttonStyles = {
  border: "1px solid #444",
  padding: "0.5rem 0.75rem",
  fontSize: "0.8rem",
  background: "#111",
  color: "#eee",
};
/**
 * Displays current AudioContext.state and provides play / pause / stop controls.
 * startAudio will create (or resume) the context, pause suspends, resume resumes, stop closes.
 */
export const AudioContextControls: React.FC = () => {
  const { audioContext, startAudio, pauseAudio, resumeAudio, stopAudio } =
    useAudioContext();
  const [actionError, setActionError] = React.useState<string | null>(null);
  const state = audioContext?.state ?? "not-created";

  const safeCall = async (fn?: () => Promise<void>) => {
    if (!fn) return;
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const handlePlay = async () => {
    await safeCall(startAudio);
  };
  const handlePause = async () => {
    await safeCall(pauseAudio);
  };
  const handleResume = async () => {
    await safeCall(resumeAudio);
  };
  const handleStop = async () => {
    // stopAudio may be synchronous per interface; wrap to conform to Promise expectation
    await safeCall(async () => {
      stopAudio?.();
    });
  };

  return (
    <div
      style={{
        border: "1px solid #444",
        padding: "0.5rem 0.75rem",
        fontSize: "0.8rem",
        background: "#111",
        color: "#eee",
      }}
    >
      <div style={{ marginBottom: "0.25rem", fontWeight: 600 }}>
        Audio Context
      </div>
      <div style={{ marginBottom: "0.5rem" }}>State: {state}</div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          style={buttonStyles}
          onClick={handlePlay}
          disabled={state === AudioContextState.running}
        >
          Play
        </button>
        <button
          style={buttonStyles}
          onClick={handlePause}
          disabled={state !== AudioContextState.running}
        >
          Pause
        </button>
        <button
          style={buttonStyles}
          onClick={handleResume}
          disabled={state !== AudioContextState.suspended}
        >
          Resume
        </button>
        <button
          style={buttonStyles}
          onClick={handleStop}
          disabled={!audioContext || state === AudioContextState.closed}
        >
          Stop
        </button>
      </div>
      {actionError && (
        <div style={{ color: "#c33", marginTop: "0.5rem" }}>{actionError}</div>
      )}
    </div>
  );
};
