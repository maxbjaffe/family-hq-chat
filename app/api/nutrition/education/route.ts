import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type {
  EducationRequest,
  EducationQuestion,
  EducationDifficulty,
  NutritionFact,
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

const QUIZ_DIFFICULTY_PROMPT: Record<EducationDifficulty, string> = {
  easy: `Target age 5-7. Use simple cause-and-effect language. Each question has exactly 2 answer choices. Use only question categories: how_you_feel, best_pick, body_science. Keep explanations short (1-2 sentences) and use simple words.`,
  medium: `Target age 7-9. Use comparisons and real-life scenarios. Each question has exactly 3 answer choices. Use all 6 question categories. Explanations can be 2-3 sentences.`,
  hard: `Target age 9-12. Use real science terms (nutrients, vitamins, minerals, carbohydrates). Each question has exactly 4 answer choices. Use all 6 question categories. Explanations should teach real nutrition science in 2-3 sentences.`,
};

async function generateQuiz(
  difficulty: EducationDifficulty,
  count: number,
  recentPrompts: string[]
): Promise<EducationQuestion[]> {
  const client = getClient();

  const avoidSection =
    recentPrompts.length > 0
      ? `\n\nIMPORTANT — AVOID REPEATING these recently asked questions. Generate completely NEW and DIFFERENT questions:\n${recentPrompts.map((p) => `- "${p}"`).join("\n")}`
      : "";

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    temperature: 0.9,
    system: `You are a fun nutrition educator for kids. Generate quiz questions that teach how food affects your body, energy, mood, and health.

Question categories:
- "how_you_feel": A food → how you'd feel after eating it (energy, focus, mood)
- "best_pick": A real-life scenario → best food choice
- "food_combo": Why food combinations work (or don't)
- "body_science": How your body uses nutrients
- "true_false_plus": A nutrition claim with a nuanced answer
- "sugar_detective": Identify hidden sugars in "healthy" foods

${QUIZ_DIFFICULTY_PROMPT[difficulty]}

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
- Vary the correct answer position — don't always make it the first option
- Generate FRESH, CREATIVE questions every time — avoid common/obvious questions${avoidSection}`,
    messages: [
      {
        role: "user",
        content: `Generate ${count} nutrition quiz questions at ${difficulty} difficulty. Mix up the question categories for variety. Be creative and surprising!`,
      },
    ],
  });

  const responseText =
    response.content[0].type === "text" ? response.content[0].text : "";

  const parsed = JSON.parse(responseText);
  return parsed.questions as EducationQuestion[];
}

// ---------------------------------------------------------------------------
// Nutrition facts generation
// ---------------------------------------------------------------------------

const FACTS_DIFFICULTY_PROMPT: Record<EducationDifficulty, string> = {
  easy: `Target age 5-7. Use very simple words and short sentences. Focus on fun, surprising, relatable facts. Relate to things kids care about: energy for playing, growing taller, feeling happy. Use playful analogies.`,
  medium: `Target age 7-9. Use comparisons and real-world examples. Include "did you know" style facts about food science, body systems, and nutrition myths. Can use slightly more detail.`,
  hard: `Target age 9-12. Include real science — cell biology, specific nutrients, chemical processes, evolutionary food facts. Use proper terminology but still make it engaging and mind-blowing.`,
};

async function generateFacts(
  difficulty: EducationDifficulty,
  count: number,
  recentTitles: string[]
): Promise<NutritionFact[]> {
  const client = getClient();

  const avoidSection =
    recentTitles.length > 0
      ? `\n\nIMPORTANT — AVOID REPEATING these recently shown facts. Generate completely NEW and DIFFERENT facts:\n${recentTitles.map((t) => `- "${t}"`).join("\n")}`
      : "";

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    temperature: 0.9,
    system: `You generate fun, surprising, and educational nutrition facts for kids. Each fact should teach something genuinely interesting about food, the human body, or nutrition science.

Categories to rotate through:
- "Body Power": How your body uses food (muscles, brain, bones, immune system)
- "Food Secrets": Surprising things about everyday foods
- "Sugar Spy": Hidden sugars and sneaky marketing
- "Nature's Science": How food grows, why food has color, animal nutrition
- "Myth Buster": Common food beliefs that are wrong (or partly wrong)
- "World Foods": Interesting nutrition facts from around the world

${FACTS_DIFFICULTY_PROMPT[difficulty]}

Respond with ONLY valid JSON, no markdown fences. Format:
{
  "facts": [
    {
      "emoji": "single relevant emoji",
      "title": "short catchy title (5-8 words)",
      "body": "the fact explanation (2-4 sentences)",
      "category": "Body Power"
    }
  ]
}

IMPORTANT:
- Each fact should be genuinely surprising or "mind-blowing" — not obvious
- Vary the categories for a good mix
- Titles should be catchy and make kids want to read more
- Keep facts accurate — no made-up statistics${avoidSection}`,
    messages: [
      {
        role: "user",
        content: `Generate ${count} amazing nutrition facts at ${difficulty} difficulty. Make them surprising and fun! Mix up the categories.`,
      },
    ],
  });

  const responseText =
    response.content[0].type === "text" ? response.content[0].text : "";

  const parsed = JSON.parse(responseText);
  return parsed.facts as NutritionFact[];
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
// Fallback static facts
// ---------------------------------------------------------------------------

