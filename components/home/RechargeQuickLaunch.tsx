'use client';

import { useRouter } from 'next/navigation';
import { Battery } from 'lucide-react';
import { Card } from '@/components/ui/card';

const CATEGORIES = [
  {
    name: 'energy',
    label: 'Energy',
    bg: 'bg-rose-100 hover:bg-rose-200',
    text: 'text-rose-700',
    icon: '🔥',
  },
  {
    name: 'calm',
    label: 'Calm',
    bg: 'bg-sky-100 hover:bg-sky-200',
    text: 'text-sky-700',
    icon: '🌊',
  },
  {
    name: 'creative',
    label: 'Creative',
    bg: 'bg-amber-100 hover:bg-amber-200',
    text: 'text-amber-700',
    icon: '✨',
  },
  {
    name: 'fun',
    label: 'Fun',
    bg: 'bg-violet-100 hover:bg-violet-200',
    text: 'text-violet-700',
    icon: '🎮',
  },
] as const;

export function RechargeQuickLaunch() {
  const router = useRouter();

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-violet-50 p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Battery className="h-5 w-5 text-purple-600" />
        <h3 className="font-bold text-slate-800">Recharge</h3>
      </div>
      <p className="text-sm text-slate-500 mb-4">Take a Break</p>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => router.push(`/recharge?category=${cat.name}`)}
            className={`rounded-xl p-4 min-h-[56px] font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${cat.bg} ${cat.text}`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
