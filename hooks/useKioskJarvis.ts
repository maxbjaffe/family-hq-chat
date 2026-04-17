'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export type KioskJarvisState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface UseKioskJarvisReturn {
  state: KioskJarvisState;
  transcript: string;
  responseText: string;
  error: string | null;
  startListening: () => void;
  cancel: () => void;
}

export function useKioskJarvis(memberId: string | null): UseKioskJarvisReturn {
  const [state, setState] = useState<KioskJarvisState>('idle');
  const [transcript, setTranscript] = useState('');
  const [responseText, setResponseText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const abortRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const getAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      const ctx = new AudioContext();
      // iOS/Chromium silent mode workaround
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const silentBuffer = ctx.createBuffer(1, 1, 22050);
      const silentSource = ctx.createBufferSource();
      silentSource.buffer = silentBuffer;
      silentSource.connect(ctx.destination);
      silentSource.start();
      audioContextRef.current = ctx;
    }
    return audioContextRef.current;
  }, []);

  const speakText = useCallback(
    async (text: string): Promise<void> => {
      if (abortRef.current) return;

      const res = await fetch('/api/jarvis/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        console.error('TTS failed:', res.status);
        return;
      }

      const arrayBuffer = await res.arrayBuffer();
      const ctx = await getAudioContext();
      await ctx.resume();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      currentSourceRef.current = source;

      return new Promise<void>((resolve) => {
        if (abortRef.current) {
          currentSourceRef.current = null;
          resolve();
          return;
        }
        source.onended = () => {
          currentSourceRef.current = null;
          resolve();
        };
        source.start();
      });
    },
    [getAudioContext]
  );

  const handleCommand = useCallback(
    async (command: string) => {
      setState('processing');
      setTranscript(command);
      setError(null);

      try {
        const res = await fetch('/api/jarvis/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command, memberId }),
        });

        if (abortRef.current) return;

        const data = await res.json();
        const text = data.response || "I didn't catch that.";
        setResponseText(text);

        setState('speaking');
        await speakText(text);

        if (abortRef.current) return;

        // Return to idle after speaking
        setState('idle');
        setTranscript('');
        setResponseText('');
      } catch (e) {
        console.error('Command error:', e);
        setError('Something went wrong. Try again?');
        setState('idle');
      }
    },
    [memberId, speakText]
  );

  const startListening = useCallback(() => {
    if (!memberId) {
      setError('Pick your name first!');
      return;
    }

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setError('Voice not supported on this browser.');
      return;
    }

    abortRef.current = false;
    setError(null);
    setTranscript('');
    setResponseText('');

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      setTranscript(last[0].transcript);

      if (last.isFinal) {
        const finalText = last[0].transcript;
        setTranscript(finalText);
        recognition.stop();
        handleCommand(finalText);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setError('No speech detected. Tap the mic and try again.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Check browser permissions.');
      }
      setState('idle');
    };

    recognition.onend = () => {
      // Only reset to idle if we're still in listening state
      // (if we got a final result, handleCommand already moved us to processing)
      if (state === 'listening') {
        setState('idle');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState('listening');
  }, [memberId, handleCommand, state]);

  const cancel = useCallback(() => {
    abortRef.current = true;

    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {
        // Already stopped
      }
      currentSourceRef.current = null;
    }

    setState('idle');
    setTranscript('');
    setResponseText('');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      recognitionRef.current?.abort();
      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch { /* noop */ }
      }
      audioContextRef.current?.close().catch(() => {});
    };
  }, []);

  return {
    state,
    transcript,
    responseText,
    error,
    startListening,
    cancel,
  };
}
