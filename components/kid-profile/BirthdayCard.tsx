'use client';

import { Card } from '@/components/ui/card';
import { Cake } from 'lucide-react';
import { getZodiacFromBirthday } from '@/lib/zodiac';

interface BirthdayCardProps {
  birthday: string | null;
}

function formatBirthday(birthday: string): string {
  const parts = birthday.split('-');
  if (parts.length === 3) {
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(2000, month, day);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
  return birthday;
}

function getBirthdayCountdown(birthday: string): { days: number; isToday: boolean; isTomorrow: boolean } | null {
  const parts = birthday.split('-');
  if (parts.length !== 3) return null;

  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
  nextBirthday.setHours(0, 0, 0, 0);

  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, birthMonth, birthDay);
  }

  const diffTime = nextBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    days: diffDays,
    isToday: diffDays === 0,
    isTomorrow: diffDays === 1,
  };
}

export function BirthdayCard({ birthday }: BirthdayCardProps) {
  if (!birthday) return null;

  const countdown = getBirthdayCountdown(birthday);
  const zodiac = getZodiacFromBirthday(birthday);
  const formattedDate = formatBirthday(birthday);

  if (countdown?.isToday) {
    return (
      <Card className="p-4 bg-gradient-to-br from-pink-100 to-purple-100 border-pink-300">
        <div className="flex items-center gap-2 mb-2">
          <Cake className="h-5 w-5 text-pink-600" />
          <h3 className="font-semibold text-slate-800">Birthday</h3>
        </div>
        <p className="text-slate-700">{formattedDate}</p>
        <p className="text-2xl font-bold text-pink-600 mt-1">Happy Birthday!</p>
        {zodiac && (
          <p className="text-sm text-purple-600 mt-2">
            {zodiac.symbol} {zodiac.sign}
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
      <div className="flex items-center gap-2 mb-2">
        <Cake className="h-5 w-5 text-pink-600" />
        <h3 className="font-semibold text-slate-800">Birthday</h3>
      </div>
      <p className="text-slate-700 font-medium">{formattedDate}</p>
      {countdown && (
        <p className="text-pink-600 font-bold mt-1">
          {countdown.isTomorrow
            ? "Tomorrow!"
            : countdown.days <= 30
              ? `${countdown.days} days away!`
              : `${countdown.days} days`
          }
        </p>
      )}
      {zodiac && (
        <p className="text-sm text-purple-600 mt-2">
          {zodiac.symbol} {zodiac.sign} - {zodiac.trait}
        </p>
      )}
    </Card>
  );
}
