/* tslint:disable */
/* eslint-disable */

export class FrequencyPlayer {
    free(): void;
    [Symbol.dispose](): void;
    constructor(sample_rate: number);
    process_stereo(left_out: Float32Array, right_out: Float32Array): void;
    release(): void;
    set_binaural(e: boolean, b: number): void;
    set_drive(amt: number): void;
    set_envelope(a: number, d: number, s: number, r: number): void;
    set_filter(c: number, r: number): void;
    set_fm(r: number, d: number): void;
    set_freq(f: number): void;
    set_fx(reverb: number, delay: number): void;
    set_lfo(rate: number, amt: number): void;
    set_noise(amt: number): void;
    trigger(): void;
    beat_freq: number;
    carrier_freq: number;
    delay_mix: number;
    drive_amt: number;
    fm_depth: number;
    fm_ratio: number;
    is_binaural: boolean;
    lfo_amt: number;
    noise_amt: number;
    reverb_mix: number;
    sample_rate: number;
}

export function init_panic_hook(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly init_panic_hook: () => void;
    readonly __wbg_frequencyplayer_free: (a: number, b: number) => void;
    readonly __wbg_get_frequencyplayer_beat_freq: (a: number) => number;
    readonly __wbg_get_frequencyplayer_carrier_freq: (a: number) => number;
    readonly __wbg_get_frequencyplayer_delay_mix: (a: number) => number;
    readonly __wbg_get_frequencyplayer_drive_amt: (a: number) => number;
    readonly __wbg_get_frequencyplayer_fm_depth: (a: number) => number;
    readonly __wbg_get_frequencyplayer_fm_ratio: (a: number) => number;
    readonly __wbg_get_frequencyplayer_is_binaural: (a: number) => number;
    readonly __wbg_get_frequencyplayer_lfo_amt: (a: number) => number;
    readonly __wbg_get_frequencyplayer_noise_amt: (a: number) => number;
    readonly __wbg_get_frequencyplayer_reverb_mix: (a: number) => number;
    readonly __wbg_get_frequencyplayer_sample_rate: (a: number) => number;
    readonly __wbg_set_frequencyplayer_beat_freq: (a: number, b: number) => void;
    readonly __wbg_set_frequencyplayer_carrier_freq: (a: number, b: number) => void;
    readonly __wbg_set_frequencyplayer_delay_mix: (a: number, b: number) => void;
    readonly __wbg_set_frequencyplayer_drive_amt: (a: number, b: number) => void;
    readonly __wbg_set_frequencyplayer_fm_depth: (a: number, b: number) => void;
    readonly __wbg_set_frequencyplayer_fm_ratio: (a: number, b: number) => void;
    readonly __wbg_set_frequencyplayer_is_binaural: (a: number, b: number) => void;
    readonly __wbg_set_frequencyplayer_lfo_amt: (a: number, b: number) => void;
    readonly __wbg_set_frequencyplayer_noise_amt: (a: number, b: number) => void;
    readonly __wbg_set_frequencyplayer_reverb_mix: (a: number, b: number) => void;
    readonly __wbg_set_frequencyplayer_sample_rate: (a: number, b: number) => void;
    readonly frequencyplayer_new: (a: number) => number;
    readonly frequencyplayer_process_stereo: (a: number, b: number, c: number, d: any, e: number, f: number, g: any) => void;
    readonly frequencyplayer_release: (a: number) => void;
    readonly frequencyplayer_set_binaural: (a: number, b: number, c: number) => void;
    readonly frequencyplayer_set_drive: (a: number, b: number) => void;
    readonly frequencyplayer_set_envelope: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly frequencyplayer_set_filter: (a: number, b: number, c: number) => void;
    readonly frequencyplayer_set_fm: (a: number, b: number, c: number) => void;
    readonly frequencyplayer_set_freq: (a: number, b: number) => void;
    readonly frequencyplayer_set_fx: (a: number, b: number, c: number) => void;
    readonly frequencyplayer_set_lfo: (a: number, b: number, c: number) => void;
    readonly frequencyplayer_set_noise: (a: number, b: number) => void;
    readonly frequencyplayer_trigger: (a: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
