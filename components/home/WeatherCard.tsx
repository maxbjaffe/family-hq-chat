'use client';

import { useState, useEffect } from 'react';
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

export function WeatherCard({ className }: { className?: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch('/api/weather');
        if (res.ok) setWeather(await res.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, []);

  return (
    <Card className={`bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 p-5 flex flex-col ${className ?? ''}`}>
      <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
        <span>🌤</span> Weather
      </h3>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
        </div>
      ) : weather ? (
        <div className="flex flex-col flex-1">
          {/* Current conditions */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{weather.icon}</span>
            <div>
              <div className="text-3xl font-bold text-slate-900">
                {weather.temperature}°F
              </div>
              <div className="text-xs text-slate-500">
                H: {weather.high}° L: {weather.low}°
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-600 mb-3">{weather.description}</div>

          {/* Multi-day forecast */}
          {weather.forecast && weather.forecast.length > 0 && (
            <div className="flex gap-3 mt-auto pt-3 border-t border-blue-100">
              {weather.forecast
                .filter((d) => d.day !== 'Today')
                .slice(0, 5)
                .map((day) => (
                  <div key={day.day} className="text-center flex-1">
                    <div className="text-[10px] font-medium text-slate-500">{day.day}</div>
                    <div className="text-lg my-0.5">{day.icon}</div>
                    <div className="text-[10px] text-slate-600">
                      {day.high}°/{day.low}°
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
          Weather unavailable
        </div>
      )}
    </Card>
  );
}
