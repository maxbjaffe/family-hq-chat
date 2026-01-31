"use client";

import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";

interface QuoteData {
  quote: string;
  author: string;
  generatedAt: string;
}

interface MotivationalQuoteProps {
  quote: QuoteData | null;
  nextRefresh?: string;
}

function getTimeUntilRefresh(isoString: string): string {
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff <= 0) return "Refreshing...";
  const minutes = Math.ceil(diff / 60000);
  return `New in ${minutes} min`;
}

export function MotivationalQuote({ quote, nextRefresh }: MotivationalQuoteProps) {
  return (
    <Card className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 h-full">
      <div className="flex items-center gap-2 mb-3">
        <Quote className="h-6 w-6 text-purple-500" />
        <h3 className="font-bold text-slate-800">Inspiration</h3>
      </div>

      {quote ? (
        <div className="space-y-2">
          <blockquote className="text-sm text-slate-700 leading-relaxed italic line-clamp-3">
            &ldquo;{quote.quote}&rdquo;
          </blockquote>

          <p className="text-xs text-purple-600 font-medium text-right">
            — {quote.author}
          </p>
        </div>
      ) : (
        <div className="text-slate-500 text-sm">Loading...</div>
      )}
    </Card>
  );
}
