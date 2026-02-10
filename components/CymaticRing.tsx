'use client';
import { useEffect, useRef } from 'react';

interface Props {
  analyser: AnalyserNode | null;
  width?: number;
  height?: number;
  color?: string;
}

export default function CymaticRing({ analyser, width = 300, height = 300, color = '#22d3ee' }: Props) {
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

      // Clear canvas for clean rendering
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2.5;
      // Subtle glow effect
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.strokeStyle = color;
      
      ctx.beginPath();

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      // Base radius
      const radius = Math.min(centerX, centerY) * 0.7;

      // Draw the circular waveform
      // We wrap the entire buffer (or a subset) around the circle.
      // To make it look "cymatic" (symmetrical), we can mirror the data
      // or just wrap it smoothly.

      // Let's use a subset to avoid too much jitter
      const step = 2;
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < bufferLength; i += step) {
        const v = (dataArray[i] / 128.0) - 1.0; // -1 to 1

        // Map index to angle 0..2PI
        const angle = (i / bufferLength) * Math.PI * 2;

        // Deformation
        const r = radius + (v * 40); // 40px vibration

        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        points.push({ x, y });
      }

      // Draw the path with smooth closure
      if (points.length > 0) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        // Explicitly close back to first point for seamless loop
        ctx.lineTo(points[0].x, points[0].y);
      }

      ctx.stroke();
      
      // Inner decorative ring (static or slowly breathing)
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1;
      ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    };

    draw();

    return () => {
        if(animationRef.current) cancelAnimationFrame(animationRef.current);
    }
  }, [analyser, color]);

  return <canvas ref={canvasRef} width={width} height={height} className="block mx-auto pointer-events-none" />;
}
