/**
 * Pitch Detection using Autocorrelation with YIN-like approach
 *
 * Based on the McLeod Pitch Method and YIN algorithm
 * Returns detected pitch in Hz or -1 if no pitch detected
 */

const NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * Calculate pitch from audio buffer using autocorrelation
 * @param buf Time-domain audio data (Uint8Array from analyser.getByteTimeDomainData)
 * @param sampleRate Audio context sample rate
 * @returns Detected frequency in Hz, or -1 if no pitch detected
 */
export function autoCorrelate(buf: Uint8Array, sampleRate: number): number {
    const SIZE = buf.length;

    // 1. RMS Energy Gate - Skip if signal is too quiet
    let sum = 0;
    for (let i = 0; i < SIZE; i++) {
        const val = (buf[i] - 128) / 128;
        sum += val * val;
    }
    const rms = Math.sqrt(sum / SIZE);
    if (rms < 0.005) return -1; // Signal too quiet

    // 2. Calculate autocorrelation for all offsets
    const maxOffset = Math.min(SIZE, 2500); // ~17Hz min at 44100
    const minOffset = 15; // ~3000Hz max
    const correlations = new Float32Array(SIZE);

    for (let offset = minOffset; offset < maxOffset; offset++) {
        const count = Math.min(SIZE - offset, 1024);
        let correlation = 0;
        for (let i = 0; i < count; i++) {
            correlation += ((buf[i] - 128) / 128) * ((buf[i + offset] - 128) / 128);
        }
        correlations[offset] = correlation / count;
    }

    // 3. YIN-like approach: Find FIRST strong peak (fundamental, not harmonics)
    const threshold = 0.5;

    for (let offset = minOffset; offset < maxOffset; offset++) {
        if (correlations[offset] > threshold) {
            // Check if this is a local maximum
            if (correlations[offset] > correlations[offset - 1] &&
                correlations[offset] > correlations[offset + 1]) {

                // 4. Parabolic interpolation for sub-sample precision
                const shift = (correlations[offset + 1] - correlations[offset - 1]) / 2;
                return sampleRate / (offset + shift);
            }
        }
    }

    // 5. Fallback: If no strong peak found, try global maximum (weak signal)
    let globalMax = 0;
    let globalOffset = -1;
    for (let offset = minOffset; offset < maxOffset; offset++) {
        if (correlations[offset] > globalMax) {
            globalMax = correlations[offset];
            globalOffset = offset;
        }
    }

    if (globalMax > 0.2) {
        return sampleRate / globalOffset;
    }

    return -1; // No pitch detected
}

/**
 * Convert frequency to musical note name
 * @param frequency Frequency in Hz
 * @returns Note name with octave (e.g., "A4", "C#3")
 */
export function noteFromPitch(frequency: number): string {
    if (!frequency || frequency <= 0) return "-";
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const midi = Math.round(noteNum) + 69;
    if (midi < 0 || midi > 127) return "-";
    const note = NOTE_STRINGS[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return note + octave;
}

/**
 * Calculate cents deviation from nearest note
 * @param pitch Detected pitch in Hz
 * @returns Cents off from nearest note (-50 to +50)
 */
export function getCentsOff(pitch: number): number {
    const noteNum = 12 * (Math.log(pitch / 440) / Math.log(2));
    const nearestNoteNum = Math.round(noteNum);
    const targetFreq = 440 * Math.pow(2, nearestNoteNum / 12);
    return 1200 * (Math.log(pitch / targetFreq) / Math.log(2));
}

/**
 * Exponential moving average for smoothing pitch readings
 */
export class PitchSmoother {
    private smoothedPitch = 0;
    private readonly alpha: number;
    private readonly jumpThreshold: number;

    constructor(alpha = 0.1, jumpThreshold = 10) {
        this.alpha = alpha;
        this.jumpThreshold = jumpThreshold;
    }

    update(newPitch: number): number {
        if (newPitch <= 0) return this.smoothedPitch;

        // Large jump = new note, skip smoothing
        if (Math.abs(newPitch - this.smoothedPitch) > this.jumpThreshold) {
            this.smoothedPitch = newPitch;
        } else {
            // Exponential moving average
            this.smoothedPitch = this.smoothedPitch * (1 - this.alpha) + newPitch * this.alpha;
        }

        return this.smoothedPitch;
    }

    reset(): void {
        this.smoothedPitch = 0;
    }

    get value(): number {
        return this.smoothedPitch;
    }
}
