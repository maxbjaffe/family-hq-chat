'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Cake,
  Droplets,
  AlertTriangle,
  Pill,
  Stethoscope,
  Heart,
  ExternalLink,
  AlertCircle,
  Loader2,
  Calendar,
  GraduationCap,
  Users,
  Sparkles,
} from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { FamilyCalendarSection } from '@/components/FamilyCalendarSection';

interface FamilyMember {
  id: string;
  name: string;
  role: string | null;
  age: string | null;
  birthday: string | null;
  bloodType: string | null;
  allergies: string | null;
  medications: string | null;
  conditions: string | null;
  doctors: string | null;
  patientPortal: string | null;
  emergencyNotes: string | null;
  school: string | null;
  teachers: string | null;
  activities: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  'Dad': 'from-blue-500 to-indigo-600',
  'Mom': 'from-pink-500 to-rose-600',
  'Daughter': 'from-purple-500 to-violet-600',
  'Son': 'from-green-500 to-emerald-600',
  'Dog': 'from-amber-500 to-orange-600',
  'default': 'from-slate-500 to-slate-600',
};

const ROLE_EMOJI: Record<string, string> = {
  'Dad': '👨',
  'Mom': '👩',
  'Daughter': '👧',
  'Son': '👦',
  'Dog': '🐕',
  'default': '👤',
};

function formatBirthday(birthday: string | null): string | null {
  if (!birthday) return null;
  try {
    // Parse date parts to avoid timezone issues
    // Dates like "1985-05-12" get interpreted as UTC midnight,
    // which becomes the previous day in local time zones
    const parts = birthday.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day); // Creates local date
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    // Fallback for other formats
    const date = new Date(birthday + 'T12:00:00'); // Noon to avoid timezone issues
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return birthday;
  }
}

function getBirthdayCountdown(birthday: string | null): { days: number; isToday: boolean; isTomorrow: boolean } | null {
  if (!birthday) return null;
  try {
    const parts = birthday.split('-');
    if (parts.length !== 3) return null;

    const birthMonth = parseInt(parts[1], 10) - 1;
    const birthDay = parseInt(parts[2], 10);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get this year's birthday
    let nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
    nextBirthday.setHours(0, 0, 0, 0);

    // If birthday has passed this year, use next year
    if (nextBirthday < today) {
      nextBirthday = new Date(today.getFullYear() + 1, birthMonth, birthDay);
    }

    const diffTime = nextBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      days: diffDays,
      isToday: diffDays === 0,
      isTomorrow: diffDays === 1,
    };
  } catch {
    return null;
  }
}

