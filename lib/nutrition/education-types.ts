// Nutrition Education — Type Definitions

export type QuestionCategory =
  | 'how_you_feel'
  | 'best_pick'
  | 'food_combo'
  | 'body_science'
  | 'true_false_plus'
  | 'sugar_detective';

export type EducationDifficulty = 'easy' | 'medium' | 'hard';

export interface EducationQuestion {
  category: QuestionCategory;
  prompt: string;
  emoji: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface NutritionFact {
  emoji: string;
  title: string;
  body: string;
  category: string;
}

// API request types — discriminated union on `type`

export interface QuizRequest {
  type: 'quiz';
  difficulty: EducationDifficulty;
  count: number;
  recentPrompts?: string[];
}

export interface FactsRequest {
  type: 'facts';
  difficulty: EducationDifficulty;
  count: number;
  recentTitles?: string[];
}

export type EducationRequest = QuizRequest | FactsRequest;

// API response types

export interface QuizResponse {
  questions: EducationQuestion[];
}

export interface FactsResponse {
  facts: NutritionFact[];
}
