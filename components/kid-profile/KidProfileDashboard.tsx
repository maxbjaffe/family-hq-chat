'use client';

import { useState, useCallback } from 'react';
import { KidTodosCard } from './KidTodosCard';
import { BirthdayCard } from './BirthdayCard';
import { ChecklistCard } from './ChecklistCard';
import { SchoolCard } from './SchoolCard';
import { ComingUpCard } from './ComingUpCard';
import { KidSchoolTab } from '@/components/KidSchoolTab';

interface KidProfileDashboardProps {
  memberId: string;
  memberName: string;
  birthday: string | null;
  school: string | null;
  teachers: string | null;
}

export function KidProfileDashboard({
  memberId,
  memberName,
  birthday,
  school,
  teachers,
}: KidProfileDashboardProps) {
  const [schoolEventTitles, setSchoolEventTitles] = useState<string[]>([]);

  // Get first name for matching
  const firstName = memberName.split(' ')[0];

  // Callback to receive school event titles for deduplication
  const handleSchoolEventsLoaded = useCallback((titles: string[]) => {
    setSchoolEventTitles(titles);
  }, []);

  return (
    <div className="space-y-4">
      {/* My To-Dos - Full width, most important */}
      <KidTodosCard childName={firstName} />

      {/* School Updates from Radar */}
      <KidSchoolTab
        childName={firstName.toLowerCase()}
        onEventsLoaded={handleSchoolEventsLoaded}
      />

      {/* 2x2 Grid of Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Birthday Card */}
        <BirthdayCard birthday={birthday} />

        {/* Checklist Card */}
        <ChecklistCard memberId={memberId} />

        {/* School Card */}
        <SchoolCard school={school} teachers={teachers} />

        {/* Coming Up Card */}
        <ComingUpCard
          memberName={firstName}
          excludeEventTitles={schoolEventTitles}
        />
      </div>
    </div>
  );
}
