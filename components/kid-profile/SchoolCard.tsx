'use client';

import { Card } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';

interface SchoolCardProps {
  school: string | null;
  teachers: string | null;
}

export function SchoolCard({ school, teachers }: SchoolCardProps) {
  if (!school && !teachers) return null;

  // Get all teachers for display
  const teacherList = teachers
    ? teachers.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  return (
    <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <GraduationCap className="h-5 w-5 text-blue-600" />
        <h3 className="font-bold text-slate-800 text-base">School</h3>
      </div>

      {school && (
        <p className="text-blue-700 font-bold text-base">{school}</p>
      )}

      {teacherList.length > 0 && (
        <div className="mt-3 space-y-1">
          {teacherList.map((teacher, idx) => (
            <p key={idx} className="text-slate-600 text-base">{teacher}</p>
          ))}
        </div>
      )}
    </Card>
  );
}
