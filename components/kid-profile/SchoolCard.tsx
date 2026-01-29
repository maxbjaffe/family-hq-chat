'use client';

import { Card } from '@/components/ui/card';
import { GraduationCap, User } from 'lucide-react';

interface SchoolCardProps {
  school: string | null;
  teachers: string | null;
}

export function SchoolCard({ school, teachers }: SchoolCardProps) {
  if (!school && !teachers) return null;

  // Parse teachers string into array (comma-separated)
  const teacherList = teachers
    ? teachers.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <GraduationCap className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-slate-800">School</h3>
      </div>

      {school && (
        <p className="text-slate-700 font-medium mb-2">{school}</p>
      )}

      {teacherList.length > 0 && (
        <div className="space-y-1">
          {teacherList.map((teacher, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
              <User className="h-4 w-4 text-blue-400" />
              <span>{teacher}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
