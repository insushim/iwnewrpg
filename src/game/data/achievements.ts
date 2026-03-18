export type AchievementCategory = 'combat' | 'social' | 'exploration' | 'crafting' | 'character';

export interface AchievementReward {
  exp?: number;
  gold?: number;
  title?: string;
  itemId?: string;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  trackType: 'kill_any' | 'kill_boss' | 'quiz_streak' | 'level' | 'gold' | 'enchant_level' | 'map_visit' | 'login_streak' | 'craft_count' | 'death_count';
  goal: number;
  rewards: AchievementReward;
  hidden?: boolean;
  icon?: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // === COMBAT ===
  {
    id: 'kill_10',
    name: '첫 사냥',
    description: '몬스터 10마리를 처치하세요.',
    category: 'combat',
    trackType: 'kill_any',
    goal: 10,
    rewards: { exp: 500, gold: 100 },
  },
  {
    id: 'kill_100',
    name: '베테랑 사냥꾼',
    description: '몬스터 100마리를 처치하세요.',
    category: 'combat',
    trackType: 'kill_any',
    goal: 100,
    rewards: { exp: 2000, gold: 500, title: '베테랑 사냥꾼' },
  },
  {
    id: 'kill_500',
    name: '몬스터 학살자',
    description: '몬스터 500마리를 처치하세요.',
    category: 'combat',
    trackType: 'kill_any',
    goal: 500,
    rewards: { exp: 8000, gold: 2000, title: '학살자' },
  },
  {
    id: 'kill_2000',
    name: '전쟁 기계',
    description: '몬스터 2000마리를 처치하세요.',
    category: 'combat',
    trackType: 'kill_any',
    goal: 2000,
    rewards: { exp: 30000, gold: 8000, title: '전쟁 기계' },
  },
  {
    id: 'kill_boss_1',
    name: '첫 보스 처치',
    description: '보스 몬스터를 처음으로 처치하세요.',
    category: 'combat',
    trackType: 'kill_boss',
    goal: 1,
    rewards: { exp: 3000, gold: 1000, itemId: 'weapon_enchant_scroll' },
  },
  {
    id: 'kill_boss_10',
    name: '보스 사냥꾼',
    description: '보스 몬스터를 10마리 처치하세요.',
    category: 'combat',
    trackType: 'kill_boss',
    goal: 10,
    rewards: { exp: 15000, gold: 5000, title: '보스 슬레이어' },
  },
  {
    id: 'kill_boss_50',
    name: '전설의 보스 킬러',
    description: '보스 몬스터를 50마리 처치하세요.',
    category: 'combat',
    trackType: 'kill_boss',
    goal: 50,
    rewards: { exp: 80000, gold: 25000, title: '레이드의 신', itemId: 'legendary_box' },
    hidden: true,
  },
  // === QUIZ / STREAK ===
  {
    id: 'quiz_streak_10',
    name: '연속 정답',
    description: '퀴즈 연속 정답 10회를 달성하세요.',
    category: 'combat',
    trackType: 'quiz_streak',
    goal: 10,
    rewards: { exp: 1000, gold: 200 },
  },
  {
    id: 'quiz_streak_30',
    name: '언어 천재',
    description: '퀴즈 연속 정답 30회를 달성하세요.',
    category: 'combat',
    trackType: 'quiz_streak',
    goal: 30,
    rewards: { exp: 5000, gold: 1000, title: '언어 천재' },
  },
  {
    id: 'quiz_streak_100',
    name: '언어의 신',
    description: '퀴즈 연속 정답 100회를 달성하세요.',
    category: 'combat',
    trackType: 'quiz_streak',
    goal: 100,
    rewards: { exp: 20000, gold: 5000, title: '언어의 신', itemId: 'mystery_box' },
    hidden: true,
  },
  // === CHARACTER ===
  {
    id: 'level_5',
    name: '성장의 시작',
    description: '레벨 5를 달성하세요.',
    category: 'character',
    trackType: 'level',
    goal: 5,
    rewards: { exp: 200, gold: 200 },
  },
  {
    id: 'level_10',
    name: '진정한 모험가',
    description: '레벨 10을 달성하세요.',
    category: 'character',
    trackType: 'level',
    goal: 10,
    rewards: { exp: 800, gold: 500, itemId: 'haste_potion' },
  },
  {
    id: 'level_20',
    name: '실력자',
    description: '레벨 20을 달성하세요.',
    category: 'character',
    trackType: 'level',
    goal: 20,
    rewards: { exp: 5000, gold: 2000, title: '실력자' },
  },
  {
    id: 'level_30',
    name: '강자의 반열',
    description: '레벨 30을 달성하세요.',
    category: 'character',
    trackType: 'level',
    goal: 30,
    rewards: { exp: 15000, gold: 5000, title: '강자' },
  },
  {
    id: 'level_50',
    name: '전설의 용사',
    description: '레벨 50을 달성하세요.',
    category: 'character',
    trackType: 'level',
    goal: 50,
    rewards: { exp: 100000, gold: 20000, title: '전설', itemId: 'legendary_box' },
    hidden: true,
  },
  // === GOLD ===
  {
    id: 'gold_1000',
    name: '초보 상인',
    description: '골드 1,000을 보유하세요.',
    category: 'character',
    trackType: 'gold',
    goal: 1000,
    rewards: { exp: 500 },
  },
  {
    id: 'gold_10000',
    name: '부유한 상인',
    description: '골드 10,000을 보유하세요.',
    category: 'character',
    trackType: 'gold',
    goal: 10000,
    rewards: { exp: 2000, title: '부유한 상인' },
  },
  {
    id: 'gold_100000',
    name: '대상인',
    description: '골드 100,000을 보유하세요.',
    category: 'character',
    trackType: 'gold',
    goal: 100000,
    rewards: { exp: 10000, gold: 5000, title: '대상인' },
    hidden: true,
  },
  // === CRAFTING / ENCHANT ===
  {
    id: 'enchant_plus3',
    name: '강화 입문',
    description: '아이템을 +3 이상 강화하세요.',
    category: 'crafting',
    trackType: 'enchant_level',
    goal: 3,
    rewards: { exp: 1000, gold: 300 },
  },
  {
    id: 'enchant_plus7',
    name: '강화 달인',
    description: '아이템을 +7 이상 강화하세요.',
    category: 'crafting',
    trackType: 'enchant_level',
    goal: 7,
    rewards: { exp: 8000, gold: 2000, title: '강화 달인' },
  },
  {
    id: 'enchant_plus12',
    name: '강화의 신',
    description: '아이템을 +12 이상 강화하세요.',
    category: 'crafting',
    trackType: 'enchant_level',
    goal: 12,
    rewards: { exp: 50000, gold: 10000, title: '강화의 신', itemId: 'blessing_scroll' },
    hidden: true,
  },
  // === EXPLORATION ===
  {
    id: 'explore_3maps',
    name: '탐험가',
    description: '3개 이상의 지역을 방문하세요.',
    category: 'exploration',
    trackType: 'map_visit',
    goal: 3,
    rewards: { exp: 1000, gold: 300 },
  },
  {
    id: 'explore_6maps',
    name: '대륙 탐험가',
    description: '6개 이상의 지역을 방문하세요.',
    category: 'exploration',
    trackType: 'map_visit',
    goal: 6,
    rewards: { exp: 5000, gold: 1500, title: '탐험가' },
  },
  {
    id: 'explore_all_maps',
    name: '세계 여행자',
    description: '모든 지역을 방문하세요.',
    category: 'exploration',
    trackType: 'map_visit',
    goal: 9,
    rewards: { exp: 20000, gold: 8000, title: '세계 여행자', itemId: 'mystery_box' },
    hidden: true,
  },
  // === SOCIAL / LOGIN ===
  {
    id: 'login_3days',
    name: '꾸준한 모험가',
    description: '3일 연속 로그인하세요.',
    category: 'social',
    trackType: 'login_streak',
    goal: 3,
    rewards: { exp: 1000, gold: 500 },
  },
  {
    id: 'login_7days',
    name: '7일 출석 완료',
    description: '7일 연속 로그인하세요.',
    category: 'social',
    trackType: 'login_streak',
    goal: 7,
    rewards: { exp: 5000, gold: 2000, itemId: 'mystery_box' },
  },
  {
    id: 'login_30days',
    name: '한 달 꾸준히',
    description: '30일 연속 로그인하세요.',
    category: 'social',
    trackType: 'login_streak',
    goal: 30,
    rewards: { exp: 30000, gold: 10000, title: '성실한 모험가', itemId: 'legendary_box' },
    hidden: true,
  },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
