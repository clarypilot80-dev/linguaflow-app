// ── audioUtils.ts ─────────────────────────────────────────────────────────────
// Web Speech API wrapper with premium voice selection and playlist support.

export const LANG_VOICE_MAP: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  it: 'it-IT',
  ja: 'ja-JP',
};

const PREMIUM_VOICE_NAMES: Record<string, string[]> = {
  fr: ['Thomas', 'Audrey', 'Aurelie', 'Amélie', 'Amira'], // Thomas explicitly locked as #1
  en: ['Samantha', 'Alex', 'Victoria', 'Daniel', 'Karen'],
  es: ['Jorge', 'Monica', 'Paulina', 'Juan'],
  de: ['Anna', 'Petra', 'Markus', 'Yannick'],
  it: ['Alice', 'Federica', 'Luca'],
  ja: ['Kyoko', 'Otoya', 'O-ren'],
};

// Global cache promise to prevent race conditions
let voicesReadyPromise: Promise<SpeechSynthesisVoice[]> | null = null;

export function ensureVoicesReady(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return Promise.resolve([]);
  }

  if (voicesReadyPromise) return voicesReadyPromise;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    voicesReadyPromise = Promise.resolve(voices);
    return voicesReadyPromise;
  }

  voicesReadyPromise = new Promise(resolve => {
    let resolved = false;

    const handler = () => {
      if (resolved) return;
      resolved = true;
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.addEventListener('voiceschanged', handler);

    // Fallback timeout in case event doesn't fire
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(window.speechSynthesis.getVoices());
      }
    }, 2000);
  });

  return voicesReadyPromise;
}

function selectBestVoice(
  voices: SpeechSynthesisVoice[],
  bcp47: string,
  langCode: string
): SpeechSynthesisVoice | null {
  const preferredNames = PREMIUM_VOICE_NAMES[langCode] ?? [];

  // 1 — Named premium voices (macOS neural voices)
  for (const name of preferredNames) {
    const match = voices.find(
      v => v.lang.startsWith(langCode) && v.name.includes(name)
    );
    if (match) return match;
  }

  // 2 — Any voice self-reporting as Enhanced or Premium
  const enhanced = voices.find(
    v =>
      v.lang.startsWith(langCode) &&
      (v.name.includes('Premium') ||
        v.name.includes('Enhanced') ||
        v.voiceURI.toLowerCase().includes('premium') ||
        v.voiceURI.toLowerCase().includes('enhanced'))
  );
  if (enhanced) return enhanced;

  // 3 — Exact BCP-47 match (e.g. fr-FR)
  const exact = voices.find(v => v.lang === bcp47);
  if (exact) return exact;

  // 4 — Partial match (e.g. fr)
  return voices.find(v => v.lang.startsWith(langCode)) ?? null;
}

/** Stop any currently speaking utterance. */
export function stopSpeech(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

/**
 * Speak `text` and resolve when finished.
 */
export async function speak(text: string, langCode: string, rate: number = 0.87): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const voices = await ensureVoicesReady();
  
  return new Promise(resolve => {
    window.speechSynthesis.cancel(); // Stop current speech to avoid overlap

    const bcp47 = LANG_VOICE_MAP[langCode] ?? langCode;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = bcp47;
    utterance.rate = rate;
    utterance.pitch = 1.0;

    const best = selectBestVoice(voices, bcp47, langCode);
    if (best) utterance.voice = best;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve(); // Resolve on error so playlist doesn't hang

    window.speechSynthesis.speak(utterance);
    
    // Safety fallback: auto-resolve after estimated duration + 2s padding
    const estDuration = (text.length * 100) / rate + 2000;
    setTimeout(resolve, estDuration);
  });
}

// ── Cloud TTS Placeholder ─────────────────────────────────────────────────────
export async function fetchCloudTTS(
  text: string,
  langCode: string
): Promise<ArrayBuffer | null> {
  console.warn('[fetchCloudTTS] Cloud TTS not configured — falling back to Web Speech API.');
  speak(text, langCode);
  return null;
}
