'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ContentData {
  joke: { setup: string; punchline: string; generatedAt: string };
  funFact: { fact: string; topic: string; generatedAt: string };
  quote: { quote: string; author: string; generatedAt: string };
}

interface FunStuffCarouselProps {
  content: ContentData | null;
  onRefresh: () => void;
  refreshing: boolean;
  className?: string;
}

const SLIDE_COUNT = 3;
const AUTO_ROTATE_MS = 20_000;
const PAUSE_DURATION_MS = 30_000;

export function FunStuffCarousel({
  content,
  onRefresh,
  refreshing,
  className,
}: FunStuffCarouselProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [showPunchline, setShowPunchline] = useState(false);
  const pauseUntilRef = useRef<number>(0);

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      setActiveSlide((prev) => (prev + 1) % SLIDE_COUNT);
    }, AUTO_ROTATE_MS);

    return () => clearInterval(interval);
  }, []);

  // Reset punchline when rotating away from joke slide
  useEffect(() => {
    if (activeSlide !== 1) {
      setShowPunchline(false);
    }
  }, [activeSlide]);

  const goToSlide = useCallback((index: number) => {
    setActiveSlide(index);
    pauseUntilRef.current = Date.now() + PAUSE_DURATION_MS;
  }, []);

  if (!content) {
    return (
      <Card className={`bg-gradient-to-br from-yellow-50 to-pink-50 p-5 ${className ?? ''}`}>
        <p className="text-center text-sm text-slate-500 py-4">Loading...</p>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-yellow-50 to-pink-50 p-5 flex flex-col ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800">✨ Daily Fun</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={refreshing}
          className="h-8 w-8"
        >
          <RefreshCw
            className={`h-4 w-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>

      {/* Slides */}
      <div className="relative min-h-[100px]">
        {/* Slide 0: Quote */}
        <div
          className={`transition-opacity duration-500 ${
            activeSlide === 0
              ? 'opacity-100'
              : 'opacity-0 absolute inset-0 pointer-events-none'
          }`}
        >
          <p className="text-xs font-semibold text-purple-600 mb-2">
            💜 Quote of the Day
          </p>
          <blockquote className="italic text-sm text-slate-700 leading-relaxed">
            &ldquo;{content.quote.quote}&rdquo;
          </blockquote>
          <p className="text-xs text-slate-500 mt-2">
            &mdash; {content.quote.author}
          </p>
        </div>

        {/* Slide 1: Joke */}
        <div
          className={`transition-opacity duration-500 ${
            activeSlide === 1
              ? 'opacity-100'
              : 'opacity-0 absolute inset-0 pointer-events-none'
          }`}
        >
          <p className="text-xs font-semibold text-amber-600 mb-2">
            😄 Joke of the Day
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            {content.joke.setup}
          </p>
          {showPunchline ? (
            <p className="text-sm font-semibold text-slate-800 mt-2">
              {content.joke.punchline}
            </p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPunchline(true)}
              className="mt-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2 h-7"
            >
              Tell me! 🤭
            </Button>
          )}
        </div>

        {/* Slide 2: Fun Fact */}
        <div
          className={`transition-opacity duration-500 ${
            activeSlide === 2
              ? 'opacity-100'
              : 'opacity-0 absolute inset-0 pointer-events-none'
          }`}
        >
          <p className="text-xs font-semibold text-emerald-600 mb-2">
            💡 Fun Fact
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            {content.funFact.fact}
          </p>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex items-center justify-center gap-3 mt-4">
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label={`Go to slide ${i + 1}`}
          >
            <span
              className={`block w-2.5 h-2.5 rounded-full transition-colors ${
                i === activeSlide ? 'bg-indigo-500' : 'bg-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </Card>
  );
}
