'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  Users,
  Cake,
  AlertTriangle,
  Droplets,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  role: string | null;
  age: string | null;
  birthday: string | null;
  bloodType: string | null;
  allergies: string | null;
}

// Role-based gradient colors
const ROLE_COLORS: Record<string, string> = {
  'Dad': 'from-blue-500 to-indigo-600',
  'Mom': 'from-pink-500 to-rose-600',
  'Daughter': 'from-purple-500 to-violet-600',
  'Son': 'from-green-500 to-emerald-600',
  'default': 'from-slate-500 to-slate-600',
};

// Role-based emojis
const ROLE_EMOJI: Record<string, string> = {
  'Dad': '👨',
  'Mom': '👩',
  'Daughter': '👧',
  'Son': '👦',
  'default': '👤',
};

function formatBirthday(birthday: string | null): string | null {
  if (!birthday) return null;
  try {
    const date = new Date(birthday);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return birthday;
  }
}

function getUpcomingBirthday(birthday: string | null): { days: number; isToday: boolean } | null {
  if (!birthday) return null;
  try {
    const today = new Date();
    const bday = new Date(birthday);
    // Set birthday to this year
    bday.setFullYear(today.getFullYear());
    // If birthday has passed this year, check next year
    if (bday < today) {
      bday.setFullYear(today.getFullYear() + 1);
    }
    const diffTime = bday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { days: diffDays, isToday: diffDays === 0 };
  } catch {
    return null;
  }
}

export function FamilyCards() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFamily() {
      try {
        const res = await fetch('/api/family');
        if (res.ok) {
          const data = await res.json();
          setMembers(data.members || []);
        }
      } catch (error) {
        console.error('Failed to load family:', error);
      }
      setLoading(false);
    }
    loadFamily();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">Family</h3>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">Family</h3>
        </div>
        <p className="text-slate-500 text-center py-4">No family members found in Notion</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-slate-600" />
        <h3 className="font-semibold text-slate-800">Family</h3>
        <span className="text-sm text-slate-400 ml-auto">Tap for details</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {members.map((member) => {
          const gradient = ROLE_COLORS[member.role || ''] || ROLE_COLORS.default;
          const emoji = ROLE_EMOJI[member.role || ''] || ROLE_EMOJI.default;
          const birthdayInfo = getUpcomingBirthday(member.birthday);
          const hasAllergies = member.allergies && member.allergies.toLowerCase() !== 'none';

          return (
            <Link
              key={member.id}
              href={`/family/${encodeURIComponent(member.name.toLowerCase())}`}
              className="group"
            >
              <div className="flex flex-col items-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all hover:shadow-md">
                {/* Avatar */}
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl mb-2 group-hover:scale-105 transition-transform`}>
                  {emoji}
                </div>

                {/* Name */}
                <span className="font-medium text-slate-800 text-sm">{member.name}</span>

                {/* Role */}
                {member.role && (
                  <span className="text-xs text-slate-500">{member.role}</span>
                )}

                {/* Quick Info Icons */}
                <div className="flex items-center gap-2 mt-2">
                  {/* Blood Type */}
                  {member.bloodType && (
                    <div className="flex items-center gap-0.5 text-xs text-red-600" title={`Blood: ${member.bloodType}`}>
                      <Droplets className="h-3 w-3" />
                      <span>{member.bloodType}</span>
                    </div>
                  )}

                  {/* Allergies Warning */}
                  {hasAllergies && (
                    <div className="text-amber-500" title={`Allergies: ${member.allergies}`}>
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                  )}

                  {/* Upcoming Birthday */}
                  {birthdayInfo && birthdayInfo.days <= 30 && (
                    <div
                      className={`flex items-center gap-0.5 text-xs ${birthdayInfo.isToday ? 'text-pink-600 font-bold' : 'text-pink-500'}`}
                      title={`Birthday: ${formatBirthday(member.birthday)}`}
                    >
                      <Cake className="h-3 w-3" />
                      {birthdayInfo.isToday ? '🎉' : `${birthdayInfo.days}d`}
                    </div>
                  )}
                </div>

                {/* Hover indicator */}
                <ChevronRight className="h-4 w-4 text-slate-300 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
