import { ADVANCED_VOCABULARY } from "@/data/vocabulary/advanced";
import { ELEMENTARY_VOCABULARY } from "@/data/vocabulary/elementary";
import { HIGH_VOCABULARY } from "@/data/vocabulary/high";
import { MIDDLE_VOCABULARY } from "@/data/vocabulary/middle";
import { ITEMS } from "@/game/data/items";
import type { QuizQuestion, QuizReward, VocabularyEntry } from "@/types/quiz";
import type { MonsterState } from "./monsterManager";

type DifficultyKey = "elementary" | "middle" | "high" | "advanced";

type RewardInventoryItem = {
  id: string;
  name: string;
  quantity: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
  type: string;
};

function getDifficulty(level: number): DifficultyKey {
  if (level <= 15) return "elementary";
  if (level <= 30) return "middle";
  if (level <= 45) return "high";
  return "advanced";
}

const vocabularyMap: Record<DifficultyKey, VocabularyEntry[]> = {
  elementary: ELEMENTARY_VOCABULARY,
  middle: MIDDLE_VOCABULARY,
  high: HIGH_VOCABULARY,
  advanced: ADVANCED_VOCABULARY,
};

export class QuizHandler {
  private activeQuestions = new Map<string, QuizQuestion>();

  generate(monsterLevel: number) {
    const difficulty = getDifficulty(monsterLevel);
    const pool = vocabularyMap[difficulty];
    const entry = pool[Math.floor(Math.random() * pool.length)];
    const sameCategory = shuffle(
      pool.filter((item) => item.category === entry.category && item.en !== entry.en),
    );
    const mixed = shuffle(pool.filter((item) => item.category !== entry.category));
    const type: QuizQuestion["type"] = "kr_to_en";

    const wrongPool = [...sameCategory.slice(0, 2), ...mixed.slice(0, 1)].slice(0, 3);

    const question: QuizQuestion = {
      id: `quiz-${crypto.randomUUID()}`,
      type,
      question: entry.kr,
      correctAnswer: entry.en,
      wrongAnswers: wrongPool.map((item) => item.en),
      difficulty,
      category: entry.category,
    };

    this.activeQuestions.set(question.id, question);
    return question;
  }

  verify(questionId: string, answer: string, monster: MonsterState) {
    const question = this.activeQuestions.get(questionId);
    if (!question) {
      return null;
    }

    const correct = question.correctAnswer === answer;
    const reward: QuizReward = correct
      ? {
          gold: monster.level * 10 + Math.floor(Math.random() * Math.max(2, monster.level * 5)),
          exp: monster.level * 50 + Math.floor(Math.random() * Math.max(10, monster.level * 20)),
          items: [],
          bonusMultiplier: 1,
        }
      : {
          gold: 0,
          exp: 0,
          items: [],
          bonusMultiplier: 0,
        };

    const items = correct ? this.rollDrops(monster) : [];
    reward.items = items.map((item) => `${item.name} x${item.quantity}`);

    this.activeQuestions.delete(questionId);
    return { correct, reward, items, question };
  }

  private rollDrops(monster: MonsterState): RewardInventoryItem[] {
    const rewards: RewardInventoryItem[] = [];

    monster.drops.forEach((drop) => {
      if (Math.random() > drop.rate) {
        return;
      }

      const item = ITEMS[drop.itemId];
      if (!item) {
        return;
      }

      const quantity =
        drop.minQuantity && drop.maxQuantity
          ? drop.minQuantity + Math.floor(Math.random() * (drop.maxQuantity - drop.minQuantity + 1))
          : 1;

      rewards.push({
        id: item.id,
        name: item.name,
        quantity,
        rarity: item.rarity,
        type: item.type,
      });
    });

    return rewards;
  }
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export type { RewardInventoryItem };
