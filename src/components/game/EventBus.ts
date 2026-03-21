type LootPayloadItem = {
  lootId: string;
  itemId: string;
  name: string;
  quantity: number;
  x: number;
  y: number;
};

type EventPayloadMap = {
  world_init: {
    selfId: string;
    players: Array<{
      id: string;
      name: string;
      mapId: string;
      x: number;
      y: number;
    }>;
    monsters: Array<{
      id: string;
      mapId: string;
      name: string;
      level: number;
      hp: number;
      maxHp: number;
      x: number;
      y: number;
    }>;
  };
  player_joined: { id: string; name: string };
  player_moved: {
    id: string;
    name: string;
    mapId: string;
    x: number;
    y: number;
  };
  player_left: { id: string };
  monster_updated: {
    id: string;
    mapId: string;
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    x: number;
    y: number;
  };
  quiz_trigger: {
    question: import("@/types/quiz").QuizQuestion;
    choices: string[];
    streak: number;
    bossStep?: number;
    bossTotal?: number;
    monsterId?: string;
    monsterLevel?: number;
  };
  socket_connected: { connected: boolean };
  quiz_result: {
    status: "correct" | "wrong" | "timeout";
    answer: string;
    reward?: import("@/types/quiz").QuizReward;
  };
  loot_spawn: {
    items: LootPayloadItem[];
  };
  loot_picked: {
    lootId: string;
  };
  npc_interact: {
    npcId: string;
    npcName: string;
    dialogue: string[];
    canShop: boolean;
  };
  player_death: {
    expLost: number;
  };
  stat_update: Partial<{
    hp: number;
    mp: number;
    exp: number;
    gold: number;
  }>;
  chat_message: {
    id: string;
    author: string;
    message: string;
    channel: "system" | "normal" | "party" | "clan" | "trade";
    timestamp: number;
  };
  use_summon_stone: {
    stoneId: string;
  };
  attempt_tame: Record<string, never>;
  teleport_random: Record<string, never>;
  return_to_town: Record<string, never>;
  chat_bubble: {
    playerId: string;
    message: string;
  };
  player_transformed: {
    playerId: string;
    transformId: string;
    form: string;
  };
  "night:undead_bonus": {
    active: boolean;
  };
};

type EventKey = keyof EventPayloadMap;
type Listener<K extends EventKey> = (payload: EventPayloadMap[K]) => void;

class TypedEventBus {
  private target = new EventTarget();

  emit<K extends EventKey>(type: K, detail: EventPayloadMap[K]) {
    this.target.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on<K extends EventKey>(type: K, listener: Listener<K>) {
    const handler = (event: Event) => {
      listener((event as CustomEvent<EventPayloadMap[K]>).detail);
    };

    this.target.addEventListener(type, handler);

    return () => this.target.removeEventListener(type, handler);
  }
}

export const EventBus = new TypedEventBus();

// gameStore에서 아이템 사용 시 EventBus에 접근할 수 있도록 글로벌 등록
(globalThis as Record<string, unknown>).__eventBus = EventBus;
