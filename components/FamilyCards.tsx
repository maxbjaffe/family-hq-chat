'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/Avatar';
import {
  Users,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  role: string;  // 'admin' | 'adult' | 'kid' | 'pet'
  avatar_url: string | null;
  has_checklist: boolean;
}

export function FamilyCards() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFamily() {
      try {
        const res = await fetch('/api/admin/family');
        if (res.ok) {
          const data = await res.json();
          setMembers(data.members || []);
        }
      } catch (error) {
        console.error('Failed to load family:', error);
      }
      setLoading(false);
    }
    loadFamily();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">Family</h3>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">Family</h3>
        </div>
        <p className="text-slate-500 text-center py-4">No family members found</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-slate-600" />
        <h3 className="font-semibold text-slate-800">Family</h3>
        <span className="text-sm text-slate-400 ml-auto">Tap for details</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {members.map((member) => (
          <Link
            key={member.id}
            href={`/family/${encodeURIComponent(member.name.toLowerCase())}`}
            className="group"
          >
            <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all hover:shadow-lg">
              {/* Avatar - Large to show off photos */}
              <div className="mb-3 group-hover:scale-105 transition-transform">
                <Avatar member={member} size="xl" className="ring-4 ring-white shadow-lg" />
              </div>

              {/* Name */}
              <span className="font-semibold text-slate-800">{member.name}</span>

              {/* Role */}
              <span className="text-sm text-slate-500 capitalize">{member.role}</span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
