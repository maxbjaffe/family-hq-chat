import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  EducationRequest,
  EducationQuestion,
  EducationDifficulty,
} from "@/lib/nutrition/education-types";

// ---------------------------------------------------------------------------
// Singleton Anthropic client
// ---------------------------------------------------------------------------

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) throw new Error("CLAUDE_API_KEY not configured");
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// ---------------------------------------------------------------------------
// Quiz generation
// ---------------------------------------------------------------------------

const DIFFICULTY_PROMPT: Record<EducationDifficulty, string> = {
  easy: `Target age 5-7. Use simple cause-and-effect language. Each question has exactly 2 answer choices. Use only question categories: how_you_feel, best_pick, body_science. Keep explanations short (1-2 sentences) and use simple words.`,
  medium: `Target age 7-9. Use comparisons and real-life scenarios. Each question has exactly 3 answer choices. Use all 6 question categories. Explanations can be 2-3 sentences.`,
  hard: `Target age 9-12. Use real science terms (nutrients, vitamins, minerals, carbohydrates). Each question has exactly 4 answer choices. Use all 6 question categories. Explanations should teach real nutrition science in 2-3 sentences.`,
};

async function generateQuiz(
  difficulty: EducationDifficulty,
  count: number
): Promise<EducationQuestion[]> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    temperature: 0.8,
    system: `You are a fun nutrition educator for kids. Generate quiz questions that teach how food affects your body, energy, mood, and health.

Question categories:
- "how_you_feel": A food → how you'd feel after eating it (energy, focus, mood)
- "best_pick": A real-life scenario → best food choice
- "food_combo": Why food combinations work (or don't)
- "body_science": How your body uses nutrients
- "true_false_plus": A nutrition claim with a nuanced answer
- "sugar_detective": Identify hidden sugars in "healthy" foods

${DIFFICULTY_PROMPT[difficulty]}

Respond with ONLY valid JSON, no markdown fences. Format:
{
  "questions": [
    {
      "category": "how_you_feel",
      "prompt": "question text",
      "emoji": "single relevant emoji",
      "options": ["option1", "option2"],
      "correctIndex": 0,
      "explanation": "educational explanation"
    }
  ]
}

IMPORTANT:
- correctIndex must be a valid index into the options array
- Every question MUST have an explanation — the explanation IS the education
- Use foods kids actually know and eat
- Make wrong answers plausible but clearly wrong when explained
- Vary the correct answer position — don't always make it the first option`,
    messages: [
      {
        role: "user",
        content: `Generate ${count} nutrition quiz questions at ${difficulty} difficulty. Mix up the question categories for variety.`,
      },
    ],
  });

  const responseText =
    response.content[0].type === "text" ? response.content[0].text : "";

  const parsed = JSON.parse(responseText);
  return parsed.questions as EducationQuestion[];
}

// ---------------------------------------------------------------------------
// Food analysis (Fuel Up win/loss)
// ---------------------------------------------------------------------------

