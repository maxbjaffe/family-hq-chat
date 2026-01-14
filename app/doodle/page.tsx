"use client";

import Link from "next/link";
import { DoodleBoard } from "@/components/DoodleBoard";
import { DoodleGallery } from "@/components/DoodleGallery";
import { Paintbrush, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DoodlePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Back to Games */}
        <Button variant="ghost" asChild className="mb-4 min-h-[48px]">
          <Link href="/games">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Games
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Paintbrush className="h-8 w-8 text-purple-600" />
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Doodle Board
            </span>
          </h1>
          <p className="text-slate-600 mt-1">
            Create your masterpiece! Draw, add stickers, and save your artwork.
          </p>
        </div>

        {/* Doodle Board */}
        <div className="mb-8">
          <DoodleBoard />
        </div>

        {/* Gallery */}
        <DoodleGallery />
      </div>
    </div>
  );
}