const FALLBACK_FACTS: Record<EducationDifficulty, NutritionFact[]> = {
  easy: [
    { emoji: "\u{1F9E0}", title: "Your Brain Runs on Water!", body: "Your brain is about 75% water. When you drink a glass of water, your brain actually works faster! That's why you feel more awake after drinking water in the morning.", category: "Body Power" },
    { emoji: "\u{1F34C}", title: "Bananas Are Nature's Energy Bar", body: "Bananas have natural sugar AND potassium, which helps your muscles work. That's why tennis players eat bananas between games!", category: "Food Secrets" },
    { emoji: "\u{1F955}", title: "Carrots Help You See in the Dark", body: "Well, not exactly in the dark — but carrots have vitamin A which keeps your eyes healthy and helps you see better in dim light!", category: "Myth Buster" },
    { emoji: "\u{1F353}", title: "Strawberries Have More Vitamin C Than Oranges", body: "Surprise! One cup of strawberries has MORE vitamin C than one orange. Vitamin C helps your body fight off colds and heal cuts.", category: "Food Secrets" },
    { emoji: "\u{1F4AA}", title: "Protein Builds Your Muscles While You Sleep", body: "When you eat protein foods like chicken or eggs, your body uses them to build and repair muscles — especially while you're sleeping!", category: "Body Power" },
    { emoji: "\u{1F36C}", title: "Sugar Hides in Ketchup!", body: "One tablespoon of ketchup has about 1 teaspoon of sugar in it. Sugar sneaks into lots of foods you wouldn't expect!", category: "Sugar Spy" },
    { emoji: "\u{1F966}", title: "Broccoli Has More Protein Than You Think", body: "A cup of broccoli actually has protein in it! It also has vitamin C, vitamin K, and lots of fiber. It's like a tiny superfood tree!", category: "Food Secrets" },
    { emoji: "\u{1F30D}", title: "Kids in Japan Eat Seaweed for Snack", body: "In Japan, kids eat dried seaweed sheets as a snack. Seaweed has tons of vitamins and minerals from the ocean!", category: "World Foods" },
    { emoji: "\u{1F9B4}", title: "Milk Makes Your Bones Grow", body: "Your bones are growing every single day! Milk, cheese, and yogurt have calcium — the building block your bones need to grow tall and strong.", category: "Body Power" },
    { emoji: "\u{1F34E}", title: "An Apple a Day Really Does Help!", body: "Apples have fiber that feeds the good bacteria in your tummy. Those good bacteria help you digest food and stay healthy!", category: "Body Power" },
  ],
  medium: [
    { emoji: "\u{1F9EC}", title: "Your Gut Has Its Own Brain", body: "Your digestive system has over 100 million nerve cells — scientists call it your 'second brain.' The foods you eat actually affect your mood because of this gut-brain connection!", category: "Body Power" },
    { emoji: "\u{1F36B}", title: "Dark Chocolate Is Actually Healthy", body: "Dark chocolate (70%+ cocoa) has antioxidants called flavonoids that are good for your heart. But milk chocolate has too much sugar to get the benefit — it's all about the cocoa!", category: "Myth Buster" },
    { emoji: "\u{1F33D}", title: "Corn Is Actually a Grain, Not a Vegetable", body: "Even though we eat it like a veggie, corn is technically a grain — just like wheat and rice. That's why it has more carbs than most vegetables!", category: "Food Secrets" },
    { emoji: "\u{1F957}", title: "Spinach Makes Your Brain Faster", body: "Spinach is packed with iron, which helps carry oxygen to your brain. More oxygen = faster thinking! That's why Popeye was so strong (and smart).", category: "Body Power" },
    { emoji: "\u{1F36F}", title: "Honey Never Goes Bad — Ever", body: "Scientists found 3,000-year-old honey in Egyptian pyramids that was still edible! Honey has natural antibacterial properties. But it still has lots of sugar, so it's a treat, not an everyday food.", category: "Nature's Science" },
    { emoji: "\u{1F963}", title: "'Whole Grain' Labels Can Be Tricky", body: "A product can say 'made with whole grains' even if only a tiny bit is whole grain. Look for 'whole wheat' as the FIRST ingredient on the label to know it's really healthy.", category: "Sugar Spy" },
    { emoji: "\u{1F347}", title: "Frozen Fruit Is Just As Healthy As Fresh", body: "Frozen fruits and vegetables are picked at peak ripeness and flash-frozen, which locks in the nutrients. Fresh produce at the store may have been sitting for days, losing vitamins!", category: "Myth Buster" },
    { emoji: "\u{1F41F}", title: "Fish Makes You Smarter — Seriously", body: "Fish like salmon have omega-3 fatty acids (DHA) that literally build the membranes of your brain cells. Studies show kids who eat fish regularly score higher on memory tests!", category: "Body Power" },
    { emoji: "\u{1F1EE}\u{1F1F3}", title: "Turmeric Is India's Secret Weapon", body: "In India, golden milk (milk with turmeric) has been used for thousands of years. Turmeric contains curcumin, a powerful anti-inflammatory that helps your body heal faster.", category: "World Foods" },
    { emoji: "\u{1F4A7}", title: "You Lose Water Just by Breathing", body: "Every time you breathe out, you lose a tiny bit of water vapor. Over a day, you can lose about 2 cups of water just from breathing! That's one reason you need to drink water even on cold days.", category: "Body Power" },
  ],
  hard: [
    { emoji: "\u{1F9EC}", title: "Your Microbiome Has More Cells Than You", body: "Your gut contains around 38 trillion bacteria — more than the 30 trillion human cells in your body. These microbes help digest food, produce vitamins K and B12, and even influence your immune system. Eating fiber feeds the beneficial bacteria.", category: "Body Power" },
    { emoji: "\u{1F9EA}", title: "Vitamin C Changes Iron's Chemical Form", body: "Non-heme iron (from plants) is in the Fe3+ form, which your body can't absorb well. Vitamin C acts as a reducing agent, converting it to Fe2+ — a form your intestines can absorb 3-6x more efficiently. That's why nutritionists pair spinach with citrus!", category: "Nature's Science" },
    { emoji: "\u{1F4A5}", title: "Capsaicin Tricks Your Brain Into Feeling Heat", body: "Spicy peppers contain capsaicin, which binds to TRPV1 receptors — the same receptors that detect actual heat. Your brain releases endorphins in response, creating a natural 'high.' This is why some people get addicted to spicy food!", category: "Food Secrets" },
    { emoji: "\u{1F9C0}", title: "Cheese Is Basically Concentrated Milk", body: "It takes about 10 pounds of milk to make 1 pound of cheese. The casein proteins in milk coagulate when acid or enzymes are added, trapping fat and calcium in a solid matrix. That's why cheese has 10x the calcium density of milk!", category: "Nature's Science" },
    { emoji: "\u{1F4C8}", title: "The Glycemic Index Explains Sugar Crashes", body: "Foods with a high glycemic index (GI) like white bread (GI: 75) cause rapid blood glucose spikes. Your pancreas releases a burst of insulin to compensate, which can overshoot, causing hypoglycemia — the 'crash.' Low-GI foods like oatmeal (GI: 55) provide steadier energy.", category: "Body Power" },
    { emoji: "\u{1F30E}", title: "Quinoa Was NASA's Space Food Pick", body: "NASA studied quinoa as a potential crop for long-duration space missions because it's one of the few plant foods that's a 'complete protein' — containing all 9 essential amino acids. The Incas called it 'the mother of all grains' 5,000 years ago.", category: "World Foods" },
    { emoji: "\u{1F9C3}", title: "Juice Companies Legally Add Back 'Flavor Packs'", body: "To make juice consistent year-round, companies strip oxygen from juice (removing flavor), then add engineered 'flavor packs' — essentially perfume made from orange byproducts. It's still '100% juice' technically, but it's been heavily processed.", category: "Sugar Spy" },
    { emoji: "\u{1F9E0}", title: "Your Brain Burns 20% of Your Daily Calories", body: "Despite being only 2% of your body weight, your brain consumes about 20% of your total energy — roughly 400-500 calories per day. It runs almost exclusively on glucose, which is why you feel foggy when you skip meals.", category: "Body Power" },
    { emoji: "\u{1F344}", title: "Mushrooms Make Vitamin D in Sunlight", body: "Like humans, mushrooms produce vitamin D when exposed to UV light. Place store-bought mushrooms gill-side-up in sunlight for 30 minutes, and their vitamin D content can increase by 800%! They're one of the only non-animal food sources of vitamin D.", category: "Nature's Science" },
    { emoji: "\u{1F1EF}\u{1F1F5}", title: "Japan's School Lunches Are Nutritionally Engineered", body: "Japanese school lunches are designed by professional nutritionists to provide exactly 1/3 of a child's daily nutrients. Students serve each other, eat in classrooms, and clean up — it's considered part of food education ('shokuiku').", category: "World Foods" },
  ],
};

