/**
 * Gap-Closing Question Generator
 *
 * Template-based question generator that produces persona-appropriate
 * questions to help close capability gaps. Takes a PersonCapabilityProfile
 * and returns ranked questions the persona can weave into conversation.
 */

import type { PersonCapabilityProfile, CapabilityArea, DataGap } from './capability-calculator';

// --- Types ---

export interface GapQuestion {
  id: string; // stable ID for tracking dismissals
  gap: string; // area name
  gapIcon: string;
  question: string;
  followUp?: string;
  impact: number; // % capability unlock
  effort: string; // "2 minutes", "ongoing"
  why: string; // brief explanation of why this helps
}

export type PersonaTone = 'spark' | 'dylan' | 'mama-bunz' | 'fidget' | 'max-poppins' | 'neutral';

// --- Question templates per area ---

interface QuestionTemplate {
  area: string;
  dataType: string;
  tones: Record<string, { question: string; followUp?: string }>;
  neutral: { question: string; followUp?: string };
  effort: string;
  why: string;
}

const QUESTION_TEMPLATES: QuestionTemplate[] = [
  // --- Productivity ---
  {
    area: 'Productivity',
    dataType: 'Focus sessions',
    tones: {
      spark: { question: "When's the last time you had 2 hours of uninterrupted focus? Let's block that in.", followUp: "What would you work on if you had a protected focus block?" },
      neutral: { question: "Would you like to start tracking focus sessions to see your deep work patterns?" },
    },
    neutral: { question: "Would you like to start tracking focus sessions to see your deep work patterns?" },
    effort: '1 minute to start',
    why: 'Focus session data reveals your productive patterns',
  },
  {
    area: 'Productivity',
    dataType: 'Weekly priorities',
    tones: {
      spark: { question: "What's the ONE thing that would make this week a win?", followUp: "Got it. What else? Give me 2 more and we've got your priorities." },
      neutral: { question: "Would you like to set weekly priorities to guide your focus?" },
    },
    neutral: { question: "Would you like to set weekly priorities to guide your focus?" },
    effort: '3 minutes',
    why: 'Priorities help us suggest what to work on',
  },

  // --- Goal Tracking ---
  {
    area: 'Goal Tracking',
    dataType: 'Weekly priorities',
    tones: {
      spark: { question: "What are you trying to accomplish this month? Not tasks — the bigger picture.", followUp: "Good. Let's turn that into trackable priorities." },
      neutral: { question: "What are your top goals right now?" },
    },
    neutral: { question: "What are your top goals right now?" },
    effort: '3 minutes',
    why: 'Goals let us connect daily work to what matters',
  },
  {
    area: 'Goal Tracking',
    dataType: 'Habits configured',
    tones: {
      spark: { question: "What's one daily habit you keep meaning to build? Let's track it.", followUp: "Start small — even 5 push-ups counts. What's yours?" },
      neutral: { question: "Would you like to track any daily habits?" },
    },
    neutral: { question: "Would you like to track any daily habits?" },
    effort: '2 minutes',
    why: 'Habit tracking builds consistency and streaks',
  },

  // --- Time Management ---
  {
    area: 'Time Management',
    dataType: 'Focus time logged',
    tones: {
      spark: { question: "You had some open blocks today. Want to claim one for deep work?", followUp: "What's the most important thing you could focus on?" },
      neutral: { question: "Try logging a focus session to start tracking your productive time." },
    },
    neutral: { question: "Try logging a focus session to start tracking your productive time." },
    effort: '1 minute',
    why: 'Tracking focus time reveals where your hours go',
  },

  // --- Email Intelligence ---
  {
    area: 'Email Intelligence',
    dataType: 'Children covered',
    tones: {
      spark: { question: "Are all the kids' school contacts sending to your main Gmail? That's how we catch deadlines automatically." },
      'max-poppins': { question: "Quick check — are all the school emails coming to the Gmail we monitor? We want to catch everything for each kid." },
      neutral: { question: "Ensure all school contacts send to your monitored Gmail for complete tracking." },
    },
    neutral: { question: "Ensure all school contacts send to your monitored Gmail for complete tracking." },
    effort: '5 minutes',
    why: 'More email coverage means fewer missed deadlines',
  },

  // --- Job Search ---
  {
    area: 'Job Search',
    dataType: 'Jobs tracked',
    tones: {
      spark: { question: "Seen any interesting roles this week? Paste the URL and I'll research it for you.", followUp: "I'll analyze fit, comp, and culture in 45 seconds." },
      neutral: { question: "Add job listing URLs to build your pipeline." },
    },
    neutral: { question: "Add job listing URLs to build your pipeline." },
    effort: '1 minute each',
    why: 'More listings means better pattern recognition for fit',
  },

  // --- Habit Tracking ---
  {
    area: 'Habit Tracking',
    dataType: 'Recent logging',
    tones: {
      spark: { question: "Did you hit your habits today? Quick check-in.", followUp: "Even partial counts. What did you do?" },
      neutral: { question: "Log today's habits to keep your streaks alive." },
    },
    neutral: { question: "Log today's habits to keep your streaks alive." },
    effort: '30 seconds',
    why: 'Consistent logging builds streaks and motivation',
  },

  // --- Mental Load Tracking ---
  {
    area: 'Mental Load Tracking',
    dataType: 'Items logged',
    tones: {
      dylan: { question: "What's living rent-free in your head right now? Let's get it out.", followUp: "Even the small stuff. If you're thinking about it, it's taking up space." },
      'mama-bunz': { question: "What's on your mind that you haven't said out loud yet?", followUp: "Come on, dump it. That's literally what I'm here for." },
      fidget: { question: "Brain dump time — what's rattling around in there?", followUp: "Don't filter, just list. We'll organize after." },
      neutral: { question: "What's on your mind? Sharing helps externalize mental load." },
    },
    neutral: { question: "What's on your mind? Sharing helps externalize mental load." },
    effort: '2 minutes',
    why: 'Externalizing mental load reduces cognitive burden',
  },
  {
    area: 'Mental Load Tracking',
    dataType: 'Items organized',
    tones: {
      dylan: { question: "You've got some unsorted items in your inbox. Want to spend 2 minutes triaging them?", followUp: "We can do it together — I'll suggest buckets." },
      'mama-bunz': { question: "Your inbox has stuff sitting in it. Let's sort through it quick.", followUp: "Is it a to-do, something to keep an eye on, or can you let it go?" },
      fidget: { question: "Want to organize your inbox? I'll help you see what connects.", followUp: "Sometimes just sorting things helps you see the pattern." },
      neutral: { question: "Triage your inbox items into buckets to stay organized." },
    },
    neutral: { question: "Triage your inbox items into buckets to stay organized." },
    effort: '5 minutes',
    why: 'Organized items reduce the feeling of overwhelm',
  },

  // --- School Support ---
  {
    area: 'School Support',
    dataType: 'Children covered',
    tones: {
      dylan: { question: "Are all the kids' school emails landing in the right inbox? We want to catch everything." },
      'max-poppins': { question: "Let's make sure we're tracking all school communications for each kid. Any schools we might be missing?" },
      neutral: { question: "Verify all kids' school contacts are sending to the monitored Gmail." },
    },
    neutral: { question: "Verify all kids' school contacts are sending to the monitored Gmail." },
    effort: '5 minutes',
    why: 'Complete school email coverage catches every deadline',
  },

  // --- Stress Management ---
  {
    area: 'Stress Management',
    dataType: 'Wellness data',
    tones: {
      dylan: { question: "How's your energy level today? Not what you think you should say — actually.", followUp: "That's real. What usually helps when you're feeling like this?" },
      'mama-bunz': { question: "Scale of 1-10, how are you actually doing today?", followUp: "And what's the biggest thing driving that number?" },
      fidget: { question: "If your energy had a weather forecast, what would it be today?", followUp: "Interesting. What usually shifts it?" },
      neutral: { question: "How's your energy level today?" },
    },
    neutral: { question: "How's your energy level today?" },
    effort: '1 minute',
    why: 'Energy patterns help us time support better',
  },
  {
    area: 'Stress Management',
    dataType: 'Stress triggers',
    tones: {
      dylan: { question: "When things pile up, what's the thing that tips you over the edge?", followUp: "Knowing your triggers helps us see trouble coming." },
      'mama-bunz': { question: "What actually stresses you out? Not the things you think should — the things that actually do.", followUp: "Good. Now we can watch for those patterns." },
      fidget: { question: "What was the last thing that made you think 'I can't deal with this right now'?", followUp: "Those moments tell us a lot about where to focus." },
      neutral: { question: "What are your biggest stress triggers?" },
    },
    neutral: { question: "What are your biggest stress triggers?" },
    effort: '2 minutes',
    why: 'Knowing triggers lets us proactively support you',
  },

  // --- Family Coordination ---
  {
    area: 'Family Coordination',
    dataType: 'Family member coverage',
    tones: {
      'max-poppins': { question: "What's each kid most focused on right now? School, activities, friendships?", followUp: "This helps me keep track of what matters to each of them." },
      neutral: { question: "Add notes about each family member's current focus and needs." },
    },
    neutral: { question: "Add notes about each family member's current focus and needs." },
    effort: '5 minutes',
    why: 'Understanding each person helps us coordinate better',
  },
  {
    area: 'Family Coordination',
    dataType: 'Tasks & priorities',
    tones: {
      'max-poppins': { question: "What's the family's biggest challenge this week?", followUp: "Let me see what we can do to help with that." },
      neutral: { question: "Set weekly family priorities for better coordination." },
    },
    neutral: { question: "Set weekly family priorities for better coordination." },
    effort: '3 minutes',
    why: 'Family priorities align everyone on what matters',
  },

  // --- Routine Tracking ---
  {
    area: 'Routine Tracking',
    dataType: 'Checklist items',
    tones: {
      'max-poppins': { question: "Want to set up a morning routine checklist? Kids do better with consistent routines.", followUp: "What are the must-dos before school?" },
      neutral: { question: "Configure morning/evening checklist items for daily routines." },
    },
    neutral: { question: "Configure morning/evening checklist items for daily routines." },
    effort: '3 minutes',
    why: 'Checklists build independence and consistency',
  },

  // --- Activity Tracking ---
  {
    area: 'Activity Tracking',
    dataType: 'Calendar events',
    tones: {
      'max-poppins': { question: "Are all the kids' activities on the family calendar? Sports, lessons, playdates?", followUp: "A complete calendar is the foundation for good coordination." },
      neutral: { question: "Add activities and events to the family calendar for better tracking." },
    },
    neutral: { question: "Add activities and events to the family calendar for better tracking." },
    effort: '2 minutes',
    why: 'Calendar completeness drives scheduling confidence',
  },
];

