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

// API request types — discriminated union on `type`

export interface QuizRequest {
  type: 'quiz';
  difficulty: EducationDifficulty;
  count: number;
}

export interface FoodAnalysisRequest {
  type: 'food-analysis';
  foods: string[];
  won: boolean;
  difficulty: string;
}

export interface MealAnalysisRequest {
  type: 'meal-analysis';
  mealType: string;
  foods: string[];
  avatarState: string;
  won: boolean;
}

export type EducationRequest = QuizRequest | FoodAnalysisRequest | MealAnalysisRequest;

// API response types

export interface QuizResponse {
  questions: EducationQuestion[];
}

export interface AnalysisResponse {
  analysis: string;
}
