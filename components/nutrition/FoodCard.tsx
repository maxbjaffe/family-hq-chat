'use client';

import { cn } from '@/lib/utils';
import type { NutritionFood } from '@/lib/nutrition/types';

interface FoodCardProps {
  food: NutritionFood;
  onTap: (food: NutritionFood) => void;
  highlighted?: boolean;
  highlightColor?: string;
  className?: string;
}

export function FoodCard({
  food,
  onTap,
  highlighted = false,
  highlightColor,
  className,
}: FoodCardProps) {
  return (
    <button
      onClick={() => onTap(food)}
      className={cn(
        'flex flex-col items-center justify-center p-2 rounded-xl',
        'bg-white shadow-sm',
        'hover:shadow-md hover:scale-105 active:scale-95',
        'border-2 transition-all duration-200',
        'min-h-[80px] min-w-[80px]',
        highlighted ? '' : 'border-transparent',
        className
      )}
      style={
        highlighted && highlightColor
          ? { borderColor: highlightColor }
          : highlighted
            ? { borderColor: '#a855f7' }
            : undefined
      }
    >
      <span className="text-3xl leading-none">{food.emoji}</span>
      <span className="text-xs font-medium text-slate-700 mt-1 text-center line-clamp-2 max-w-[72px]">
        {food.name}
      </span>
    </button>
  );
}

export type { FoodCardProps };