// --- Main entry point ---

/**
 * Generate gap-closing questions for a person's capability profile.
 * Returns questions ranked by impact, in the specified persona's tone.
 */
export function generateGapQuestions(
  profile: PersonCapabilityProfile,
  persona: PersonaTone = 'neutral',
  maxQuestions: number = 5
): GapQuestion[] {
  const questions: GapQuestion[] = [];

  // Sort areas by gap size (biggest opportunity first)
  const sortedAreas = [...profile.areas].sort((a, b) => b.gap - a.gap);

  for (const area of sortedAreas) {
    if (area.gap <= 5) continue; // Skip areas with tiny gaps

    for (const gap of area.dataGaps) {
      // Find matching template
      const template = QUESTION_TEMPLATES.find(
        t => t.area === area.name && t.dataType === gap.dataType
      );

      if (!template) continue;

      // Pick persona-appropriate version
      const toneVersion = template.tones[persona] || template.neutral;

      questions.push({
        id: `${area.name.toLowerCase().replace(/\s+/g, '-')}_${gap.dataType.toLowerCase().replace(/\s+/g, '-')}`,
        gap: area.name,
        gapIcon: area.icon,
        question: toneVersion.question,
        followUp: toneVersion.followUp,
        impact: gap.impact,
        effort: template.effort,
        why: template.why,
      });
    }
  }

  // Sort by impact descending, return top N
  return questions
    .sort((a, b) => b.impact - a.impact)
    .slice(0, maxQuestions);
}

/**
 * Format top questions for injection into a system prompt.
 * Keeps it concise so it doesn't bloat the prompt.
 */
export function formatQuestionsForPrompt(
  questions: GapQuestion[],
  limit: number = 2
): string {
  if (questions.length === 0) return '';

  const top = questions.slice(0, limit);

  const lines = [
    '## Gap-Closing Opportunities',
    'If relevant to the conversation, consider naturally asking one of these:',
    '',
  ];

  for (const q of top) {
    lines.push(`${q.gapIcon} **${q.gap}** (+${q.impact}% capability)`);
    lines.push(`Ask: "${q.question}"`);
    if (q.followUp) lines.push(`Follow-up: "${q.followUp}"`);
    lines.push(`Why: ${q.why}`);
    lines.push('');
  }

  lines.push('Only ask if it fits naturally. Never force these questions.');

  return lines.join('\n');
}
