'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Page,
  Navbar,
  BlockTitle,
  Toggle
} from 'konsta/react';
import { Play, Square, Leaf, AudioWaveform, Music, Landmark, Infinity, Save, FolderOpen, Trash2, ChevronUp } from 'lucide-react';
import CymaticRing from '@/components/CymaticRing';
import SessionTimer from '@/components/SessionTimer';

// ==========================================
// PRESETS - Sound presets (NO frequency - that's separate)
// ==========================================
const SOUND_PRESETS = [
    { label: "Healing Pad", icon: "leaf", fmRatio: 1.0, fmDepth: 0.1, a: 1.5, d: 1.0, s: 0.8, r: 2.0, cutoff: 800, res: 0.0, noise: 0.0, lfoRate: 0.2, lfoAmt: 0.1, drive: 0.0, reverb: 0.1, delay: 0.0 },
    { label: "Pure Sine", icon: "waveform", fmRatio: 1.0, fmDepth: 0.0, a: 0.05, d: 0.1, s: 1.0, r: 0.1, cutoff: 5000, res: 0.0, noise: 0, lfoRate: 0, lfoAmt: 0, drive: 0, reverb: 0.1, delay: 0 },
    { label: "Warm String", icon: "music", fmRatio: 1.0, fmDepth: 0.3, a: 0.5, d: 0.5, s: 0.7, r: 1.0, cutoff: 1500, res: 0.1, noise: 0, lfoRate: 4.0, lfoAmt: 0.02, drive: 0.2, reverb: 0.4, delay: 0 },
    { label: "Temple Drone", icon: "landmark", fmRatio: 1.0, fmDepth: 0.1, a: 2.0, d: 1.0, s: 1.0, r: 3.0, cutoff: 600, res: 0.4, noise: 0.02, lfoRate: 0.1, lfoAmt: 0.1, drive: 0.1, reverb: 0.8, delay: 0.2 },
    { label: "Deep Om", icon: "infinity", fmRatio: 1.0, fmDepth: 0.2, a: 1.0, d: 2.0, s: 0.6, r: 3.0, cutoff: 400, res: 0.0, noise: 0.02, lfoRate: 0.1, lfoAmt: 0.1, drive: 0.3, reverb: 0.5, delay: 0.1 },
];

// ==========================================
// FREQUENCY PRESETS - Organized by category
// ==========================================
type FrequencyCategory = 'solfeggio' | 'rose' | 'special';

interface FrequencyPreset {
    label: string;
    frequency: number;
    category: FrequencyCategory;
    description?: string;
}

const FREQUENCY_PRESETS: FrequencyPreset[] = [
    // Solfeggio frequencies
    { label: "396", frequency: 396, category: 'solfeggio', description: "Liberation" },
    { label: "417", frequency: 417, category: 'solfeggio', description: "Change" },
    { label: "528", frequency: 528, category: 'solfeggio', description: "Miracles" },
    { label: "639", frequency: 639, category: 'solfeggio', description: "Connection" },
    { label: "741", frequency: 741, category: 'solfeggio', description: "Expression" },
    { label: "852", frequency: 852, category: 'solfeggio', description: "Intuition" },
    // Rose frequencies (power of 2)
    { label: "32", frequency: 32, category: 'rose' },
    { label: "64", frequency: 64, category: 'rose' },
    { label: "128", frequency: 128, category: 'rose' },
    { label: "256", frequency: 256, category: 'rose' },
    { label: "512", frequency: 512, category: 'rose' },
    { label: "1024", frequency: 1024, category: 'rose' },
    // Special frequencies
    { label: "Om", frequency: 136.1, category: 'special', description: "Cosmic Om" },
    { label: "432", frequency: 432, category: 'special', description: "Verdi A" },
];

// Icon mapping for presets
const PRESET_ICONS: Record<string, React.ReactNode> = {
    leaf: <Leaf size={20} />,
    waveform: <AudioWaveform size={20} />,
    music: <Music size={20} />,
    landmark: <Landmark size={20} />,
    infinity: <Infinity size={20} />,
};

// Default to Healing Pad preset values
const DEFAULT_PRESET = SOUND_PRESETS[0];

const BRAINWAVES = [
    { label: "Delta", freq: 2.0, desc: "Deep Sleep" },
    { label: "Theta", freq: 6.0, desc: "Meditation" },
    { label: "Alpha", freq: 10.0, desc: "Relaxation" },
    { label: "Beta", freq: 20.0, desc: "Focus" },
];

