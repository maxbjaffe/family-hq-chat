'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

// Member type for the avatar component
interface AvatarMember {
  name: string;
  role: string;
  avatar_url?: string | null;
}

// Size variants
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
  member: AvatarMember;
  size?: AvatarSize;
  className?: string;
}

// Role-based gradient colors
const ROLE_COLORS: Record<string, string> = {
  admin: 'from-blue-500 to-indigo-600',
  adult: 'from-pink-500 to-rose-600',
  kid: 'from-purple-500 to-violet-600',
  pet: 'from-amber-500 to-orange-600',
  default: 'from-slate-500 to-slate-600',
};

// Role-based emojis
const ROLE_EMOJIS: Record<string, string> = {
  admin: '\u{1F468}',
  adult: '\u{1F469}',
  kid: '\u{1F467}',
  pet: '\u{1F415}',
  default: '\u{1F464}',
};

// Size classes for container and text
const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'w-8 h-8 text-sm',
  sm: 'w-12 h-12 text-lg',
  md: 'w-16 h-16 text-2xl',
  lg: 'w-24 h-24 text-4xl',
  xl: 'w-32 h-32 text-5xl',
  '2xl': 'w-44 h-44 text-6xl',
};

export function Avatar({ member, size = 'md', className }: AvatarProps) {
  const roleKey = member.role?.toLowerCase() || 'default';
  const gradient = ROLE_COLORS[roleKey] || ROLE_COLORS.default;
  const emoji = ROLE_EMOJIS[roleKey] || ROLE_EMOJIS.default;
  const sizeClasses = SIZE_CLASSES[size];

  // If avatar_url exists, render image
  if (member.avatar_url) {
    return (
      <div
        className={cn(
          'relative rounded-full overflow-hidden flex-shrink-0',
          sizeClasses,
          className
        )}
      >
        <Image
          src={member.avatar_url}
          alt={member.name}
          fill
          className="object-cover"
          sizes={size === '2xl' ? '176px' : size === 'xl' ? '128px' : size === 'lg' ? '96px' : size === 'md' ? '64px' : size === 'sm' ? '48px' : '32px'}
        />
      </div>
    );
  }

  // Fallback: gradient background with role-based emoji
  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0',
        gradient,
        sizeClasses,
        className
      )}
    >
      {emoji}
    </div>
  );
}

// Export types for consumers
export type { AvatarMember, AvatarSize, AvatarProps };
