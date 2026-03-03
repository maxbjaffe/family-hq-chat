'use client';

import { useState, useCallback } from 'react';
import { KidTodosCard } from './KidTodosCard';
import { BirthdayCard } from './BirthdayCard';
import { ChecklistCard } from './ChecklistCard';
import { SchoolCard } from './SchoolCard';
import { ComingUpCard } from './ComingUpCard';
import { KidSchoolTab } from '@/components/KidSchoolTab';
import { RechargeMenu } from '@/components/recharge';
import { Battery, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface KidProfileDashboardProps {
  memberId: string;
  memberName: string;
  birthday: string | null;
  school: string | null;
  teachers: string | null;
  kioskMode?: boolean;
}

export function KidProfileDashboard({
  memberId,
  memberName,
  birthday,
  school,
  teachers,
  kioskMode,
}: KidProfileDashboardProps) {
  const [schoolEventTitles, setSchoolEventTitles] = useState<string[]>([]);
  const [showRecharge, setShowRecharge] = useState(false);

  // Get first name for matching
  const firstName = memberName.split(' ')[0];

  // Callback to receive school event titles for deduplication
  const handleSchoolEventsLoaded = useCallback((titles: string[]) => {
    setSchoolEventTitles(titles);
  }, []);

  if (kioskMode) {
    return (
      <div className="h-full flex flex-col min-h-0">
        {/* 2x2 Grid of Cards */}
        <div className="grid grid-cols-2 gap-3 flex-shrink-0">
          <BirthdayCard birthday={birthday} />
          <ChecklistCard memberId={memberId} />
          <SchoolCard school={school} teachers={teachers} />
          <ComingUpCard
            memberName={firstName}
            excludeEventTitles={schoolEventTitles}
          />
        </div>

        {/* My To-Dos — scrollable */}
        <div className="flex-1 overflow-auto min-h-0 mt-3">
          <KidTodosCard childName={firstName} />
        </div>

        {/* Hidden: still load school events for dedup */}
        <div className="hidden">
          <KidSchoolTab
            childName={firstName.toLowerCase()}
            onEventsLoaded={handleSchoolEventsLoaded}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 2x2 Grid of Cards - At the top */}
      <div className="grid grid-cols-2 gap-4">
        <BirthdayCard birthday={birthday} />
        <ChecklistCard memberId={memberId} />
        <SchoolCard school={school} teachers={teachers} />
        <ComingUpCard
          memberName={firstName}
          excludeEventTitles={schoolEventTitles}
        />
      </div>

      {/* Recharge Menu */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setShowRecharge(!showRecharge)}
          className="w-full flex items-center gap-3 p-4 min-h-[56px] cursor-pointer hover:bg-purple-50/50 transition-colors"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex-shrink-0">
            <Battery className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-bold text-slate-800 text-base">Recharge Menu</h3>
            <p className="text-sm text-slate-500">Take a brain break</p>
          </div>
          {showRecharge ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>
        {showRecharge && (
          <div className="border-t border-slate-200 p-4">
            <RechargeMenu childId={memberId} childName={firstName} />
          </div>
        )}
      </Card>

      {/* My To-Dos */}
      <KidTodosCard childName={firstName} />

      {/* School Updates from Radar */}
      <KidSchoolTab
        childName={firstName.toLowerCase()}
        onEventsLoaded={handleSchoolEventsLoaded}
      />
    </div>
  );
}
