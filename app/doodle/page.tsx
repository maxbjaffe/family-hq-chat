"use client";

import { DoodleBoard } from "@/components/DoodleBoard";
import { DoodleGallery } from "@/components/DoodleGallery";
import { Paintbrush } from "lucide-react";

export default function DoodlePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
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
