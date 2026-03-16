'use client';

import { useRouter } from 'next/navigation';
import { Apple } from 'lucide-react';
import { Card } from '@/components/ui/card';

const MEAL_SHORTCUTS = [
  {
    name: 'breakfast',
    label: 'Breakfast',
    bg: 'bg-amber-100 hover:bg-amber-200',
    text: 'text-amber-700',
    icon: '\uD83C\uDF73',
  },
  {
    name: 'lunch',
    label: 'Lunch',
    bg: 'bg-green-100 hover:bg-green-200',
    text: 'text-green-700',
    icon: '\uD83E\uDD6A',
  },
  {
    name: 'snack',
    label: 'Snack',
    bg: 'bg-orange-100 hover:bg-orange-200',
    text: 'text-orange-700',
    icon: '\uD83C\uDF4E',
  },
  {
    name: 'dinner',
    label: 'Dinner',
    bg: 'bg-indigo-100 hover:bg-indigo-200',
    text: 'text-indigo-700',
    icon: '\uD83C\uDF5D',
  },
] as const;

export function NutritionQuickLaunch({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <Card className={`bg-gradient-to-br from-green-50 to-emerald-50 p-5 flex flex-col ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Apple className="h-5 w-5 text-green-600" />
        <h3 className="font-bold text-slate-800">Nutrition</h3>
      </div>
      <p className="text-sm text-slate-500 mb-4">Track What You Eat</p>

      {/* Meal shortcut grid */}
      <div className="grid grid-cols-2 gap-3">
        {MEAL_SHORTCUTS.map((meal) => (
          <button
            key={meal.name}
            onClick={() => router.push('/nutrition')}
            className={`rounded-xl p-4 min-h-[56px] font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${meal.bg} ${meal.text}`}
          >
            <span>{meal.icon}</span>
            <span>{meal.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
