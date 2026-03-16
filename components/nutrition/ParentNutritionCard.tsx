'use client';

import { useState, useEffect, useCallback } from 'react';
import { NutritionAvatar } from '@/components/nutrition/NutritionAvatar';
import { NutritionMeters } from '@/components/nutrition/NutritionMeters';
import { toPercentages } from '@/lib/nutrition/engine';
import { AVATAR_STATE_CONFIG } from '@/lib/nutrition/constants';
import type {
  DailyState,
  NutritionLog,
  AvatarState,
  MeterValues,
} from '@/lib/nutrition/types';

interface ParentNutritionCardProps {
  memberId: string;
  kidName: string;
}

const STATE_PILL_COLORS: Record<AvatarState, string> = {
  sunbeam: 'bg-yellow-100 text-yellow-800',
  glow: 'bg-green-100 text-green-800',
  flicker: 'bg-amber-100 text-amber-800',
  pebble: 'bg-slate-100 text-slate-600',
  fizzy: 'bg-orange-100 text-orange-800',
};

export function ParentNutritionCard({
  memberId,
  kidName,
}: ParentNutritionCardProps) {
  const [state, setState] = useState<DailyState | null>(null);
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [waterCount, setWaterCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/nutrition/state/${memberId}`);
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
        setLogs(data.logs || []);
        setWaterCount(data.waterCount ?? 0);
      }
    } catch (error) {
      console.error('[ParentNutritionCard] Failed to fetch state:', error);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const handleDelete = async (logId: string) => {
    setDeleting(logId);
    try {
      const res = await fetch('/api/nutrition/log', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      });
      if (res.ok) {
        await fetchState();
      }
    } catch (error) {
      console.error('[ParentNutritionCard] Failed to delete log:', error);
    } finally {
      setDeleting(null);
    }
  };

  const formatLogTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-4 animate-pulse">
        <div className="h-6 bg-slate-100 rounded w-24 mb-4" />
        <div className="h-20 bg-slate-50 rounded" />
      </div>
    );
  }

  const avatarState: AvatarState = state?.avatar_state ?? 'pebble';
  const stateConfig = AVATAR_STATE_CONFIG[avatarState];
  const pillColor = STATE_PILL_COLORS[avatarState];

  const totals: MeterValues = {
    protein: state?.protein_total ?? 0,
    veggie: state?.veggie_total ?? 0,
    sugar: state?.sugar_total ?? 0,
    water: state?.water_total ?? 0,
    vitamin: state?.vitamin_total ?? 0,
  };

  const percentages = toPercentages(totals);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">{kidName}</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${pillColor}`}
          >
            {stateConfig.label}
          </span>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 min-h-[44px] px-2"
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      {/* Avatar + Meters side by side */}
      <div className="flex items-start gap-4 mb-3">
        <NutritionAvatar
          kidName={kidName}
          state={avatarState}
          totals={totals}
          size="sm"
        />
        <NutritionMeters
          percentages={percentages}
          variant="full"
          className="flex-1"
        />
      </div>

      {/* Food log list */}
      {logs.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-3">
          No food logged yet
        </p>
      ) : (
        <div className="max-h-48 overflow-y-auto border-t pt-2 space-y-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-2 py-1 px-1 rounded hover:bg-slate-50"
            >
              <span className="text-base">{log.food?.emoji ?? '🍽️'}</span>
              <span className="text-sm text-slate-700 flex-1 truncate">
                {log.food?.name ?? 'Unknown food'}
              </span>
              <span className="text-xs text-slate-400 capitalize px-1.5 py-0.5 bg-slate-50 rounded">
                {log.meal_category}
              </span>
              <span className="text-xs text-slate-400 w-16 text-right">
                {formatLogTime(log.logged_at)}
              </span>
              {editing && (
                <button
                  onClick={() => handleDelete(log.id)}
                  disabled={deleting === log.id}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  aria-label={`Delete ${log.food?.name ?? 'food'} log`}
                >
                  {deleting === log.id ? (
                    <span className="text-xs">...</span>
                  ) : (
                    <span className="text-lg font-bold">&times;</span>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Water count */}
      <div className="border-t mt-2 pt-2 text-sm text-slate-500">
        <span role="img" aria-label="water">
          💧
        </span>{' '}
        &times; {waterCount}
      </div>
    </div>
  );
}
