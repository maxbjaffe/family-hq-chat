"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Smile, Upload } from "lucide-react";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  customIcons?: { url: string; name: string }[];
  onClose?: () => void;
}

// Fun emoji categories for kid checklists
const EMOJI_CATEGORIES = [
  {
    name: "Morning Routine",
    emojis: ["🌅", "☀️", "🌞", "⏰", "🛏️", "🪥", "🧼", "🚿", "👕", "👖", "👗", "🧦", "👟", "🎒"],
  },
  {
    name: "Food & Drinks",
    emojis: ["🍎", "🍌", "🥪", "🥗", "🍕", "🌮", "🥣", "🥛", "💧", "🧃", "🍪", "🧁", "🍓", "🥕"],
  },
  {
    name: "School & Learning",
    emojis: ["📚", "📖", "✏️", "📝", "🎨", "🖍️", "📐", "🔬", "🌍", "💻", "🎵", "🎭", "🧮", "📓"],
  },
  {
    name: "Activities & Sports",
    emojis: ["⚽", "🏀", "🎾", "🏃", "🚴", "🏊", "⛷️", "🎯", "🎮", "🧩", "🎲", "🛹", "🎪", "🎠"],
  },
  {
    name: "Chores & Tasks",
    emojis: ["🧹", "🧺", "🗑️", "📬", "🐕", "🐈", "🌱", "✅", "📋", "🔑", "🚗", "🏠", "🧽", "🧴"],
  },
  {
    name: "Fun & Celebration",
    emojis: ["🎉", "🎈", "🎁", "⭐", "🌈", "🦄", "🎪", "🎢", "🎡", "🎯", "🏆", "🥇", "💪", "🙌"],
  },
  {
    name: "Nature & Animals",
    emojis: ["🌸", "🌻", "🌳", "🦋", "🐝", "🐰", "🐶", "🐱", "🐼", "🦁", "🐢", "🐬", "🦜", "🌙"],
  },
  {
    name: "Weather & Time",
    emojis: ["🌤️", "🌧️", "❄️", "🌈", "🌙", "⭐", "🌊", "🍂", "🌺", "🌴", "🏔️", "🗓️", "⏳", "🔔"],
  },
];

export function IconPicker({ value, onChange, customIcons = [], onClose }: IconPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [showCustom, setShowCustom] = useState(false);

  return (
    <Card className="absolute z-50 top-full left-0 mt-2 w-80 max-h-96 overflow-hidden shadow-xl border-2">
      <div className="p-2 border-b bg-slate-50 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">Pick an Icon</span>
        {onClose && (
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Tabs: Emoji vs Custom */}
      <div className="flex border-b">
        <button
          onClick={() => setShowCustom(false)}
          className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 ${
            !showCustom ? "bg-purple-100 text-purple-700 border-b-2 border-purple-500" : "text-slate-500"
          }`}
        >
          <Smile className="h-4 w-4" />
          Emoji
        </button>
        <button
          onClick={() => setShowCustom(true)}
          className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1 ${
            showCustom ? "bg-purple-100 text-purple-700 border-b-2 border-purple-500" : "text-slate-500"
          }`}
        >
          <Upload className="h-4 w-4" />
          Custom
        </button>
      </div>

      {!showCustom ? (
        <>
          {/* Category tabs */}
          <div className="flex overflow-x-auto gap-1 p-2 border-b bg-slate-50 scrollbar-hide">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(i)}
                className={`px-2 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === i
                    ? "bg-purple-500 text-white"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="p-3 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-7 gap-1">
              {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onChange(emoji);
                    onClose?.();
                  }}
                  className={`text-2xl p-2 rounded-lg hover:bg-purple-100 transition-colors ${
                    value === emoji ? "bg-purple-200 ring-2 ring-purple-500" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="p-3 max-h-60 overflow-y-auto">
          {customIcons.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Upload className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No custom icons uploaded</p>
              <p className="text-xs text-slate-400">Go to Media Library → Icons to add some</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {customIcons.map((icon) => (
                <button
                  key={icon.url}
                  onClick={() => {
                    onChange(icon.url);
                    onClose?.();
                  }}
                  className={`aspect-square rounded-lg overflow-hidden border-2 hover:border-purple-500 transition-colors ${
                    value === icon.url ? "border-purple-500 ring-2 ring-purple-300" : "border-slate-200"
                  }`}
                >
                  <img src={icon.url} alt={icon.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
