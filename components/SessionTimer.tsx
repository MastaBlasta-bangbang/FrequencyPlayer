'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Play, Pause, Square, Plus, X, ChevronDown, ChevronUp, ListMusic, Clock } from 'lucide-react';
import { Toggle } from 'konsta/react';

interface FrequencyPreset {
    label: string;
    frequency: number;
    category: string;
    description?: string;
}

interface Segment {
    id: string;
    frequencyLabel: string;
    frequency: number;
    durationSeconds: number;
}

interface SessionTimerProps {
    currentFrequency: number;
    frequencyPresets: FrequencyPreset[];
    onFrequencyChange: (frequency: number) => void;
    onSessionStart?: () => void;
    onSessionEnd?: () => void;
    onSessionStatusChange?: (isReady: boolean, startHandler: (() => void) | null) => void;
    className?: string;
}

type SessionMode = 'single' | 'sequence';

const DURATION_PRESETS = [
    { label: '1m', seconds: 60 },
    { label: '3m', seconds: 180 },
    { label: '5m', seconds: 300 },
    { label: '10m', seconds: 600 },
];

const SEGMENT_DURATION_PRESETS = [
    { label: '1m', seconds: 60 },
    { label: '2m', seconds: 120 },
    { label: '3m', seconds: 180 },
    { label: '5m', seconds: 300 },
];

