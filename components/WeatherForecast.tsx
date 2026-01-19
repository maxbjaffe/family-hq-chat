'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

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

export function WeatherForecast() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const response = await fetch('/api/weather');
        if (response.ok) {
          const data = await response.json();
          setWeather(data);
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center min-h-[150px]">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-slate-500 text-center">Weather unavailable</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Current weather - prominent */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-5xl">{weather.icon}</div>
        <div>
          <div className="text-3xl font-bold text-slate-900">
            {weather.temperature}°F
          </div>
          <div className="text-sm text-slate-600">{weather.description}</div>
        </div>
        <div className="ml-auto text-sm text-slate-500">
          H: {weather.high}° L: {weather.low}°
        </div>
      </div>

      {/* 3-day forecast */}
      {weather.forecast && weather.forecast.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-blue-100">
          {weather.forecast.map((day) => (
            <div key={day.day} className="text-center">
              <div className="text-xs font-medium text-slate-500">{day.day}</div>
              <div className="text-2xl my-1">{day.icon}</div>
              <div className="text-xs text-slate-600">
                <span className="font-medium">{day.high}°</span>
                <span className="text-slate-400 mx-1">/</span>
                <span>{day.low}°</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
