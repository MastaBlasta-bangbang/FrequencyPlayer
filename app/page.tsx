'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Page,
  Navbar,
  BlockTitle,
  Toggle
} from 'konsta/react';
import { Play, Square, Leaf, AudioWaveform, Music, Landmark, Infinity, Save, FolderOpen, Trash2, ChevronUp, ChevronDown, Settings } from 'lucide-react';
import CymaticRing from '@/components/CymaticRing';
import WaveformVisualizer from '@/components/WaveformVisualizer';
import MandalaVisualizer from '@/components/MandalaVisualizer';
import LissajousVisualizer from '@/components/LissajousVisualizer';
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
    // Solfeggio frequencies (complete scale)
    { label: "174", frequency: 174, category: 'solfeggio', description: "Pain Relief" },
    { label: "285", frequency: 285, category: 'solfeggio', description: "Healing" },
    { label: "396", frequency: 396, category: 'solfeggio', description: "Liberation" },
    { label: "417", frequency: 417, category: 'solfeggio', description: "Change" },
    { label: "528", frequency: 528, category: 'solfeggio', description: "Miracles" },
    { label: "639", frequency: 639, category: 'solfeggio', description: "Connection" },
    { label: "741", frequency: 741, category: 'solfeggio', description: "Expression" },
    { label: "852", frequency: 852, category: 'solfeggio', description: "Intuition" },
    { label: "963", frequency: 963, category: 'solfeggio', description: "Crown" },
    // Rose frequencies (power of 2)
    { label: "32", frequency: 32, category: 'rose' },
    { label: "64", frequency: 64, category: 'rose' },
    { label: "128", frequency: 128, category: 'rose' },
    { label: "256", frequency: 256, category: 'rose' },
    { label: "512", frequency: 512, category: 'rose' },
    { label: "1024", frequency: 1024, category: 'rose' },
    // Special frequencies
    { label: "Schumann", frequency: 7.83, category: 'special', description: "Earth" },
    { label: "40Hz", frequency: 40, category: 'special', description: "Gamma" },
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
    { label: "Gamma", freq: 40.0, desc: "Peak Awareness" },
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
const SETTINGS_STORAGE_KEY = 'meditation-app-settings';

