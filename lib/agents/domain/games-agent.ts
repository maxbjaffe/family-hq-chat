/**
 * Games Agent
 * 
 * Educational games and fun activities for kids.
 */

import { BaseAgent } from '../base-agent';
import { AgentContext, AgentResult, AgentCapability, UserInput, QuizQuestion } from '../types';

export class GamesAgent extends BaseAgent {
  name = 'GamesAgent';
  description = 'Educational games and fun activities';

  capabilities: AgentCapability[] = [
    {
      name: 'play_game',
      description: 'Start a game',
      triggers: ['game', 'play', 'fun', 'bored'],
      examples: ['I want to play a game', "I'm bored", 'Can we play?'],
    },
    {
      name: 'quiz',
      description: 'Educational quiz',
      triggers: ['quiz', 'trivia', 'question'],
      examples: ['Give me a quiz', 'Ask me a question'],
    },
    {
      name: 'fun_fact',
      description: 'Share a fun fact',
      triggers: ['fun fact', 'tell me something', 'did you know'],
      examples: ['Tell me a fun fact', 'Did you know...'],
    },
  ];

  async process(input: UserInput, context: AgentContext): Promise<AgentResult> {
    const text = input.text.toLowerCase();

    if (/quiz|trivia|question/i.test(text)) {
      return this.startQuiz(context);
    }

    if (/fact|did you know/i.test(text)) {
      return this.shareFunFact(context);
    }

    return this.showGameOptions(context);
  }

  private async showGameOptions(context: AgentContext): Promise<AgentResult> {
    const isKid = context.familyMember?.role === 'kid';
    
    const message = isKid
      ? "Let's have some fun! 🎮\n\n• Quiz time 🧠\n• Fun facts 🌟\n• Word games 📝\n\nWhat sounds good?"
      : "Games available:\n• Educational quizzes\n• Fun facts\n• Word games";

    return this.success(
      { availableGames: ['quiz', 'fun_fact', 'word_game'] },
      message,
      { confidence: 0.9 }
    );
  }

  private async startQuiz(context: AgentContext): Promise<AgentResult> {
    // TODO: Integrate with existing game logic
    const question = this.getRandomQuestion();
    
    return this.success(
      { question },
      `🧠 Quiz time!\n\n${question.question}\n\nWhat's your answer?`,
      { confidence: 0.9 }
    );
  }

  private async shareFunFact(context: AgentContext): Promise<AgentResult> {
    // TODO: Integrate with birthday-facts.ts
    const facts = [
      "Did you know? Honey never spoils! Archaeologists found 3000-year-old honey in Egyptian tombs that was still edible! 🍯",
      "Did you know? Octopuses have three hearts and blue blood! 🐙",
      "Did you know? A group of flamingos is called a 'flamboyance'! 🦩",
    ];
    
    const fact = facts[Math.floor(Math.random() * facts.length)];
    
    return this.success(
      { fact },
      fact,
      { confidence: 0.95, suggestedFollowUp: 'Want another fun fact?' }
    );
  }

  private getRandomQuestion(): QuizQuestion {
    const questions: QuizQuestion[] = [
      {
        question: "What is the largest planet in our solar system?",
        options: ["Mars", "Jupiter", "Saturn", "Neptune"],
        answer: "Jupiter",
        category: "science",
      },
      {
        question: "How many continents are there on Earth?",
        options: ["5", "6", "7", "8"],
        answer: "7",
        category: "geography",
      },
      {
        question: "What do bees make?",
        options: ["Milk", "Honey", "Butter", "Cheese"],
        answer: "Honey",
        category: "nature",
      },
    ];
    
    return questions[Math.floor(Math.random() * questions.length)];
  }
}
