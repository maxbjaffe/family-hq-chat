'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { DailyState, MeterValues } from '@/lib/nutrition/types';
import { toPercentages } from '@/lib/nutrition/engine';
import { AVATAR_STATE_CONFIG } from '@/lib/nutrition/constants';
import { NutritionAvatar } from '@/components/nutrition/NutritionAvatar';
import { NutritionMeters } from '@/components/nutrition/NutritionMeters';
import { NutritionLogger } from '@/components/nutrition/NutritionLogger';

interface KidInfo {
  id: string;
  name: string;
}

const DEFAULT_STATE: DailyState = {
  member_id: '',
  date: new Date().toISOString().split('T')[0],
  protein_total: 0,
  veggie_total: 0,
  sugar_total: 0,
  water_total: 0,
  vitamin_total: 0,
  avatar_state: 'pebble',
};

function stateToTotals(state: DailyState): MeterValues {
  return {
    protein: state.protein_total,
    veggie: state.veggie_total,
    sugar: state.sugar_total,
    water: state.water_total,
    vitamin: state.vitamin_total,
  };
}

export default function NutritionKioskPage() {
  const router = useRouter();
  const [kids, setKids] = useState<KidInfo[]>([]);
  const [dailyStates, setDailyStates] = useState<Record<string, DailyState>>({});
  const [activeKid, setActiveKid] = useState<KidInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------------
  // Load kids and their daily states
  // -------------------------------------------------------------------

  const loadStates = useCallback(async (kidList: KidInfo[]) => {
    const entries = await Promise.all(
      kidList.map(async (kid) => {
        try {
          const res = await fetch(`/api/nutrition/state/${kid.id}`);
          if (!res.ok) throw new Error('fetch failed');
          const data = await res.json();
          return [kid.id, data.state as DailyState] as const;
        } catch {
          return [kid.id, { ...DEFAULT_STATE, member_id: kid.id }] as const;
        }
      })
    );
    setDailyStates(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);

      // Fetch family members, filter to kids
      let kidList: KidInfo[] = [];
      try {
        const res = await fetch('/api/admin/family');
        if (res.ok) {
          const data = await res.json();
          const members = Array.isArray(data) ? data : data.members ?? [];
          kidList = members
            .filter((m: { role: string }) => m.role === 'kid')
            .map((m: { id: string; name: string }) => ({ id: m.id, name: m.name }));
        }
      } catch {
        // If the endpoint fails, fall back to empty — UI will show "no kids"
      }

      setKids(kidList);

      if (kidList.length > 0) {
        await loadStates(kidList);
      }

      setLoading(false);
    }
    init();
  }, [loadStates]);

  // -------------------------------------------------------------------
  // When a kid is selected and then backs out, refresh all states
  // -------------------------------------------------------------------

  const handleBack = useCallback(() => {
    setActiveKid(null);
    if (kids.length > 0) {
      loadStates(kids);
    }
  }, [kids, loadStates]);

  // -------------------------------------------------------------------
  // Active kid view — full-screen NutritionLogger
  // -------------------------------------------------------------------

  if (activeKid) {
    return (
      <div className="h-screen">
        <NutritionLogger
          memberId={activeKid.id}
          kidName={activeKid.name}
          onBack={handleBack}
        />
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Kiosk view — pick a kid
  // -------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-slate-50 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Nutrition Tracker</h1>
        <p className="text-slate-500 mt-2">Tap your character to start logging!</p>
      </div>

      {/* Kid avatars */}
      {kids.length === 0 ? (
        <p className="text-slate-400 text-sm">No kids found.</p>
      ) : (
        <div className="flex items-start justify-center gap-8 md:gap-12">
          {kids.map((kid) => {
            const state = dailyStates[kid.id] ?? { ...DEFAULT_STATE, member_id: kid.id };
            const totals = stateToTotals(state);
            const percentages = toPercentages(totals);
            const stateConfig = AVATAR_STATE_CONFIG[state.avatar_state];

            return (
              <button
                key={kid.id}
                onClick={() => setActiveKid(kid)}
                className="flex flex-col items-center gap-2 group"
              >
                {/* Avatar — grows on hover */}
                <div className="transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
                  <NutritionAvatar
                    kidName={kid.name}
                    state={state.avatar_state}
                    totals={totals}
                    size="xl"
                  />
                </div>

                {/* Name */}
                <span className="font-bold text-lg text-slate-900">
                  {kid.name}
                </span>

                {/* Mini meters */}
                <NutritionMeters
                  percentages={percentages}
                  variant="mini"
                />

                {/* State label */}
                <span className="text-xs text-slate-500">
                  {stateConfig.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Back to home link */}
      <button
        onClick={() => router.push('/')}
        className="mt-12 flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>
    </div>
  );
}
