'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuoteData {
  quote: string;
  author: string;
}

interface JokeData {
  setup: string;
  punchline: string;
}

interface FunFactData {
  fact: string;
  topic: string;
}

export function QuoteCard({ quote, className }: { quote: QuoteData | null; className?: string }) {
  return (
    <Card className={`bg-gradient-to-br from-purple-50 to-violet-50 p-5 flex flex-col ${className ?? ''}`}>
      <h3 className="font-bold text-purple-700 mb-3 text-sm">💜 Quote of the Day</h3>
      {quote ? (
        <div className="flex-1 flex flex-col justify-center">
          <blockquote className="italic text-sm text-slate-700 leading-relaxed">
            &ldquo;{quote.quote}&rdquo;
          </blockquote>
          <p className="text-xs text-slate-500 mt-2">
            &mdash; {quote.author}
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-400">Loading...</p>
      )}
    </Card>
  );
}

export function JokeCard({ joke, className }: { joke: JokeData | null; className?: string }) {
  const [showPunchline, setShowPunchline] = useState(false);

  return (
    <Card className={`bg-gradient-to-br from-amber-50 to-yellow-50 p-5 flex flex-col ${className ?? ''}`}>
      <h3 className="font-bold text-amber-700 mb-3 text-sm">😄 Joke of the Day</h3>
      {joke ? (
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-sm text-slate-700 leading-relaxed">
            {joke.setup}
          </p>
          {showPunchline ? (
            <p className="text-sm font-semibold text-slate-800 mt-2">
              {joke.punchline}
            </p>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPunchline(true)}
              className="mt-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2 h-7 w-fit"
            >
              Tell me! 🤭
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-400">Loading...</p>
      )}
    </Card>
  );
}

export function FunFactCard({ funFact, className }: { funFact: FunFactData | null; className?: string }) {
  return (
    <Card className={`bg-gradient-to-br from-emerald-50 to-green-50 p-5 flex flex-col ${className ?? ''}`}>
      <h3 className="font-bold text-emerald-700 mb-3 text-sm">💡 Fun Fact</h3>
      {funFact ? (
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-sm text-slate-700 leading-relaxed">
            {funFact.fact}
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-400">Loading...</p>
      )}
    </Card>
  );
}
