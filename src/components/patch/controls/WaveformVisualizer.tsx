import React, { useEffect, useRef } from "react";

import type { MasterOutputAnalyserData } from "../../../modular/modules/MasterOutput";

interface WaveformVisualizerProps {
  getAnalyserData: () => MasterOutputAnalyserData;
  width?: number;
  height?: number;
  className?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  getAnalyserData,
  width = 200,
  height = 100,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const analyserData = getAnalyserData();
      const waveformData = analyserData.getWaveformData();

      // Clear canvas
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, width, height);

      // Draw waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#00ff88";
      ctx.beginPath();

      const sliceWidth = width / waveformData.length;
      let x = 0;

      for (let i = 0; i < waveformData.length; i++) {
        const v = waveformData[i] / 128.0; // Convert to 0-2 range
        const y = (v * height) / 2; // Scale to canvas height

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();

      // Draw center line
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Continue animation
      animationRef.current = requestAnimationFrame(draw);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [getAnalyserData, width, height]);

  return (
    <div className={`waveform-visualizer ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: "1px solid #333",
          borderRadius: "4px",
          backgroundColor: "#1a1a1a",
        }}
      />
      <div className="waveform-label">Waveform</div>
    </div>
  );
};
