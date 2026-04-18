/**
 * Jarvis Core — shared audio/TTS/recognition utilities.
 *
 * Copied identically to every app that hosts a Jarvis interface.
 * App-specific logic (briefing pipeline, conversation history, command
 * dispatch) lives in the per-app React hook that imports this module.
 *
 * Control semantics:
 *   Skip   — stop current audio, resolve promise early. During multi-section
 *            playback the caller should also abort remaining sections.
 *            Transition to ready/listening.
 *   Cancel — full stop: kill audio, abort recognition, abort API calls,
 *            return to idle. Clears transcript/response.
 *   Dismiss — cancel + close the Jarvis UI entirely.
 */

// ---------------------------------------------------------------------------
// Audio context
// ---------------------------------------------------------------------------

/**
 * Create an AudioContext with the iOS silent-buffer workaround.
 * Must be called from a user-gesture handler on Safari/iOS.
 */
export async function initAudioContext(): Promise<AudioContext> {
  const ctx = new AudioContext();

  // iOS: resume suspended context and play a silent buffer to force the
  // audio session into "playback" category (fixes silent-mode muting).
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  const silentBuffer = ctx.createBuffer(1, 1, 22050);
  const silentSource = ctx.createBufferSource();
  silentSource.buffer = silentBuffer;
  silentSource.connect(ctx.destination);
  silentSource.start();

  return ctx;
}

// ---------------------------------------------------------------------------
// TTS playback
// ---------------------------------------------------------------------------

export interface PlaybackHandle {
  /** Stop audio playback immediately. */
  stop: () => void;
  /** Resolves when audio ends naturally or is skipped. */
  promise: Promise<void>;
  /** Resolve the promise early (skip without waiting for onended). */
  skipResolve: () => void;
  /** AnalyserNode for visualisation (orb reactivity). May be null. */
  analyser: AnalyserNode | null;
}

/**
 * Fetch TTS audio from the API and play it through the given AudioContext.
 *
 * Returns a {@link PlaybackHandle} so the caller can stop/skip externally.
 *
 * @param text      Text to speak.
 * @param ctx       An already-initialised AudioContext.
 * @param apiPath   Endpoint for the TTS proxy (defaults to `/api/jarvis/speak`).
 * @param withAnalyser  Attach an AnalyserNode for waveform visualisation.
 */
export async function speakWithTTS(
  text: string,
  ctx: AudioContext,
  apiPath = '/api/jarvis/speak',
  withAnalyser = false,
): Promise<PlaybackHandle> {
  const res = await fetch(apiPath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) throw new Error(`TTS failed (${res.status})`);

  const arrayBuffer = await res.arrayBuffer();
  await ctx.resume();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;

  let analyser: AnalyserNode | null = null;
  if (withAnalyser) {
    analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);
    analyser.connect(ctx.destination);
  } else {
    source.connect(ctx.destination);
  }

  let resolvePromise: () => void;
  let settled = false;

  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });

  const settle = () => {
    if (settled) return;
    settled = true;
    resolvePromise();
  };

  source.onended = settle;

  const handle: PlaybackHandle = {
    stop: () => {
      try {
        source.stop();
      } catch {
        // Already stopped
      }
    },
    promise,
    skipResolve: settle,
    analyser,
  };

  source.start();
  return handle;
}

// ---------------------------------------------------------------------------
// Speech recognition
// ---------------------------------------------------------------------------

export interface RecognitionCallbacks {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

/**
 * Create a SpeechRecognition instance wired to the given callbacks.
 * Returns `null` if the browser does not support the Web Speech API.
 */
export function createRecognition(
  callbacks: RecognitionCallbacks,
): SpeechRecognition | null {
  const SpeechRecognitionCtor =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : undefined;

  if (!SpeechRecognitionCtor) return null;

  const recognition = new SpeechRecognitionCtor();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const last = event.results[event.results.length - 1];
    if (last.isFinal) {
      callbacks.onFinal(last[0].transcript);
    } else {
      callbacks.onInterim(last[0].transcript);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    callbacks.onError(event.error);
  };

  recognition.onend = () => {
    callbacks.onEnd();
  };

  return recognition;
}
