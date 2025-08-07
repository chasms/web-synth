import { useAudioContext } from "../hooks/useAudioContext";
import { useSynthesizer } from "../hooks/useSynthesizer";
import type { OscillatorParams, OscillatorType } from "../types/synth";
import { Knob } from "./Controls";
import { OscillatorControls } from "./OscillatorControls";

export function Synthesizer() {
  const {
    audioContext,
    isPlaying: contextIsPlaying,
    startAudio,
  } = useAudioContext();
  const {
    synthParams,
    isPlaying,
    // playNote,
    stopNote,
    updateOscillator,
    setMasterVolume,
    playTestNote,
  } = useSynthesizer();

  const handleStartAudio = async () => {
    console.log("contextIsPlaying", contextIsPlaying, "\n");
    if (!contextIsPlaying) {
      await startAudio();
    }
  };

  const handleOscillatorParamChange = (
    oscIndex: 1 | 2 | 3,
    param: keyof OscillatorParams,
    value: number | OscillatorType,
  ) => {
    updateOscillator(oscIndex, { [param]: value });
  };

  return (
    <div className="synthesizer">
      <div className="audio-controls">
        <h2>Audio Context</h2>
        {!audioContext && (
          <button onClick={handleStartAudio} className="start-audio-btn">
            Start Audio Context
          </button>
        )}
        {audioContext && (
          <div className="audio-status">
            <span>Audio Context: {audioContext.state}</span>
            <span>Sample Rate: {audioContext.sampleRate}Hz</span>
          </div>
        )}
      </div>

      <div className="test-controls">
        <h2>Test Notes</h2>
        <div className="test-buttons">
          <button
            onClick={() => playTestNote("C4")}
            disabled={!audioContext}
            className="test-note-btn"
          >
            C4
          </button>
          <button
            onClick={() => playTestNote("E4")}
            disabled={!audioContext}
            className="test-note-btn"
          >
            E4
          </button>
          <button
            onClick={() => playTestNote("G4")}
            disabled={!audioContext}
            className="test-note-btn"
          >
            G4
          </button>
          <button
            onClick={stopNote}
            disabled={!audioContext || !isPlaying}
            className="stop-btn"
          >
            Stop
          </button>
        </div>
        <div className="play-status">
          Status: {isPlaying ? "Playing" : "Stopped"}
        </div>
      </div>

      <div className="master-controls">
        <h2>Master</h2>
        <Knob
          label="Master Volume"
          value={synthParams.masterVolume}
          min={0}
          max={1}
          step={0.01}
          onChange={setMasterVolume}
        />
      </div>

      <div className="oscillators">
        <OscillatorControls
          label="Oscillator 1"
          params={synthParams.oscillator1}
          onParamChange={(param, value) =>
            handleOscillatorParamChange(1, param, value)
          }
        />
        <OscillatorControls
          label="Oscillator 2"
          params={synthParams.oscillator2}
          onParamChange={(param, value) =>
            handleOscillatorParamChange(2, param, value)
          }
        />
        <OscillatorControls
          label="Oscillator 3"
          params={synthParams.oscillator3}
          onParamChange={(param, value) =>
            handleOscillatorParamChange(3, param, value)
          }
        />
      </div>
    </div>
  );
}
