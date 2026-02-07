// public/worklet.js
import init, { FrequencyPlayer } from './wasm/frequency_player_engine.js';

class RustSynthProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.synth = null;
        this.initialized = false;
        
        this.port.onmessage = async (event) => {
            const data = event.data;
            if (data.type === 'INIT') {
                try {
                    await init(data.wasmBytes);
                    this.synth = new FrequencyPlayer(sampleRate);
                    this.initialized = true;
                    this.port.postMessage({ type: 'READY' });
                } catch (err) { console.error("WASM Init Failed:", err); }
            } 
            else if (!this.synth) return;

            switch (data.type) {
                case 'NOTE_ON': this.synth.trigger(); break;
                case 'NOTE_OFF': this.synth.release(); break;
                case 'SET_FREQ': this.synth.set_freq(data.freq); break;
                case 'SET_BINAURAL': this.synth.set_binaural(data.enabled, data.beat); break;
                case 'SET_FILTER': this.synth.set_filter(data.cutoff, data.resonance); break;
                case 'SET_FM': this.synth.set_fm(data.ratio, data.depth); break;
                case 'SET_ENVELOPE': this.synth.set_envelope(data.a, data.d, data.s, data.r); break;
                case 'SET_NOISE': this.synth.set_noise(data.amt); break;
                case 'SET_LFO': this.synth.set_lfo(data.rate, data.amt); break;
                case 'SET_DRIVE': this.synth.set_drive(data.amt); break;
                // NEW
                case 'SET_FX': this.synth.set_fx(data.reverb, data.delay); break;
            }
        };
    }

    process(inputs, outputs) {
        if (!this.initialized || !this.synth) return true;
        const output = outputs[0];
        if (!output[0] || !output[1]) return true;

        try {
            this.synth.process_stereo(output[0], output[1]);
        } catch (e) {
            console.error(e);
            return false;
        }
        return true;
    }
}

registerProcessor('rust-synth-processor', RustSynthProcessor);
