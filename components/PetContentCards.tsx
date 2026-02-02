'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Lightbulb, Smile, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface PetContent {
  fact: string | null;
  joke: string | null;
}

const JAFFE_MEDIA = [
  { type: 'image', src: '/jaffe/jaffe-1.webp' },
  { type: 'image', src: '/jaffe/jaffe-2.webp' },
  { type: 'image', src: '/jaffe/jaffe-3.webp' },
  { type: 'image', src: '/jaffe/jaffe-4.webp' },
  { type: 'video', src: '/jaffe/dressed-for-school.mp4' },
  { type: 'video', src: '/jaffe/tricks-dance.mp4' },
] as const;

function SkeletonCard({ icon: Icon, label, bgColor }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  bgColor: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className="h-5 w-5 text-slate-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded animate-pulse w-full" />
            <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function MediaSkeleton() {
  return (
    <Card className="p-4">
      <div className="relative w-full aspect-video bg-slate-200 rounded-lg animate-pulse flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    </Card>
  );
}

export function PetContentCards() {
  const [content, setContent] = useState<PetContent | null>(null);
  const [loading, setLoading] = useState(true);

  // Select random media on mount (stable across re-renders)
  const selectedMedia = useMemo(() => {
    const index = Math.floor(Math.random() * JAFFE_MEDIA.length);
    return JAFFE_MEDIA[index];
  }, []);

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch('/api/pet-content');
        if (response.ok) {
          const data = await response.json();
          setContent(data);
        }
      } catch (error) {
        console.error('Failed to fetch pet content:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard icon={Lightbulb} label="Fun Fact" bgColor="bg-amber-100" />
          <SkeletonCard icon={Smile} label="Joke" bgColor="bg-purple-100" />
        </div>
        <MediaSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fun Fact Card */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Lightbulb className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-1">Fun Fact</p>
              <p className="font-medium text-slate-800">
                {content?.fact || 'No fact available right now.'}
              </p>
            </div>
          </div>
        </Card>

        {/* Joke Card */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Smile className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-1">Joke</p>
              <p className="font-medium text-slate-800">
                {content?.joke || 'No joke available right now.'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Media Card */}
      <Card className="p-4">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-100">
          {selectedMedia.type === 'video' ? (
            <video
              src={selectedMedia.src}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={selectedMedia.src}
              alt="Jaffe the dog"
              fill
              className="object-cover"
              priority
            />
          )}
        </div>
      </Card>
    </div>
  );
}
