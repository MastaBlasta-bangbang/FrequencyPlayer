'use client';
import { useEffect, useRef } from 'react';

interface Props {
  analyser: AnalyserNode | null;
  width?: number;
  height?: number;
  color?: string;
}

export default function LissajousVisualizer({ analyser, width = 300, height = 300, color = '#22d3ee' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.strokeStyle = color;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const scale = Math.min(canvas.width, canvas.height) * 0.25; // Conservative scale to prevent clipping

      ctx.beginPath();

      // Lissajous curve: plot (x(t), y(t)) where x and y come from different parts of the waveform
      // This creates figure-8 and complex patterns
      const halfBuffer = Math.floor(bufferLength / 2);

      for (let i = 0; i < halfBuffer; i++) {
        // Use first half for X, second half for Y (creates phase difference)
        const xSample = dataArray[i];
        const ySample = dataArray[i + halfBuffer];

        // Normalize to -1..1 with strong attenuation to keep well within bounds
        const x = ((xSample / 128.0) - 1.0) * scale * 0.7;
        const y = ((ySample / 128.0) - 1.0) * scale * 0.7;

        const plotX = centerX + x;
        const plotY = centerY + y;

        if (i === 0) {
          ctx.moveTo(plotX, plotY);
        } else {
          ctx.lineTo(plotX, plotY);
        }
      }

      ctx.stroke();

      // Draw center crosshairs for reference
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - scale, centerY);
      ctx.lineTo(centerX + scale, centerY);
      ctx.moveTo(centerX, centerY - scale);
      ctx.lineTo(centerX, centerY + scale);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, color]);

  return <canvas ref={canvasRef} width={width} height={height} className="block mx-auto pointer-events-none" />;
}