// SOLFEGGIO removed - now using FREQUENCY_PRESETS

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSoundPreset, setActiveSoundPreset] = useState("Healing Pad");
  const [frequencyCategory, setFrequencyCategory] = useState<FrequencyCategory>('solfeggio');
  const [settingsOpen, setSettingsOpen] = useState(false); // CLOSED by default!
  const [customFrequency, setCustomFrequency] = useState('');

  // Collapsible sub-sections - ALL CLOSED by default
  const [frequenciesExpanded, setFrequenciesExpanded] = useState(false);
  const [toneExpanded, setToneExpanded] = useState(false);
  const [sessionTimerExpanded, setSessionTimerExpanded] = useState(false);
  const [sequenceBuilderExpanded, setSequenceBuilderExpanded] = useState(false);

  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPresetSelector, setShowPresetSelector] = useState(false);

  // Session Timer state
  const [sessionTimerEnabled, setSessionTimerEnabled] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(60); // seconds
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0);
  const [sessionTimerActive, setSessionTimerActive] = useState(false);
  const sessionTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // App settings (for modal)
  const [defaultFrequencyInput, setDefaultFrequencyInput] = useState('432');
  const [defaultTone, setDefaultTone] = useState('Healing Pad');
  const [visualizerType, setVisualizerType] = useState<'cymatic' | 'waveform' | 'mandala' | 'lissajous'>('cymatic');

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

  // Initialize audio on mount
  useEffect(() => {
      initAudio();
  }, []);

  // Smart context-aware play handler
  const togglePlay = async () => {
      // Ensure audio context is ready and running FIRST
      if (audioContextRef.current) {
          if (audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
          }
          // Wait for it to actually be running
          if (audioContextRef.current.state !== 'running') {
              console.log('Audio context not running');
              return;
          }
      }

      // If session is configured, start the session instead
      if (hasActiveSession && sessionStartHandlerRef.current && !isPlaying) {
          sessionStartHandlerRef.current();
          return;
      }

      // Ensure audio is initialized
      if (!audioContextRef.current) {
          await initAudio();
          // Wait a bit for WASM to be ready
          await new Promise(resolve => setTimeout(resolve, 100));
      }

      const node = workletNodeRef.current;

      // Check if system is ready
      if (!node || !isReady) {
          console.log('Audio system not ready yet, please wait...');
          return;
      }

      // Toggle play/stop
      if (isPlaying) {
          node.port.postMessage({ type: 'NOTE_OFF' });
          setIsPlaying(false);
          // Stop session timer if active
          if (sessionTimerActive) {
              setSessionTimerActive(false);
              if (sessionTimerIntervalRef.current) {
                  clearInterval(sessionTimerIntervalRef.current);
                  sessionTimerIntervalRef.current = null;
              }
          }
      } else {
          // CRITICAL: Resume audio context BEFORE sending NOTE_ON
          if (audioContextRef.current) {
              if (audioContextRef.current.state === 'suspended') {
                  await audioContextRef.current.resume();
              }

              // Double-check it's actually running
              if (audioContextRef.current.state !== 'running') {
                  console.log('Audio context not running, state:', audioContextRef.current.state);
                  return;
              }
          }

          // Now safe to start audio
          node.port.postMessage({ type: 'NOTE_ON' });
          setIsPlaying(true);

          // Start session timer if enabled
          if (sessionTimerEnabled && sessionDuration > 0) {
              setSessionTimeRemaining(sessionDuration);
              setSessionTimerActive(true);
          }
      }
  };

  // Session timer countdown logic
  useEffect(() => {
      if (sessionTimerActive && sessionTimeRemaining > 0) {
          sessionTimerIntervalRef.current = setInterval(() => {
              setSessionTimeRemaining(prev => {
                  if (prev <= 1) {
                      // Timer reached zero - stop playback
                      if (workletNodeRef.current && isPlaying) {
                          workletNodeRef.current.port.postMessage({ type: 'NOTE_OFF' });
                          setIsPlaying(false);
                      }
                      setSessionTimerActive(false);
                      if (sessionTimerIntervalRef.current) {
                          clearInterval(sessionTimerIntervalRef.current);
                          sessionTimerIntervalRef.current = null;
                      }
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
      }

      return () => {
          if (sessionTimerIntervalRef.current) {
              clearInterval(sessionTimerIntervalRef.current);
              sessionTimerIntervalRef.current = null;
          }
      };
  }, [sessionTimerActive, isPlaying]);

  // Sync defaultFrequencyInput with freq changes from main controls
  useEffect(() => {
      setDefaultFrequencyInput(String(freq));
  }, [freq]);

  // Sync defaultTone with activeSoundPreset changes
  useEffect(() => {
      setDefaultTone(activeSoundPreset);
  }, [activeSoundPreset]);

  // Auto-save settings when freq, preset, or visualizer changes (debounced via timeout)
  useEffect(() => {
      const timeoutId = setTimeout(() => {
          saveAppSettings();
      }, 500); // Debounce 500ms to avoid too many writes

      return () => clearTimeout(timeoutId);
  }, [freq, activeSoundPreset, visualizerType]);

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
  const handleSessionStart = useCallback(async () => {
      if (!isPlaying && workletNodeRef.current && audioContextRef.current) {
          // Resume audio context if needed (browser requirement)
          if (audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
          }

          // Verify it's running before starting
          if (audioContextRef.current.state === 'running') {
              workletNodeRef.current.port.postMessage({ type: 'NOTE_ON' });
              setIsPlaying(true);
          }
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

  // Load templates and app settings from localStorage on mount
  useEffect(() => {
      try {
          // Load templates
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
              const templates = JSON.parse(stored) as SessionTemplate[];
              setSavedTemplates(templates);
          }

          // Load app settings
          const settingsStored = localStorage.getItem(SETTINGS_STORAGE_KEY);
          if (settingsStored) {
              const settings = JSON.parse(settingsStored);

              // Apply default frequency (updates both display and audio engine)
              if (settings.defaultFrequency) {
                  loadFrequencyPreset(settings.defaultFrequency);
                  setDefaultFrequencyInput(String(settings.defaultFrequency));
              }

              // Apply default tone preset
              if (settings.defaultTone) {
                  setDefaultTone(settings.defaultTone);
                  setActiveSoundPreset(settings.defaultTone);
                  const preset = SOUND_PRESETS.find(p => p.label === settings.defaultTone);
                  if (preset) {
                      loadSoundPreset(preset);
                  }
              }

              // Apply visualizer preference
              if (settings.visualizer) {
                  setVisualizerType(settings.visualizer);
              }
          }
      } catch (err) {
          console.error('Failed to load settings:', err);
      }
  }, [loadFrequencyPreset]);

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

  // Save app settings to localStorage
  const saveAppSettings = () => {
      try {
          const settings = {
              defaultFrequency: freq,
              defaultTone: activeSoundPreset,
              visualizer: visualizerType,
          };
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch (err) {
          console.error('Failed to save settings:', err);
      }
  };

  // Apply default tone from settings modal
  const applyDefaultTone = (presetLabel: string) => {
      setDefaultTone(presetLabel);
      const preset = SOUND_PRESETS.find(p => p.label === presetLabel);
      if (preset) {
          loadSoundPreset(preset);
          saveAppSettings();
      }
  };

  // Apply default frequency from settings modal (manual input)
  const applyDefaultFrequencyInput = () => {
      const val = parseFloat(defaultFrequencyInput);
      if (!isNaN(val) && val >= 20 && val <= 2000) {
          loadFrequencyPreset(val);
          saveAppSettings();
      }
  };

  // Apply frequency from preset selector in modal
  const applyFrequencyPreset = (frequency: number) => {
      loadFrequencyPreset(frequency);
      setDefaultFrequencyInput(String(frequency));
      setShowPresetSelector(false);
      saveAppSettings();
  };

  return (
    <Page className="bg-gradient-to-b from-slate-50 to-slate-100">
      <Navbar
        title="Resonance"
        transparent
        centerTitle
        className="!text-slate-700"
        right={
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-full hover:bg-slate-200/50 transition-colors"
          >
            <Settings size={20} className="text-slate-600" />
          </button>
        }
      />

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowSettingsModal(false)}>
          <div className="glass-card rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">App Settings</h2>
              <button onClick={() => setShowSettingsModal(false)} className="p-1 hover:bg-slate-200 rounded-full">
                <ChevronDown size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Default Session Length */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Default Session Length</label>
                <div className="flex gap-2">
                  <input type="number" min="1" max="120" placeholder="Minutes" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600">Save</button>
                </div>
              </div>

              {/* Default Tone */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Default Tone</label>
                <select
                  value={defaultTone}
                  onChange={(e) => applyDefaultTone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  {SOUND_PRESETS.map(p => (
                    <option key={p.label} value={p.label}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Default START Frequency */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Default START Frequency</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="20"
                    max="2000"
                    step="0.1"
                    placeholder="Hz"
                    value={defaultFrequencyInput}
                    onChange={(e) => setDefaultFrequencyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        applyDefaultFrequencyInput();
                      }
                    }}
                    onBlur={applyDefaultFrequencyInput}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <button onClick={() => setShowPresetSelector(!showPresetSelector)} className="px-4 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium hover:bg-violet-600">
                    Select from Presets
                  </button>
                </div>
                {showPresetSelector && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-48 overflow-y-auto">
                    {(['solfeggio', 'rose', 'special'] as FrequencyCategory[]).map(cat => (
                      <div key={cat} className="mb-3">
                        <div className="text-xs font-semibold text-slate-600 uppercase mb-1">{cat}</div>
                        <div className="flex flex-wrap gap-1">
                          {FREQUENCY_PRESETS.filter(f => f.category === cat).map(f => (
                            <button
                              key={f.label}
                              onClick={() => applyFrequencyPreset(f.frequency)}
                              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs hover:bg-violet-100"
                            >
                              {f.label} ({f.frequency}Hz)
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Custom Frequency */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Add Custom Frequency to Special</label>
                <div className="flex gap-2">
                  <input type="number" min="20" max="2000" step="0.1" placeholder="Hz" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  <input type="text" placeholder="Label" className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  <button className="px-4 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium hover:bg-violet-600">Add</button>
                </div>
              </div>

              {/* Binaural Always On */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Binaural Always On</label>
                <Toggle checked={binauralOn} onChange={() => setBinauralOn(!binauralOn)} />
              </div>

              {/* Visualizer Type */}
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Visualizer Style</label>
                <select
                  value={visualizerType}
                  onChange={(e) => setVisualizerType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="cymatic">Cymatic Ring</option>
                  <option value="waveform">Classic Waveform</option>
                  <option value="mandala">Mandala</option>
                  <option value="lissajous">Lissajous Curve</option>
                </select>
              </div>

            </div>

            <button onClick={() => setShowSettingsModal(false)} className="w-full mt-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900">
              Close Settings
            </button>
          </div>
        </div>
      )}

      {/* 1. HERO VISUALIZER */}
      <div className="relative w-full h-[35vh] flex flex-col items-center justify-center">
         <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/50 to-transparent rounded-b-[60px]" />
         {visualizerType === 'cymatic' && (
            <CymaticRing analyser={analyserRef.current} width={280} height={280} color={isPlaying ? "#0891b2" : "#cbd5e1"} />
         )}
         {visualizerType === 'waveform' && (
            <WaveformVisualizer analyser={analyserRef.current} width={280} height={280} color={isPlaying ? "#0891b2" : "#cbd5e1"} />
         )}
         {visualizerType === 'mandala' && (
            <MandalaVisualizer analyser={analyserRef.current} width={280} height={280} color={isPlaying ? "#0891b2" : "#cbd5e1"} />
         )}
         {visualizerType === 'lissajous' && (
            <LissajousVisualizer analyser={analyserRef.current} width={280} height={280} color={isPlaying ? "#0891b2" : "#cbd5e1"} />
         )}

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


      {/* 3. SETTINGS ACCORDION (Floating Glass Dock) */}
      <div className="fixed bottom-0 left-0 w-full p-4 pb-8 z-50 bg-gradient-to-t from-slate-100 via-slate-100/95 to-transparent pointer-events-none">

         {/* Smart Play Button - Context-aware */}
         <div className="flex flex-col items-center -mt-8 mb-3 pointer-events-auto">
            <button
                onClick={togglePlay}
                disabled={!isReady}
                className={`play-button-landscape w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-md border-2 transition-all duration-500 shadow-xl
                ${!isReady
                    ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-wait'
                    : isPlaying
                    ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 border-cyan-400 shadow-cyan-200/50 text-white'
                    : hasActiveSession
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 shadow-emerald-200/50 text-white hover:scale-105'
                    : 'bg-white/95 border-slate-200 text-slate-400 hover:border-cyan-300 hover:text-cyan-500'}`}
            >
                {!isReady ? (
                    <div className="animate-spin">⏳</div>
                ) : isPlaying ? (
                    <Square size={22} fill="currentColor" />
                ) : (
                    <Play size={28} fill="currentColor" className="ml-1" />
                )}
            </button>
            {/* Session Timer Countdown */}
            {sessionTimerActive && sessionTimeRemaining > 0 && (
                <div className="mt-2 px-4 py-1.5 bg-emerald-500/90 backdrop-blur-sm rounded-full text-white text-sm font-bold shadow-lg animate-in fade-in slide-in-from-bottom-2">
                    {Math.floor(sessionTimeRemaining / 60)}:{String(sessionTimeRemaining % 60).padStart(2, '0')}
                </div>
            )}
            {/* Context indicators */}
            {!isReady && (
                <div className="mt-2 px-3 py-1 bg-slate-400/90 backdrop-blur-sm rounded-full text-white text-xs font-medium shadow-lg animate-pulse">
                    Initializing...
                </div>
            )}
            {hasActiveSession && !isPlaying && isReady && (
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

         {/* ALL SETTINGS SECTIONS (when open) - COMPACT + SCROLLABLE + COLLAPSIBLE */}
         {settingsOpen && (
            <div className="animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-auto">
               {/* Scrollable container with max-height */}
               <div className="max-h-[60vh] overflow-y-auto space-y-2 mb-2 settings-scroll">

                  {/* 1. FREQUENCIES - Always expanded */}
                  <div className="glass-card rounded-xl p-3">
                     <button
                        onClick={() => setFrequenciesExpanded(!frequenciesExpanded)}
                        className="w-full flex items-center justify-between mb-2"
                     >
                        <h3 className="text-sm font-semibold text-slate-700">Frequencies</h3>
                        {frequenciesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                     </button>

                     {frequenciesExpanded && (
                        <div className="space-y-2">
                           {/* Frequency Category Tabs - Compact */}
                           <div className="flex justify-center gap-1.5">
                              {(['solfeggio', 'rose', 'special'] as FrequencyCategory[]).map(cat => (
                                 <button
                                    key={cat}
                                    onClick={() => setFrequencyCategory(cat)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all duration-300
                                    ${frequencyCategory === cat
                                       ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md'
                                       : 'bg-slate-100 text-slate-500 hover:text-violet-600'}`}
                                 >
                                    {cat}
                                 </button>
                              ))}
                           </div>

                           {/* Frequency Presets - Wider for text */}
                           <div className="flex gap-2 overflow-x-auto pb-2 px-1 no-scrollbar snap-x">
                              {FREQUENCY_PRESETS
                                 .filter(f => f.category === frequencyCategory)
                                 .map(f => (
                                 <button
                                    key={f.label}
                                    onClick={() => loadFrequencyPreset(f.frequency)}
                                    className={`snap-center shrink-0 w-20 h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 px-1
                                    ${freq === f.frequency
                                       ? 'bg-gradient-to-br from-violet-500 to-purple-600 border-violet-400 text-white shadow-md'
                                       : 'bg-white border-slate-200 text-slate-500 hover:border-violet-200'}`}
                                 >
                                    <span className="text-base font-bold">{f.label}</span>
                                    <span className="text-[8px] uppercase tracking-wider opacity-70 text-center leading-tight">
                                       {f.description || 'Hz'}
                                    </span>
                                 </button>
                              ))}
                           </div>

                           {/* Custom Frequency Input - Compact */}
                           {frequencyCategory === 'special' && (
                              <div className="pt-2 border-t border-slate-200">
                                 <label className="text-[10px] text-slate-500 mb-1 block">Custom Hz</label>
                                 <div className="flex gap-1.5">
                                    <input
                                       type="number"
                                       min="20"
                                       max="2000"
                                       step="0.1"
                                       value={customFrequency}
                                       onChange={(e) => setCustomFrequency(e.target.value)}
                                       placeholder="Enter Hz..."
                                       className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                    <button
                                       onClick={() => {
                                          const val = parseFloat(customFrequency);
                                          if (!isNaN(val) && val >= 20 && val <= 2000) {
                                             loadFrequencyPreset(val);
                                             setCustomFrequency('');
                                          }
                                       }}
                                       className="px-3 py-1.5 bg-violet-500 text-white rounded-lg text-xs font-medium hover:bg-violet-600"
                                    >
                                       Set
                                    </button>
                                 </div>
                              </div>
                           )}

                           {/* Binaural Entrainment - Integrated */}
                           <div className="pt-2 border-t border-slate-200">
                              <div className="flex items-center justify-between mb-2">
                                 <label className="text-sm font-semibold text-slate-700">Binaural Entrainment</label>
                                 <Toggle
                                    checked={binauralOn}
                                    onChange={() => {
                                       const next = !binauralOn;
                                       setBinauralOn(next);
                                       if (workletNodeRef.current) workletNodeRef.current.port.postMessage({ type: 'SET_BINAURAL', enabled: next, beat: beatFreq });
                                    }}
                                 />
                              </div>
                              {binauralOn && (
                                 <div className="grid grid-cols-2 gap-1.5">
                                    {BRAINWAVES.map(w => (
                                       <button
                                          key={w.label}
                                          onClick={() => {
                                             setBeatFreq(w.freq);
                                             if (workletNodeRef.current) workletNodeRef.current.port.postMessage({ type: 'SET_BINAURAL', enabled: binauralOn, beat: w.freq });
                                          }}
                                          className={`p-2 rounded-lg border text-left transition-all duration-300
                                          ${beatFreq === w.freq
                                             ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 text-white shadow-sm'
                                             : 'bg-white border-slate-200 text-slate-600'}`}
                                       >
                                          <div className="text-xs font-bold">{w.label} {w.freq} Hz</div>
                                          <div className="text-xs opacity-70">{w.desc}</div>
                                       </button>
                                    ))}
                                 </div>
                              )}
                           </div>
                        </div>
                     )}
                  </div>

                  {/* 2. TONE - Collapsible */}
                  <div className="glass-card rounded-xl p-3">
                     <button
                        onClick={() => setToneExpanded(!toneExpanded)}
                        className="w-full flex items-center justify-between"
                     >
                        <h3 className="text-sm font-semibold text-slate-700">Tone</h3>
                        {toneExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                     </button>

                     {toneExpanded && (
                        <div className="grid grid-cols-5 gap-1.5 mt-2">
                           {SOUND_PRESETS.map(p => (
                              <button
                                 key={p.label}
                                 onClick={() => loadSoundPreset(p)}
                                 className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300
                                 ${activeSoundPreset === p.label
                                    ? 'preset-active text-white shadow-md scale-105'
                                    : 'bg-white text-slate-600 hover:scale-102 border border-slate-200'}`}
                              >
                                 <span className="mb-1">
                                    {PRESET_ICONS[p.icon]}
                                 </span>
                                 <span className="text-[9px] font-medium leading-tight text-center">{p.label}</span>
                              </button>
                           ))}
                        </div>
                     )}
                  </div>

                  {/* 3. SESSION TIMER - Always visible with toggle */}
                  <div className="glass-card rounded-xl p-3">
                     <button
                        onClick={() => setSessionTimerExpanded(!sessionTimerExpanded)}
                        className="w-full flex items-center justify-between"
                     >
                        <h3 className="text-sm font-semibold text-slate-700">Session Timer</h3>
                        {sessionTimerExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                     </button>

                     {sessionTimerExpanded && (
                        <div className="space-y-2 mt-2">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-slate-600">Enable Timer</span>
                              <Toggle checked={sessionTimerEnabled} onChange={() => setSessionTimerEnabled(!sessionTimerEnabled)} />
                           </div>
                           <div className="flex gap-1.5">
                              {[1, 3, 5, 10].map(min => {
                                 const seconds = min * 60;
                                 const isActive = sessionDuration === seconds;
                                 return (
                                    <button
                                       key={min}
                                       onClick={() => setSessionDuration(seconds)}
                                       className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                                          isActive
                                             ? 'bg-emerald-500 text-white shadow-md'
                                             : 'bg-slate-100 hover:bg-emerald-400 hover:text-white'
                                       }`}
                                    >
                                       {min}m
                                    </button>
                                 );
                              })}
                           </div>
                           <input
                              type="number"
                              min="1"
                              placeholder="Custom minutes"
                              onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                    const val = parseInt(e.currentTarget.value);
                                    if (!isNaN(val) && val > 0) {
                                       setSessionDuration(val * 60);
                                       e.currentTarget.value = '';
                                    }
                                 }
                              }}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                           />
                        </div>
                     )}
                  </div>

                  {/* 5. SEQUENCE BUILDER - Full SessionTimer */}
                  <div className="glass-card rounded-xl p-3">
                     <button
                        onClick={() => setSequenceBuilderExpanded(!sequenceBuilderExpanded)}
                        className="w-full flex items-center justify-between"
                     >
                        <h3 className="text-sm font-semibold text-slate-700">Sequence Builder</h3>
                        {sequenceBuilderExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                     </button>

                     {sequenceBuilderExpanded && (
                        <div className="mt-2 space-y-2">
                           {/* Load Template */}
                           {savedTemplates.length > 0 && (
                              <select
                                 onChange={(e) => {
                                    const template = savedTemplates.find(t => t.id === e.target.value);
                                    if (template) loadTemplate(template);
                                 }}
                                 className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                              >
                                 <option value="">Load Template...</option>
                                 {savedTemplates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                 ))}
                              </select>
                           )}

                           {/* SessionTimer */}
                           <SessionTimer
                              currentFrequency={freq}
                              frequencyPresets={FREQUENCY_PRESETS}
                              onFrequencyChange={loadFrequencyPreset}
                              onSessionStart={handleSessionStart}
                              onSessionEnd={handleSessionEnd}
                              onSessionStatusChange={handleSessionStatusChange}
                              className=""
                           />

                           {/* Save as Template */}
                           <button
                              onClick={() => setShowTemplateDialog(!showTemplateDialog)}
                              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                           >
                              <Save size={14} />
                              Save as Template
                           </button>

                           {/* Save Dialog */}
                           {showTemplateDialog && (
                              <div className="p-2 bg-white rounded-lg border border-amber-200 space-y-2">
                                 <input
                                    type="text"
                                    placeholder="Name (required)"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                                 />
                                 <input
                                    type="text"
                                    placeholder="Description (optional)"
                                    value={templateDescription}
                                    onChange={(e) => setTemplateDescription(e.target.value)}
                                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                                 />
                                 <div className="flex gap-2">
                                    <button onClick={saveTemplate} className="flex-1 py-1.5 bg-amber-500 text-white rounded text-xs font-medium">
                                       Save
                                    </button>
                                    <button onClick={() => { setShowTemplateDialog(false); setTemplateName(''); setTemplateDescription(''); }} className="flex-1 py-1.5 bg-slate-200 text-slate-600 rounded text-xs font-medium">
                                       Cancel
                                    </button>
                                 </div>
                              </div>
                           )}
                        </div>
                     )}
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
