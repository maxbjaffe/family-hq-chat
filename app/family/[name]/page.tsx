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
    const date = new Date(birthday);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch {
    return birthday;
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

  const gradient = ROLE_COLORS[member.role || ''] || ROLE_COLORS.default;
  const emoji = ROLE_EMOJI[member.role || ''] || ROLE_EMOJI.default;
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
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-4xl shadow-lg`}>
              {emoji}
            </div>
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
        {(hasAllergies || member.emergencyNotes) && (
          <Card className="p-4 mb-6 border-amber-200 bg-amber-50">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h2 className="font-semibold text-amber-800">Emergency Info</h2>
            </div>
            {hasAllergies && (
              <div className="mb-3">
                <p className="text-sm text-amber-700 font-medium">Allergies</p>
                <p className="text-amber-900">{member.allergies}</p>
              </div>
            )}
            {member.emergencyNotes && (
              <div>
                <p className="text-sm text-amber-700 font-medium">Emergency Notes</p>
                <p className="text-amber-900">{member.emergencyNotes}</p>
              </div>
            )}
          </Card>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <InfoCard
            icon={Cake}
            label="Birthday"
            value={formatBirthday(member.birthday)}
          />
          <InfoCard
            icon={Droplets}
            label="Blood Type"
            value={member.bloodType}
            valueClassName="text-red-600 font-bold text-lg"
          />
          <InfoCard
            icon={Pill}
            label="Medications"
            value={member.medications}
          />
          <InfoCard
            icon={Heart}
            label="Chronic Conditions"
            value={member.conditions}
          />
          <InfoCard
            icon={Stethoscope}
            label="Primary Doctors"
            value={member.doctors}
          />
        </div>

        {/* School & Activities (for kids) */}
        {(member.school || member.teachers || member.activities) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <InfoCard
              icon={GraduationCap}
              label="School / Grade"
              value={member.school}
            />
            <InfoCard
              icon={Users}
              label="Teachers"
              value={member.teachers}
            />
            <InfoCard
              icon={Sparkles}
              label="Activities & Interests"
              value={member.activities}
              className="sm:col-span-2"
            />
          </div>
        )}

        {/* Patient Portal Link */}
        {member.patientPortal && (
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
