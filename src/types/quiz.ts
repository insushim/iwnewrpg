import type { DifficultyTier } from "@/types/game";

export interface QuizQuestion {
  id: string;
  type: "en_to_kr" | "kr_to_en";
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
  difficulty: DifficultyTier;
  category?: string;
}

export interface QuizReward {
  gold: number;
  exp: number;
  items: string[];
  bonusMultiplier: number;
}

export interface QuizResult {
  correct: boolean;
  streakCount: number;
  reward: QuizReward;
}

export interface VocabularyEntry {
  en: string;
  kr: string;
  category: string;
}
