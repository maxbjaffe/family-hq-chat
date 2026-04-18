'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  initAudioContext,
  speakWithTTS,
  createRecognition,
  type PlaybackHandle,
} from '@/lib/jarvis/jarvis-core';

export type KioskJarvisState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface UseKioskJarvisReturn {
  state: KioskJarvisState;
  transcript: string;
  responseText: string;
  error: string | null;
  startListening: () => void;
  skip: () => void;
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
  const currentHandleRef = useRef<PlaybackHandle | null>(null);
  const conversationRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const getAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = await initAudioContext();
    }
    return audioContextRef.current;
  }, []);

  const speakText = useCallback(
    async (text: string): Promise<void> => {
      if (abortRef.current) return;

      const ctx = await getAudioContext();
      const handle = await speakWithTTS(text, ctx);
      currentHandleRef.current = handle;

      await handle.promise;

      currentHandleRef.current = null;
    },
    [getAudioContext]
  );

  const handleCommand = useCallback(
    async (command: string) => {
      setState('processing');
      setTranscript(command);
      setError(null);

      // Add user message to conversation history
      conversationRef.current.push({ role: 'user', content: command });

      try {
        const res = await fetch('/api/jarvis/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command,
            memberId,
            history: conversationRef.current.slice(0, -1), // everything before this message
          }),
        });

        if (abortRef.current) return;

        const data = await res.json();
        const text = data.response || "I didn't catch that.";
        setResponseText(text);

        // Add assistant response to conversation history
        conversationRef.current.push({ role: 'assistant', content: text });

        // Keep history manageable (last 10 turns)
        if (conversationRef.current.length > 20) {
          conversationRef.current = conversationRef.current.slice(-20);
        }

        setState('speaking');
        await speakText(text);

        if (abortRef.current) return;

        // Return to idle but keep transcript/response visible
        setState('idle');
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

    abortRef.current = false;
    setError(null);

    const recognition = createRecognition({
      onInterim: (text) => setTranscript(text),
      onFinal: (text) => {
        setTranscript(text);
        recognition?.stop();
        handleCommand(text);
      },
      onError: (error) => {
        console.error('Speech recognition error:', error);
        if (error === 'no-speech') {
          setError('No speech detected. Tap the mic and try again.');
        } else if (error === 'not-allowed') {
          setError('Microphone access denied. Check browser permissions.');
        }
        setState('idle');
      },
      onEnd: () => {
        // Only reset to idle if we're still in listening state
        if (state === 'listening') {
          setState('idle');
        }
      },
    });

    if (!recognition) {
      setError('Voice not supported on this browser.');
      return;
    }

    recognitionRef.current = recognition;
    recognition.start();
    setState('listening');
  }, [memberId, handleCommand, state]);

  const skip = useCallback(() => {
    // Stop current audio playback
    if (currentHandleRef.current) {
      currentHandleRef.current.stop();
      currentHandleRef.current.skipResolve();
      currentHandleRef.current = null;
    }
    // If speaking, return to idle (keep transcript/response visible)
    if (state === 'speaking') {
      setState('idle');
    }
  }, [state]);

  const cancel = useCallback(() => {
    abortRef.current = true;

    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    if (currentHandleRef.current) {
      currentHandleRef.current.stop();
      currentHandleRef.current.skipResolve();
      currentHandleRef.current = null;
    }

    setState('idle');
    setTranscript('');
    setResponseText('');
    setError(null);
    conversationRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      recognitionRef.current?.abort();
      if (currentHandleRef.current) {
        currentHandleRef.current.stop();
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
    skip,
    cancel,
  };
}