// ---------------------------------------------------------------------------
// Server-side dedup — Haiku sometimes ignores "avoid these" instructions
// ---------------------------------------------------------------------------

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function isDuplicate(candidate: string, recentList: string[]): boolean {
  const norm = normalize(candidate);
  return recentList.some((r) => {
    const rNorm = normalize(r);
    // Exact match or one contains the other (catches minor rewording)
    return norm === rNorm || norm.includes(rNorm) || rNorm.includes(norm);
  });
}

function dedupeQuestions(
  questions: EducationQuestion[],
  recentPrompts: string[],
  difficulty: EducationDifficulty,
  targetCount: number
): EducationQuestion[] {
  if (recentPrompts.length === 0) return questions.slice(0, targetCount);

  const filtered = questions.filter((q) => !isDuplicate(q.prompt, recentPrompts));

  if (filtered.length >= targetCount) return filtered.slice(0, targetCount);

  // Backfill from fallbacks that also aren't in recent
  const fallbacks = FALLBACK_QUESTIONS[difficulty].filter(
    (q) => !isDuplicate(q.prompt, recentPrompts) && !isDuplicate(q.prompt, filtered.map((f) => f.prompt))
  );
  return [...filtered, ...fallbacks].slice(0, targetCount);
}

function dedupeFacts(
  facts: NutritionFact[],
  recentTitles: string[],
  difficulty: EducationDifficulty,
  targetCount: number
): NutritionFact[] {
  if (recentTitles.length === 0) return facts.slice(0, targetCount);

  const filtered = facts.filter((f) => !isDuplicate(f.title, recentTitles));

  if (filtered.length >= targetCount) return filtered.slice(0, targetCount);

  const fallbacks = FALLBACK_FACTS[difficulty].filter(
    (f) => !isDuplicate(f.title, recentTitles) && !isDuplicate(f.title, filtered.map((x) => x.title))
  );
  return [...filtered, ...fallbacks].slice(0, targetCount);
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EducationRequest;

    if (body.type === "quiz") {
      const { difficulty, count, recentPrompts = [] } = body;
      try {
        // Ask for extra to compensate for dedup filtering
        const raw = await generateQuiz(difficulty, Math.min(count + 4, 15), recentPrompts);
        const questions = dedupeQuestions(raw, recentPrompts, difficulty, count);
        return NextResponse.json({ questions });
      } catch (error) {
        console.error("[Education] Quiz generation failed, using fallback:", error);
        const fallback = dedupeQuestions(FALLBACK_QUESTIONS[difficulty], recentPrompts, difficulty, count);
        return NextResponse.json({ questions: fallback });
      }
    }

    if (body.type === "facts") {
      const { difficulty, count, recentTitles = [] } = body;
      try {
        const raw = await generateFacts(difficulty, Math.min(count + 4, 15), recentTitles);
        const facts = dedupeFacts(raw, recentTitles, difficulty, count);
        return NextResponse.json({ facts });
      } catch (error) {
        console.error("[Education] Facts generation failed, using fallback:", error);
        const fallback = dedupeFacts(FALLBACK_FACTS[difficulty], recentTitles, difficulty, count);
        return NextResponse.json({ facts: fallback });
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
