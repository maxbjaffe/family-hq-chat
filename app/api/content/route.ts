import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// In-memory cache for jokes and fun facts
interface CachedContent {
  joke: {
    setup: string;
    punchline: string;
    generatedAt: string;
  };
  funFact: {
    fact: string;
    topic: string;
    generatedAt: string;
  };
  jokeExpiresAt: number;
  factExpiresAt: number;
}

let cache: CachedContent | null = null;

const HOUR_MS = 60 * 60 * 1000;

// Fallback content if API fails
const FALLBACK_JOKES = [
  { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything!" },
  { setup: "What do you call a fish without eyes?", punchline: "A fsh!" },
  { setup: "Why did the math book look so sad?", punchline: "Because it had too many problems." },
];

const FALLBACK_FACTS = [
  { fact: "Did you know honey never spoils? Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still perfectly good to eat!", topic: "science" },
  { fact: "Did you know octopuses have three hearts? Two pump blood to the gills, and one pumps it to the rest of the body.", topic: "animals" },
  { fact: "Did you know the shortest war in history lasted only 38 minutes? It was between Britain and Zanzibar in 1896.", topic: "history" },
];

async function generateJoke(client: Anthropic): Promise<{ setup: string; punchline: string }> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Generate a single family-friendly joke for kids. Vary between silly jokes for younger kids and slightly cleverer wordplay for older kids.

Return ONLY valid JSON in this exact format, no other text:
{"setup": "the setup", "punchline": "the punchline"}`
      }
    ]
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    return JSON.parse(text.trim());
  } catch {
    return FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
  }
}

async function generateFunFact(client: Anthropic): Promise<{ fact: string; topic: string }> {
  const topics = ["science", "animals", "nature", "space", "history", "ocean", "dinosaurs", "weather"];
  const topic = topics[Math.floor(Math.random() * topics.length)];

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Generate one fascinating fun fact about ${topic} for kids. Start with "Did you know" and make it engaging and educational. Keep it under 50 words.

Return ONLY valid JSON in this exact format, no other text:
{"fact": "Did you know...", "topic": "${topic}"}`
      }
    ]
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    return JSON.parse(text.trim());
  } catch {
    return FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)];
  }
}

export async function GET() {
  const now = Date.now();

  // Check if we need to refresh joke
  const needNewJoke = !cache || now >= cache.jokeExpiresAt;
  // Check if we need to refresh fact
  const needNewFact = !cache || now >= cache.factExpiresAt;

  if (!needNewJoke && !needNewFact && cache) {
    return NextResponse.json({
      joke: cache.joke,
      funFact: cache.funFact,
      jokeNextRefresh: new Date(cache.jokeExpiresAt).toISOString(),
      factNextRefresh: new Date(cache.factExpiresAt).toISOString(),
    });
  }

  // Initialize client
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Return fallback if no API key
    const fallbackJoke = FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
    const fallbackFact = FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)];
    return NextResponse.json({
      joke: { ...fallbackJoke, generatedAt: new Date().toISOString() },
      funFact: { ...fallbackFact, generatedAt: new Date().toISOString() },
      jokeNextRefresh: new Date(now + HOUR_MS).toISOString(),
      factNextRefresh: new Date(now + HOUR_MS).toISOString(),
    });
  }

  const client = new Anthropic({ apiKey });

  try {
    // Generate new content as needed
    let joke = cache?.joke;
    let jokeExpiresAt = cache?.jokeExpiresAt || 0;

    if (needNewJoke) {
      const newJoke = await generateJoke(client);
      joke = { ...newJoke, generatedAt: new Date().toISOString() };
      jokeExpiresAt = now + HOUR_MS;
    }

    let funFact = cache?.funFact;
    let factExpiresAt = cache?.factExpiresAt || 0;

    if (needNewFact) {
      const newFact = await generateFunFact(client);
      funFact = { ...newFact, generatedAt: new Date().toISOString() };
      factExpiresAt = now + HOUR_MS;
    }

    // Update cache
    cache = {
      joke: joke!,
      funFact: funFact!,
      jokeExpiresAt,
      factExpiresAt,
    };

    return NextResponse.json({
      joke: cache.joke,
      funFact: cache.funFact,
      jokeNextRefresh: new Date(cache.jokeExpiresAt).toISOString(),
      factNextRefresh: new Date(cache.factExpiresAt).toISOString(),
    });
  } catch (error) {
    console.error("Error generating content:", error);

    // Return fallback on error
    const fallbackJoke = FALLBACK_JOKES[Math.floor(Math.random() * FALLBACK_JOKES.length)];
    const fallbackFact = FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)];

    return NextResponse.json({
      joke: { ...fallbackJoke, generatedAt: new Date().toISOString() },
      funFact: { ...fallbackFact, generatedAt: new Date().toISOString() },
      jokeNextRefresh: new Date(now + HOUR_MS).toISOString(),
      factNextRefresh: new Date(now + HOUR_MS).toISOString(),
    });
  }
}
