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
    <Card className="p-6 bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="flex items-center gap-2 mb-4">
        <Quote className="h-7 w-7 text-purple-500" />
        <h3 className="text-lg font-bold text-slate-800">Daily Inspiration</h3>
      </div>

      {quote ? (
        <div className="space-y-4">
          <blockquote className="text-lg text-slate-700 leading-relaxed italic">
            "{quote.quote}"
          </blockquote>

          <p className="text-sm text-purple-600 font-medium text-right">
            — {quote.author}
          </p>

          {nextRefresh && (
            <p className="text-xs text-slate-400">
              {getTimeUntilRefresh(nextRefresh)}
            </p>
          )}
        </div>
      ) : (
        <div className="text-slate-500">Loading inspiration...</div>
      )}
    </Card>
  );
}
