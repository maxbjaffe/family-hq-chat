'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/Avatar';
import {
  getGreeting,
  getRandomQuote,
  getRandomPalette,
  decorativeElements,
  type ColorPalette,
} from '@/lib/kid-quotes';

interface KidGreetingHeaderProps {
  name: string;
  avatarInfo: {
    avatar_url?: string | null;
    role?: string;
  };
  age?: string | null;
}

export function KidGreetingHeader({ name, avatarInfo, age }: KidGreetingHeaderProps) {
  const [palette, setPalette] = useState<ColorPalette | null>(null);
  const [quote, setQuote] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('');

  // Initialize on client to avoid hydration mismatch
  useEffect(() => {
    setPalette(getRandomPalette());
    setQuote(getRandomQuote());
    setGreeting(getGreeting(name));
  }, [name]);

  // Don't render until client-side initialization
  if (!palette) {
    return (
      <Card className="p-6 mb-6 min-h-[160px] animate-pulse bg-slate-100" />
    );
  }

  return (
    <Card
      className="p-6 mb-6 relative overflow-hidden"
      style={{ backgroundColor: palette.background }}
    >
      {/* Decorative Elements */}
      {decorativeElements.map((el, index) => (
        <span
          key={index}
          className={`absolute ${el.position} ${el.size} ${el.rotation} opacity-70 select-none pointer-events-none`}
          aria-hidden="true"
        >
          {el.emoji}
        </span>
      ))}

      {/* Main Content */}
      <div className="relative z-10 flex items-center gap-5">
        {/* Avatar - larger, rounded rectangle */}
        <Avatar
          member={{
            name: name,
            role: avatarInfo?.role || 'kid',
            avatar_url: avatarInfo?.avatar_url,
          }}
          size="3xl"
          shape="rounded"
          className="shadow-lg border-4 border-white/50"
        />

        {/* Greeting and Quote */}
        <div className="flex-1 min-w-0">
          <h1
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ color: palette.accent }}
          >
            {greeting}
          </h1>
          <p className="text-lg sm:text-xl text-slate-700 font-medium leading-relaxed">
            &ldquo;{quote}&rdquo;
          </p>
          {age && (
            <p className="text-sm text-slate-500 mt-2">{age}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
