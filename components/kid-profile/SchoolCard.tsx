'use client';

import { Card } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';

interface SchoolCardProps {
  school: string | null;
  teachers: string | null;
}

export function SchoolCard({ school, teachers }: SchoolCardProps) {
  if (!school && !teachers) return null;

  // Get main teacher (first one)
  const mainTeacher = teachers
    ? teachers.split(',')[0].trim()
    : null;

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-slate-800">School</h3>
      </div>

      {school && (
        <p className="text-blue-700 font-bold text-sm">{school}</p>
      )}

      {mainTeacher && (
        <p className="text-slate-600 text-sm mt-1">{mainTeacher}</p>
      )}
    </Card>
  );
}
