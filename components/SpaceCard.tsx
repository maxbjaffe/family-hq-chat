'use client';

import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SpaceCardProps {
  name: string;
  icon: React.ReactNode;
  color: string;
  requiresPin?: boolean;
  onClick: () => void;
}

export function SpaceCard({ name, icon, color, requiresPin = false, onClick }: SpaceCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`p-4 cursor-pointer transition-transform hover:scale-105 ${color}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium text-white">{name}</span>
        </div>
        {requiresPin && <Lock className="w-4 h-4 text-white/70" />}
      </div>
    </Card>
  );
}
