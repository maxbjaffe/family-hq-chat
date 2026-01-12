import { NextResponse } from "next/server";

// Bronxville, NY coordinates
const DEFAULT_LAT = 40.9385;
const DEFAULT_LON = -73.8326;

interface WeatherData {
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  high: number;
  low: number;
}

// Simple in-memory cache
let weatherCache: { data: WeatherData; timestamp: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function GET() {
  try {
    // Check cache
    if (weatherCache && Date.now() - weatherCache.timestamp < CACHE_TTL) {
      return NextResponse.json(weatherCache.data);
    }

    // Use Open-Meteo (free, no API key needed)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${DEFAULT_LAT}&longitude=${DEFAULT_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York`
    );

    if (!response.ok) {
      throw new Error("Weather API error");
    }

    const data = await response.json();

    // Map weather codes to descriptions and icons
    const weatherDescriptions: Record<number, { description: string; icon: string }> = {
      0: { description: "Clear sky", icon: "☀️" },
      1: { description: "Mainly clear", icon: "🌤️" },
      2: { description: "Partly cloudy", icon: "⛅" },
      3: { description: "Overcast", icon: "☁️" },
      45: { description: "Foggy", icon: "🌫️" },
      48: { description: "Depositing rime fog", icon: "🌫️" },
      51: { description: "Light drizzle", icon: "🌧️" },
      53: { description: "Moderate drizzle", icon: "🌧️" },
      55: { description: "Dense drizzle", icon: "🌧️" },
      61: { description: "Slight rain", icon: "🌧️" },
      63: { description: "Moderate rain", icon: "🌧️" },
      65: { description: "Heavy rain", icon: "🌧️" },
      66: { description: "Light freezing rain", icon: "🌨️" },
      67: { description: "Heavy freezing rain", icon: "🌨️" },
      71: { description: "Slight snow", icon: "🌨️" },
      73: { description: "Moderate snow", icon: "❄️" },
      75: { description: "Heavy snow", icon: "❄️" },
      77: { description: "Snow grains", icon: "❄️" },
      80: { description: "Slight rain showers", icon: "🌦️" },
      81: { description: "Moderate rain showers", icon: "🌦️" },
      82: { description: "Violent rain showers", icon: "⛈️" },
      85: { description: "Slight snow showers", icon: "🌨️" },
      86: { description: "Heavy snow showers", icon: "🌨️" },
      95: { description: "Thunderstorm", icon: "⛈️" },
      96: { description: "Thunderstorm with hail", icon: "⛈️" },
      99: { description: "Thunderstorm with heavy hail", icon: "⛈️" },
    };

    const weatherCode = data.current.weather_code;
    const weatherInfo = weatherDescriptions[weatherCode] || {
      description: "Unknown",
      icon: "🌡️",
    };

    const weatherData: WeatherData = {
      temperature: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      description: weatherInfo.description,
      icon: weatherInfo.icon,
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
    };

    // Update cache
    weatherCache = { data: weatherData, timestamp: Date.now() };

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error("Weather API error:", error);

    // Return cached data if available, even if stale
    if (weatherCache) {
      return NextResponse.json(weatherCache.data);
    }

    return NextResponse.json(
      { error: "Failed to fetch weather" },
      { status: 500 }
    );
  }
}
