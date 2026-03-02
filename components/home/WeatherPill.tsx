'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ForecastDay {
  day: string;
  high: number;
  low: number;
  icon: string;
  description: string;
}

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  high: number;
  low: number;
  forecast?: ForecastDay[];
}

export function WeatherPill() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch('/api/weather');
        if (!res.ok) throw new Error('Weather fetch failed');
        const data: WeatherData = await res.json();
        setWeather(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    }
    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopover]);

  if (error) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="relative">
      <button
        ref={pillRef}
        onClick={() => setShowPopover(!showPopover)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white/90 transition-colors cursor-pointer"
      >
        <span className="text-sm">{weather.icon}</span>
        <span className="text-sm font-medium text-slate-700">
          {Math.round(weather.temperature)}&deg;F
        </span>
      </button>

      {showPopover && (
        <Card className="absolute right-0 top-full mt-2 z-50 w-56 p-3 shadow-lg bg-white/95 backdrop-blur-sm">
          {/* Current conditions */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {Math.round(weather.temperature)}&deg;F
              </p>
              <p className="text-xs text-slate-500 capitalize">{weather.description}</p>
            </div>
            <span className="text-2xl">{weather.icon}</span>
          </div>

          {/* Hi / Lo */}
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
            <span>
              H: <span className="font-medium text-slate-700">{Math.round(weather.high)}&deg;</span>
            </span>
            <span>
              L: <span className="font-medium text-slate-700">{Math.round(weather.low)}&deg;</span>
            </span>
          </div>

          {/* 3-day forecast */}
          {weather.forecast && weather.forecast.length > 0 && (
            <>
              <div className="border-t border-slate-100 pt-2">
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wide mb-1.5">
                  Forecast
                </p>
                <div className="space-y-1.5">
                  {weather.forecast.slice(0, 3).map((day) => (
                    <div key={day.day} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium w-12">{day.day}</span>
                      <span className="text-sm">{day.icon}</span>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="font-medium text-slate-700">{Math.round(day.high)}&deg;</span>
                        <span>{Math.round(day.low)}&deg;</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
