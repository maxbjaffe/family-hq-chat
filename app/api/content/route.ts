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
  { setup: "What do you call a bear with no teeth?", punchline: "A gummy bear!" },
  { setup: "Why can't your nose be 12 inches long?", punchline: "Because then it would be a foot!" },
  { setup: "What do you call a dinosaur that crashes their car?", punchline: "Tyrannosaurus Wrecks!" },
  { setup: "Why did the scarecrow win an award?", punchline: "He was outstanding in his field!" },
  { setup: "What do you call a sleeping dinosaur?", punchline: "A dino-snore!" },
  { setup: "Why don't eggs tell jokes?", punchline: "They'd crack each other up!" },
  { setup: "What did the ocean say to the beach?", punchline: "Nothing, it just waved!" },
  { setup: "Why did the golfer bring two pairs of pants?", punchline: "In case he got a hole in one!" },
  { setup: "What do you call a fake noodle?", punchline: "An impasta!" },
  { setup: "Why did the bicycle fall over?", punchline: "Because it was two-tired!" },
  { setup: "What do you call a boomerang that doesn't come back?", punchline: "A stick!" },
  { setup: "Why did the cookie go to the doctor?", punchline: "Because it felt crummy!" },
  { setup: "What do you call a pig that does karate?", punchline: "A pork chop!" },
  { setup: "Why can't you give Elsa a balloon?", punchline: "Because she will let it go!" },
  { setup: "What do you call a cow with no legs?", punchline: "Ground beef!" },
  { setup: "Why did the banana go to the doctor?", punchline: "Because it wasn't peeling well!" },
  { setup: "What do you call a dog that does magic?", punchline: "A Labracadabrador!" },
  { setup: "Why did the teddy bear say no to dessert?", punchline: "She was already stuffed!" },
  { setup: "What do you call a snowman with a six-pack?", punchline: "An abdominal snowman!" },
  { setup: "Why did the student eat his homework?", punchline: "Because the teacher told him it was a piece of cake!" },
  { setup: "What do you call a train carrying bubblegum?", punchline: "A chew-chew train!" },
  { setup: "Why are ghosts bad at lying?", punchline: "Because you can see right through them!" },
];

const FALLBACK_FACTS = [
  { fact: "Did you know honey never spoils? Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still perfectly good to eat!", topic: "science" },
  { fact: "Did you know octopuses have three hearts? Two pump blood to the gills, and one pumps it to the rest of the body.", topic: "animals" },
  { fact: "Did you know the shortest war in history lasted only 38 minutes? It was between Britain and Zanzibar in 1896.", topic: "history" },
  { fact: "Did you know a group of flamingos is called a 'flamboyance'? They also eat with their heads upside down!", topic: "animals" },
  { fact: "Did you know that bananas are berries, but strawberries aren't? In botany, berries must have seeds inside!", topic: "science" },
  { fact: "Did you know the Eiffel Tower can grow by 6 inches in summer? The iron expands when heated by the sun!", topic: "science" },
  { fact: "Did you know dolphins sleep with one eye open? Half their brain stays awake to watch for danger!", topic: "animals" },
  { fact: "Did you know there are more stars in the universe than grains of sand on Earth? Scientists estimate about 70 sextillion stars!", topic: "space" },
  { fact: "Did you know a day on Venus is longer than its year? It takes 243 Earth days to rotate but only 225 to orbit the sun!", topic: "space" },
  { fact: "Did you know butterflies taste with their feet? They have sensors that help them find the best plants!", topic: "animals" },
  { fact: "Did you know lightning strikes Earth about 8 million times per day? That's about 100 times per second!", topic: "weather" },
  { fact: "Did you know the Great Wall of China is not visible from space with the naked eye? It's a common myth!", topic: "history" },
  { fact: "Did you know a cloud can weigh over a million pounds? They float because the water droplets are spread out!", topic: "weather" },
  { fact: "Did you know koalas sleep up to 22 hours a day? Digesting eucalyptus leaves takes a lot of energy!", topic: "animals" },
  { fact: "Did you know the ocean produces over 50% of the world's oxygen? Tiny plants called phytoplankton are the heroes!", topic: "ocean" },
  { fact: "Did you know T-Rex lived closer in time to us than to Stegosaurus? About 80 million years separated them!", topic: "dinosaurs" },
  { fact: "Did you know a jiffy is an actual unit of time? It's 1/100th of a second in computing!", topic: "science" },
  { fact: "Did you know the moon has moonquakes? They can last for hours because there's no water to dampen vibrations!", topic: "space" },
  { fact: "Did you know sea otters hold hands while sleeping? They do it so they don't drift apart!", topic: "animals" },
  { fact: "Did you know rainbows are actually full circles? We only see half because the ground gets in the way!", topic: "weather" },
  { fact: "Did you know elephants are the only animals that can't jump? Their legs are designed for strength, not bouncing!", topic: "animals" },
  { fact: "Did you know the inventor of the Pringles can is buried in one? His ashes were placed in a Pringles can!", topic: "history" },
  { fact: "Did you know a sneeze travels about 100 miles per hour? That's faster than most cars on the highway!", topic: "science" },
  { fact: "Did you know sharks have been around longer than trees? Sharks are about 400 million years old!", topic: "animals" },
  { fact: "Did you know the hottest planet isn't the closest to the sun? Venus is hotter than Mercury because of its thick atmosphere!", topic: "space" },
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
  } catch (e) {
    console.warn('Joke generation failed, using fallback:', e);
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
  } catch (e) {
    console.warn('Fun fact generation failed, using fallback:', e);
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