// ==========================================
// SESSION TEMPLATES
// ==========================================
interface SessionTemplate {
    id: string;
    name: string;
    description?: string;
    timestamp: number;
    // Sound parameters
    soundPreset: string;
    freq: number;
    cutoff: number;
    resonance: number;
    env: { a: number; d: number; s: number; r: number };
    fmRatio: number;
    fmDepth: number;
    noise: number;
    lfoRate: number;
    lfoAmt: number;
    drive: number;
    reverb: number;
    delay: number;
    // Binaural
    binauralOn: boolean;
    beatFreq: number;
}

const STORAGE_KEY = 'meditation-templates';

// SOLFEGGIO removed - now using FREQUENCY_PRESETS

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSoundPreset, setActiveSoundPreset] = useState("Healing Pad");
  const [frequencyCategory, setFrequencyCategory] = useState<FrequencyCategory>('solfeggio');
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [customFrequency, setCustomFrequency] = useState('');

  // Smart Play Button - track if session is ready
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const sessionStartHandlerRef = useRef<(() => void) | null>(null);

  // CORE PARAMS - Default to 432 Hz (Verdi A)
  const [freq, setFreq] = useState(432);
  const [cutoff, setCutoff] = useState(DEFAULT_PRESET.cutoff);
  const [resonance, setResonance] = useState(DEFAULT_PRESET.res);
  const [env, setEnv] = useState({ a: DEFAULT_PRESET.a, d: DEFAULT_PRESET.d, s: DEFAULT_PRESET.s, r: DEFAULT_PRESET.r });

  // FX PARAMS - Default to Healing Pad values
  const [fmRatio, setFmRatio] = useState(DEFAULT_PRESET.fmRatio);
  const [fmDepth, setFmDepth] = useState(DEFAULT_PRESET.fmDepth);
  const [noise, setNoise] = useState(DEFAULT_PRESET.noise);
  const [lfoRate, setLfoRate] = useState(DEFAULT_PRESET.lfoRate);
  const [lfoAmt, setLfoAmt] = useState(DEFAULT_PRESET.lfoAmt);
  const [drive, setDrive] = useState(DEFAULT_PRESET.drive);
  const [reverb, setReverb] = useState(DEFAULT_PRESET.reverb);
  const [delay, setDelay] = useState(DEFAULT_PRESET.delay);

  const [binauralOn, setBinauralOn] = useState(false);
  const [beatFreq, setBeatFreq] = useState(10.0);

  // Template management
  const [savedTemplates, setSavedTemplates] = useState<SessionTemplate[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const initAudio = async () => {
    try {
      const ctx = new window.AudioContext();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048; // Reduced from 4096 to fix stuttering
      analyserRef.current = analyser;

      await ctx.audioWorklet.addModule('/polyfills.js');
      await ctx.audioWorklet.addModule('/worklet.js');

      const response = await fetch('/wasm/frequency_player_engine_bg.wasm');
      if (!response.ok) throw new Error("WASM fetch failed");
      const wasmBytes = await response.arrayBuffer();

      const node = new AudioWorkletNode(ctx, 'rust-synth-processor', { outputChannelCount: [2] });
      node.port.postMessage({ type: 'INIT', wasmBytes });

      node.connect(analyser);
      analyser.connect(ctx.destination);
      workletNodeRef.current = node;

      node.port.onmessage = (e) => {
        if (e.data.type === 'READY') {
          setIsReady(true);
          pushAllParams(node);
        }
      };
    } catch (err) { console.error(err); }
  };

  const pushAllParams = (node: AudioWorkletNode) => {
      node.port.postMessage({ type: 'SET_FREQ', freq });
      node.port.postMessage({ type: 'SET_FILTER', cutoff, resonance });
      node.port.postMessage({ type: 'SET_FM', ratio: fmRatio, depth: fmDepth });
      node.port.postMessage({ type: 'SET_ENVELOPE', ...env });
      node.port.postMessage({ type: 'SET_NOISE', amt: noise });
      node.port.postMessage({ type: 'SET_LFO', rate: lfoRate, amt: lfoAmt });
      node.port.postMessage({ type: 'SET_DRIVE', amt: drive });
      node.port.postMessage({ type: 'SET_FX', reverb, delay });
      node.port.postMessage({ type: 'SET_BINAURAL', enabled: binauralOn, beat: beatFreq });
  };

  // Smart context-aware play handler
  const togglePlay = () => {
      // If session is configured, start the session instead
      if (hasActiveSession && sessionStartHandlerRef.current && !isPlaying) {
          sessionStartHandlerRef.current();
          return;
      }

      // Otherwise, manual play (continuous)
      if (!audioContextRef.current) { initAudio(); return; }
      if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
      const node = workletNodeRef.current;
      if (!node) return;

      if (isPlaying) {
          node.port.postMessage({ type: 'NOTE_OFF' });
          setIsPlaying(false);
      } else {
          node.port.postMessage({ type: 'NOTE_ON' });
          setIsPlaying(true);
      }
  };

  // Callback from SessionTimer to notify about session status
  const handleSessionStatusChange = useCallback((isReady: boolean, startHandler: (() => void) | null) => {
      setHasActiveSession(isReady);
      sessionStartHandlerRef.current = startHandler;
  }, []);

  // Load sound preset - does NOT change frequency
  const loadSoundPreset = (p: typeof SOUND_PRESETS[0]) => {
      setActiveSoundPreset(p.label);
      setCutoff(p.cutoff); setResonance(p.res);
      setFmRatio(p.fmRatio); setFmDepth(p.fmDepth);
      setEnv({ a: p.a, d: p.d, s: p.s, r: p.r });
      setNoise(p.noise); setLfoRate(p.lfoRate); setLfoAmt(p.lfoAmt); setDrive(p.drive);
      setReverb(p.reverb || 0); setDelay(p.delay || 0);

      if (workletNodeRef.current) {
          const node = workletNodeRef.current;
          node.port.postMessage({ type: 'SET_FILTER', cutoff: p.cutoff, resonance: p.res });
          node.port.postMessage({ type: 'SET_FM', ratio: p.fmRatio, depth: p.fmDepth });
          node.port.postMessage({ type: 'SET_ENVELOPE', a: p.a, d: p.d, s: p.s, r: p.r });
          node.port.postMessage({ type: 'SET_NOISE', amt: p.noise });
          node.port.postMessage({ type: 'SET_LFO', rate: p.lfoRate, amt: p.lfoAmt });
          node.port.postMessage({ type: 'SET_DRIVE', amt: p.drive });
          node.port.postMessage({ type: 'SET_FX', reverb: p.reverb || 0, delay: p.delay || 0 });
      }
  };

  // Load frequency preset
  const loadFrequencyPreset = useCallback((f: number) => {
      setFreq(f);
      if (workletNodeRef.current) {
          workletNodeRef.current.port.postMessage({ type: 'SET_FREQ', freq: f });
      }
  }, []);

  // Handle session start - start playing if not already
  const handleSessionStart = useCallback(() => {
      if (!isPlaying && workletNodeRef.current) {
          workletNodeRef.current.port.postMessage({ type: 'NOTE_ON' });
          setIsPlaying(true);
      }
  }, [isPlaying]);

  // Handle session end - stop playing
  const handleSessionEnd = useCallback(() => {
      if (isPlaying && workletNodeRef.current) {
          workletNodeRef.current.port.postMessage({ type: 'NOTE_OFF' });
          setIsPlaying(false);
      }
  }, [isPlaying]);


  const updateVal = (setter: any, type: string, val: any) => {
      setter(val);
      if (workletNodeRef.current) workletNodeRef.current.port.postMessage({ type, ...val });
  };

  const randomize = () => {
      setActiveSoundPreset("");
      const r = (min: number, max: number) => Math.random() * (max - min) + min;
      const newP = {
          label: "",
          icon: "waveform" as const,
          fmRatio: r(0.5, 3.5), fmDepth: r(0, 0.8),
          cutoff: r(500, 4000), res: r(0, 0.5),
          noise: r(0, 0.3), drive: r(0, 0.5),
          lfoRate: r(0, 10), lfoAmt: r(0, 0.5),
          a: r(0.01, 2.0), d: r(0.1, 1.0), s: r(0.5, 1.0), r: r(0.5, 3.0),
          reverb: r(0, 0.8), delay: r(0, 0.5)
      };
      loadSoundPreset(newP);
  };

  // Load templates from localStorage on mount
  useEffect(() => {
      try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
              const templates = JSON.parse(stored) as SessionTemplate[];
              setSavedTemplates(templates);
          }
      } catch (err) {
          console.error('Failed to load templates:', err);
      }
  }, []);

  // Save current state as template
  const saveTemplate = () => {
      if (!templateName.trim()) {
          alert('Please enter a template name');
          return;
      }

      const newTemplate: SessionTemplate = {
          id: crypto.randomUUID(),
          name: templateName.trim(),
          description: templateDescription.trim() || undefined,
          timestamp: Date.now(),
          soundPreset: activeSoundPreset,
          freq,
          cutoff,
          resonance,
          env,
          fmRatio,
          fmDepth,
          noise,
          lfoRate,
          lfoAmt,
          drive,
          reverb,
          delay,
          binauralOn,
          beatFreq,
      };

      const updated = [...savedTemplates, newTemplate];
      setSavedTemplates(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      setTemplateName('');
      setTemplateDescription('');
      setShowTemplateDialog(false);
  };

  // Load template
  const loadTemplate = (template: SessionTemplate) => {
      setActiveSoundPreset(template.soundPreset);
      setFreq(template.freq);
      setCutoff(template.cutoff);
      setResonance(template.resonance);
      setEnv(template.env);
      setFmRatio(template.fmRatio);
      setFmDepth(template.fmDepth);
      setNoise(template.noise);
      setLfoRate(template.lfoRate);
      setLfoAmt(template.lfoAmt);
      setDrive(template.drive);
      setReverb(template.reverb);
      setDelay(template.delay);
      setBinauralOn(template.binauralOn);
      setBeatFreq(template.beatFreq);

      if (workletNodeRef.current) {
          const node = workletNodeRef.current;
          node.port.postMessage({ type: 'SET_FREQ', freq: template.freq });
          node.port.postMessage({ type: 'SET_FILTER', cutoff: template.cutoff, resonance: template.resonance });
          node.port.postMessage({ type: 'SET_FM', ratio: template.fmRatio, depth: template.fmDepth });
          node.port.postMessage({ type: 'SET_ENVELOPE', ...template.env });
          node.port.postMessage({ type: 'SET_NOISE', amt: template.noise });
          node.port.postMessage({ type: 'SET_LFO', rate: template.lfoRate, amt: template.lfoAmt });
          node.port.postMessage({ type: 'SET_DRIVE', amt: template.drive });
          node.port.postMessage({ type: 'SET_FX', reverb: template.reverb, delay: template.delay });
          node.port.postMessage({ type: 'SET_BINAURAL', enabled: template.binauralOn, beat: template.beatFreq });
      }
  };

  // Delete template
  const deleteTemplate = (id: string) => {
      if (!confirm('Delete this template?')) return;
      const updated = savedTemplates.filter(t => t.id !== id);
      setSavedTemplates(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <Page className="bg-gradient-to-b from-slate-50 to-slate-100">
      <Navbar
        title="Resonance"
        transparent
        centerTitle
        className="!text-slate-700"
      />

      {/* 1. HERO VISUALIZER */}
      <div className="relative w-full h-[35vh] flex flex-col items-center justify-center">
         <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/50 to-transparent rounded-b-[60px]" />
         <CymaticRing analyser={analyserRef.current} width={280} height={280} color={isPlaying ? "#0891b2" : "#cbd5e1"} />

         {/* Frequency Readout Overlay */}
         <div className="absolute flex flex-col items-center pointer-events-none">
            <h1 className={`text-5xl font-light tracking-tight transition-all duration-700 ${isPlaying ? "text-slate-800" : "text-slate-400"}`}>
              {freq.toFixed(1)} <span className="text-sm text-slate-400 font-normal tracking-widest">Hz</span>
            </h1>
            {binauralOn && (
                <div className="text-xs text-emerald-600 tracking-[0.15em] mt-2 font-medium">
                    BINAURAL {beatFreq} Hz
                </div>
            )}
         </div>
      </div>

      {/* 2. LAB SECTION - Always visible */}
      <div className="px-4 py-3">
        <BlockTitle className="!text-emerald-700 !font-semibold">Session</BlockTitle>
        <SessionTimer
            currentFrequency={freq}
            frequencyPresets={FREQUENCY_PRESETS}
            onFrequencyChange={loadFrequencyPreset}
            onSessionStart={handleSessionStart}
            onSessionEnd={handleSessionEnd}
            onSessionStatusChange={handleSessionStatusChange}
            className="mb-4"
        />

        {/* Templates */}
        <BlockTitle className="!text-amber-700 !font-semibold">Templates</BlockTitle>
        <div className="glass-card rounded-2xl p-4 mb-4">
            {/* Save Template Button */}
            <button
                onClick={() => setShowTemplateDialog(!showTemplateDialog)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all mb-3"
            >
                <Save size={18} />
                Save Current as Template
            </button>

            {/* Save Template Dialog */}
            {showTemplateDialog && (
                <div className="mb-4 p-3 bg-white rounded-xl border-2 border-amber-200 animate-in fade-in slide-in-from-top-2">
                    <input
                        type="text"
                        placeholder="Template name (required)"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="w-full px-3 py-2 mb-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <input
                        type="text"
                        placeholder="Description (optional)"
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        className="w-full px-3 py-2 mb-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={saveTemplate}
                            className="flex-1 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => {
                                setShowTemplateDialog(false);
                                setTemplateName('');
                                setTemplateDescription('');
                            }}
                            className="flex-1 py-2 bg-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Saved Templates List */}
            {savedTemplates.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <FolderOpen size={14} />
                        <span>Saved Templates ({savedTemplates.length})</span>
                    </div>
                    {savedTemplates
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .map(template => (
                            <div
                                key={template.id}
                                className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                <button
                                    onClick={() => loadTemplate(template)}
                                    className="flex-1 text-left min-w-0"
                                >
                                    <div className="font-semibold text-slate-700 text-sm truncate">
                                        {template.name}
                                    </div>
                                    {template.description && (
                                        <div className="text-xs text-slate-500 truncate">
                                            {template.description}
                                        </div>
                                    )}
                                    <div className="text-xs text-slate-400 mt-1">
                                        {template.freq.toFixed(1)} Hz • {template.soundPreset || 'Custom'}
                                    </div>
                                </button>
                                <button
                                    onClick={() => deleteTemplate(template.id)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 shrink-0"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                </div>
            ) : (
                <div className="text-center py-6 text-slate-400 text-sm">
                    No templates saved yet
                </div>
            )}
        </div>
      </div>

      {/* 3. SETTINGS ACCORDION (Floating Glass Dock) */}
      <div className="fixed bottom-0 left-0 w-full p-4 pb-8 z-50 bg-gradient-to-t from-slate-100 via-slate-100/95 to-transparent pointer-events-none">

         {/* Smart Play Button - Context-aware */}
         <div className="flex flex-col items-center -mt-8 mb-3 pointer-events-auto">
            <button
                onClick={togglePlay}
                className={`w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-md border-2 transition-all duration-500 shadow-xl
                ${isPlaying
                    ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 border-cyan-400 shadow-cyan-200/50 text-white'
                    : hasActiveSession
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 shadow-emerald-200/50 text-white hover:scale-105'
                    : 'bg-white/95 border-slate-200 text-slate-400 hover:border-cyan-300 hover:text-cyan-500'}`}
            >
                {isPlaying ? <Square size={22} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>
            {/* Context indicator */}
            {hasActiveSession && !isPlaying && (
                <div className="mt-2 px-3 py-1 bg-emerald-500/90 backdrop-blur-sm rounded-full text-white text-xs font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2">
                    Start Session
                </div>
            )}
         </div>

         {/* Accordion Toggle Bar (when closed) */}
         {!settingsOpen && (
            <div className="flex justify-center mb-2 pointer-events-auto">
               <button
                  onClick={() => setSettingsOpen(true)}
                  className="px-6 py-2 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg flex items-center gap-2 text-slate-600 hover:text-violet-600 hover:border-violet-300 transition-all text-sm font-medium"
               >
                  <span>Settings</span>
                  <ChevronUp size={16} />
               </button>
            </div>
         )}

         {/* ALL SETTINGS SECTIONS (when open) */}
         {settingsOpen && (
            <div className="animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-auto space-y-3">

               {/* 1. FREQUENCIES */}
               <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 text-center">Frequencies</h3>

                  {/* Frequency Category Tabs */}
                  <div className="flex justify-center gap-2 mb-3">
                     {(['solfeggio', 'rose', 'special'] as FrequencyCategory[]).map(cat => (
                        <button
                           key={cat}
                           onClick={() => setFrequencyCategory(cat)}
                           className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300
                           ${frequencyCategory === cat
                              ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg'
                              : 'bg-slate-100 text-slate-500 hover:text-violet-600'}`}
                        >
                           {cat}
                        </button>
                     ))}
                  </div>

                  {/* Frequency Presets (Horizontal Scroll) */}
                  <div className="flex gap-3 overflow-x-auto pb-3 px-2 no-scrollbar snap-x">
                     {FREQUENCY_PRESETS
                        .filter(f => f.category === frequencyCategory)
                        .map(f => (
                        <button
                           key={f.label}
                           onClick={() => loadFrequencyPreset(f.frequency)}
                           className={`snap-center shrink-0 w-16 h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-300
                           ${freq === f.frequency
                              ? 'bg-gradient-to-br from-violet-500 to-purple-600 border-violet-400 text-white shadow-lg shadow-violet-200/50'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-violet-200'}`}
                        >
                           <span className="text-lg font-bold">{f.label}</span>
                           <span className="text-[9px] uppercase tracking-widest opacity-70">
                              {f.description || 'Hz'}
                           </span>
                        </button>
                     ))}
                  </div>

                  {/* Custom Frequency Input (Special tab only) */}
                  {frequencyCategory === 'special' && (
                     <div className="mt-3 pt-3 border-t border-slate-200">
                        <label className="text-xs text-slate-500 mb-2 block">Custom Frequency</label>
                        <div className="flex gap-2">
                           <input
                              type="number"
                              min="20"
                              max="2000"
                              step="0.1"
                              value={customFrequency}
                              onChange={(e) => setCustomFrequency(e.target.value)}
                              placeholder="Enter Hz..."
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                           />
                           <button
                              onClick={() => {
                                 const val = parseFloat(customFrequency);
                                 if (!isNaN(val) && val >= 20 && val <= 2000) {
                                    loadFrequencyPreset(val);
                                    setCustomFrequency('');
                                 }
                              }}
                              className="px-4 py-2 bg-violet-500 text-white rounded-lg font-medium hover:bg-violet-600"
                           >
                              Set
                           </button>
                        </div>
                     </div>
                  )}
               </div>

               {/* 2. TONE (Sound Presets) */}
               <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 text-center">Tone</h3>
                  <div className="grid grid-cols-5 gap-2">
                     {SOUND_PRESETS.map(p => (
                        <button
                           key={p.label}
                           onClick={() => loadSoundPreset(p)}
                           className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300
                           ${activeSoundPreset === p.label
                              ? 'preset-active text-white shadow-lg scale-105'
                              : 'bg-white text-slate-600 hover:scale-102 border border-slate-200'}`}
                        >
                           <span className="mb-1.5">
                              {PRESET_ICONS[p.icon]}
                           </span>
                           <span className="text-[10px] font-medium leading-tight text-center">{p.label}</span>
                        </button>
                     ))}
                  </div>
               </div>

               {/* 3. BINAURAL */}
               <div className="glass-card rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-sm font-semibold text-slate-700">Binaural Entrainment</span>
                     <Toggle
                        checked={binauralOn}
                        onChange={() => {
                           const next = !binauralOn;
                           setBinauralOn(next);
                           if (workletNodeRef.current) workletNodeRef.current.port.postMessage({ type: 'SET_BINAURAL', enabled: next, beat: beatFreq });
                        }}
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     {BRAINWAVES.map(w => (
                        <button
                           key={w.label}
                           onClick={() => {
                              setBeatFreq(w.freq);
                              if (workletNodeRef.current) workletNodeRef.current.port.postMessage({ type: 'SET_BINAURAL', enabled: binauralOn, beat: w.freq });
                           }}
                           className={`p-3 rounded-xl border-2 text-left transition-all duration-300
                           ${beatFreq === w.freq
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 text-white shadow-lg'
                              : 'bg-white border-slate-200 text-slate-600'}`}
                        >
                           <div className="text-xs font-bold uppercase tracking-wider">{w.label}</div>
                           <div className="text-lg font-light">{w.freq} Hz</div>
                           <div className="text-[10px] opacity-70">{w.desc}</div>
                        </button>
                     ))}
                  </div>
               </div>

               {/* Close button */}
               <div className="flex justify-center">
                  <button
                     onClick={() => setSettingsOpen(false)}
                     className="px-4 py-1 rounded-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                     Hide ↓
                  </button>
               </div>
            </div>
         )}
      </div>


      {/* spacer for bottom dock - ensures content isn't hidden behind fixed dock */}
      <div className="h-64" />

    </Page>
  );
}
