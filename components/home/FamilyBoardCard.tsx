'use client';

import { Pin } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function FamilyBoardCard({ className }: { className?: string }) {
  return (
    <Card className={`bg-gradient-to-br from-slate-50 to-stone-50 p-5 border-2 border-dashed border-slate-200 flex flex-col ${className ?? ''}`}>
      {/* Header */}
      <h3 className="font-bold text-slate-800 mb-3">📌 Family Board</h3>

      {/* Empty state */}
      <div className="min-h-[120px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Pin className="h-6 w-6 text-slate-300" />
          <p className="text-slate-500 font-medium text-sm">
            Nothing pinned yet
          </p>
          <p className="text-sm text-slate-400">
            Parents can add items here
          </p>
        </div>
      </div>
    </Card>
  );
}
