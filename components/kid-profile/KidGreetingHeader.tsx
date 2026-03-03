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
  compact?: boolean;
}

export function KidGreetingHeader({ name, avatarInfo, age, compact }: KidGreetingHeaderProps) {
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
    if (compact) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="w-52 h-52 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="h-8 w-40 bg-slate-200 rounded animate-pulse" />
        </div>
      );
    }
    return (
      <div className="relative mb-6 pt-12">
        <div className="absolute -top-4 left-4 z-20 w-52 h-52 rounded-2xl bg-slate-200 animate-pulse" />
        <Card className="pt-32 pb-6 px-6 min-h-[160px] animate-pulse bg-slate-100" />
      </div>
    );
  }

  // Compact mode: vertical centered column for kiosk left panel
  if (compact) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full px-4 py-6 rounded-2xl"
        style={{ backgroundColor: palette.background }}
      >
        <Avatar
          member={{
            name: name,
            role: avatarInfo?.role || 'kid',
            avatar_url: avatarInfo?.avatar_url,
          }}
          size="5xl"
          shape="rounded"
          className="shadow-2xl border-4 border-white ring-4 ring-white/40"
        />
        <h1
          className="text-3xl font-bold mt-5 text-center"
          style={{ color: palette.accent }}
        >
          {greeting}
        </h1>
        <p className="text-lg text-slate-700 font-medium leading-relaxed text-center mt-2 px-2">
          &ldquo;{quote}&rdquo;
        </p>
        {age && (
          <p className="text-sm text-slate-500 mt-2">{age}</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative mb-6 pt-12">
      {/* Avatar - Breaking out of the card */}
      <div className="absolute -top-4 left-4 z-20">
        <Avatar
          member={{
            name: name,
            role: avatarInfo?.role || 'kid',
            avatar_url: avatarInfo?.avatar_url,
          }}
          size="5xl"
          shape="rounded"
          className="shadow-2xl border-4 border-white ring-4 ring-white/40"
        />
      </div>

      <Card
        className="pt-32 pb-6 px-6 relative overflow-visible"
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

        {/* Main Content - shifted right to account for larger avatar */}
        <div className="relative z-10 ml-56 sm:ml-60">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{ color: palette.accent }}
          >
            {greeting}
          </h1>
          <p className="text-xl sm:text-2xl text-slate-700 font-medium leading-relaxed">
            &ldquo;{quote}&rdquo;
          </p>
          {age && (
            <p className="text-base text-slate-500 mt-3">{age}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