async function analyzeFoods(
  foods: string[],
  won: boolean,
  difficulty: string
): Promise<string> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    temperature: 0.7,
    system: `You are a fun, encouraging nutrition coach for kids ages 5-12. Keep responses to 2-3 short sentences. Use simple language. Reference specific foods the kid picked and explain HOW they help (or don't help) the body.`,
    messages: [
      {
        role: "user",
        content: won
          ? `The kid won the Fuel Up game on ${difficulty} difficulty by picking these foods: ${foods.join(", ")}. Explain why these were great picks and how they power up the body. Be enthusiastic!`
          : `The kid lost the Fuel Up game on ${difficulty} difficulty. They picked: ${foods.join(", ")}. Give encouraging coaching about what they could improve — mention specific nutrients they were missing (protein, veggies, water, or vitamins) and suggest better picks. Stay positive!`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

// ---------------------------------------------------------------------------
// Meal analysis (Meal Builder report card)
// ---------------------------------------------------------------------------

async function analyzeMeal(
  mealType: string,
  foods: string[],
  avatarState: string,
  won: boolean
): Promise<string> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    temperature: 0.7,
    system: `You are a fun, encouraging nutrition coach for kids ages 5-12. Keep responses to 2-3 short sentences. Use simple language. Explain how specific foods in the meal work together (or don't) to fuel the body.`,
    messages: [
      {
        role: "user",
        content: won
          ? `The kid built a great ${mealType}! They chose: ${foods.join(", ")}. Their avatar reached "${avatarState}" state. Explain why this meal is balanced and how it would make them feel. Be enthusiastic!`
          : `The kid's ${mealType} wasn't quite balanced. They chose: ${foods.join(", ")}. Their avatar is at "${avatarState}" state but needs better. Give encouraging coaching — explain what's missing and suggest a specific swap to improve the meal. Stay positive!`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

// ---------------------------------------------------------------------------
// Fallback static questions
// ---------------------------------------------------------------------------

const FALLBACK_QUESTIONS: Record<EducationDifficulty, EducationQuestion[]> = {
  easy: [
    { category: "how_you_feel", prompt: "You eat Sugary Cereal for breakfast. By 10am, how do you probably feel?", emoji: "\u{1F963}", options: ["Tired and hungry", "Energized and focused"], correctIndex: 0, explanation: "Sugary cereal gives you a quick energy spike, but then your blood sugar drops and you crash! That's why you feel tired by recess." },
    { category: "best_pick", prompt: "You have a soccer game in 1 hour. What should you eat?", emoji: "\u26BD", options: ["Banana and Water", "Ice Cream"], correctIndex: 0, explanation: "Bananas give you quick natural energy from potassium and carbs, and water keeps your muscles working!" },
    { category: "body_science", prompt: "Why does your body need water even when you're not thirsty?", emoji: "\u{1F4A7}", options: ["Your brain needs it to think", "All parts of your body need it"], correctIndex: 1, explanation: "Water helps your brain think, carries nutrients in your blood, and keeps your joints working. Your body is about 60% water!" },
    { category: "how_you_feel", prompt: "You eat Scrambled Eggs and Toast for breakfast. How do you feel at school?", emoji: "\u{1F373}", options: ["Focused and full of energy", "Sleepy and slow"], correctIndex: 0, explanation: "Eggs have protein that gives you steady energy, and toast gives you carbs for fuel. Together they keep you going all morning!" },
    { category: "best_pick", prompt: "It's a hot day and you're really thirsty. What's the best drink?", emoji: "\u2600\uFE0F", options: ["Soda", "Water"], correctIndex: 1, explanation: "Water hydrates you the best! Soda has lots of sugar that can actually make you MORE thirsty." },
    { category: "body_science", prompt: "What does protein do for your body?", emoji: "\u{1F4AA}", options: ["Helps build strong muscles", "Makes your teeth white"], correctIndex: 0, explanation: "Protein is like building blocks for your muscles! Foods like chicken, eggs, and beans help your muscles grow stronger." },
    { category: "how_you_feel", prompt: "You eat a Candy Bar for a snack. What happens to your energy?", emoji: "\u{1F36B}", options: ["Energy goes up then crashes down", "Steady energy all afternoon"], correctIndex: 0, explanation: "Candy gives you a sugar rush that feels great for a few minutes, but then your energy crashes and you feel even more tired!" },
    { category: "best_pick", prompt: "You need a snack before homework. What helps you focus?", emoji: "\u{1F4DA}", options: ["Cookies", "Apple with Peanut Butter"], correctIndex: 1, explanation: "Apple gives you natural sugar for energy, and peanut butter has protein to keep you full and focused. Cookies would just give you a sugar crash!" },
    { category: "body_science", prompt: "Why are fruits and vegetables important?", emoji: "\u{1F34E}", options: ["They have vitamins that keep you healthy", "They taste better than candy"], correctIndex: 0, explanation: "Fruits and vegetables are packed with vitamins and minerals that help your body fight off sickness and grow strong!" },
    { category: "how_you_feel", prompt: "You drink a big glass of water in the morning. How does your brain feel?", emoji: "\u{1F9E0}", options: ["More awake and ready to think", "No difference at all"], correctIndex: 0, explanation: "Your brain is mostly water! When you drink water in the morning, it wakes up your brain and helps you think clearly." },
  ],
  medium: [
    { category: "how_you_feel", prompt: "You eat Oatmeal with Berries for breakfast instead of a Donut. How is your morning different?", emoji: "\u{1F35C}", options: ["Steady energy until lunch", "Same energy either way", "Less energy from oatmeal"], correctIndex: 0, explanation: "Oatmeal has complex carbs that release energy slowly, and berries add vitamins and antioxidants. A donut gives quick sugar energy that crashes fast!" },
    { category: "best_pick", prompt: "You're going on a long hike. What snack should you pack?", emoji: "\u{1F3D4}\uFE0F", options: ["Candy", "Trail Mix", "Chips"], correctIndex: 1, explanation: "Trail mix has nuts for protein (lasting energy), dried fruit for quick fuel, and healthy fats. It's the perfect adventure food!" },
    { category: "food_combo", prompt: "What makes PB&J with an Apple better than PB&J with Chips?", emoji: "\u{1F34E}", options: ["Apple adds vitamins and fiber", "They taste the same", "Chips have more energy"], correctIndex: 0, explanation: "An apple adds vitamins, fiber, and water to your meal. Chips just add salt and fat without much nutrition. The apple makes your lunch more balanced!" },
    { category: "body_science", prompt: "Your bones need a special mineral to stay strong. Which food has the most of it?", emoji: "\u{1F9B4}", options: ["Chips", "Milk", "Candy"], correctIndex: 1, explanation: "Milk is loaded with calcium, the mineral that builds strong bones! Your bones are growing fast right now, so calcium is super important." },
    { category: "true_false_plus", prompt: "Chocolate Milk is just as good as Water for hydration after sports.", emoji: "\u{1F95B}", options: ["True", "Partly True", "False"], correctIndex: 1, explanation: "Partly true! Chocolate milk hydrates you AND the protein helps muscles recover after exercise. But it has more sugar than water, so it's better as a recovery drink, not an everyday hydration choice." },
    { category: "sugar_detective", prompt: "Which 'healthy' food actually has a LOT of hidden sugar?", emoji: "\u{1F575}\uFE0F", options: ["Scrambled Eggs", "Yogurt Parfait", "Grilled Chicken"], correctIndex: 1, explanation: "Yogurt parfaits often have sweetened yogurt PLUS granola PLUS honey. All that added sugar can add up to as much as a candy bar! Look for plain yogurt instead." },
    { category: "how_you_feel", prompt: "You eat Salmon and Broccoli for dinner. How do you sleep?", emoji: "\u{1F41F}", options: ["Restless and hungry", "Comfortable and full", "Too full to sleep"], correctIndex: 1, explanation: "Salmon has omega-3 fats that help your brain relax, and the protein keeps you satisfied. Broccoli adds vitamins without sugar that would keep you wired!" },
    { category: "best_pick", prompt: "It's test day at school! What breakfast helps you think clearly?", emoji: "\u{1F4DD}", options: ["Pop-Tart", "Scrambled Eggs with Fruit", "Skipping breakfast"], correctIndex: 1, explanation: "Eggs give your brain protein and healthy fats for focus, and fruit provides natural energy. A Pop-Tart would give you a sugar crash right during the test!" },
    { category: "food_combo", prompt: "Why is Rice & Beans together better than either one alone?", emoji: "\u{1F35A}", options: ["They taste better", "Together they make a complete protein", "Rice cancels out beans"], correctIndex: 1, explanation: "Rice and beans each have different amino acids (protein building blocks). Together, they form a complete protein — as good as meat for building muscles!" },
    { category: "body_science", prompt: "What does fiber do in your body?", emoji: "\u{1F966}", options: ["Helps your heart beat faster", "Helps your digestive system work", "Makes your hair grow"], correctIndex: 1, explanation: "Fiber is like a broom for your digestive system! It helps food move through your body and keeps your stomach feeling good. Fruits, vegetables, and whole grains are great fiber sources." },
  ],
  hard: [
    { category: "how_you_feel", prompt: "You eat a meal high in refined carbohydrates with no protein. What happens to your blood sugar?", emoji: "\u{1F4C8}", options: ["Stays perfectly steady", "Rises slowly and stays up", "Spikes quickly then crashes", "Drops immediately"], correctIndex: 2, explanation: "Refined carbs (white bread, sugary foods) cause a rapid blood sugar spike because they digest quickly. Without protein or fiber to slow absorption, insulin rushes in and your blood sugar crashes — that's the 'sugar crash' feeling." },
    { category: "best_pick", prompt: "You're recovering from being sick. What meal helps your immune system most?", emoji: "\u{1F912}", options: ["Pizza", "Chicken Soup with Vegetables", "Pasta with Butter", "French Fries"], correctIndex: 1, explanation: "Chicken soup provides protein for cell repair, vegetables deliver vitamins C and A for immunity, and the warm broth keeps you hydrated. Scientists call it 'nature's medicine' because it actually has anti-inflammatory properties!" },
    { category: "food_combo", prompt: "Eating vitamin C-rich foods with iron-rich foods helps your body absorb more iron. Which combo does this?", emoji: "\u{1F9EA}", options: ["Cheese and Crackers", "Steak and Orange slices", "Bread and Butter", "Chips and Soda"], correctIndex: 1, explanation: "Vitamin C (from the orange) chemically transforms iron into a form your body absorbs more easily. This is why nutritionists recommend pairing iron-rich foods like red meat with citrus fruits!" },
    { category: "body_science", prompt: "Omega-3 fatty acids are essential for brain development. Which food is the best source?", emoji: "\u{1F9E0}", options: ["Chicken Nuggets", "Salmon", "Rice", "Crackers"], correctIndex: 1, explanation: "Salmon is one of the richest sources of omega-3 fatty acids (DHA and EPA). These fats literally build brain cell membranes and are crucial for memory, learning, and concentration. Your brain is about 60% fat!" },
    { category: "true_false_plus", prompt: "Sports drinks are better than water for every type of exercise.", emoji: "\u{1F3C3}", options: ["True", "Partly True — only for intense exercise", "Partly True — only for children", "False — water is always better"], correctIndex: 1, explanation: "Sports drinks contain electrolytes (sodium, potassium) that replace what you lose in sweat during INTENSE exercise lasting 60+ minutes. For regular activity, water is better because sports drinks add unnecessary sugar (about 8 teaspoons per bottle!)." },
    { category: "sugar_detective", prompt: "Which of these has more added sugar per serving than a Chocolate Chip Cookie?", emoji: "\u{1F575}\uFE0F", options: ["A plain bagel", "Flavored instant oatmeal", "Scrambled eggs", "Grilled cheese"], correctIndex: 1, explanation: "Many flavored instant oatmeal packets contain 12-15g of added sugar — more than some cookies! The fruit flavoring is mostly sugar. Plain oatmeal with real fruit is a much better choice." },
    { category: "how_you_feel", prompt: "An athlete eats a balanced meal of chicken, sweet potato, and broccoli 2 hours before a game. What's happening in their body?", emoji: "\u{1F3C6}", options: ["Their body stores the energy as fat", "Protein repairs muscles while carbs provide glycogen for sustained energy", "The food hasn't digested yet", "Only the carbs matter for sports"], correctIndex: 1, explanation: "The sweet potato's complex carbs are converted to glycogen (stored energy) in muscles. The chicken's protein begins amino acid delivery for muscle maintenance. The broccoli provides micronutrients and fiber. 2 hours gives enough time for proper digestion." },
    { category: "body_science", prompt: "Why do nutritionists recommend eating a 'rainbow' of colored foods?", emoji: "\u{1F308}", options: ["Different colors mean different vitamins and antioxidants", "Colorful food tastes better", "It's just for fun", "Only green foods are healthy"], correctIndex: 0, explanation: "Each color in fruits and vegetables represents different phytonutrients: red (lycopene), orange (beta-carotene), green (chlorophyll), blue/purple (anthocyanins). These antioxidants protect different parts of your body — that's why variety matters!" },
    { category: "food_combo", prompt: "Why do some cereals say 'fortified with iron' on the box? What does fortified mean?", emoji: "\u{1F963}", options: ["The cereal is extra crunchy", "Nutrients were added that aren't naturally there", "It means organic", "The cereal has extra sugar"], correctIndex: 1, explanation: "'Fortified' means manufacturers added nutrients (like iron, B vitamins, or folic acid) that were lost during processing or weren't in the original grain. It's helpful, but getting nutrients from whole foods is generally better because they come with fiber and other natural benefits." },
    { category: "sugar_detective", prompt: "A '100% Fruit Juice' label sounds healthy. What's the nutrition catch?", emoji: "\u{1F9C3}", options: ["It has artificial sweeteners", "It has lots of natural sugar but no fiber", "It's secretly carbonated", "There's no catch — it's perfectly healthy"], correctIndex: 1, explanation: "When fruit is juiced, all the fiber is removed but the sugar stays. A glass of apple juice has as much sugar as a soda! Eating a whole apple is better because the fiber slows sugar absorption and keeps you full longer." },
  ],
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EducationRequest;

    if (body.type === "quiz") {
      const { difficulty, count } = body;
      try {
        const questions = await generateQuiz(difficulty, count);
        return NextResponse.json({ questions });
      } catch (error) {
        console.error("[Education] Quiz generation failed, using fallback:", error);
        const fallback = FALLBACK_QUESTIONS[difficulty].slice(0, count);
        return NextResponse.json({ questions: fallback });
      }
    }

    if (body.type === "food-analysis") {
      const { foods, won, difficulty } = body;
      try {
        const analysis = await analyzeFoods(foods, won, difficulty);
        return NextResponse.json({ analysis });
      } catch (error) {
        console.error("[Education] Food analysis failed, using fallback:", error);
        const analysis = won
          ? `Great food choices! ${foods.join(", ")} gave your body a balanced mix of nutrients to feel strong and energized!`
          : `Good try! Next time, look for foods with more protein and veggies to power up your avatar. You've got this!`;
        return NextResponse.json({ analysis });
      }
    }

    if (body.type === "meal-analysis") {
      const { mealType, foods, avatarState, won } = body;
      try {
        const analysis = await analyzeMeal(mealType, foods, avatarState, won);
        return NextResponse.json({ analysis });
      } catch (error) {
        console.error("[Education] Meal analysis failed, using fallback:", error);
        const analysis = won
          ? `Awesome ${mealType}! ${foods.join(", ")} make a well-balanced meal that would keep you feeling great all day!`
          : `Nice try on your ${mealType}! Try mixing in more protein and veggies next time for a more balanced meal. You're learning!`;
        return NextResponse.json({ analysis });
      }
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error) {
    console.error("[Education] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
