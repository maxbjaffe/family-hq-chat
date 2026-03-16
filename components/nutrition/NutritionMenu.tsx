'use client';

import { useState, useEffect, useCallback } from 'react';
import { NutritionLogger } from './NutritionLogger';
import { NutritionAvatar } from './NutritionAvatar';
import { NutritionMeters } from './NutritionMeters';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { DailyState, MeterValues } from '@/lib/nutrition/types';
import { toPercentages } from '@/lib/nutrition/engine';
import { AVATAR_STATE_CONFIG } from '@/lib/nutrition/constants';

interface NutritionMenuProps {
  childId?: string;
  childName?: string;
}

interface KidMember {
  id: string;
  name: string;
  role: string;
  avatar_url?: string | null;
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

export function NutritionMenu({ childId, childName }: NutritionMenuProps) {
  const [kids, setKids] = useState<KidMember[]>([]);
  const [dailyStates, setDailyStates] = useState<Record<string, DailyState>>({});
  const [selectedKid, setSelectedKid] = useState<{ id: string; name: string } | null>(
    childId && childName ? { id: childId, name: childName } : null
  );
  const [loadingKids, setLoadingKids] = useState(!childId);

  // Load states for all kids (used in picker view)
  const loadStates = useCallback(async (kidList: KidMember[]) => {
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

  // Load kids list if no childId prop
  useEffect(() => {
    if (childId) return;

    async function fetchKids() {
      try {
        const res = await fetch('/api/admin/family');
        if (res.ok) {
          const data = await res.json();
          const members = Array.isArray(data) ? data : data.members ?? [];
          const kidMembers = members.filter(
            (m: KidMember) => m.role === 'kid'
          );
          setKids(kidMembers);
          if (kidMembers.length > 0) {
            await loadStates(kidMembers);
          }
        }
      } catch (error) {
        console.error('[NutritionMenu] Error loading kids:', error);
      } finally {
        setLoadingKids(false);
      }
    }

    fetchKids();
  }, [childId, loadStates]);

  const handleBack = useCallback(() => {
    setSelectedKid(null);
    if (kids.length > 0) {
      loadStates(kids);
    }
  }, [kids, loadStates]);

  // If childId is directly provided, go straight to logger
  if (childId && childName) {
    return (
      <div className="max-h-[500px] overflow-auto rounded-lg">
        <NutritionLogger
          memberId={childId}
          kidName={childName}
          onBack={() => {
            // No-op when embedded with fixed child — nowhere to go back to
          }}
        />
      </div>
    );
  }

  // Show loading state
  if (loadingKids) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <LoadingSpinner size="md" />
        <p className="text-slate-500">Loading kids...</p>
      </div>
    );
  }

  // If a kid is selected, show their logger inline
  if (selectedKid) {
    return (
      <div className="max-h-[500px] overflow-auto rounded-lg">
        <NutritionLogger
          memberId={selectedKid.id}
          kidName={selectedKid.name}
          onBack={handleBack}
        />
      </div>
    );
  }

  // Kid picker view
  return (
    <div className="flex flex-col items-center py-4">
      <h3 className="font-bold text-lg text-slate-800 mb-1">Nutrition Tracker</h3>
      <p className="text-sm text-slate-500 mb-4">Tap a character to start logging!</p>

      {kids.length === 0 ? (
        <p className="text-slate-400 text-sm">No kids found.</p>
      ) : (
        <div className="flex items-start justify-center gap-6">
          {kids.map((kid) => {
            const state = dailyStates[kid.id] ?? { ...DEFAULT_STATE, member_id: kid.id };
            const totals = stateToTotals(state);
            const percentages = toPercentages(totals);
            const stateConfig = AVATAR_STATE_CONFIG[state.avatar_state];

            return (
              <button
                key={kid.id}
                onClick={() => setSelectedKid({ id: kid.id, name: kid.name })}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
                  <NutritionAvatar
                    kidName={kid.name}
                    state={state.avatar_state}
                    totals={totals}
                    size="lg"
                  />
                </div>
                <span className="font-bold text-sm text-slate-900">
                  {kid.name}
                </span>
                <NutritionMeters
                  percentages={percentages}
                  variant="mini"
                />
                <span className="text-xs text-slate-500">
                  {stateConfig.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
