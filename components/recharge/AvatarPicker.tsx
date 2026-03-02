"use client";

import { Avatar } from "@/components/Avatar";

interface KidMember {
  id: string;
  name: string;
  role: string;
  avatar_url?: string | null;
}

interface AvatarPickerProps {
  kids: KidMember[];
  onSelect: (kid: KidMember) => void;
}

export function AvatarPicker({ kids, onSelect }: AvatarPickerProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
          Who&apos;s Recharging?
        </h2>
        <p className="text-slate-500 mt-2 text-lg">
          Tap your face to get started
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-4">
        {kids.map((kid) => (
          <button
            key={kid.id}
            onClick={() => onSelect(kid)}
            className="group flex flex-col items-center gap-3 transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none"
          >
            <div className="rounded-full ring-4 ring-transparent group-hover:ring-purple-300 transition-all duration-200">
              <Avatar
                member={{
                  name: kid.name,
                  role: kid.role,
                  avatar_url: kid.avatar_url,
                }}
                size="3xl"
              />
            </div>
            <span className="text-lg font-bold text-slate-700 group-hover:text-purple-600 transition-colors">
              {kid.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
