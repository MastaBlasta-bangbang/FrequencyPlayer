/* @ts-self-types="./frequency_player_engine.d.ts" */

export class FrequencyPlayer {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        FrequencyPlayerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_frequencyplayer_free(ptr, 0);
    }
    /**
     * @param {number} sample_rate
     */
    constructor(sample_rate) {
        const ret = wasm.frequencyplayer_new(sample_rate);
        this.__wbg_ptr = ret >>> 0;
        FrequencyPlayerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Float32Array} left_out
     * @param {Float32Array} right_out
     */
    process_stereo(left_out, right_out) {
        var ptr0 = passArrayF32ToWasm0(left_out, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = passArrayF32ToWasm0(right_out, wasm.__wbindgen_malloc);
        var len1 = WASM_VECTOR_LEN;
        wasm.frequencyplayer_process_stereo(this.__wbg_ptr, ptr0, len0, left_out, ptr1, len1, right_out);
    }
    release() {
        wasm.frequencyplayer_release(this.__wbg_ptr);
    }
    /**
     * @param {boolean} e
     * @param {number} b
     */
    set_binaural(e, b) {
        wasm.frequencyplayer_set_binaural(this.__wbg_ptr, e, b);
    }
    /**
     * @param {number} amt
     */
    set_drive(amt) {
        wasm.frequencyplayer_set_drive(this.__wbg_ptr, amt);
    }
    /**
     * @param {number} a
     * @param {number} d
     * @param {number} s
     * @param {number} r
     */
    set_envelope(a, d, s, r) {
        wasm.frequencyplayer_set_envelope(this.__wbg_ptr, a, d, s, r);
    }
    /**
     * @param {number} c
     * @param {number} r
     */
    set_filter(c, r) {
        wasm.frequencyplayer_set_filter(this.__wbg_ptr, c, r);
    }
    /**
     * @param {number} r
     * @param {number} d
     */
    set_fm(r, d) {
        wasm.frequencyplayer_set_fm(this.__wbg_ptr, r, d);
    }
    /**
     * @param {number} f
     */
    set_freq(f) {
        wasm.frequencyplayer_set_freq(this.__wbg_ptr, f);
    }
    /**
     * @param {number} reverb
     * @param {number} delay
     */
    set_fx(reverb, delay) {
        wasm.frequencyplayer_set_fx(this.__wbg_ptr, reverb, delay);
    }
    /**
     * @param {number} rate
     * @param {number} amt
     */
    set_lfo(rate, amt) {
        wasm.frequencyplayer_set_lfo(this.__wbg_ptr, rate, amt);
    }
    /**
     * @param {number} amt
     */
    set_noise(amt) {
        wasm.frequencyplayer_set_noise(this.__wbg_ptr, amt);
    }
    trigger() {
        wasm.frequencyplayer_trigger(this.__wbg_ptr);
    }
    /**
     * @returns {number}
     */
    get beat_freq() {
        const ret = wasm.__wbg_get_frequencyplayer_beat_freq(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get carrier_freq() {
        const ret = wasm.__wbg_get_frequencyplayer_carrier_freq(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get delay_mix() {
        const ret = wasm.__wbg_get_frequencyplayer_delay_mix(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get drive_amt() {
        const ret = wasm.__wbg_get_frequencyplayer_drive_amt(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get fm_depth() {
        const ret = wasm.__wbg_get_frequencyplayer_fm_depth(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get fm_ratio() {
        const ret = wasm.__wbg_get_frequencyplayer_fm_ratio(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {boolean}
     */
    get is_binaural() {
        const ret = wasm.__wbg_get_frequencyplayer_is_binaural(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number}
     */
    get lfo_amt() {
        const ret = wasm.__wbg_get_frequencyplayer_lfo_amt(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get noise_amt() {
        const ret = wasm.__wbg_get_frequencyplayer_noise_amt(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get reverb_mix() {
        const ret = wasm.__wbg_get_frequencyplayer_reverb_mix(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get sample_rate() {
        const ret = wasm.__wbg_get_frequencyplayer_sample_rate(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set beat_freq(arg0) {
        wasm.__wbg_set_frequencyplayer_beat_freq(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set carrier_freq(arg0) {
        wasm.__wbg_set_frequencyplayer_carrier_freq(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set delay_mix(arg0) {
        wasm.__wbg_set_frequencyplayer_delay_mix(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set drive_amt(arg0) {
        wasm.__wbg_set_frequencyplayer_drive_amt(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set fm_depth(arg0) {
        wasm.__wbg_set_frequencyplayer_fm_depth(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set fm_ratio(arg0) {
        wasm.__wbg_set_frequencyplayer_fm_ratio(this.__wbg_ptr, arg0);
    }
    /**
     * @param {boolean} arg0
     */
    set is_binaural(arg0) {
        wasm.__wbg_set_frequencyplayer_is_binaural(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set lfo_amt(arg0) {
        wasm.__wbg_set_frequencyplayer_lfo_amt(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set noise_amt(arg0) {
        wasm.__wbg_set_frequencyplayer_noise_amt(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set reverb_mix(arg0) {
        wasm.__wbg_set_frequencyplayer_reverb_mix(this.__wbg_ptr, arg0);
    }
    /**
     * @param {number} arg0
     */
    set sample_rate(arg0) {
        wasm.__wbg_set_frequencyplayer_sample_rate(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) FrequencyPlayer.prototype[Symbol.dispose] = FrequencyPlayer.prototype.free;

export function init_panic_hook() {
    wasm.init_panic_hook();
}

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_copy_to_typed_array_fc0809a4dec43528: function(arg0, arg1, arg2) {
            new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(getArrayU8FromWasm0(arg0, arg1));
        },
        __wbg___wbindgen_throw_be289d5034ed271b: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_error_7534b8e9a36f1ab4: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_new_8a6f238a6ece86ea: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_stack_0ed75d68575b0f3c: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./frequency_player_engine_bg.js": import0,
    };
}

const FrequencyPlayerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_frequencyplayer_free(ptr >>> 0, 1));

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedFloat32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('frequency_player_engine_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
