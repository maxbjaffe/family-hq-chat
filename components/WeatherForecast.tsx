'use client';

import { Card } from '@/components/ui/card';

interface ForecastDay {
  day: string;
  high: number;
  low: number;
  icon: string;
  description: string;
}

interface WeatherForecastProps {
  current: {
    temperature: number;
    description: string;
    icon: string;
  };
  forecast: ForecastDay[];
}

export function WeatherForecast({ current, forecast }: WeatherForecastProps) {
  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Current weather - prominent */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-5xl">{current.icon}</div>
        <div>
          <div className="text-3xl font-bold text-slate-900">
            {current.temperature}°F
          </div>
          <div className="text-sm text-slate-600">{current.description}</div>
        </div>
      </div>

      {/* 3-day forecast */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-blue-100">
        {forecast.map((day) => (
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
    </Card>
  );
}
