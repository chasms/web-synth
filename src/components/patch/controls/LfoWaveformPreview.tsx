import React, { useEffect, useRef } from "react";

import {
  generateLfoWaveformSamples,
  type LfoWaveform,
} from "../../../utils/lfoUtils";

interface LfoWaveformPreviewProps {
  waveform: LfoWaveform;
  rate: number;
  depth: number;
  bipolar: boolean;
  width?: number;
  height?: number;
}

/** Number of samples used to draw the waveform shape */
const SAMPLE_COUNT = 128;

/** Color for the waveform line */
const WAVEFORM_COLOR = "#ffb347";

/** Color for the animated phase cursor */
const CURSOR_COLOR = "#ff6b35";

/** Color for the center / zero line */
const ZERO_LINE_COLOR = "#333";

/** Background color */
const BACKGROUND_COLOR = "#1a1a1a";

/**
 * Renders an animated preview of the LFO waveform shape.
 *
 * Instead of an AnalyserNode (which shows nearly flat lines at sub-audio LFO
 * frequencies), this component draws the waveform mathematically and animates
 * a vertical cursor to indicate the current phase position based on the rate.
 */
export const LfoWaveformPreview: React.FC<LfoWaveformPreviewProps> = ({
  waveform,
  rate,
  depth,
  bipolar,
  width = 148,
  height = 60,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const samples = generateLfoWaveformSamples(
      waveform,
      SAMPLE_COUNT,
      depth,
      bipolar,
    );

    // Determine the value range for Y-axis mapping
    const maxAmplitude = bipolar ? depth : depth;
    const minValue = bipolar ? -maxAmplitude : 0;
    const maxValue = maxAmplitude;
    const valueRange = maxValue - minValue || 1;

    // Padding from top/bottom edges
    const verticalPadding = 4;
    const drawHeight = height - verticalPadding * 2;

    /** Maps a sample value to canvas Y coordinate */
    const valueToY = (value: number): number => {
      const normalized = (value - maxValue) / -valueRange; // 0 at top (max), 1 at bottom (min)
      return verticalPadding + normalized * drawHeight;
    };

    const draw = (timestamp: number) => {
      if (startTimeRef.current === undefined) {
        startTimeRef.current = timestamp;
      }

      // Calculate the animated cursor position based on elapsed time and rate
      const elapsedSeconds = (timestamp - startTimeRef.current) / 1000;
      const cursorPhase = (elapsedSeconds * rate) % 1;
      const cursorX = cursorPhase * width;

      // Clear
      context.fillStyle = BACKGROUND_COLOR;
      context.fillRect(0, 0, width, height);

      // Draw zero/center line
      const zeroY = valueToY(0);
      context.strokeStyle = ZERO_LINE_COLOR;
      context.lineWidth = 1;
      context.setLineDash([2, 2]);
      context.beginPath();
      context.moveTo(0, zeroY);
      context.lineTo(width, zeroY);
      context.stroke();
      context.setLineDash([]);

      // Draw waveform shape
      context.strokeStyle = WAVEFORM_COLOR;
      context.lineWidth = 1.5;
      context.beginPath();

      for (let i = 0; i < samples.length; i++) {
        const x = (i / samples.length) * width;
        const y = valueToY(samples[i]);
        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      // Close the loop back to the start for visual continuity
      context.lineTo(width, valueToY(samples[0]));
      context.stroke();

      // Draw animated cursor (vertical line at current phase)
      context.strokeStyle = CURSOR_COLOR;
      context.lineWidth = 1.5;
      context.globalAlpha = 0.8;
      context.beginPath();
      context.moveTo(cursorX, verticalPadding);
      context.lineTo(cursorX, height - verticalPadding);
      context.stroke();

      // Draw a dot at the intersection of cursor and waveform
      const cursorSampleIndex = Math.floor(cursorPhase * samples.length);
      const cursorY = valueToY(
        samples[Math.min(cursorSampleIndex, samples.length - 1)],
      );
      context.globalAlpha = 1;
      context.fillStyle = CURSOR_COLOR;
      context.beginPath();
      context.arc(cursorX, cursorY, 3, 0, Math.PI * 2);
      context.fill();

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current);
      }
      startTimeRef.current = undefined;
    };
  }, [waveform, rate, depth, bipolar, width, height]);

  return (
    <div className="lfo-waveform-preview">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        aria-label={`LFO ${waveform} waveform preview`}
      />
    </div>
  );
};
