use wasm_bindgen::prelude::*;

// ============================================================================
// SENIOR DEV NOTE: Modular Re-export
// Instead of writing DSP code here, we import it from our shared 'audio_core'.
// This means if we fix a bug in the filter math, it updates ALL our apps at once.
// ============================================================================

pub use audio_core::FrequencyPlayer;

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}
