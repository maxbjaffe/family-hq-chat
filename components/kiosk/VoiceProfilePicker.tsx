'use client';

import { Avatar } from '@/components/Avatar';

interface VoiceProfilePickerProps {
  members: Array<{
    id: string;
    name: string;
    role: string;
    avatar_url: string | null;
  }>;
  selectedId: string | null;
  onSelect: (memberId: string | null) => void;
}

export function VoiceProfilePicker({ members, selectedId, onSelect }: VoiceProfilePickerProps) {
  // Only show kids
  const kids = members.filter((m) => m.role === 'kid');

  if (kids.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {kids.map((kid) => {
        const isSelected = kid.id === selectedId;
        return (
          <button
            key={kid.id}
            onClick={() => onSelect(isSelected ? null : kid.id)}
            className={`
              flex items-center gap-1.5 px-2 py-1 rounded-full transition-all
              ${isSelected
                ? 'bg-blue-100 ring-2 ring-blue-500 shadow-sm'
                : 'bg-white/60 hover:bg-white/80'
              }
            `}
          >
            <Avatar
              member={{ name: kid.name, role: kid.role, avatar_url: kid.avatar_url }}
              size="sm"
            />
            <span className={`text-xs font-medium ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
              {kid.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