export default function SessionTimer({
    currentFrequency,
    frequencyPresets,
    onFrequencyChange,
    onSessionStart,
    onSessionEnd,
    onSessionStatusChange,
    className = '',
}: SessionTimerProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [mode, setMode] = useState<SessionMode>('single');
    const [totalDuration, setTotalDuration] = useState(180); // 3 minutes default
    const [segments, setSegments] = useState<Segment[]>([]);
    const [autoDistribute, setAutoDistribute] = useState(false);
    const [targetSequenceDuration, setTargetSequenceDuration] = useState(600); // 10 minutes default

    // Timer state
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Calculate total sequence duration
    const sequenceDuration = segments.reduce((sum, s) => sum + s.durationSeconds, 0);
    const effectiveDuration = mode === 'single' ? totalDuration : sequenceDuration;

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Start timer
    const startTimer = useCallback(() => {
        if (mode === 'sequence' && segments.length === 0) {
            alert('Add at least one frequency to the sequence');
            return;
        }

        setIsActive(true);
        setIsPaused(false);
        setElapsedSeconds(0);
        setCurrentSegmentIndex(0);

        if (mode === 'sequence' && segments.length > 0) {
            onFrequencyChange(segments[0].frequency);
        }

        onSessionStart?.();
    }, [mode, segments, onFrequencyChange, onSessionStart]);

    // Pause/resume
    const togglePause = useCallback(() => {
        setIsPaused(prev => !prev);
    }, []);

    // Stop timer
    const stopTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        setIsActive(false);
        setIsPaused(false);
        setElapsedSeconds(0);
        setCurrentSegmentIndex(0);
        onSessionEnd?.();
    }, [onSessionEnd]);

    // Notify parent when session status changes
    useEffect(() => {
        if (isActive) {
            // If timer is running, session is not "ready to start"
            onSessionStatusChange?.(false, null);
        } else {
            // Session is ready if: single mode (always ready) OR sequence mode with segments
            const isReady = mode === 'single' || (mode === 'sequence' && segments.length > 0);
            onSessionStatusChange?.(isReady, isReady ? startTimer : null);
        }
    }, [mode, segments.length, isActive, startTimer, onSessionStatusChange]);

    // Timer tick
    useEffect(() => {
        if (isActive && !isPaused) {
            intervalRef.current = setInterval(() => {
                setElapsedSeconds(prev => {
                    const next = prev + 1;

                    // Check if session is complete
                    if (next >= effectiveDuration) {
                        stopTimer();
                        return prev;
                    }

                    // Check for segment change in sequence mode
                    if (mode === 'sequence' && segments.length > 0) {
                        let accumulated = 0;
                        for (let i = 0; i < segments.length; i++) {
                            accumulated += segments[i].durationSeconds;
                            if (next < accumulated) {
                                if (i !== currentSegmentIndex) {
                                    setCurrentSegmentIndex(i);
                                    onFrequencyChange(segments[i].frequency);
                                }
                                break;
                            }
                        }
                    }

                    return next;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive, isPaused, effectiveDuration, mode, segments, currentSegmentIndex, onFrequencyChange, stopTimer]);

    // Add frequency to sequence
    const addToSequence = (preset: FrequencyPreset) => {
        const newSegment: Segment = {
            id: crypto.randomUUID(),
            frequencyLabel: preset.label,
            frequency: preset.frequency,
            durationSeconds: 60, // Default 1 minute
        };
        setSegments(prev => [...prev, newSegment]);
    };

    // Remove from sequence
    const removeFromSequence = (id: string) => {
        setSegments(prev => prev.filter(s => s.id !== id));
    };

    // Update segment duration
    const updateSegmentDuration = (id: string, seconds: number) => {
        setSegments(prev => prev.map(s =>
            s.id === id ? { ...s, durationSeconds: Math.max(10, seconds) } : s
        ));
    };

    // Auto-distribute duration across all segments
    const distributeTimeEvenly = () => {
        if (segments.length === 0) return;
        const durationPerSegment = Math.floor(targetSequenceDuration / segments.length);
        setSegments(prev => prev.map(s => ({ ...s, durationSeconds: durationPerSegment })));
    };

    // Calculate progress percentage
    const progress = effectiveDuration > 0 ? (elapsedSeconds / effectiveDuration) * 100 : 0;

    // Calculate segment positions for timeline
    const getSegmentPositions = () => {
        if (segments.length === 0) return [];
        const total = sequenceDuration;
        let accumulated = 0;
        return segments.map(s => {
            const start = (accumulated / total) * 100;
            accumulated += s.durationSeconds;
            const end = (accumulated / total) * 100;
            return { ...s, start, width: end - start };
        });
    };

    return (
        <div className={`glass-card rounded-2xl overflow-hidden ${className}`}>
            {/* Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isActive ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                        <Timer size={20} />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-semibold text-slate-700">Session Timer</h3>
                        <p className="text-xs text-slate-500">
                            {isActive
                                ? `${formatTime(effectiveDuration - elapsedSeconds)} remaining`
                                : mode === 'single'
                                    ? formatTime(totalDuration)
                                    : segments.length > 0
                                        ? `${segments.length} frequencies, ${formatTime(sequenceDuration)}`
                                        : 'Build a sequence'
                            }
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isActive && (
                        <div className="flex gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); togglePause(); }}
                                className="p-2 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200"
                            >
                                {isPaused ? <Play size={16} /> : <Pause size={16} />}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); stopTimer(); }}
                                className="p-2 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200"
                            >
                                <Square size={16} />
                            </button>
                        </div>
                    )}
                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
            </div>

            {/* Progress bar */}
            {isActive && (
                <div className="px-4 pb-2">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        {mode === 'sequence' ? (
                            <div className="h-full flex">
                                {getSegmentPositions().map((seg, i) => (
                                    <div
                                        key={seg.id}
                                        className={`h-full transition-all ${i === currentSegmentIndex ? 'opacity-100' : 'opacity-50'}`}
                                        style={{
                                            width: `${seg.width}%`,
                                            backgroundColor: `hsl(${(i * 60) % 360}, 70%, 50%)`,
                                        }}
                                    />
                                ))}
                                <div
                                    className="absolute h-2 bg-white/50"
                                    style={{ width: `${100 - progress}%`, right: 0 }}
                                />
                            </div>
                        ) : (
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000"
                                style={{ width: `${progress}%` }}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Expanded content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Mode toggle */}
                    <div className="flex bg-slate-100 rounded-xl p-1">
                        <button
                            onClick={() => setMode('single')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                                mode === 'single'
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Clock size={16} /> Single
                        </button>
                        <button
                            onClick={() => setMode('sequence')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                                mode === 'sequence'
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <ListMusic size={16} /> Sequence
                        </button>
                    </div>

                    {/* Single mode: Duration presets */}
                    {mode === 'single' && (
                        <div>
                            <label className="text-xs text-slate-500 mb-2 block">Duration</label>
                            <div className="flex gap-2 mb-3">
                                {DURATION_PRESETS.map(d => (
                                    <button
                                        key={d.label}
                                        onClick={() => setTotalDuration(d.seconds)}
                                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                                            totalDuration === d.seconds
                                                ? 'bg-emerald-500 text-white shadow-lg'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="120"
                                    value={Math.floor(totalDuration / 60)}
                                    onChange={(e) => setTotalDuration(parseInt(e.target.value || '1') * 60)}
                                    className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-2 text-center text-sm"
                                />
                                <span className="text-sm text-slate-500">minutes</span>
                            </div>
                        </div>
                    )}

                    {/* Sequence mode: Builder */}
                    {mode === 'sequence' && (
                        <div className="space-y-3">
                            {/* Current sequence */}
                            {segments.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-500">Sequence ({formatTime(sequenceDuration)} total)</label>

                                    {/* Visual timeline */}
                                    <div className="h-4 rounded-full overflow-hidden flex">
                                        {getSegmentPositions().map((seg, i) => (
                                            <div
                                                key={seg.id}
                                                className="h-full flex items-center justify-center text-[8px] font-bold text-white truncate px-1"
                                                style={{
                                                    width: `${seg.width}%`,
                                                    backgroundColor: `hsl(${(i * 60) % 360}, 70%, 50%)`,
                                                }}
                                            >
                                                {seg.frequencyLabel}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Auto-distribute controls */}
                                    <div className="mb-3 p-3 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-violet-700">Auto-distribute time</span>
                                            <Toggle
                                                checked={autoDistribute}
                                                onChange={() => setAutoDistribute(!autoDistribute)}
                                            />
                                        </div>
                                        {autoDistribute && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="120"
                                                        value={Math.floor(targetSequenceDuration / 60)}
                                                        onChange={(e) => setTargetSequenceDuration(parseInt(e.target.value || '10') * 60)}
                                                        className="w-16 bg-white border border-violet-300 rounded-lg px-2 py-1 text-sm text-center"
                                                    />
                                                    <span className="text-xs text-violet-600">minutes total</span>
                                                </div>
                                                <button
                                                    onClick={distributeTimeEvenly}
                                                    className="w-full py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    Distribute {Math.floor(targetSequenceDuration / segments.length)} sec per frequency
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Segment list */}
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {segments.map((seg, i) => (
                                            <div
                                                key={seg.id}
                                                className="bg-slate-50 rounded-xl p-3 space-y-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full shrink-0"
                                                        style={{ backgroundColor: `hsl(${(i * 60) % 360}, 70%, 50%)` }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-slate-700 truncate">
                                                            {seg.frequencyLabel} Hz
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromSequence(seg.id)}
                                                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>

                                                {/* Duration preset buttons */}
                                                <div className="flex gap-1">
                                                    {SEGMENT_DURATION_PRESETS.map(preset => (
                                                        <button
                                                            key={preset.label}
                                                            onClick={() => updateSegmentDuration(seg.id, preset.seconds)}
                                                            className={`flex-1 py-1 rounded text-xs font-medium transition-all ${
                                                                seg.durationSeconds === preset.seconds
                                                                    ? 'bg-violet-500 text-white shadow'
                                                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                            }`}
                                                        >
                                                            {preset.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Manual input */}
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={seg.durationSeconds}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === '') return; // Allow empty for typing
                                                            const num = parseInt(val);
                                                            if (!isNaN(num)) {
                                                                updateSegmentDuration(seg.id, num);
                                                            }
                                                        }}
                                                        onBlur={(e) => {
                                                            const val = e.target.value;
                                                            if (val === '') {
                                                                updateSegmentDuration(seg.id, 60); // Default to 60 if empty
                                                            }
                                                        }}
                                                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-center"
                                                        placeholder="seconds"
                                                    />
                                                    <span className="text-xs text-slate-400">sec</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add frequencies - grouped by category */}
                            <div>
                                <label className="text-xs text-slate-500 mb-2 block flex items-center gap-1">
                                    <Plus size={12} /> Add to sequence
                                </label>

                                {/* Solfeggio */}
                                <div className="mb-2">
                                    <span className="text-[10px] text-violet-500 font-semibold uppercase tracking-wider">Solfeggio</span>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {frequencyPresets.filter(f => f.category === 'solfeggio').map(f => (
                                            <button
                                                key={f.label}
                                                onClick={() => addToSequence(f)}
                                                className="px-2.5 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-600 hover:text-violet-700 rounded-lg text-xs font-medium transition-colors border border-violet-200"
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Rose */}
                                <div className="mb-2">
                                    <span className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider">Rose</span>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {frequencyPresets.filter(f => f.category === 'rose').map(f => (
                                            <button
                                                key={f.label}
                                                onClick={() => addToSequence(f)}
                                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg text-xs font-medium transition-colors border border-rose-200"
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Special */}
                                <div>
                                    <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Special</span>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {frequencyPresets.filter(f => f.category === 'special').map(f => (
                                            <button
                                                key={f.label}
                                                onClick={() => addToSequence(f)}
                                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-700 rounded-lg text-xs font-medium transition-colors border border-amber-200"
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Instruction when ready */}
                    {!isActive && (
                        <div className="text-center py-3 px-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                            <p className="text-sm text-emerald-700 font-medium">
                                {mode === 'sequence' && segments.length === 0
                                    ? '⬆ Add frequencies to your sequence above'
                                    : '⬇ Press the Play button below to start'}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