function InfoCard({
  icon: Icon,
  label,
  value,
  className = '',
  valueClassName = '',
}: {
  icon: React.ElementType;
  label: string;
  value: string | null;
  className?: string;
  valueClassName?: string;
}) {
  if (!value || value.toLowerCase() === 'none') return null;

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-slate-100">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className={`font-medium text-slate-800 ${valueClassName}`}>{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default function FamilyProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [avatarInfo, setAvatarInfo] = useState<{ avatar_url?: string | null; role?: string } | null>(null);

  const isVisible = (field: string) => visibility[field] !== false;

  const name = typeof params.name === 'string' ? decodeURIComponent(params.name) : '';

  useEffect(() => {
    async function loadMember() {
      try {
        const res = await fetch('/api/family');
        if (res.ok) {
          const data = await res.json();
          // Match by any word in name to support "alex" matching "S Alex Jaffe"
          const found = data.members?.find(
            (m: FamilyMember) => {
              const nameParts = m.name.toLowerCase().split(' ');
              const searchName = name.toLowerCase();
              return m.name.toLowerCase() === searchName || nameParts.some(part => part === searchName);
            }
          );
          if (found) {
            // Fetch visibility settings from Supabase
            try {
              const visRes = await fetch('/api/admin/family');
              if (visRes.ok) {
                const visData = await visRes.json();
                const supabaseMember = visData.members?.find(
                  (m: { name: string; profile_visibility?: Record<string, boolean>; avatar_url?: string | null; role?: string }) => {
                    const nameParts = m.name.toLowerCase().split(' ');
                    return nameParts.some(part => part === name.toLowerCase());
                  }
                );
                if (supabaseMember) {
                  if (supabaseMember.profile_visibility) {
                    setVisibility(supabaseMember.profile_visibility);
                  }
                  setAvatarInfo({ avatar_url: supabaseMember.avatar_url, role: supabaseMember.role });
                }
              }
            } catch (e) {
              console.error('Failed to load visibility settings:', e);
            }
            setMember(found);
          } else {
            setNotFound(true);
          }
        }
      } catch (error) {
        console.error('Failed to load family member:', error);
        setNotFound(true);
      }
      setLoading(false);
    }
    if (name) {
      loadMember();
    }
  }, [name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (notFound || !member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Card className="p-8 text-center">
            <p className="text-slate-500">Family member not found</p>
          </Card>
        </div>
      </div>
    );
  }

  const hasAllergies = member.allergies && member.allergies.toLowerCase() !== 'none';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <Avatar
              member={{
                name: member.name,
                role: avatarInfo?.role || member.role || 'default',
                avatar_url: avatarInfo?.avatar_url,
              }}
              size="2xl"
              className="shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{member.name}</h1>
              {member.role && (
                <p className="text-slate-500">{member.role}</p>
              )}
              {member.age && (
                <p className="text-sm text-slate-400">{member.age}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Emergency Info - Highlighted */}
        {((hasAllergies && isVisible('allergies')) || (member.emergencyNotes && isVisible('emergencyNotes'))) && (
          <Card className="p-4 mb-6 border-amber-200 bg-amber-50">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h2 className="font-semibold text-amber-800">Emergency Info</h2>
            </div>
            {hasAllergies && isVisible('allergies') && (
              <div className="mb-3">
                <p className="text-sm text-amber-700 font-medium">Allergies</p>
                <p className="text-amber-900">{member.allergies}</p>
              </div>
            )}
            {member.emergencyNotes && isVisible('emergencyNotes') && (
              <div>
                <p className="text-sm text-amber-700 font-medium">Emergency Notes</p>
                <p className="text-amber-900">{member.emergencyNotes}</p>
              </div>
            )}
          </Card>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {isVisible('birthday') && member.birthday && (() => {
            const countdown = getBirthdayCountdown(member.birthday);
            const formattedDate = formatBirthday(member.birthday);

            if (countdown?.isToday) {
              return (
                <Card className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200 sm:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-pink-100">
                      <Cake className="h-5 w-5 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-pink-600 mb-1">Birthday</p>
                      <p className="font-medium text-slate-800">{formattedDate}</p>
                      <p className="text-lg font-bold text-pink-600 mt-1">🎉 Happy Birthday! 🎂</p>
                    </div>
                  </div>
                </Card>
              );
            }

            return (
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100">
                    <Cake className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 mb-1">Birthday</p>
                    <p className="font-medium text-slate-800">{formattedDate}</p>
                    {countdown && (
                      <p className="text-sm text-purple-600 mt-1">
                        {countdown.isTomorrow
                          ? "🎈 Tomorrow!"
                          : countdown.days <= 30
                            ? `🎈 ${countdown.days} days away`
                            : `${countdown.days} days away`
                        }
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })()}
          {isVisible('bloodType') && (
            <InfoCard
              icon={Droplets}
              label="Blood Type"
              value={member.bloodType}
              valueClassName="text-red-600 font-bold text-lg"
            />
          )}
          {isVisible('medications') && (
            <InfoCard
              icon={Pill}
              label="Medications"
              value={member.medications}
            />
          )}
          {isVisible('conditions') && (
            <InfoCard
              icon={Heart}
              label="Chronic Conditions"
              value={member.conditions}
            />
          )}
          {isVisible('doctors') && (
            <InfoCard
              icon={Stethoscope}
              label="Primary Doctors"
              value={member.doctors}
            />
          )}
        </div>

        {/* School & Activities (for kids) */}
        {((member.school && isVisible('school')) || (member.teachers && isVisible('teachers')) || (member.activities && isVisible('activities'))) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {isVisible('school') && (
              <InfoCard
                icon={GraduationCap}
                label="School / Grade"
                value={member.school}
              />
            )}
            {isVisible('teachers') && (
              <InfoCard
                icon={Users}
                label="Teachers"
                value={member.teachers}
              />
            )}
            {isVisible('activities') && (
              <InfoCard
                icon={Sparkles}
                label="Activities & Interests"
                value={member.activities}
                className="sm:col-span-2"
              />
            )}
          </div>
        )}

        {/* Upcoming Calendar Events */}
        {member.role !== 'Dog' && avatarInfo?.role !== 'pet' && (
          <FamilyCalendarSection memberName={member.name.split(' ')[0]} />
        )}

        {/* Patient Portal Link */}
        {member.patientPortal && isVisible('patientPortal') && (
          <Card className="p-4">
            <a
              href={member.patientPortal}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-purple-600 hover:text-purple-700"
            >
              <ExternalLink className="h-5 w-5" />
              <span className="font-medium">Open Patient Portal</span>
            </a>
          </Card>
        )}
      </div>
    </div>
  );
}
