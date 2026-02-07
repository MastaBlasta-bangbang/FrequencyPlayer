'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import { autoCorrelate, noteFromPitch, getCentsOff, PitchSmoother } from '@/lib/pitchDetection';

interface MicInputProps {
    onPitchDetected?: (frequency: number, note: string) => void;
    className?: string;
}

export default function MicInput({ onPitchDetected, className = '' }: MicInputProps) {
    const [isEnabled, setIsEnabled] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [gain, setGain] = useState(5.0);
    const [detectedFreq, setDetectedFreq] = useState(0);
    const [detectedNote, setDetectedNote] = useState('-');
    const [centsOff, setCentsOff] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number>();
    const smootherRef = useRef(new PitchSmoother(0.15, 8));

    // Enumerate audio input devices
    const refreshDevices = useCallback(async () => {
        try {
            // Request permission first to get labeled devices
            await navigator.mediaDevices.getUserMedia({ audio: true });
            const deviceList = await navigator.mediaDevices.enumerateDevices();
            const inputs = deviceList.filter(d => d.kind === 'audioinput');
            setDevices(inputs);
            if (inputs.length > 0 && !selectedDeviceId) {
                setSelectedDeviceId(inputs[0].deviceId);
            }
        } catch (e) {
            console.error('Device enumeration failed:', e);
        }
    }, [selectedDeviceId]);

    useEffect(() => {
        refreshDevices();
    }, [refreshDevices]);

    // Start/stop microphone
    const toggleMic = useCallback(async () => {
        if (isEnabled) {
            // Stop
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(t => t.stop());
                mediaStreamRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            setIsEnabled(false);
            setDetectedFreq(0);
            setDetectedNote('-');
            smootherRef.current.reset();
            return;
        }

        // Start
        try {
            const ctx = new AudioContext();
            audioContextRef.current = ctx;

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 4096;
            analyser.smoothingTimeConstant = 0.8;
            analyserRef.current = analyser;

            const gainNode = ctx.createGain();
            gainNode.gain.value = gain;
            gainNodeRef.current = gainNode;

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                },
            });
            mediaStreamRef.current = stream;

            const source = ctx.createMediaStreamSource(stream);
            source.connect(gainNode);
            gainNode.connect(analyser);
            // Note: Not connecting to destination to avoid feedback

            setIsEnabled(true);
            detectPitch();
        } catch (e) {
            console.error('Mic access failed:', e);
            alert('Could not access microphone. Check permissions.');
        }
    }, [isEnabled, selectedDeviceId, gain]);

    // Pitch detection loop
    const detectPitch = useCallback(() => {
        const analyser = analyserRef.current;
        const ctx = audioContextRef.current;
        if (!analyser || !ctx) return;

        const buffer = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(buffer);

        const pitch = autoCorrelate(buffer, ctx.sampleRate);

        if (pitch > 20 && pitch < 5000) {
            const smoothed = smootherRef.current.update(pitch);
            setDetectedFreq(smoothed);
            const note = noteFromPitch(smoothed);
            setDetectedNote(note);
            setCentsOff(getCentsOff(smoothed));
            onPitchDetected?.(smoothed, note);
        }

        animationRef.current = requestAnimationFrame(detectPitch);
    }, [onPitchDetected]);

    // Update gain in real-time
    useEffect(() => {
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = gain;
        }
    }, [gain]);

    // Restart mic when device changes
    useEffect(() => {
        if (isEnabled) {
            // Restart with new device
            toggleMic().then(() => toggleMic());
        }
    }, [selectedDeviceId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(t => t.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return (
        <div className={`glass-card rounded-2xl overflow-hidden ${className}`}>
            {/* Header - Always visible */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isEnabled ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-200 text-slate-500'}`}>
                        {isEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-semibold text-slate-700">Microphone Input</h3>
                        <p className="text-xs text-slate-500">
                            {isEnabled ? `${detectedFreq.toFixed(1)} Hz` : 'Tap to expand'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isEnabled && (
                        <div className="text-right">
                            <div className="text-2xl font-bold text-slate-800">{detectedNote}</div>
                            <div className={`text-xs font-mono ${Math.abs(centsOff) < 10 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {centsOff > 0 ? '+' : ''}{centsOff.toFixed(0)}c
                            </div>
                        </div>
                    )}
                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Enable toggle */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Enable Microphone</span>
                        <button
                            onClick={toggleMic}
                            className={`relative w-12 h-6 rounded-full transition-colors ${isEnabled ? 'bg-rose-500' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isEnabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Device selector */}
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Input Device</label>
                        <select
                            value={selectedDeviceId}
                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none"
                        >
                            {devices.map(d => (
                                <option key={d.deviceId} value={d.deviceId}>
                                    {d.label || `Device ${d.deviceId.slice(0, 8)}...`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Gain slider */}
                    <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span className="flex items-center gap-1"><Volume2 size={12} /> Gain</span>
                            <span className="font-mono">{gain.toFixed(1)}x</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            step="0.5"
                            value={gain}
                            onChange={(e) => setGain(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                        />
                    </div>

                    {/* Large frequency display */}
                    {isEnabled && (
                        <div className="text-center py-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
                            <div className="text-4xl font-light text-slate-800 tracking-tight">
                                {detectedFreq.toFixed(1)}
                                <span className="text-sm text-slate-400 ml-1">Hz</span>
                            </div>
                            <div className="text-5xl font-bold text-slate-700 mt-2">{detectedNote}</div>
                            <div className={`mt-2 text-sm font-mono ${Math.abs(centsOff) < 5 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                                {centsOff > 0 ? '+' : ''}{centsOff.toFixed(0)} cents
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
