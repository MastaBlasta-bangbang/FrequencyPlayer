// public/polyfills.js
// This runs on the AudioWorkletGlobalScope before the main engine logic.

if (typeof TextDecoder === 'undefined') {
    globalThis.TextDecoder = class TextDecoder {
        decode(view) {
            if (!view) return "";
            const arr = new Uint8Array(view.buffer || view);
            let str = '';
            for (let i = 0; i < arr.length; i++) {
                str += String.fromCharCode(arr[i]);
            }
            return str;
        }
    };
}

if (typeof TextEncoder === 'undefined') {
    globalThis.TextEncoder = class TextEncoder {
        encode(str) {
            const arr = new Uint8Array(str.length);
            for (let i = 0; i < str.length; i++) {
                arr[i] = str.charCodeAt(i);
            }
            return arr;
        }
    };
}

console.log("Polyfills loaded in AudioWorklet.");
