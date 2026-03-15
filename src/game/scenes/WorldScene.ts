import * as Phaser from "phaser";
import { EventBus } from "@/components/game/EventBus";
import { MAPS } from "@/game/data/maps";
import { NPCS } from "@/game/data/npcs";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";
import { ELEMENTARY_VOCABULARY } from "@/data/vocabulary/elementary";
import { MONSTERS } from "@/game/data/monsters";

type WorldInitPayload = {
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

type WorldPlayerPayload = {
  id: string;
  name: string;
  mapId: string;
  x: number;
  y: number;
};

type WorldMonsterPayload = {
  id: string;
  mapId: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
};

type LootPayload = {
  items: Array<{
    lootId: string;
    itemId: string;
    name: string;
    quantity: number;
    x: number;
    y: number;
  }>;
};

type NpcSprite = Phaser.GameObjects.Container & {
  npcId: string;
  spriteBody: Phaser.GameObjects.Image;
  facing: DirectionKey;
  animState: AnimState;
  animFrame: number;
  frameTimer: number;
  lastX: number;
  lastY: number;
  textureBase: string;
};

type MonsterSprite = Phaser.GameObjects.Container & {
  monsterId: string;
  hpFill: Phaser.GameObjects.Rectangle;
  hpBack: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  ring: Phaser.GameObjects.Ellipse;
  spriteBody: Phaser.GameObjects.Image;
  facing: DirectionKey;
  animState: AnimState;
  animFrame: number;
  frameTimer: number;
  lastX: number;
  lastY: number;
  textureBase: string;
  attackUntil: number;
  hitFlash: number;
  prevHp: number;
};

type PlayerSprite = Phaser.GameObjects.Container & {
  playerId: string;
  label: Phaser.GameObjects.Text;
  ring: Phaser.GameObjects.Ellipse;
  spriteBody: Phaser.GameObjects.Image;
  facing: DirectionKey;
  animState: AnimState;
  animFrame: number;
  frameTimer: number;
  lastX: number;
  lastY: number;
  textureBase: string;
  attackUntil: number;
};

type LootSprite = Phaser.GameObjects.Container & {
  lootId: string;
};

const TILE_WIDTH = 72;
const TILE_HEIGHT = 52;
const STARTER_TOWN_RECT = new Phaser.Geom.Rectangle(220, 180, 760, 430);
const MOVE_SPEED = 110;
const MELEE_RANGE = 92;
const RANGED_RANGE = 420;
const WALK_FRAME_COUNT = 4;
const IDLE_FRAME_COUNT = 2;
const ATTACK_FRAME_COUNT = 4;

export class WorldScene extends Phaser.Scene {
  private mapId = "speakingIsland";
  private selfId: string | null = null;
  private localPlayer?: PlayerSprite;
  private selectedMonsterId: string | null = null;
  private autoAttackEvent?: Phaser.Time.TimerEvent;
  private lastAttackAt = 0;
  private unsubscribe: Array<() => void> = [];

  private groundLayer?: Phaser.GameObjects.Container;
  private propLayer?: Phaser.GameObjects.Container;
  private actorLayer?: Phaser.GameObjects.Container;
  private effectLayer?: Phaser.GameObjects.Container;
  private overlayLayer?: Phaser.GameObjects.Container;
  private waterLayer?: Phaser.GameObjects.Container;
  private destinationMarker?: Phaser.GameObjects.Ellipse;
  private targetMarker?: Phaser.GameObjects.Ellipse;

  private playerSprites = new Map<string, PlayerSprite>();
  private monsterSprites = new Map<string, MonsterSprite>();
  private npcSprites = new Map<string, NpcSprite>();
  private lootSprites = new Map<string, LootSprite>();

  private isOfflineMode = false;
  private offlineMonsterHp = new Map<
    string,
    {
      hp: number;
      maxHp: number;
      atk: number;
      exp: number;
      goldMin: number;
      goldMax: number;
    }
  >();
  private pendingOfflineMonsterId: string | null = null;
  private offlineStreak = 0;
  private offlineAttackCount = new Map<string, number>();
  private QUIZ_EVERY_N_ATTACKS = 5;
  private quizResultUnsubscribe?: () => void;

  private nearbyNpcId: string | null = null;
  private interactionHintSprite?: Phaser.GameObjects.Container;

  private monsterAI = new Map<
    string,
    {
      state: "idle" | "wander" | "chase";
      spawnX: number;
      spawnY: number;
      wanderTargetX: number;
      wanderTargetY: number;
      wanderTimer: number;
      lastChaseAt: number;
    }
  >();

  constructor() {
    super("WorldScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#07101a");
    this.cameras.main.setZoom(0.94);
    this.cameras.main.roundPixels = true;

    this.groundLayer = this.add.container(0, 0);
    this.waterLayer = this.add.container(0, 0);
    this.propLayer = this.add.container(0, 0);
    this.actorLayer = this.add.container(0, 0);
    this.effectLayer = this.add.container(0, 0);
    this.overlayLayer = this.add.container(0, 0);

    this.destinationMarker = this.add
      .ellipse(0, 0, 30, 18, 0xf6df95, 0.14)
      .setStrokeStyle(2, 0xf6df95, 0.55)
      .setVisible(false);
    this.targetMarker = this.add
      .ellipse(0, 0, 54, 28, 0xf46f57, 0.1)
      .setStrokeStyle(2, 0xf46f57, 0.85)
      .setVisible(false);
    this.effectLayer.add([this.destinationMarker, this.targetMarker]);

    this.registerEvents();
    this.attachInput();
    this.syncFromStore();
    this.drawMap();
    this.spawnStaticNpcs();
    this.spawnLootFromStore();
  }

  update() {
    if (!this.localPlayer || !this.targetMarker) {
      return;
    }

    this.cameras.main.centerOn(this.localPlayer.x, this.localPlayer.y);
    this.updateAnimatedUnits();
    this.sortActorLayer();
    this.updateNpcProximity();
    this.updateMonsterAI();

    if (this.targetMarker.visible) {
      const target = this.selectedMonsterId
        ? this.monsterSprites.get(this.selectedMonsterId)
        : null;
      if (target && target.visible) {
        this.targetMarker.setPosition(target.x, target.y + 20);
      } else {
        this.targetMarker.setVisible(false);
      }
    }
  }

  shutdown() {
    this.stopAutoAttack();
    this.quizResultUnsubscribe?.();
    this.unsubscribe.forEach((off) => off());
    this.unsubscribe = [];
  }

  private bootstrapOffline() {
    this.isOfflineMode = true;
    const offlineId = `offline-${Date.now()}`;
    const playerName = useGameStore.getState().player.name;

    const startX = 530;
    const startY = 400;

    const offlineMonsters = this.generateOfflineMonsters();

    useGameStore.getState().setWorld({
      selfId: offlineId,
      players: [
        {
          id: offlineId,
          name: playerName,
          mapId: "speakingIsland",
          x: startX,
          y: startY,
        },
      ],
      monsters: offlineMonsters,
    });

    this.selfId = offlineId;
    this.mapId = "speakingIsland";

    this.upsertPlayer({
      id: offlineId,
      name: playerName,
      mapId: "speakingIsland",
      x: startX,
      y: startY,
    });

    offlineMonsters.forEach((monster) => {
      this.offlineMonsterHp.set(monster.id, {
        hp: monster.hp,
        maxHp: monster.maxHp,
        atk: 4,
        exp: 10 * monster.level,
        goldMin: 5,
        goldMax: 15,
      });
      this.monsterAI.set(monster.id, {
        state: "idle",
        spawnX: monster.x,
        spawnY: monster.y,
        wanderTargetX: monster.x,
        wanderTargetY: monster.y,
        wanderTimer: 0,
        lastChaseAt: 0,
      });
      this.upsertMonster(monster);
    });

    // Listen for quiz results in offline mode
    this.quizResultUnsubscribe = EventBus.on("quiz_result", (payload) => {
      if (this.isOfflineMode) {
        this.handleOfflineQuizResult(payload);
      }
    });

    useGameStore.getState().addChat({
      id: crypto.randomUUID(),
      channel: "system",
      author: "시스템",
      message:
        "오프라인 모드로 플레이 중입니다. 우클릭으로 이동, 몬스터 우클릭으로 공격하세요!",
      timestamp: Date.now(),
    });
  }

  private generateOfflineMonsters(): Array<{
    id: string;
    mapId: string;
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    x: number;
    y: number;
  }> {
    // 마을 안전구역: x:220~980, y:180~610 → 그 밖에 배치
    const monsterSpawns: Array<{ monsterId: string; x: number; y: number }> = [
      // 마을 왼쪽 (입문 구역 - 슬라임, 고블린)
      { monsterId: "slime", x: 80, y: 300 },
      { monsterId: "slime", x: 130, y: 460 },
      { monsterId: "goblin_child", x: 160, y: 560 },
      { monsterId: "goblin_child", x: 90, y: 650 },
      // 마을 오른쪽 (중급 구역 - 멧돼지, 거미)
      { monsterId: "wild_boar", x: 1050, y: 260 },
      { monsterId: "wild_boar", x: 1150, y: 420 },
      { monsterId: "poison_spider", x: 1080, y: 580 },
      { monsterId: "poison_spider", x: 1200, y: 340 },
      // 마을 아래 (슬라임, 고블린, 개구리)
      { monsterId: "slime", x: 280, y: 700 },
      { monsterId: "goblin_child", x: 500, y: 730 },
      { monsterId: "bog_frog", x: 700, y: 720 },
      { monsterId: "goblin_child", x: 880, y: 700 },
      // 맵 상단 (스켈레톤, 오크)
      { monsterId: "skeleton_warrior", x: 160, y: 110 },
      { monsterId: "orc_archer", x: 700, y: 100 },
      { monsterId: "skeleton_warrior", x: 1000, y: 120 },
      // 맵 외곽 (강적)
      { monsterId: "kobold_raider", x: 180, y: 820 },
      { monsterId: "bog_frog", x: 600, y: 850 },
      { monsterId: "orc_archer", x: 1100, y: 800 },
    ];

    return monsterSpawns
      .map((spawn, index) => {
        const def = MONSTERS[spawn.monsterId];
        if (!def) return null;
        const uniqueId = `${spawn.monsterId}-offline-${index}`;
        return {
          id: uniqueId,
          mapId: "speakingIsland",
          name: def.name,
          level: def.level,
          hp: def.hp,
          maxHp: def.maxHp,
          x: spawn.x,
          y: spawn.y,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      mapId: string;
      name: string;
      level: number;
      hp: number;
      maxHp: number;
      x: number;
      y: number;
    }>;
  }

  private triggerKillQuiz(monsterId: string) {
    const monsterData = this.offlineMonsterHp.get(monsterId);
    if (!monsterData) return;

    this.pendingOfflineMonsterId = monsterId;

    const vocab = ELEMENTARY_VOCABULARY;
    const questionIndex = Math.floor(Math.random() * vocab.length);
    const questionEntry = vocab[questionIndex];
    const useEnToKr = Math.random() > 0.5;

    const wrongIndices: number[] = [];
    while (wrongIndices.length < 3) {
      const idx = Math.floor(Math.random() * vocab.length);
      if (idx !== questionIndex && !wrongIndices.includes(idx)) {
        wrongIndices.push(idx);
      }
    }

    const correctAnswer = useEnToKr ? questionEntry.kr : questionEntry.en;
    const wrongAnswers = wrongIndices.map((idx) =>
      useEnToKr ? vocab[idx].kr : vocab[idx].en,
    );
    const choices = [correctAnswer, ...wrongAnswers].sort(
      () => Math.random() - 0.5,
    );

    EventBus.emit("quiz_trigger", {
      question: {
        id: `kill-${questionIndex}`,
        type: useEnToKr ? "en_to_kr" : "kr_to_en",
        question: useEnToKr ? questionEntry.en : questionEntry.kr,
        correctAnswer,
        wrongAnswers,
        difficulty: "elementary",
        category: questionEntry.category,
      },
      choices,
      streak: this.offlineStreak,
      monsterId,
      monsterLevel: 1,
    });
  }

  private triggerOfflineQuiz(monsterId: string) {
    const monsterData = this.offlineMonsterHp.get(monsterId);
    if (!monsterData || monsterData.hp <= 0) {
      return;
    }

    this.pendingOfflineMonsterId = monsterId;
    this.stopAutoAttack();

    const vocab = ELEMENTARY_VOCABULARY;
    const questionIndex = Math.floor(Math.random() * vocab.length);
    const questionEntry = vocab[questionIndex];
    const useEnToKr = Math.random() > 0.5;

    const wrongIndices: number[] = [];
    while (wrongIndices.length < 3) {
      const idx = Math.floor(Math.random() * vocab.length);
      if (idx !== questionIndex && !wrongIndices.includes(idx)) {
        wrongIndices.push(idx);
      }
    }

    const correctAnswer = useEnToKr ? questionEntry.kr : questionEntry.en;
    const wrongAnswers = wrongIndices.map((idx) =>
      useEnToKr ? vocab[idx].kr : vocab[idx].en,
    );
    const choices = [correctAnswer, ...wrongAnswers].sort(
      () => Math.random() - 0.5,
    );

    EventBus.emit("quiz_trigger", {
      question: {
        id: `offline-${questionIndex}`,
        type: useEnToKr ? "en_to_kr" : "kr_to_en",
        question: useEnToKr ? questionEntry.en : questionEntry.kr,
        correctAnswer,
        wrongAnswers,
        difficulty: "elementary",
        category: questionEntry.category,
      },
      choices,
      streak: this.offlineStreak,
      monsterId,
      monsterLevel: this.offlineMonsterHp.get(monsterId) ? 1 : 1,
    });
  }

  private handleOfflineQuizResult(payload: {
    status: "correct" | "wrong" | "timeout";
    answer: string;
    reward?: {
      gold: number;
      exp: number;
      items: string[];
      bonusMultiplier: number;
    };
  }) {
    const monsterId = this.pendingOfflineMonsterId;
    if (!monsterId) {
      return;
    }
    this.pendingOfflineMonsterId = null;

    const monsterData = this.offlineMonsterHp.get(monsterId);
    const monsterSprite = this.monsterSprites.get(monsterId);
    if (!monsterData || !monsterSprite) {
      return;
    }

    if (payload.status !== "correct") {
      this.offlineStreak = 0;
      return;
    }

    this.offlineStreak += 1;

    // 킬 퀴즈 (몬스터가 이미 사망): 보너스 보상만 지급
    if (monsterData.hp <= 0) {
      useGameStore.getState().applyOfflineReward({
        gold: Math.floor(
          monsterData.goldMin +
            (monsterData.goldMax - monsterData.goldMin) * 0.5,
        ),
        exp: Math.floor(monsterData.exp * 0.5),
      });
      return;
    }

    // 전투 중 퀴즈 정답 시 보너스 데미지 적용
    const state = useGameStore.getState();
    const bonusDamage = Math.floor(
      (5 + state.getAttackProfile().int) *
        (payload.reward?.bonusMultiplier ?? 1),
    );
    const newHp = Math.max(0, monsterData.hp - bonusDamage);
    this.offlineMonsterHp.set(monsterId, { ...monsterData, hp: newHp });

    if (monsterSprite) {
      this.showDamageNumber(
        monsterSprite.x,
        monsterSprite.y - 20,
        bonusDamage,
        true,
      );
      const bonusUpdatePayload = {
        id: monsterId,
        mapId: this.mapId,
        name: monsterSprite.label.text,
        level: 1,
        hp: newHp,
        maxHp: monsterData.maxHp,
        x: monsterSprite.x,
        y: monsterSprite.y,
      };
      useGameStore.getState().upsertMonster(bonusUpdatePayload);
      EventBus.emit("monster_updated", bonusUpdatePayload);
    }

    // 퀴즈 보너스로 몬스터 사망 시
    if (newHp <= 0) {
      const goldReward =
        monsterData.goldMin +
        Math.floor(
          Math.random() * (monsterData.goldMax - monsterData.goldMin + 1),
        );
      useGameStore.getState().applyOfflineReward({
        gold: goldReward + 10,
        exp: monsterData.exp + 20,
      });

      const killQuest = state.quests.find(
        (q) => q.questId === "mq_001" && q.status === "in_progress",
      );
      if (killQuest) {
        useGameStore
          .getState()
          .updateQuestProgress("mq_001", Math.min(10, killQuest.progress + 1));
      }
      this.offlineStreak = 0;
      this.offlineAttackCount.delete(monsterId);

      this.time.delayedCall(10000, () => {
        const sprite = this.monsterSprites.get(monsterId);
        if (!sprite) return;
        const fullHp = monsterData.maxHp;
        this.offlineMonsterHp.set(monsterId, { ...monsterData, hp: fullHp });
        useGameStore.getState().upsertMonster({
          id: monsterId,
          mapId: this.mapId,
          name: sprite.label.text,
          level: 1,
          hp: fullHp,
          maxHp: fullHp,
          x: sprite.x,
          y: sprite.y,
        });
        sprite.setVisible(true);
        sprite.setAlpha(0);
        this.tweens.add({ targets: sprite, alpha: 1, duration: 400 });
      });
    }

    // 퀘스트 연속 정답 추적
    const streakQuest = state.quests.find((q) => q.questId === "mq_003");
    if (streakQuest?.status === "in_progress") {
      useGameStore
        .getState()
        .updateQuestProgress("mq_003", Math.min(10, streakQuest.progress + 1));
    }
  }

  private registerEvents() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.shutdown, this);

    this.unsubscribe.push(
      EventBus.on("world_init", (payload) => this.handleWorldInit(payload)),
      EventBus.on("player_moved", (payload) => this.upsertPlayer(payload)),
      EventBus.on("player_left", (payload) => this.removePlayer(payload.id)),
      EventBus.on("monster_updated", (payload) => this.upsertMonster(payload)),
      EventBus.on("loot_spawn", (payload) => this.spawnLoot(payload)),
      EventBus.on("loot_picked", (payload) => this.removeLoot(payload.lootId)),
    );
  }

  private attachInput() {
    this.input.mouse?.disableContextMenu();

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const worldPoint = pointer.positionToCamera(
        this.cameras.main,
      ) as Phaser.Math.Vector2;

      if (pointer.rightButtonDown()) {
        this.handleRightClick(worldPoint.x, worldPoint.y);
        return;
      }

      if (
        pointer.leftButtonDown() &&
        !this.findMonsterAt(worldPoint.x, worldPoint.y) &&
        !this.findLootAt(worldPoint.x, worldPoint.y)
      ) {
        this.clearSelection();
      }
    });
  }

  private syncFromStore() {
    const state = useGameStore.getState();

    if (!state.selfId) {
      this.bootstrapOffline();
      return;
    }

    this.selfId = state.selfId;
    this.mapId = state.currentMapId;
    state.worldPlayers.forEach((player) => this.upsertPlayer(player));
    state.worldMonsters.forEach((monster) => this.upsertMonster(monster));
  }

  private handleWorldInit(payload: WorldInitPayload) {
    this.selfId = payload.selfId;
    const selfPlayer = payload.players.find(
      (player) => player.id === payload.selfId,
    );
    this.mapId = selfPlayer?.mapId ?? useGameStore.getState().currentMapId;

    this.playerSprites.forEach((sprite) => sprite.destroy());
    this.monsterSprites.forEach((sprite) => sprite.destroy());
    this.npcSprites.forEach((sprite) => sprite.destroy());
    this.lootSprites.forEach((sprite) => sprite.destroy());
    this.playerSprites.clear();
    this.monsterSprites.clear();
    this.npcSprites.clear();
    this.lootSprites.clear();

    this.drawMap();
    this.spawnStaticNpcs();
    payload.players.forEach((player) => this.upsertPlayer(player));
    payload.monsters.forEach((monster) => this.upsertMonster(monster));
    this.spawnLootFromStore();
  }

  private drawMap() {
    const map = MAPS[this.mapId] ?? MAPS.speakingIsland;
    const mapWidth = map.width * TILE_WIDTH + 320;
    const mapHeight = map.height * TILE_HEIGHT + 260;

    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    this.groundLayer?.removeAll(true);
    this.waterLayer?.removeAll(true);
    this.propLayer?.removeAll(true);
    this.overlayLayer?.removeAll(true);

    const backdrop = this.add.graphics();
    backdrop.fillGradientStyle(0x0e2033, 0x10263b, 0x07121a, 0x050d14, 1);
    backdrop.fillRect(0, 0, mapWidth, mapHeight);
    backdrop
      .fillStyle(0x12283a, 0.65)
      .fillEllipse(
        mapWidth * 0.52,
        mapHeight * 0.18,
        mapWidth * 0.9,
        mapHeight * 0.42,
      );
    backdrop
      .fillStyle(0x0c1d29, 0.55)
      .fillEllipse(
        mapWidth * 0.12,
        mapHeight * 0.78,
        mapWidth * 0.48,
        mapHeight * 0.32,
      );
    this.groundLayer?.add(backdrop);

    for (let y = 0; y < map.height; y += 1) {
      for (let x = 0; x < map.width; x += 1) {
        const worldX = 120 + x * TILE_WIDTH;
        const worldY = 120 + y * TILE_HEIGHT;
        const patch = this.createGroundPatch(x, y, map.id);
        const tile = this.add
          .image(worldX, worldY, patch.texture)
          .setOrigin(0, 0);
        tile.setAlpha(patch.alpha);
        tile.setTint(patch.tint);
        tile.setRotation(patch.rotation);
        tile.setScale(1 + patch.scaleX, 1 + patch.scaleY);
        this.groundLayer?.add(tile);
      }
    }

    this.drawRoads(map.id, mapWidth, mapHeight);
    this.drawWaterBodies(map.id);
    this.scatterProps(map.id, map.width, map.height);
    this.drawTownFence(map.id);
    this.drawAtmosphere(mapWidth, mapHeight);
  }

  private drawRoads(mapId: string, mapWidth: number, mapHeight: number) {
    const road = this.add.graphics();
    road.fillStyle(mapId === "silverKnightTown" ? 0x848d92 : 0x8d7850, 0.9);

    if (mapId === "speakingIsland") {
      road.fillRoundedRect(240, 360, 680, 88, 24);
      road.fillRoundedRect(470, 220, 120, 260, 18);
      road.fillRoundedRect(320, 270, 360, 120, 28);
    } else if (mapId === "silverKnightTown") {
      road.fillRoundedRect(160, 290, 1200, 122, 30);
      road.fillRoundedRect(660, 120, 152, 780, 24);
    } else if (mapId === "giranTown") {
      road.fillRoundedRect(220, 340, mapWidth - 440, 126, 30);
      road.fillRoundedRect(mapWidth * 0.5 - 66, 140, 132, mapHeight - 300, 26);
    } else {
      road.fillRoundedRect(160, 340, mapWidth - 320, 84, 20);
    }

    road.fillStyle(0xf3e0b0, 0.08);
    road.fillRoundedRect(180, 372, Math.max(500, mapWidth * 0.35), 18, 10);
    this.groundLayer?.add(road);
  }

  private drawWaterBodies(mapId: string) {
    if (
      !["speakingIsland", "moonlitWetland", "windwoodForest"].includes(mapId)
    ) {
      return;
    }

    const water = this.add.graphics();
    water.fillStyle(0x2b83aa, 0.18);

    if (mapId === "speakingIsland") {
      water.fillEllipse(1480, 480, 520, 720);
      water.fillEllipse(1420, 920, 380, 300);
    } else if (mapId === "moonlitWetland") {
      water.fillEllipse(1440, 560, 760, 820);
      water.fillEllipse(880, 1120, 520, 360);
    } else {
      water.fillEllipse(1560, 540, 420, 520);
    }

    water.fillStyle(0xa7efff, 0.12);
    water.fillEllipse(1500, 420, 280, 140);
    this.waterLayer?.add(water);

    const shimmer = this.add.graphics();
    shimmer.fillStyle(0xdff8ff, 0.08);

    const puddles =
      mapId === "speakingIsland"
        ? [
            { x: 1500, y: 420, w: 260, h: 120 },
            { x: 1420, y: 980, w: 180, h: 90 },
          ]
        : mapId === "moonlitWetland"
          ? [
              { x: 1440, y: 520, w: 320, h: 140 },
              { x: 920, y: 1140, w: 210, h: 90 },
            ]
          : [{ x: 1560, y: 520, w: 180, h: 90 }];

    puddles.forEach((puddle) => {
      shimmer.fillEllipse(puddle.x, puddle.y, puddle.w, puddle.h);
    });
    this.waterLayer?.add(shimmer);
  }

  private scatterProps(
    mapId: string,
    mapWidthTiles: number,
    mapHeightTiles: number,
  ) {
    const seedOffset = mapId.length * 31;
    const propCount = Math.max(
      24,
      Math.floor((mapWidthTiles * mapHeightTiles) / 90),
    );

    for (let index = 0; index < propCount; index += 1) {
      const nx = this.noise(index * 0.91 + seedOffset, mapWidthTiles * 0.13);
      const ny = this.noise(index * 1.37 + seedOffset, mapHeightTiles * 0.19);
      const x = 180 + nx * (mapWidthTiles * TILE_WIDTH - 220);
      const y = 160 + ny * (mapHeightTiles * TILE_HEIGHT - 220);

      if (mapId === "speakingIsland" && STARTER_TOWN_RECT.contains(x, y)) {
        continue;
      }

      const roll = this.noise(index * 0.47 + seedOffset, 1.7);
      let texture = "prop_tree";
      if (roll < 0.16) texture = "prop_rock";
      else if (roll < 0.24) texture = "prop_ruin";
      else if (roll < 0.29 && mapId !== "speakingIsland")
        texture = "prop_crystal";
      else if (roll < 0.33) texture = "prop_banner";
      const image = this.add.image(x, y, texture).setOrigin(0.5, 0.85);
      const scale =
        texture === "prop_tree"
          ? 0.95 + this.noise(index, 2.3) * 0.35
          : texture === "prop_banner"
            ? 0.78 + this.noise(index, 3.1) * 0.18
            : texture === "prop_crystal"
              ? 0.82 + this.noise(index, 3.7) * 0.22
              : 0.72 + this.noise(index, 4.1) * 0.2;
      image.setScale(scale);
      image.setAlpha(
        texture === "prop_tree"
          ? 0.72
          : texture === "prop_banner"
            ? 0.78
            : 0.58,
      );
      this.propLayer?.add(image);
    }
  }

  private drawTownFence(mapId: string) {
    if (mapId !== "speakingIsland") {
      return;
    }

    const fenceContainer = this.add.container(0, 0);
    const topCount = Math.floor(STARTER_TOWN_RECT.width / 48);
    const sideCount = Math.floor(STARTER_TOWN_RECT.height / 42);

    for (let index = 0; index < topCount; index += 1) {
      const top = this.add
        .image(
          STARTER_TOWN_RECT.x + 24 + index * 48,
          STARTER_TOWN_RECT.y + 2,
          "prop_fence",
        )
        .setOrigin(0.5, 0);
      const bottom = this.add
        .image(
          STARTER_TOWN_RECT.x + 24 + index * 48,
          STARTER_TOWN_RECT.bottom - 10,
          "prop_fence",
        )
        .setOrigin(0.5, 0);
      fenceContainer.add([top, bottom]);

      if (index === 2 || index === topCount - 3) {
        const banner = this.add
          .image(
            STARTER_TOWN_RECT.x + 24 + index * 48,
            STARTER_TOWN_RECT.y + 8,
            "prop_banner",
          )
          .setOrigin(0.5, 0)
          .setScale(0.72)
          .setAlpha(0.82);
        fenceContainer.add(banner);
      }
    }

    for (let index = 0; index < sideCount; index += 1) {
      const left = this.add
        .image(
          STARTER_TOWN_RECT.x + 8,
          STARTER_TOWN_RECT.y + 18 + index * 42,
          "prop_fence",
        )
        .setAngle(90)
        .setScale(0.85);
      const right = this.add
        .image(
          STARTER_TOWN_RECT.right - 10,
          STARTER_TOWN_RECT.y + 18 + index * 42,
          "prop_fence",
        )
        .setAngle(90)
        .setScale(0.85);
      fenceContainer.add([left, right]);
    }

    const gateGlow = this.add.rectangle(
      STARTER_TOWN_RECT.centerX,
      STARTER_TOWN_RECT.bottom - 6,
      180,
      16,
      0xf5de9b,
      0.18,
    );
    fenceContainer.add(gateGlow);

    const markerLeft = this.add
      .image(
        STARTER_TOWN_RECT.x + 44,
        STARTER_TOWN_RECT.bottom - 18,
        "prop_ruin",
      )
      .setOrigin(0.5, 1)
      .setScale(0.8)
      .setAlpha(0.72);
    const markerRight = this.add
      .image(
        STARTER_TOWN_RECT.right - 44,
        STARTER_TOWN_RECT.bottom - 18,
        "prop_ruin",
      )
      .setOrigin(0.5, 1)
      .setScale(0.8)
      .setAlpha(0.72);
    fenceContainer.add([markerLeft, markerRight]);
    this.overlayLayer?.add(fenceContainer);
  }

  private drawAtmosphere(mapWidth: number, mapHeight: number) {
    const haze = this.add.graphics();
    haze.fillStyle(0xffd36e, 0.045);
    haze.fillEllipse(mapWidth * 0.28, mapHeight * 0.18, 620, 240);
    haze.fillStyle(0x86d8ff, 0.035);
    haze.fillEllipse(mapWidth * 0.78, mapHeight * 0.3, 520, 180);
    this.overlayLayer?.add(haze);
  }

  private spawnStaticNpcs() {
    const entries = Object.values(NPCS).filter(
      (npc) => npc.mapId === this.mapId,
    );

    entries.forEach((npc) => {
      const worldPosition = this.getNpcWorldPosition(
        npc.id,
        npc.position.x,
        npc.position.y,
      );
      const textureBase = this.getNpcTexture(npc.role);
      const shadow = this.add.ellipse(0, 10, 44, 18, 0x08131b, 0.35);
      const sprite = this.add.image(
        0,
        0,
        this.getFrameKey(textureBase, "idle", "s", 0),
      );
      sprite.setOrigin(0.5, 0.92);
      sprite.setScale(1.28);

      const label = this.add
        .text(0, -48, npc.name, {
          fontSize: "14px",
          color: "#fff4d5",
          fontFamily: "sans-serif",
          stroke: "#07101a",
          strokeThickness: 4,
        })
        .setOrigin(0.5);

      const ring = this.add
        .ellipse(0, 12, 52, 18, 0x8fe8d3, 0.12)
        .setStrokeStyle(2, 0x8fe8d3, 0.55);
      const hitArea = this.add
        .zone(0, -18, 72, 92)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      const container = this.add.container(worldPosition.x, worldPosition.y, [
        shadow,
        ring,
        sprite,
        label,
        hitArea,
      ]) as NpcSprite;
      container.npcId = npc.id;
      container.spriteBody = sprite;
      container.facing = "s";
      container.animState = "idle";
      container.animFrame = 0;
      container.frameTimer = 0;
      container.lastX = worldPosition.x;
      container.lastY = worldPosition.y;
      container.textureBase = textureBase;

      hitArea.on(
        "pointerdown",
        (
          pointer: Phaser.Input.Pointer,
          _lx: number,
          _ly: number,
          event: Phaser.Types.Input.EventData,
        ) => {
          event.stopPropagation();
          if (pointer.rightButtonDown()) {
            this.moveSelfTo(container.x, container.y - 28);
            return;
          }

          if (pointer.leftButtonDown()) {
            useGameStore.getState().openDialogue({
              npcId: npc.id,
              npcName: npc.name,
              dialogue: npc.dialogue,
            });

            if (npc.shopInventory) {
              const { ui, setActiveShop, toggleShop } = useGameStore.getState();
              setActiveShop(npc.id);
              if (!ui.shopOpen) {
                toggleShop();
              }
            }

            getSocket().emit("npc:interact", { npcId: npc.id });
          }
        },
      );

      this.actorLayer?.add(container);
      this.npcSprites.set(npc.id, container);
    });
  }

  private spawnLootFromStore() {
    this.spawnLoot({ items: useGameStore.getState().droppedLoot });
  }

  private spawnLoot(payload: LootPayload) {
    payload.items.forEach((item) => {
      const existing = this.lootSprites.get(item.lootId);
      if (existing) {
        existing.setPosition(item.x, item.y);
        return;
      }

      const gem = this.add.image(0, 0, "loot_gem").setScale(0.82);
      const glow = this.add.ellipse(0, 6, 26, 12, 0xffdf83, 0.18);
      const label = this.add
        .text(0, -20, item.name, {
          fontSize: "11px",
          color: "#fff0c0",
          stroke: "#07101a",
          strokeThickness: 3,
        })
        .setOrigin(0.5);
      const zone = this.add
        .zone(0, 0, 40, 40)
        .setInteractive({ useHandCursor: true });
      const container = this.add.container(item.x, item.y, [
        glow,
        gem,
        label,
        zone,
      ]) as LootSprite;
      container.lootId = item.lootId;

      this.tweens.add({
        targets: gem,
        y: -4,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });

      zone.on(
        "pointerdown",
        (
          pointer: Phaser.Input.Pointer,
          _lx: number,
          _ly: number,
          event: Phaser.Types.Input.EventData,
        ) => {
          event.stopPropagation();
          if (pointer.rightButtonDown() || pointer.leftButtonDown()) {
            getSocket().emit("loot:pickup", { lootId: item.lootId });
          }
        },
      );

      this.effectLayer?.add(container);
      this.lootSprites.set(item.lootId, container);
    });
  }

  private removeLoot(lootId: string) {
    const sprite = this.lootSprites.get(lootId);
    if (!sprite) {
      return;
    }

    sprite.destroy();
    this.lootSprites.delete(lootId);
  }

  private upsertPlayer(payload: WorldPlayerPayload) {
    const textureBase = this.getPlayerTexture();
    const existing = this.playerSprites.get(payload.id);

    if (existing) {
      existing.label.setText(payload.name);
      existing.textureBase = textureBase;
      if (payload.id === this.selfId) {
        existing.setPosition(payload.x, payload.y);
        this.localPlayer = existing;
        this.followSelf();
      } else {
        this.tweenActor(existing, payload.x, payload.y, 240);
      }
      return;
    }

    const isSelf = payload.id === this.selfId;
    const shadow = this.add.ellipse(0, 10, 44, 18, 0x08131b, 0.32);
    const ring = this.add
      .ellipse(0, 12, 62, 20, isSelf ? 0xffefb2 : 0x89cffd, 0.16)
      .setStrokeStyle(2, isSelf ? 0xffefb2 : 0x89cffd, 0.7);
    const body = this.add
      .image(0, 0, this.getFrameKey(textureBase, "idle", "s", 0))
      .setScale(isSelf ? 1.24 : 1.1)
      .setOrigin(0.5, 0.92);
    const label = this.add
      .text(0, -58, payload.name, {
        fontSize: "14px",
        color: isSelf ? "#fff4ba" : "#f5f5f5",
        stroke: "#07101a",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const container = this.add.container(payload.x, payload.y, [
      shadow,
      ring,
      body,
      label,
    ]) as PlayerSprite;
    container.playerId = payload.id;
    container.label = label;
    container.ring = ring;
    container.spriteBody = body;
    container.facing = "s";
    container.animState = "idle";
    container.animFrame = 0;
    container.frameTimer = 0;
    container.lastX = payload.x;
    container.lastY = payload.y;
    container.textureBase = textureBase;
    container.attackUntil = 0;

    this.actorLayer?.add(container);
    this.playerSprites.set(payload.id, container);

    if (isSelf) {
      this.localPlayer = container;
      this.followSelf();
    }
  }

  private removePlayer(playerId: string) {
    const sprite = this.playerSprites.get(playerId);
    if (!sprite) {
      return;
    }

    if (playerId === this.selfId) {
      this.localPlayer = undefined;
    }

    sprite.destroy();
    this.playerSprites.delete(playerId);
  }

  private upsertMonster(payload: WorldMonsterPayload) {
    const baseId = this.getMonsterBaseId(payload.id);
    const textureBase = this.getMonsterTexture(baseId);
    const existing = this.monsterSprites.get(payload.id);

    if (payload.hp <= 0) {
      if (existing && existing.visible) {
        this.tweens.killTweensOf(existing);
        if (this.selectedMonsterId === payload.id) {
          this.stopAutoAttack();
          this.targetMarker?.setVisible(false);
        }
        this.showDeathEffect(existing.x, existing.y);
        this.tweens.add({
          targets: existing,
          alpha: 0,
          scaleY: 0.08,
          y: existing.y + 16,
          duration: 380,
          ease: "Power2.Out",
          onComplete: () => {
            existing.setVisible(false);
            existing.setAlpha(1);
            existing.setScale(1);
            existing.y -= 16;
          },
        });
      } else if (existing) {
        existing.setVisible(false);
      }
      return;
    }

    if (existing) {
      if (!existing.visible) {
        existing.setPosition(payload.x, payload.y);
        existing.setAlpha(0);
        existing.setVisible(true);
        existing.hpFill.width =
          42 * Phaser.Math.Clamp(payload.hp / Math.max(1, payload.maxHp), 0, 1);
        existing.label.setText(payload.name);
        existing.textureBase = textureBase;
        existing.prevHp = payload.hp;
        this.tweens.add({
          targets: existing,
          alpha: 1,
          duration: 260,
          ease: "Quad.Out",
        });
        return;
      }

      // Hit flash effect when HP decreases
      if (payload.hp < existing.prevHp && payload.hp > 0) {
        this.showHitEffect(existing.x, existing.y);
        this.tweens.add({
          targets: existing.spriteBody,
          alpha: 0.2,
          duration: 55,
          yoyo: true,
          repeat: 1,
          ease: "Linear",
        });
      }
      existing.prevHp = payload.hp;

      existing.setAlpha(1);
      existing.hpFill.width =
        42 * Phaser.Math.Clamp(payload.hp / Math.max(1, payload.maxHp), 0, 1);
      existing.label.setText(payload.name);
      existing.textureBase = textureBase;
      this.tweenActor(existing, payload.x, payload.y, 300);
      return;
    }

    const shadow = this.add.ellipse(0, 10, 48, 18, 0x08131b, 0.32);
    const ring = this.add
      .ellipse(0, 12, 58, 20, 0xf57f69, 0.12)
      .setStrokeStyle(2, 0xff9c88, 0.75);
    const body = this.add
      .image(0, 2, this.getFrameKey(textureBase, "idle", "s", 0))
      .setOrigin(0.5, 0.86)
      .setScale(this.getMonsterScale(baseId));
    const hpBack = this.add
      .rectangle(0, -54, 44, 6, 0x160808, 0.78)
      .setOrigin(0.5);
    const hpFill = this.add
      .rectangle(-21, -54, 42, 4, 0xfb7260, 0.95)
      .setOrigin(0, 0.5);
    const label = this.add
      .text(0, -70, payload.name, {
        fontSize: "13px",
        color: "#ffd9d1",
        stroke: "#07101a",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    const hitArea = this.add
      .zone(0, -14, 94, 88)
      .setInteractive({ useHandCursor: true });

    const container = this.add.container(payload.x, payload.y, [
      shadow,
      ring,
      body,
      hpBack,
      hpFill,
      label,
      hitArea,
    ]) as MonsterSprite;
    container.monsterId = payload.id;
    container.hpFill = hpFill;
    container.hpBack = hpBack;
    container.label = label;
    container.ring = ring;
    container.spriteBody = body;
    container.facing = "s";
    container.animState = "idle";
    container.animFrame = 0;
    container.frameTimer = 0;
    container.lastX = payload.x;
    container.lastY = payload.y;
    container.textureBase = textureBase;
    container.attackUntil = 0;
    container.hitFlash = 0;
    container.prevHp = payload.hp;

    hitArea.on(
      "pointerdown",
      (
        pointer: Phaser.Input.Pointer,
        _lx: number,
        _ly: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
        if (pointer.rightButtonDown()) {
          this.beginAttack(payload.id);
          return;
        }

        if (pointer.leftButtonDown()) {
          this.selectMonster(payload.id);
        }
      },
    );

    this.actorLayer?.add(container);
    this.monsterSprites.set(payload.id, container);
  }

  private handleRightClick(worldX: number, worldY: number) {
    const hitMonster = this.findMonsterAt(worldX, worldY);
    if (hitMonster) {
      this.beginAttack(hitMonster.monsterId);
      return;
    }

    const hitLoot = this.findLootAt(worldX, worldY);
    if (hitLoot) {
      getSocket().emit("loot:pickup", { lootId: hitLoot.lootId });
      return;
    }

    this.moveSelfTo(worldX, worldY);
  }

  private beginAttack(monsterId: string) {
    const monster = this.monsterSprites.get(monsterId);
    if (!monster || !this.localPlayer) {
      return;
    }

    this.selectMonster(monsterId);
    this.startAutoAttack(monsterId);
  }

  private performAttack(monsterId: string) {
    const monster = this.monsterSprites.get(monsterId);
    if (!monster || !this.localPlayer) {
      this.stopAutoAttack();
      return;
    }

    const range = this.isRangedClass() ? RANGED_RANGE : MELEE_RANGE;
    const distance = Phaser.Math.Distance.Between(
      this.localPlayer.x,
      this.localPlayer.y,
      monster.x,
      monster.y,
    );
    if (distance > range) {
      const angle = Phaser.Math.Angle.Between(
        monster.x,
        monster.y,
        this.localPlayer.x,
        this.localPlayer.y,
      );
      const targetX = monster.x + Math.cos(angle) * range * 0.72;
      const targetY = monster.y + Math.sin(angle) * range * 0.72;
      this.moveSelfTo(targetX, targetY, undefined, true);
      return;
    }

    const cooldown = this.getAttackCooldown();
    const now = this.time.now;
    if (now - this.lastAttackAt < cooldown) {
      return;
    }
    this.lastAttackAt = now;
    this.localPlayer.facing = this.resolveDirection(
      monster.x - this.localPlayer.x,
      monster.y - this.localPlayer.y,
      this.localPlayer.facing,
    );
    this.localPlayer.attackUntil = now + 260;

    if (this.isRangedClass()) {
      const startX = this.localPlayer.x + 10;
      const startY = this.localPlayer.y - 28;
      const projectile = this.add
        .image(startX, startY, "projectile_arrow")
        .setOrigin(0.2, 0.5)
        .setScale(1.1);
      projectile.setRotation(
        Phaser.Math.Angle.Between(startX, startY, monster.x, monster.y - 18),
      );
      this.effectLayer?.add(projectile);
      this.tweens.add({
        targets: projectile,
        x: monster.x,
        y: monster.y - 18,
        duration: 200,
        ease: "Power2.In",
        onComplete: () => {
          // Impact flash on arrival
          const hit = this.add.ellipse(
            monster.x,
            monster.y - 18,
            22,
            16,
            0xffe080,
            0.75,
          );
          this.effectLayer?.add(hit);
          this.tweens.add({
            targets: hit,
            alpha: 0,
            scale: 1.6,
            duration: 140,
            onComplete: () => hit.destroy(),
          });
          projectile.destroy();
        },
      });
    } else {
      // Main slash arc
      const slash = this.add
        .arc(monster.x, monster.y - 8, 32, 200, 340, false, 0xfff0b5, 0.32)
        .setStrokeStyle(4, 0xffd97b, 0.95);
      this.effectLayer?.add(slash);
      this.tweens.add({
        targets: slash,
        alpha: 0,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 200,
        ease: "Power2.Out",
        onComplete: () => slash.destroy(),
      });
      // Secondary impact flash
      const impact = this.add.ellipse(
        monster.x,
        monster.y - 12,
        38,
        28,
        0xffffff,
        0.45,
      );
      this.effectLayer?.add(impact);
      this.tweens.add({
        targets: impact,
        alpha: 0,
        scaleX: 1.8,
        scaleY: 1.8,
        duration: 150,
        ease: "Power2.Out",
        onComplete: () => impact.destroy(),
      });
      this.tweens.add({
        targets: this.localPlayer,
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 70,
        yoyo: true,
      });
    }

    const socket = getSocket();
    if (!socket.connected) {
      // 오프라인 직접 데미지 처리
      const monsterData = this.offlineMonsterHp.get(monsterId);
      const monsterSprite = this.monsterSprites.get(monsterId);
      if (!monsterData || monsterData.hp <= 0) return;

      const state = useGameStore.getState();
      const attackProfile = state.getAttackProfile();
      const baseDamage =
        3 + attackProfile.str + Math.floor(attackProfile.dex * 0.5);
      const variance = Math.floor(Math.random() * 4) - 1; // -1 ~ +2
      const damage = Math.max(1, baseDamage + variance);
      const isCrit = Math.random() < 0.12;
      const finalDamage = isCrit ? Math.floor(damage * 1.8) : damage;

      const newHp = Math.max(0, monsterData.hp - finalDamage);
      this.offlineMonsterHp.set(monsterId, { ...monsterData, hp: newHp });

      // 데미지 숫자 표시
      if (monsterSprite) {
        this.showDamageNumber(
          monsterSprite.x,
          monsterSprite.y,
          finalDamage,
          isCrit,
        );
      }

      // 몬스터 HP 바 업데이트 (스토어 + Phaser 씬 동시 반영)
      const monsterUpdatePayload = {
        id: monsterId,
        mapId: this.mapId,
        name: monsterSprite?.label.text ?? "",
        level: 1,
        hp: newHp,
        maxHp: monsterData.maxHp,
        x: monsterSprite?.x ?? 0,
        y: monsterSprite?.y ?? 0,
      };
      useGameStore.getState().upsertMonster(monsterUpdatePayload);
      EventBus.emit("monster_updated", monsterUpdatePayload);

      // 몬스터 사망 처리
      if (newHp <= 0) {
        const goldReward =
          monsterData.goldMin +
          Math.floor(
            Math.random() * (monsterData.goldMax - monsterData.goldMin + 1),
          );
        const expReward = monsterData.exp;
        useGameStore
          .getState()
          .applyOfflineReward({ gold: goldReward, exp: expReward });

        const killQuest = state.quests.find(
          (q) => q.questId === "mq_001" && q.status === "in_progress",
        );
        if (killQuest) {
          useGameStore
            .getState()
            .updateQuestProgress(
              "mq_001",
              Math.min(10, killQuest.progress + 1),
            );
        }
        this.offlineAttackCount.delete(monsterId);
        // 킬 시 영어 퀴즈 트리거
        this.triggerKillQuiz(monsterId);

        // 리스폰
        this.time.delayedCall(10000, () => {
          const sprite = this.monsterSprites.get(monsterId);
          if (!sprite) return;
          const fullHp = monsterData.maxHp;
          this.offlineMonsterHp.set(monsterId, { ...monsterData, hp: fullHp });
          useGameStore.getState().upsertMonster({
            id: monsterId,
            mapId: this.mapId,
            name: sprite.label.text,
            level: 1,
            hp: fullHp,
            maxHp: fullHp,
            x: sprite.x,
            y: sprite.y,
          });
          sprite.setVisible(true);
          sprite.setAlpha(0);
          this.tweens.add({ targets: sprite, alpha: 1, duration: 400 });
        });
        return;
      }

      // 주기적 퀴즈 트리거 (N번마다 1번)
      const attackCount = (this.offlineAttackCount.get(monsterId) ?? 0) + 1;
      this.offlineAttackCount.set(monsterId, attackCount);
      if (attackCount % this.QUIZ_EVERY_N_ATTACKS === 0) {
        this.triggerOfflineQuiz(monsterId);
      }
      return;
    }
    socket.emit("combat:attack", { monsterId });
  }

  private moveSelfTo(
    targetX: number,
    targetY: number,
    onComplete?: () => void,
    preserveSelection = false,
  ) {
    if (!this.localPlayer) {
      return;
    }

    const map = MAPS[this.mapId] ?? MAPS.speakingIsland;
    const maxX = map.width * TILE_WIDTH + 220;
    const maxY = map.height * TILE_HEIGHT + 180;
    const clampedX = Phaser.Math.Clamp(targetX, 110, maxX);
    const clampedY = Phaser.Math.Clamp(targetY, 120, maxY);
    const distance = Phaser.Math.Distance.Between(
      this.localPlayer.x,
      this.localPlayer.y,
      clampedX,
      clampedY,
    );
    const duration = Math.max(260, (distance / MOVE_SPEED) * 1000);

    this.destinationMarker
      ?.setPosition(clampedX, clampedY + 10)
      .setVisible(true);
    if (!preserveSelection) {
      this.selectMonster(null);
    }

    this.tweens.killTweensOf(this.localPlayer);
    this.tweens.add({
      targets: this.localPlayer,
      x: clampedX,
      y: clampedY,
      duration,
      ease: "Sine.Out",
      onUpdate: () => this.followSelf(),
      onComplete: () => {
        this.destinationMarker?.setVisible(false);
        onComplete?.();
      },
    });

    useGameStore.getState().upsertWorldPlayer({
      id: this.selfId ?? "self",
      name: useGameStore.getState().player.name,
      mapId: this.mapId,
      x: clampedX,
      y: clampedY,
    });
    getSocket().emit("player:move", { x: clampedX, y: clampedY });
  }

  private followSelf() {
    if (!this.localPlayer) {
      return;
    }

    this.cameras.main.centerOn(this.localPlayer.x, this.localPlayer.y);
  }

  private tweenActor(
    target: Phaser.GameObjects.Container,
    x: number,
    y: number,
    minimumDuration: number,
  ) {
    const distance = Phaser.Math.Distance.Between(target.x, target.y, x, y);
    const duration = Math.max(minimumDuration, distance * 2.6);
    this.tweens.killTweensOf(target);
    this.tweens.add({
      targets: target,
      x,
      y,
      duration,
      ease: "Sine.Out",
    });
  }

  private selectMonster(monsterId: string | null) {
    this.selectedMonsterId = monsterId;
    if (!monsterId) {
      this.stopAutoAttack();
      this.targetMarker?.setVisible(false);
      return;
    }

    const target = this.monsterSprites.get(monsterId);
    if (!target) {
      this.targetMarker?.setVisible(false);
      return;
    }

    this.targetMarker?.setPosition(target.x, target.y + 20).setVisible(true);
  }

  private clearSelection() {
    this.selectMonster(null);
  }

  private startAutoAttack(monsterId: string) {
    this.stopAutoAttack();
    this.performAttack(monsterId);
    this.autoAttackEvent = this.time.addEvent({
      delay: 120,
      loop: true,
      callback: () => {
        if (this.selectedMonsterId !== monsterId) {
          this.stopAutoAttack();
          return;
        }

        const monster = this.monsterSprites.get(monsterId);
        if (!monster || !monster.visible) {
          this.stopAutoAttack();
          this.targetMarker?.setVisible(false);
          return;
        }

        this.performAttack(monsterId);
      },
    });
  }

  private stopAutoAttack() {
    this.autoAttackEvent?.remove(false);
    this.autoAttackEvent = undefined;
  }

  private updateAnimatedUnits() {
    const now = this.time.now;
    this.playerSprites.forEach((sprite) =>
      this.updateAnimatedActor(sprite, now),
    );
    this.monsterSprites.forEach((sprite) =>
      this.updateAnimatedActor(sprite, now),
    );
    this.npcSprites.forEach((sprite) => this.updateAnimatedNpc(sprite, now));
  }

  private updateAnimatedActor(
    sprite: PlayerSprite | MonsterSprite,
    now: number,
  ) {
    const dx = sprite.x - sprite.lastX;
    const dy = sprite.y - sprite.lastY;
    const moving = Math.abs(dx) + Math.abs(dy) > 0.45;

    if (moving) {
      sprite.facing = this.resolveDirection(dx, dy, sprite.facing);
    }

    const nextState: AnimState =
      sprite.attackUntil > now ? "attack" : moving ? "walk" : "idle";
    const frameInterval =
      nextState === "attack" ? 80 : nextState === "walk" ? 100 : 280;
    const frameCount =
      nextState === "attack"
        ? ATTACK_FRAME_COUNT
        : nextState === "walk"
          ? WALK_FRAME_COUNT
          : IDLE_FRAME_COUNT;

    if (sprite.animState !== nextState) {
      sprite.animState = nextState;
      sprite.animFrame = 0;
      sprite.frameTimer = now;
    } else if (now - sprite.frameTimer >= frameInterval) {
      sprite.animFrame = (sprite.animFrame + 1) % frameCount;
      sprite.frameTimer = now;
    }

    sprite.spriteBody.setTexture(
      this.getFrameKey(
        sprite.textureBase,
        sprite.animState,
        sprite.facing,
        sprite.animFrame,
      ),
    );
    const bob =
      sprite.animState === "walk"
        ? [0, -1.8, -2.8, -0.9][sprite.animFrame % 4]
        : sprite.animState === "attack"
          ? [-1, -3.5, 2, 0][sprite.animFrame % 4]
          : 0;
    sprite.spriteBody.y = bob;
    sprite.lastX = sprite.x;
    sprite.lastY = sprite.y;
  }

  private updateAnimatedNpc(sprite: NpcSprite, now: number) {
    if (now - sprite.frameTimer >= 320) {
      sprite.animFrame = (sprite.animFrame + 1) % IDLE_FRAME_COUNT;
      sprite.frameTimer = now;
      sprite.spriteBody.setTexture(
        this.getFrameKey(
          sprite.textureBase,
          "idle",
          sprite.facing,
          sprite.animFrame,
        ),
      );
      sprite.spriteBody.y = sprite.animFrame === 0 ? 0 : -0.5;
    }
  }

  private sortActorLayer() {
    const layer = this.actorLayer;
    if (!layer) {
      return;
    }

    const sorted = [...layer.list].sort((a, b) => {
      const ay = (a as Phaser.GameObjects.Container).y ?? 0;
      const by = (b as Phaser.GameObjects.Container).y ?? 0;
      return ay - by;
    });
    sorted.forEach((child, index) => {
      (child as Phaser.GameObjects.Container).setDepth(index);
    });
  }

  private findMonsterAt(x: number, y: number): MonsterSprite | null {
    let best: MonsterSprite | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    this.monsterSprites.forEach((monster) => {
      if (!monster.visible) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(
        monster.x,
        monster.y - 12,
        x,
        y,
      );
      if (distance < 68 && distance < bestDistance) {
        best = monster;
        bestDistance = distance;
      }
    });

    return best;
  }

  private findLootAt(x: number, y: number): LootSprite | null {
    let best: LootSprite | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    this.lootSprites.forEach((loot) => {
      const distance = Phaser.Math.Distance.Between(loot.x, loot.y, x, y);
      if (distance < 28 && distance < bestDistance) {
        best = loot;
        bestDistance = distance;
      }
    });

    return best;
  }

  private getPlayerTexture() {
    const className = useGameStore.getState().player.className.toLowerCase();
    if (className.includes("ranger")) return "anim_player_ranger";
    if (className.includes("arcan")) return "anim_player_arcanist";
    if (className.includes("sovereign")) return "anim_player_sovereign";
    return "anim_player_guardian";
  }

  private getNpcTexture(role: string) {
    switch (role) {
      case "weapon":
        return "anim_npc_weapon";
      case "armor":
        return "anim_npc_armor";
      case "magic":
        return "anim_npc_magic";
      case "inn":
        return "anim_npc_inn";
      case "blacksmith":
        return "anim_npc_blacksmith";
      default:
        return "anim_npc_default";
    }
  }

  private getMonsterBaseId(id: string) {
    const parts = id.split("-");
    return parts.length > 1 ? parts.slice(0, -1).join("-") : id;
  }

  private getMonsterTexture(baseId: string) {
    if (baseId.includes("slime")) return "anim_monster_slime";
    if (baseId.includes("skeleton")) return "anim_monster_skeleton";
    if (baseId.includes("bog") || baseId.includes("frog"))
      return "anim_monster_bog";
    if (baseId.includes("spider")) return "anim_monster_spider";
    if (baseId.includes("wolf") || baseId.includes("werewolf"))
      return "anim_monster_wolf";
    if (
      baseId.includes("orc") ||
      baseId.includes("kobold") ||
      baseId.includes("lizard")
    )
      return "anim_monster_orc";
    if (baseId.includes("boar")) return "anim_monster_boar";
    if (baseId.includes("wisp") || baseId.includes("sprite"))
      return "anim_monster_wisp";
    if (
      baseId.includes("dragon") ||
      baseId.includes("wyvern") ||
      baseId.includes("drake")
    )
      return "anim_monster_dragon";
    if (baseId.includes("golem")) return "anim_monster_rock_golem";
    return "anim_monster_slime";
  }

  private getMonsterScale(baseId: string) {
    if (baseId.includes("dragon") || baseId.includes("wyvern")) return 1.22;
    if (baseId.includes("golem")) return 1.08;
    if (baseId.includes("boar") || baseId.includes("orc")) return 1;
    return 0.94;
  }

  private isRangedClass() {
    const state = useGameStore.getState();
    const weaponId = state.equipment.weapon?.id ?? "";
    const arrows =
      state.inventory.find((item) => item.id === "training_arrow")?.quantity ??
      0;
    return weaponId === "hunter_bow" && arrows > 0;
  }

  private getAttackCooldown() {
    const weaponId = useGameStore.getState().equipment.weapon?.id ?? "";
    if (weaponId === "hunter_bow") return 900;
    if (weaponId === "arcana_staff") return 1050;
    return 760;
  }

  private createGroundPatch(x: number, y: number, mapId: string) {
    const seed = this.noise(
      x * 0.31 + mapId.length,
      y * 0.29 + mapId.length * 2,
    );
    const moisture = this.noise(x * 0.11 + 9, y * 0.17 + 17);
    const nearRoad =
      (mapId === "speakingIsland" &&
        ((y >= 5 && y <= 9 && x >= 2 && x <= 13) ||
          (x >= 5 && x <= 7 && y >= 2 && y <= 11))) ||
      Math.abs(y - 5.2) < 1.6;

    if (nearRoad) {
      return {
        texture:
          mapId === "silverKnightTown" || mapId === "giranTown"
            ? "tile_cobble"
            : "tile_path",
        alpha: 0.86,
        tint: 0xffffff,
        rotation: 0,
        scaleX: 0,
        scaleY: 0,
      };
    }

    if (mapId === "moonlitWetland" && moisture > 0.7) {
      return {
        texture: "tile_water",
        alpha: 0.48,
        tint: 0xc9fbff,
        rotation: seed * 0.06,
        scaleX: 0.04,
        scaleY: 0.02,
      };
    }

    if (mapId === "dragonValley") {
      return {
        texture: seed > 0.78 ? "tile_path" : "tile_grass_b",
        alpha: 0.58,
        tint: seed > 0.78 ? 0xa36c4d : 0x45504d,
        rotation: (seed - 0.5) * 0.1,
        scaleX: 0.03,
        scaleY: 0.03,
      };
    }

    return {
      texture: seed > 0.54 ? "tile_grass_a" : "tile_grass_b",
      alpha: 0.54 + moisture * 0.16,
      tint:
        mapId === "silverKnightTown"
          ? 0x84a17f
          : mapId === "windwoodForest"
            ? 0x5f8152
            : mapId === "gludioPlain"
              ? 0x73985f
              : 0xffffff,
      rotation: (seed - 0.5) * 0.08,
      scaleX: moisture * 0.03,
      scaleY: seed * 0.02,
    };
  }

  private noise(x: number, y: number) {
    const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return value - Math.floor(value);
  }

  private getFrameKey(
    base: string,
    state: AnimState,
    direction: DirectionKey,
    frame: number,
  ) {
    return `${base}_${state}_${direction}_${frame}`;
  }

  private resolveDirection(
    dx: number,
    dy: number,
    fallback: DirectionKey,
  ): DirectionKey {
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
      return fallback;
    }

    const angle = Phaser.Math.RadToDeg(Math.atan2(dy, dx));
    if (angle >= -22.5 && angle < 22.5) return "e";
    if (angle >= 22.5 && angle < 67.5) return "se";
    if (angle >= 67.5 && angle < 112.5) return "s";
    if (angle >= 112.5 && angle < 157.5) return "sw";
    if (angle >= 157.5 || angle < -157.5) return "w";
    if (angle >= -157.5 && angle < -112.5) return "nw";
    if (angle >= -112.5 && angle < -67.5) return "n";
    return "ne";
  }

  private getNpcWorldPosition(npcId: string, tileX: number, tileY: number) {
    if (this.mapId === "speakingIsland") {
      const positions: Record<string, { x: number; y: number }> = {
        elder: { x: 520, y: 300 },
        radar: { x: 470, y: 520 },
        eirin: { x: 600, y: 520 },
        garo: { x: 730, y: 520 },
        betty: { x: 820, y: 420 },
      };

      return (
        positions[npcId] ?? {
          x: tileX * TILE_WIDTH + 120,
          y: tileY * TILE_HEIGHT + 120,
        }
      );
    }

    if (this.mapId === "silverKnightTown") {
      const positions: Record<string, { x: number; y: number }> = {
        julie: { x: 720, y: 420 },
        knight_captain: { x: 860, y: 310 },
      };

      return (
        positions[npcId] ?? {
          x: tileX * TILE_WIDTH + 120,
          y: tileY * TILE_HEIGHT + 120,
        }
      );
    }

    return { x: tileX * TILE_WIDTH + 120, y: tileY * TILE_HEIGHT + 120 };
  }

  private updateNpcProximity() {
    if (!this.localPlayer) return;

    let nearestNpc: NpcSprite | null = null;
    let nearestDistance = Infinity;

    this.npcSprites.forEach((npcSprite: NpcSprite) => {
      const distance = Phaser.Math.Distance.Between(
        this.localPlayer!.x,
        this.localPlayer!.y,
        npcSprite.x,
        npcSprite.y,
      );

      if (distance < 80 && distance < nearestDistance) {
        nearestDistance = distance;
        nearestNpc = npcSprite;
      }
    });

    if (nearestNpc && this.nearbyNpcId !== (nearestNpc as NpcSprite).npcId) {
      this.nearbyNpcId = (nearestNpc as NpcSprite).npcId;

      // Show [F] hint above NPC
      if (this.interactionHintSprite) {
        this.interactionHintSprite.destroy();
      }

      this.interactionHintSprite = this.add.container(
        (nearestNpc as NpcSprite).x,
        (nearestNpc as NpcSprite).y - 60,
      );
      const hintText = this.add
        .text(0, 0, "[F]", {
          fontSize: "14px",
          color: "#ffffff",
          fontFamily: "sans-serif",
          backgroundColor: "#000000aa",
          padding: { x: 6, y: 3 },
        })
        .setOrigin(0.5);

      this.interactionHintSprite.add(hintText);
      this.effectLayer?.add(this.interactionHintSprite);
    } else if (!nearestNpc && this.nearbyNpcId) {
      this.nearbyNpcId = null;

      if (this.interactionHintSprite) {
        this.interactionHintSprite.destroy();
        this.interactionHintSprite = undefined;
      }
    }

    // F key listener
    if (!this.input.keyboard) return;

    this.input.keyboard.on("keydown-F", () => {
      if (!this.nearbyNpcId) return;
      const npc = Object.values(NPCS).find((n) => n.id === this.nearbyNpcId);
      if (!npc) return;

      useGameStore.getState().openDialogue({
        npcId: npc.id,
        npcName: npc.name,
        dialogue: npc.dialogue,
      });

      if (npc.shopInventory) {
        const { ui, setActiveShop, toggleShop } = useGameStore.getState();
        setActiveShop(npc.id);
        if (!ui.shopOpen) toggleShop();
      }
    });
  }

  private updateMonsterAI() {
    if (!this.isOfflineMode || !this.localPlayer) return;
    const now = this.time.now;

    this.monsterSprites.forEach((sprite, monsterId) => {
      if (!sprite.visible) return;
      const ai = this.monsterAI.get(monsterId);
      if (!ai) return;

      const distToPlayer = Phaser.Math.Distance.Between(
        sprite.x,
        sprite.y,
        this.localPlayer!.x,
        this.localPlayer!.y,
      );
      const AGGRO_RANGE = 150;
      const ATTACK_RANGE = 45;

      if (distToPlayer < AGGRO_RANGE) {
        ai.state = "chase";
        ai.lastChaseAt = now;
      } else if (ai.state === "chase" && now - ai.lastChaseAt > 3000) {
        ai.state = "idle";
      }

      if (ai.state === "chase") {
        // Don't chase player into village safe zone
        if (
          STARTER_TOWN_RECT.contains(this.localPlayer!.x, this.localPlayer!.y)
        ) {
          ai.state = "idle";
          ai.lastChaseAt = 0;
        } else if (distToPlayer > ATTACK_RANGE) {
          const speed = 50;
          const angle = Phaser.Math.Angle.Between(
            sprite.x,
            sprite.y,
            this.localPlayer!.x,
            this.localPlayer!.y,
          );
          const newX = sprite.x + Math.cos(angle) * speed * (1 / 60);
          const newY = sprite.y + Math.sin(angle) * speed * (1 / 60);
          // Don't enter safe zone
          if (!STARTER_TOWN_RECT.contains(newX, newY)) {
            sprite.setPosition(newX, newY);
          } else {
            ai.state = "idle";
            ai.lastChaseAt = 0;
          }
        }
      } else {
        // Idle wander
        if (now > ai.wanderTimer) {
          ai.wanderTimer = now + 2000 + Math.random() * 3000;
          const wanderRadius = 80;
          ai.wanderTargetX =
            ai.spawnX + (Math.random() - 0.5) * wanderRadius * 2;
          ai.wanderTargetY =
            ai.spawnY + (Math.random() - 0.5) * wanderRadius * 2;
        }
        const distToWander = Phaser.Math.Distance.Between(
          sprite.x,
          sprite.y,
          ai.wanderTargetX,
          ai.wanderTargetY,
        );
        if (distToWander > 5) {
          const speed = 30;
          const angle = Phaser.Math.Angle.Between(
            sprite.x,
            sprite.y,
            ai.wanderTargetX,
            ai.wanderTargetY,
          );
          sprite.setPosition(
            sprite.x + Math.cos(angle) * speed * (1 / 60),
            sprite.y + Math.sin(angle) * speed * (1 / 60),
          );
        }
      }
    });
  }

  private showDamageNumber(
    x: number,
    y: number,
    damage: number,
    isCrit: boolean,
  ) {
    const text = this.add
      .text(x, y - 30, isCrit ? `${damage}!` : String(damage), {
        fontSize: isCrit ? "22px" : "18px",
        color: isCrit ? "#FFD700" : "#FFFFFF",
        fontFamily: "sans-serif",
        stroke: "#07101a",
        strokeThickness: 4,
        fontStyle: isCrit ? "bold" : "normal",
      })
      .setOrigin(0.5)
      .setDepth(9999);

    this.effectLayer?.add(text);
    this.tweens.add({
      targets: text,
      y: y - 80,
      alpha: 0,
      duration: 900,
      ease: "Quad.Out",
      onComplete: () => text.destroy(),
    });
  }

  private showHitEffect(x: number, y: number) {
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2;
      const dist = 14 + Math.random() * 16;
      const spark = this.add
        .ellipse(x, y - 20, 6, 6, i % 2 === 0 ? 0xffffff : 0xffe060, 0.9)
        .setScale(0.6 + Math.random() * 0.6);
      this.effectLayer?.add(spark);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * dist,
        y: y - 20 + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.1,
        duration: 280 + Math.random() * 160,
        ease: "Power2.Out",
        onComplete: () => spark.destroy(),
      });
    }
  }

  private showDeathEffect(x: number, y: number) {
    const flash = this.add.ellipse(x, y - 16, 56, 36, 0xffffff, 0.72);
    this.effectLayer?.add(flash);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2.4,
      scaleY: 2.4,
      duration: 420,
      ease: "Power2.Out",
      onComplete: () => flash.destroy(),
    });
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      const particle = this.add.ellipse(
        x + Math.cos(angle) * 8,
        y - 20 + Math.sin(angle) * 8,
        5,
        5,
        [0xffffff, 0xffe060, 0xff8844][i % 3],
        0.85,
      );
      this.effectLayer?.add(particle);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * (28 + Math.random() * 22),
        y: y - 20 + Math.sin(angle) * (28 + Math.random() * 22),
        alpha: 0,
        scale: 0.15,
        duration: 480 + Math.random() * 220,
        ease: "Power2.Out",
        onComplete: () => particle.destroy(),
      });
    }
  }
}

type DirectionKey = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
type AnimState = "idle" | "walk" | "attack";
