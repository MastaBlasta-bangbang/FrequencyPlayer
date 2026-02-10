'use client';
import { useEffect, useRef } from 'react';

interface Props {
  analyser: AnalyserNode | null;
  width?: number;
  height?: number;
  color?: string;
}

export default function MandalaVisualizer({ analyser, width = 300, height = 300, color = '#22d3ee' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const timeDataArray = new Uint8Array(bufferLength);
    const freqDataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(timeDataArray);
      analyser.getByteFrequencyData(freqDataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = Math.min(centerX, centerY) * 0.6;

      // Calculate average amplitude for pulsing effect
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += Math.abs((timeDataArray[i] / 128.0) - 1.0);
      }
      const avgAmplitude = sum / bufferLength;

      // Calculate frequency dominance for dynamic petal count
      let lowFreqSum = 0;
      let midFreqSum = 0;
      let highFreqSum = 0;
      const third = Math.floor(bufferLength / 3);

      for (let i = 0; i < third; i++) {
        lowFreqSum += freqDataArray[i];
        midFreqSum += freqDataArray[i + third];
        highFreqSum += freqDataArray[i + third * 2];
      }

      const totalFreq = lowFreqSum + midFreqSum + highFreqSum;
      const freqIntensity = totalFreq / (255 * bufferLength);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 10 + (freqIntensity * 20);
      ctx.shadowColor = color;

      // Draw multiple concentric rings with symmetrical petals
      // Petal count varies based on frequency content (6-12 petals)
      const numPetals = Math.floor(6 + (freqIntensity * 6));
      const numRings = 5;

      for (let ring = 0; ring < numRings; ring++) {
        const ringRadius = baseRadius * ((ring + 1) / numRings);
        const pulse = avgAmplitude * 15;

        ctx.beginPath();
        for (let petal = 0; petal <= numPetals; petal++) {
          const angle = (petal / numPetals) * Math.PI * 2;

          // Sample both time and frequency data for this petal
          const dataIndex = Math.floor((petal / numPetals) * bufferLength);
          const timeV = (timeDataArray[dataIndex] / 128.0) - 1.0;
          const freqV = (freqDataArray[dataIndex] / 255.0) - 0.5;

          // Combine time and frequency variations
          const r = ringRadius + (timeV * 15) + (freqV * 25) + pulse;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;

          if (petal === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.globalAlpha = 0.4 + (ring * 0.15);
        ctx.stroke();
      }

      ctx.globalAlpha = 1.0;

      // Draw center dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4 + avgAmplitude * 8, 0, Math.PI * 2);
      ctx.fill();
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyser, color]);

  return <canvas ref={canvasRef} width={width} height={height} className="block mx-auto pointer-events-none" />;
}
