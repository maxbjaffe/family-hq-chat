'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { AvatarState, MeterValues } from '@/lib/nutrition/types';
import {
  getAvatarStatePath,
  AVATAR_STATE_CONFIG,
  METER_CONFIG,
} from '@/lib/nutrition/constants';
import { getLowestMeter } from '@/lib/nutrition/engine';

interface NutritionAvatarProps {
  kidName: string;
  state: AvatarState;
  totals?: MeterValues;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showMessage?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-40 h-40',
};

const IMAGE_SIZES: Record<string, string> = {
  sm: '64px',
  md: '96px',
  lg: '128px',
  xl: '160px',
};

export function NutritionAvatar({
  kidName,
  state,
  totals,
  size = 'md',
  showMessage = false,
  className,
}: NutritionAvatarProps) {
  const imagePath = getAvatarStatePath(kidName, state);
  const config = AVATAR_STATE_CONFIG[state];
  const showBubble = config.needsBubble && totals;

  // Determine bubble content
  let bubbleEmoji = '';
  let bubbleClasses = 'bg-white shadow-md';

  if (showBubble) {
    if (state === 'fizzy') {
      bubbleEmoji = '\u26A1';
      bubbleClasses = 'bg-white shadow-md border-2 border-orange-400';
    } else {
      const lowestKey = getLowestMeter(totals);
      bubbleEmoji = METER_CONFIG[lowestKey].emoji;
    }
  }

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {/* Avatar container */}
      <div className="relative inline-block">
        <div
          className={cn(
            'relative rounded-full overflow-hidden',
            SIZE_CLASSES[size]
          )}
        >
          <Image
            src={imagePath}
            alt={`${kidName}'s avatar - ${config.label}`}
            fill
            className="object-cover"
            sizes={IMAGE_SIZES[size]}
          />
        </div>

        {/* Needs bubble */}
        {showBubble && (
          <div
            className={cn(
              'absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-base animate-bounce',
              bubbleClasses
            )}
          >
            {bubbleEmoji}
          </div>
        )}
      </div>

      {/* Optional state message */}
      {showMessage && (
        <p className="text-xs text-slate-600 text-center max-w-[160px]">
          {config.message}
        </p>
      )}
    </div>
  );
}

export type { NutritionAvatarProps };
