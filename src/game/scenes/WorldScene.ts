import * as Phaser from "phaser";
import { EventBus } from "@/components/game/EventBus";
import { MAPS } from "@/game/data/maps";
import { NPCS } from "@/game/data/npcs";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";
import { GRADE3_VOCABULARY } from "@/data/vocabulary/grade3";
import { GRADE4_VOCABULARY } from "@/data/vocabulary/grade4";
import { GRADE5_VOCABULARY } from "@/data/vocabulary/grade5";
import { GRADE6_VOCABULARY } from "@/data/vocabulary/grade6";
import type { VocabularyEntry } from "@/types/quiz";
import { MONSTERS } from "@/game/data/monsters";
import { ITEMS } from "@/game/data/items";
import { WeaponSubType } from "@/types/item";

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
  auraRing: Phaser.GameObjects.Ellipse;
  glowBody: Phaser.GameObjects.Image;
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
  auraRing: Phaser.GameObjects.Ellipse;
  glowBody: Phaser.GameObjects.Image;
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
  isBoss: boolean;
};

type PlayerSprite = Phaser.GameObjects.Container & {
  playerId: string;
  label: Phaser.GameObjects.Text;
  ring: Phaser.GameObjects.Ellipse;
  auraRing: Phaser.GameObjects.Ellipse;
  glowBody: Phaser.GameObjects.Image;
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

// ── 지형 충돌 존 (이동 불가 영역) ──
type CollisionZone = { x: number; y: number; rx: number; ry: number };
const COLLISION_ZONES: Record<string, CollisionZone[]> = {
  speakingIsland: [
    // 중앙 호수
    { x: 7800, y: 5800, rx: 380, ry: 250 },
    // 서쪽 늪 깊은 곳
    { x: 800, y: 5000, rx: 250, ry: 350 },
    // 남쪽 해안 (바다)
    { x: 5000, y: 10000, rx: 2800, ry: 400 },
    // 북쪽 산맥
    { x: 6600, y: 200, rx: 400, ry: 350 },
    { x: 7500, y: 250, rx: 350, ry: 300 },
    { x: 8700, y: 400, rx: 320, ry: 280 },
    // 동쪽 동굴 내부
    { x: 15000, y: 3000, rx: 150, ry: 100 },
    // 동쪽 연못
    { x: 13000, y: 6800, rx: 140, ry: 90 },
  ],
  silverKnightTown: [
    // 성벽
    { x: 8000, y: 200, rx: 3000, ry: 150 },
  ],
};
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
  private combatEndTimer?: Phaser.Time.TimerEvent;
  private unsubscribe: Array<() => void> = [];

  private groundLayer?: Phaser.GameObjects.Container;
  private propLayer?: Phaser.GameObjects.Container;
  private actorLayer?: Phaser.GameObjects.Container;
  private effectLayer?: Phaser.GameObjects.Container;
  private overlayLayer?: Phaser.GameObjects.Container;
  private waterLayer?: Phaser.GameObjects.Container;
  private weatherLayer?: Phaser.GameObjects.Container;
  private destinationMarker?: Phaser.GameObjects.Ellipse;
  private targetMarker?: Phaser.GameObjects.Ellipse;
  private ambientVeil?: Phaser.GameObjects.Rectangle;
  private ambientBloom?: Phaser.GameObjects.Ellipse;
  private ambientMoon?: Phaser.GameObjects.Ellipse;

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
      lastPlayerAttack?: number;
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
      lastAttackAt: number;
    }
  >();

  // 맵 전환 시스템
  private isTransitioning = false;
  private portalGlows: Phaser.GameObjects.Graphics[] = [];
  private spawnX = 530;
  private spawnY = 400;
  private serverName = "아스카론 01";

  // 소환 시스템
  private summonedAllies: Array<{
    sprite: Phaser.GameObjects.Container & {
      hpFill: Phaser.GameObjects.Rectangle;
      lastX: number;
      lastY: number;
    };
    hp: number;
    maxHp: number;
    atk: number;
    expireAt: number;
    targetId: string | null;
    lastAttackAt: number;
  }> = [];
  private summonHudText?: Phaser.GameObjects.Text;
  private summonHudBg?: Phaser.GameObjects.Graphics;

  // 테이밍 시스템
  private tamedMonsters: Array<{
    sprite: Phaser.GameObjects.Container & {
      hpFill: Phaser.GameObjects.Rectangle;
      lastX: number;
      lastY: number;
    };
    originalMonsterId: string;
    name: string;
    hp: number;
    maxHp: number;
    atk: number;
    expireAt: number;
    targetId: string | null;
    lastAttackAt: number;
  }> = [];
  private tamingHudText?: Phaser.GameObjects.Text;
  private tamingHudBg?: Phaser.GameObjects.Graphics;

  constructor() {
    super("WorldScene");
  }

  create(data?: {
    mapId?: string;
    spawnX?: number;
    spawnY?: number;
    serverName?: string;
  }) {
    if (data?.mapId) {
      this.mapId = data.mapId;
      if (data.spawnX !== undefined) this.spawnX = data.spawnX;
      if (data.spawnY !== undefined) this.spawnY = data.spawnY;
    }
    this.serverName = data?.serverName ?? useGameStore.getState().serverName;

    this.cameras.main.setBackgroundColor("#07101a");
    this.cameras.main.setZoom(0.72);
    this.cameras.main.roundPixels = true;

    this.groundLayer = this.add.container(0, 0);
    this.waterLayer = this.add.container(0, 0);
    this.propLayer = this.add.container(0, 0);
    this.actorLayer = this.add.container(0, 0);
    this.effectLayer = this.add.container(0, 0);
    this.overlayLayer = this.add.container(0, 0);
    this.weatherLayer = this.add.container(0, 0);
    this.createAtmosphere();

    this.destinationMarker = this.add
      .ellipse(0, 0, 30, 18, 0xf6df95, 0.14)
      .setStrokeStyle(2, 0xf6df95, 0.55)
      .setVisible(false);
    this.targetMarker = this.add
      .ellipse(0, 0, 54, 28, 0xf46f57, 0.1)
      .setStrokeStyle(2, 0xf46f57, 0.85)
      .setVisible(false);
    this.effectLayer.add([this.destinationMarker, this.targetMarker]);
    this.showEntranceBanner();

    this.registerEvents();
    this.attachInput();
    this.syncFromStore();
    this.drawMap();
    this.spawnStaticNpcs();
    this.spawnLootFromStore();
    this.drawPortals();
  }

  update() {
    if (!this.localPlayer || !this.targetMarker) {
      return;
    }

    this.cameras.main.centerOn(this.localPlayer.x, this.localPlayer.y);
    this.updateAmbientLighting();
    this.updateAnimatedUnits();
    this.sortActorLayer();
    this.updateNpcProximity();
    this.updateMonsterAI();
    this.updateSummonedAllies();
    this.updateTamedMonsters();
    this.checkPortalTransitions();
    this.checkAutoPickup();

    if (this.targetMarker.visible) {
      const target = this.selectedMonsterId
        ? this.monsterSprites.get(this.selectedMonsterId)
        : null;
      if (target && target.visible) {
        this.targetMarker.setPosition(target.x, target.y + 20);
        const pulse = 0.76 + Math.sin(this.time.now / 120) * 0.18;
        this.targetMarker.setScale(pulse, pulse);
      } else {
        this.targetMarker.setVisible(false);
      }
    }

    if (this.destinationMarker?.visible) {
      const pulse = 0.92 + Math.sin(this.time.now / 140) * 0.08;
      this.destinationMarker.setScale(pulse, pulse);
    }
  }

  private showEntranceBanner() {
    const player = useGameStore.getState().player;
    const map = MAPS[this.mapId] ?? MAPS.speakingIsland;
    const width = this.scale.width;
    const banner = this.add
      .container(width / 2, 94)
      .setDepth(1600)
      .setScrollFactor(0);

    const plate = this.add.graphics();
    plate.fillStyle(0x091019, 0.88);
    plate.fillRoundedRect(-220, -34, 440, 68, 22);
    plate.lineStyle(2, 0xb48a46, 0.42);
    plate.strokeRoundedRect(-220, -34, 440, 68, 22);
    plate.lineStyle(1, 0xffffff, 0.06);
    plate.strokeRoundedRect(-212, -26, 424, 52, 18);
    plate.lineStyle(1, 0xf8d58d, 0.2);
    plate.strokeRoundedRect(-188, -14, 376, 2, 1);
    plate.strokeRoundedRect(-188, 18, 376, 2, 1);
    banner.add(plate);

    const crest = this.add.graphics();
    crest.fillStyle(0xd0ad6e, 0.85);
    crest.fillTriangle(0, -42, -10, -26, 10, -26);
    crest.fillStyle(0x2f2012, 0.95);
    crest.fillCircle(0, -31, 5);
    banner.add(crest);

    banner.add(
      this.add
        .text(0, -12, this.serverName, {
          color: "#b79660",
          fontSize: "11px",
        })
        .setOrigin(0.5),
    );
    banner.add(
      this.add
        .text(
          0,
          10,
          `${player.name} · ${this.formatClassLabel(player.className)} 입장`,
          {
            color: "#f2e4c2",
            fontFamily: "serif",
            fontSize: "22px",
            fontStyle: "bold",
          },
        )
        .setOrigin(0.5),
    );
    banner.add(
      this.add
        .text(0, 26, `${map.name}  LV ${map.level}`, {
          color: "#d8c49f",
          fontSize: "10px",
        })
        .setOrigin(0.5),
    );

    banner.setAlpha(0);
    banner.y -= 16;
    this.tweens.add({
      targets: banner,
      alpha: 1,
      y: banner.y + 16,
      duration: 260,
      ease: "Sine.easeOut",
    });
    this.tweens.add({
      targets: banner,
      alpha: 0,
      y: banner.y - 10,
      duration: 420,
      delay: 2400,
      ease: "Sine.easeIn",
      onComplete: () => banner.destroy(),
    });
  }

  private formatClassLabel(className: string) {
    const normalized = className.toLowerCase();
    if (normalized.includes("guardian")) return "Guardian";
    if (normalized.includes("ranger")) return "Ranger";
    if (normalized.includes("arcan")) return "Arcanist";
    if (normalized.includes("sovereign")) return "Sovereign";
    return className;
  }

  shutdown() {
    this.stopAutoAttack();
    this.clearSummons();
    this.clearTamed();
    this.quizResultUnsubscribe?.();
    this.unsubscribe.forEach((off) => off());
    this.unsubscribe = [];
  }

  private bootstrapOffline() {
    this.isOfflineMode = true;
    const offlineId = `offline-${Date.now()}`;
    const playerName = useGameStore.getState().player.name;

    const startX = this.spawnX;
    const startY = this.spawnY;

    const offlineMonsters = this.generateOfflineMonsters();

    useGameStore.getState().setWorld({
      selfId: offlineId,
      players: [
        {
          id: offlineId,
          name: playerName,
          mapId: this.mapId,
          x: startX,
          y: startY,
        },
      ],
      monsters: offlineMonsters,
    });

    this.selfId = offlineId;

    this.upsertPlayer({
      id: offlineId,
      name: playerName,
      mapId: this.mapId,
      x: startX,
      y: startY,
    });

    offlineMonsters.forEach((monster) => {
      this.offlineMonsterHp.set(monster.id, {
        hp: monster.hp,
        maxHp: monster.maxHp,
        atk: monster.atk,
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
        lastAttackAt: 0,
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
    atk: number;
    x: number;
    y: number;
  }> {
    type SpawnEntry = { monsterId: string; x: number; y: number };

    // ══════════════════════════════════════════════════════════════════════
    // 리니지 클래식 사냥터: 맵당 2-3개 존, 존당 4마리, 존별 단일 몬스터 종류
    // 몬스터 간격 300-400px, 맵 공간 활용으로 자연스러운 사냥터 분리
    // ══════════════════════════════════════════════════════════════════════

    // 이야기의 섬 (speakingIsland) 17600w×10660h — Lv 1-10
    const speakingIsland: SpawnEntry[] = [
      // ── 슬라임 서쪽 늪 (lv1-2) ─ 마을 서남쪽, 완전 초보 사냥터
      { monsterId: "slime", x: 440, y: 3600 },
      { monsterId: "slime", x: 1040, y: 4300 },
      { monsterId: "slime", x: 480, y: 5100 },
      { monsterId: "slime", x: 1080, y: 5900 },
      { monsterId: "slime", x: 760, y: 3900 },
      { monsterId: "slime", x: 340, y: 4800 },
      { monsterId: "slime", x: 900, y: 5500 },
      { monsterId: "slime", x: 1300, y: 4600 },
      // ── 슬라임 남쪽 해안 (lv1-2) ─ 추가 초보 사냥터
      { monsterId: "slime", x: 2200, y: 8400 },
      { monsterId: "slime", x: 3000, y: 8800 },
      { monsterId: "slime", x: 3800, y: 9100 },
      // ── 고블린 야영지 (lv3-5) ─ 중앙 평원
      { monsterId: "goblin_child", x: 4400, y: 2200 },
      { monsterId: "goblin_child", x: 5200, y: 2900 },
      { monsterId: "goblin_child", x: 4400, y: 3800 },
      { monsterId: "goblin_child", x: 5200, y: 4700 },
      { monsterId: "goblin_child", x: 4800, y: 2600 },
      { monsterId: "goblin_child", x: 5600, y: 3400 },
      { monsterId: "goblin_child", x: 4200, y: 4200 },
      { monsterId: "goblin_child", x: 5400, y: 5200 },
      // ── 고블린 북쪽 산기슭 (lv3-5)
      { monsterId: "goblin_child", x: 6800, y: 1400 },
      { monsterId: "goblin_child", x: 7600, y: 1800 },
      { monsterId: "goblin_child", x: 8200, y: 1200 },
      // ── 멧돼지 동쪽 들판 (lv5-7) ─ 마을 반대편 넓은 평원
      { monsterId: "wild_boar", x: 11600, y: 3600 },
      { monsterId: "wild_boar", x: 12500, y: 4400 },
      { monsterId: "wild_boar", x: 11600, y: 5400 },
      { monsterId: "wild_boar", x: 12500, y: 6400 },
      { monsterId: "wild_boar", x: 12000, y: 3000 },
      { monsterId: "wild_boar", x: 13200, y: 3800 },
      { monsterId: "wild_boar", x: 11200, y: 4800 },
      { monsterId: "wild_boar", x: 13000, y: 5600 },
      // ── 멧돼지 남동쪽 숲 (lv5-7)
      { monsterId: "wild_boar", x: 10400, y: 7200 },
      { monsterId: "wild_boar", x: 11200, y: 7800 },
      { monsterId: "wild_boar", x: 10800, y: 8400 },
      // ── 해골 전사 동굴 근처 (lv7-9) ─ 동쪽 동굴 입구
      { monsterId: "skeleton_warrior", x: 14200, y: 2800 },
      { monsterId: "skeleton_warrior", x: 14800, y: 3400 },
      { monsterId: "skeleton_warrior", x: 15400, y: 2600 },
      { monsterId: "skeleton_warrior", x: 15000, y: 4000 },
      { monsterId: "skeleton_warrior", x: 14600, y: 4600 },
      // ── [보스] 고블린 두목 ─ 동쪽 깊은 곳
      { monsterId: "goblin_boss", x: 15000, y: 5600 },
      // ── [보스] 슬라임 킹 ─ 서쪽 늪 깊은 곳
      { monsterId: "slime_boss", x: 600, y: 7400 },
    ];

    // 은기사의 마을 (silverKnightTown) 16160w×9620h — Lv 10-20
    const silverKnightTown: SpawnEntry[] = [
      // ── 해골 북쪽 폐허 (lv7-10) ─ 마을 북단 고위험 지역
      { monsterId: "skeleton_warrior", x: 4800, y: 760 },
      { monsterId: "skeleton_warrior", x: 5800, y: 1200 },
      { monsterId: "skeleton_warrior", x: 7000, y: 760 },
      { monsterId: "skeleton_warrior", x: 8200, y: 1200 },
      // ── 독거미 동쪽 심연 숲 (lv15-17) ─ 마을 동쪽
      { monsterId: "poison_spider", x: 12000, y: 3600 },
      { monsterId: "poison_spider", x: 13000, y: 4400 },
      { monsterId: "poison_spider", x: 12000, y: 5400 },
      { monsterId: "poison_spider", x: 13000, y: 6400 },
      // ── 워울프 남서 깊은 숲 (lv18-20) ─ 고위험 남서 지역
      { monsterId: "werewolf", x: 1800, y: 7000 },
      { monsterId: "werewolf", x: 2700, y: 7800 },
      { monsterId: "werewolf", x: 1800, y: 8700 },
      { monsterId: "werewolf", x: 2700, y: 9400 },
      // ── [보스] 오크 족장 ─ 남동 끝
      { monsterId: "orc_chief", x: 14400, y: 8400 },
    ];

    // 바람숲 (windwoodForest) 20480w×11700h — Lv 15-25
    const windwoodForest: SpawnEntry[] = [
      // ── 독거미 서쪽 입구 (lv17-19) ─ 숲 진입로
      { monsterId: "poison_spider", x: 1200, y: 4000 },
      { monsterId: "poison_spider", x: 2100, y: 4900 },
      { monsterId: "poison_spider", x: 1200, y: 5900 },
      { monsterId: "poison_spider", x: 2100, y: 6900 },
      // ── 워울프 중앙 울창 숲 (lv20-22) ─ 핵심 사냥터
      { monsterId: "werewolf", x: 9000, y: 4000 },
      { monsterId: "werewolf", x: 10000, y: 5000 },
      { monsterId: "werewolf", x: 9000, y: 6200 },
      { monsterId: "werewolf", x: 10000, y: 7400 },
      // ── 포레스트 스프라이트 동쪽 심부 (lv22-25) ─ 고위험
      { monsterId: "forest_sprite", x: 17000, y: 3600 },
      { monsterId: "forest_sprite", x: 18000, y: 4600 },
      { monsterId: "forest_sprite", x: 17000, y: 5800 },
      { monsterId: "forest_sprite", x: 18000, y: 7000 },
      // ── [보스] 석재 골렘 ─ 동쪽 끝 폐허
      { monsterId: "stone_golem", x: 19600, y: 6000 },
    ];

    // 오크 부락지 (orcForest) 19040w×10660h — Lv 18-28
    const orcForest: SpawnEntry[] = [
      // ── 오크 궁수 서쪽 야영지 (lv18-20) ─ 부락 입구
      { monsterId: "orc_archer", x: 1000, y: 2600 },
      { monsterId: "orc_archer", x: 1800, y: 3400 },
      { monsterId: "orc_archer", x: 1000, y: 4400 },
      { monsterId: "orc_archer", x: 1800, y: 5400 },
      // ── 코볼드 중앙 광산 (lv20-22) ─ 부락 중심부
      { monsterId: "kobold_raider", x: 8400, y: 4000 },
      { monsterId: "kobold_raider", x: 9400, y: 5000 },
      { monsterId: "kobold_raider", x: 8400, y: 6200 },
      { monsterId: "kobold_raider", x: 9400, y: 7400 },
      // ── 오크 동쪽 요새 (lv22-25) ─ 부락 심부
      { monsterId: "orc_archer", x: 15000, y: 3000 },
      { monsterId: "orc_archer", x: 15800, y: 4000 },
      { monsterId: "orc_archer", x: 15000, y: 5200 },
      { monsterId: "orc_archer", x: 15800, y: 6400 },
      // ── [보스] 오크 족장 ─ 동쪽 끝 요새
      { monsterId: "orc_chief", x: 18000, y: 8000 },
    ];

    // 글루디오 평원 (gludioPlain) 21920w×12740h — Lv 10-18
    const gludioPlain: SpawnEntry[] = [
      // ── 멧돼지 서북 초원 (lv5-8) ─ 평원 진입 초기 구역
      { monsterId: "wild_boar", x: 1400, y: 1600 },
      { monsterId: "wild_boar", x: 2200, y: 2400 },
      { monsterId: "wild_boar", x: 1400, y: 3400 },
      { monsterId: "wild_boar", x: 2200, y: 4400 },
      // ── 고블린 중앙 캠프 (lv5-8) ─ 평원 중심
      { monsterId: "goblin_child", x: 9600, y: 5600 },
      { monsterId: "goblin_child", x: 10600, y: 6600 },
      { monsterId: "goblin_child", x: 9600, y: 7800 },
      { monsterId: "goblin_child", x: 10600, y: 9000 },
      // ── 도마뱀 동쪽 척후대 (lv14-16) ─ 동쪽 고위험
      { monsterId: "lizard_scout", x: 17600, y: 3000 },
      { monsterId: "lizard_scout", x: 18600, y: 4000 },
      { monsterId: "lizard_scout", x: 17600, y: 5200 },
      { monsterId: "lizard_scout", x: 18600, y: 6400 },
    ];

    // 달안개 습지 (moonlitWetland) 21920w×12740h — Lv 20-28
    const moonlitWetland: SpawnEntry[] = [
      // ── 늪개구리 서쪽 늪 (lv21-23) ─ 습지 입구
      { monsterId: "bog_frog", x: 1200, y: 3600 },
      { monsterId: "bog_frog", x: 2100, y: 4600 },
      { monsterId: "bog_frog", x: 1200, y: 5800 },
      { monsterId: "bog_frog", x: 2100, y: 7000 },
      // ── 독거미 중앙 오염 지대 (lv17-20) ─ 습지 중심
      { monsterId: "poison_spider", x: 10400, y: 4400 },
      { monsterId: "poison_spider", x: 11400, y: 5400 },
      { monsterId: "poison_spider", x: 10400, y: 6600 },
      { monsterId: "poison_spider", x: 11400, y: 7800 },
      // ── 워울프 동쪽 안개 숲 (lv20-25) ─ 고위험
      { monsterId: "werewolf", x: 17600, y: 3600 },
      { monsterId: "werewolf", x: 18600, y: 4600 },
      { monsterId: "werewolf", x: 17600, y: 5800 },
      { monsterId: "werewolf", x: 18600, y: 7000 },
    ];

    // 기란 도시 (giranTown) 19040w×10660h — Lv 30-40
    const giranTown: SpawnEntry[] = [
      // ── 드레이크 북쪽 황무지 (lv35-38) ─ 도시 북단 고위험
      { monsterId: "drake", x: 4000, y: 800 },
      { monsterId: "drake", x: 5000, y: 1500 },
      { monsterId: "drake", x: 4000, y: 2400 },
      { monsterId: "drake", x: 5000, y: 3400 },
      // ── 석재 골렘 동쪽 폐허 (lv24-26) ─ 도시 동쪽 외곽
      { monsterId: "stone_golem", x: 14000, y: 4400 },
      { monsterId: "stone_golem", x: 15000, y: 5400 },
      { monsterId: "stone_golem", x: 14000, y: 6600 },
      { monsterId: "stone_golem", x: 15000, y: 7800 },
    ];

    // 용의 계곡 (dragonValley) 24800w×13780h — Lv 35-50
    const dragonValley: SpawnEntry[] = [
      // ── 드레이크 서쪽 협곡 (lv38-40) ─ 계곡 진입
      { monsterId: "drake", x: 1200, y: 4000 },
      { monsterId: "drake", x: 2200, y: 5200 },
      { monsterId: "drake", x: 1200, y: 6600 },
      { monsterId: "drake", x: 2200, y: 8000 },
      // ── 와이번 중앙 화염지대 (lv42-45) ─ 핵심 고위험 사냥터
      { monsterId: "ash_wyvern", x: 11600, y: 5000 },
      { monsterId: "ash_wyvern", x: 12800, y: 6200 },
      { monsterId: "ash_wyvern", x: 11600, y: 7600 },
      { monsterId: "ash_wyvern", x: 12800, y: 9000 },
      // ── 드레이크 동쪽 잔해지 (lv38-40) ─ 보스 전 구역
      { monsterId: "drake", x: 19600, y: 4400 },
      { monsterId: "drake", x: 20600, y: 5600 },
      { monsterId: "drake", x: 19600, y: 7000 },
      { monsterId: "drake", x: 20600, y: 8400 },
      // ── [보스] 붉은 용 ─ 계곡 최심부 레이드
      { monsterId: "red_dragon", x: 23600, y: 7000 },
    ];

    // ──────────────────────────────────────────────────────────────────────
    // 고대 동굴 (ancientCave) 8240w×4940h — Lv 8-15 던전
    // ──────────────────────────────────────────────────────────────────────
    const ancientCave: SpawnEntry[] = [
      // ── Hall 1 해골 수호자 (lv7-10) ─ 동굴 입구 구역
      { monsterId: "skeleton_warrior", x: 1000, y: 1400 },
      { monsterId: "skeleton_warrior", x: 1800, y: 2200 },
      { monsterId: "skeleton_warrior", x: 1000, y: 3200 },
      // ── Hall 2 해골 심층부 (lv10-13) ─ 동굴 중심부
      { monsterId: "skeleton_warrior", x: 4000, y: 1400 },
      { monsterId: "skeleton_warrior", x: 4800, y: 2200 },
      { monsterId: "skeleton_warrior", x: 4000, y: 3200 },
      // ── [보스] 해골/고블린 보스 ─ 최심부 보스방
      { monsterId: "skeleton_boss", x: 7000, y: 2000 },
      { monsterId: "goblin_boss", x: 7600, y: 2800 },
    ];

    const mapSpawns: Record<string, SpawnEntry[]> = {
      speakingIsland,
      silverKnightTown,
      windwoodForest,
      orcForest,
      gludioPlain,
      moonlitWetland,
      giranTown,
      dragonValley,
      ancientCave,
    };

    const zones = mapSpawns[this.mapId] ?? speakingIsland;

    return zones
      .map((spawn, index) => {
        const def = MONSTERS[spawn.monsterId];
        if (!def) return null;
        return {
          id: `${spawn.monsterId}-offline-${index}`,
          mapId: this.mapId,
          name: def.isBoss ? `[보스] ${def.name}` : def.name,
          level: def.level,
          hp: def.hp,
          maxHp: def.maxHp,
          atk: def.atk,
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
      atk: number;
      x: number;
      y: number;
    }>;
  }

  private triggerKillQuiz(monsterId: string) {
    const monsterData = this.offlineMonsterHp.get(monsterId);
    if (!monsterData) return;

    this.pendingOfflineMonsterId = monsterId;

    const vocab = this.getGradeVocabulary();
    const { entry: questionEntry, index: questionIndex } =
      this.pickQuizWord(vocab);
    const useEnToKr = Math.random() > 0.5;

    const wrongSet = new Set<number>();
    while (wrongSet.size < 3) {
      const idx = Math.floor(Math.random() * vocab.length);
      if (idx !== questionIndex) wrongSet.add(idx);
    }
    const wrongIndices = Array.from(wrongSet);

    const correctAnswer = useEnToKr ? questionEntry.kr : questionEntry.en;
    const wrongAnswers = wrongIndices.map((idx) =>
      useEnToKr ? vocab[idx].kr : vocab[idx].en,
    );
    const choices = [correctAnswer, ...wrongAnswers].sort(
      () => Math.random() - 0.5,
    );

    EventBus.emit("quiz_trigger", {
      question: {
        id: `kill-${questionEntry.en}`,
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

    const vocab = this.getGradeVocabulary();
    const { entry: questionEntry, index: questionIndex } =
      this.pickQuizWord(vocab);
    const useEnToKr = Math.random() > 0.5;

    const wrongSet = new Set<number>();
    while (wrongSet.size < 3) {
      const idx = Math.floor(Math.random() * vocab.length);
      if (idx !== questionIndex) wrongSet.add(idx);
    }
    const wrongIndices = Array.from(wrongSet);

    const correctAnswer = useEnToKr ? questionEntry.kr : questionEntry.en;
    const wrongAnswers = wrongIndices.map((idx) =>
      useEnToKr ? vocab[idx].kr : vocab[idx].en,
    );
    const choices = [correctAnswer, ...wrongAnswers].sort(
      () => Math.random() - 0.5,
    );

    EventBus.emit("quiz_trigger", {
      question: {
        id: `offline-${questionEntry.en}`,
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
      monsterLevel: this.offlineMonsterHp.get(monsterId)?.hp ?? 1,
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
      // 틀린 단어 기록 (나중에 다시 출제)
      if (payload.answer) {
        useGameStore.getState().markWordWrong(payload.answer);
      }
      // 오답이어도 몬스터가 살아있으면 자동공격 재개
      if (monsterData.hp > 0 && this.selectedMonsterId === monsterId) {
        this.startAutoAttack(monsterId);
      }
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
      const mBaseQ = monsterId.split("-offline-")[0];
      const mDefQ = MONSTERS[mBaseQ];
      const droppedItemsQ: string[] = [];
      if (mDefQ?.drops) {
        for (const drop of mDefQ.drops) {
          if (Math.random() < drop.rate) droppedItemsQ.push(drop.itemId);
        }
      }
      // EXP 즉시, 골드+아이템 바닥 드롭
      useGameStore.getState().applyOfflineReward({
        gold: 0,
        exp: monsterData.exp + 20,
      });
      this.spawnGroundLoot(
        monsterSprite.x,
        monsterSprite.y,
        goldReward + 10,
        droppedItemsQ,
      );
      useGameStore.getState().registerKill(mBaseQ, mDefQ?.isBoss ?? false);

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

      // 리스폰 - 원래 스폰 위치로, 몬스터 respawnTime 사용
      const ai = this.monsterAI.get(monsterId);
      const mBase = monsterId.split("-offline-")[0];
      const mDef = MONSTERS[mBase];
      const respawnMs = (mDef?.respawnTime ?? 30) * 1000;
      this.time.delayedCall(respawnMs, () => {
        const sprite = this.monsterSprites.get(monsterId);
        if (!sprite) return;
        const fullHp = monsterData.maxHp;
        const rx = ai?.spawnX ?? sprite.x;
        const ry = ai?.spawnY ?? sprite.y;
        this.offlineMonsterHp.set(monsterId, { ...monsterData, hp: fullHp });
        if (ai) {
          ai.state = "idle";
          ai.lastChaseAt = 0;
        }
        sprite.setPosition(rx, ry);
        sprite.hpFill.width = 50;
        sprite.prevHp = fullHp;
        useGameStore.getState().upsertMonster({
          id: monsterId,
          mapId: this.mapId,
          name: sprite.label.text,
          level: 1,
          hp: fullHp,
          maxHp: fullHp,
          x: rx,
          y: ry,
        });
        sprite.setVisible(true);
        sprite.setAlpha(0);
        this.tweens.add({ targets: sprite, alpha: 1, duration: 600 });
      });
    }

    // 퀘스트 연속 정답 추적
    const streakQuest = state.quests.find((q) => q.questId === "mq_003");
    if (streakQuest?.status === "in_progress") {
      useGameStore
        .getState()
        .updateQuestProgress("mq_003", Math.min(10, streakQuest.progress + 1));
    }

    // 퀴즈 후 자동공격 재개 (몬스터가 아직 살아있을 때)
    if (newHp > 0 && this.selectedMonsterId === monsterId) {
      this.startAutoAttack(monsterId);
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
      EventBus.on("use_summon_stone", (payload: { stoneId: string }) =>
        this.activateSummonStone(payload.stoneId),
      ),
      EventBus.on("attempt_tame", () => this.attemptTaming()),
      EventBus.on("teleport_random", () => this.handleTeleportRandom()),
      EventBus.on("return_to_town", () => this.handleReturnToTown()),
      EventBus.on("chat_bubble", (payload) =>
        this.showChatBubble(payload.playerId, payload.message),
      ),
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
    this.drawPortals();
  }

  private drawMap() {
    const map = MAPS[this.mapId] ?? MAPS.speakingIsland;
    const mapWidth = map.width * TILE_WIDTH + 320;
    const mapHeight = map.height * TILE_HEIGHT + 260;
    const theme = this.getMapVisualTheme(map.id);

    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    this.groundLayer?.removeAll(true);
    this.waterLayer?.removeAll(true);
    this.propLayer?.removeAll(true);
    this.overlayLayer?.removeAll(true);
    this.weatherLayer?.removeAll(true);

    const backdrop = this.add.graphics();
    backdrop.fillGradientStyle(
      theme.skyTop,
      Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(theme.skyTop),
        Phaser.Display.Color.IntegerToColor(theme.skyBottom),
        100,
        32,
      ).color,
      theme.skyBottom,
      Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(theme.skyBottom),
        Phaser.Display.Color.IntegerToColor(theme.ambient),
        100,
        48,
      ).color,
      1,
    );
    backdrop.fillRect(0, 0, mapWidth, mapHeight);
    backdrop
      .fillStyle(theme.hazePrimary, 0.65)
      .fillEllipse(
        mapWidth * 0.52,
        mapHeight * 0.18,
        mapWidth * 0.9,
        mapHeight * 0.42,
      );
    backdrop
      .fillStyle(theme.hazeSecondary, 0.55)
      .fillEllipse(
        mapWidth * 0.12,
        mapHeight * 0.78,
        mapWidth * 0.48,
        mapHeight * 0.32,
      );
    backdrop
      .fillStyle(theme.sunTint, 0.05)
      .fillEllipse(mapWidth * 0.34, mapHeight * 0.12, mapWidth * 0.42, 180);
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

    this.drawTerrainContours(map.id, mapWidth, mapHeight);
    this.drawRoads(map.id, mapWidth, mapHeight);
    this.drawWaterBodies(map.id);
    this.drawMapStructures(map.id, mapWidth, mapHeight);
    this.scatterProps(map.id, map.width, map.height);
    this.drawTownFence(map.id);
    this.drawMapLandmarks(map.id, mapWidth, mapHeight);
    this.drawGroundShade(mapWidth, mapHeight);
    this.drawAtmosphere(mapWidth, mapHeight);
    this.drawWeatherEffects(map.id, mapWidth, mapHeight);
  }

  private getMapVisualTheme(mapId: string) {
    switch (mapId) {
      case "silverKnightTown":
        return {
          skyTop: 0x243547,
          skyBottom: 0x0b141d,
          hazePrimary: 0xaebed0,
          hazeSecondary: 0x46525b,
          sunTint: 0xf4dfae,
          ambient: 0x11181f,
        };
      case "windwoodForest":
        return {
          skyTop: 0x143126,
          skyBottom: 0x07110d,
          hazePrimary: 0x35684d,
          hazeSecondary: 0x0e2419,
          sunTint: 0xcaefa6,
          ambient: 0x08130d,
        };
      case "orcForest":
        return {
          skyTop: 0x2e281d,
          skyBottom: 0x120f0a,
          hazePrimary: 0x66503a,
          hazeSecondary: 0x231912,
          sunTint: 0xe7b06b,
          ambient: 0x110d0a,
        };
      case "gludioPlain":
        return {
          skyTop: 0x30402b,
          skyBottom: 0x0d130c,
          hazePrimary: 0x7aa06a,
          hazeSecondary: 0x31422c,
          sunTint: 0xf4de9a,
          ambient: 0x12170d,
        };
      case "moonlitWetland":
        return {
          skyTop: 0x112330,
          skyBottom: 0x060d12,
          hazePrimary: 0x4c8c86,
          hazeSecondary: 0x18362f,
          sunTint: 0xcff5ff,
          ambient: 0x091011,
        };
      case "giranTown":
        return {
          skyTop: 0x3b2f44,
          skyBottom: 0x100b14,
          hazePrimary: 0x997b65,
          hazeSecondary: 0x2c1c20,
          sunTint: 0xf7ddbd,
          ambient: 0x150f12,
        };
      case "dragonValley":
        return {
          skyTop: 0x2a1513,
          skyBottom: 0x0f0808,
          hazePrimary: 0x964d3f,
          hazeSecondary: 0x2a1411,
          sunTint: 0xffb167,
          ambient: 0x160d0b,
        };
      case "ancientCave":
        return {
          skyTop: 0x2e4060,
          skyBottom: 0x18273a,
          hazePrimary: 0x6a90b8,
          hazeSecondary: 0x2a3f58,
          sunTint: 0xb9d8ff,
          ambient: 0x1c2e42,
        };
      default:
        return {
          skyTop: 0x13263a,
          skyBottom: 0x061019,
          hazePrimary: 0x2c5572,
          hazeSecondary: 0x122433,
          sunTint: 0xf4d693,
          ambient: 0x08121a,
        };
    }
  }

  private drawTerrainContours(
    mapId: string,
    mapWidth: number,
    mapHeight: number,
  ) {
    const contour = this.add.graphics();
    contour.lineStyle(2, 0xffffff, 0.03);

    for (let index = 0; index < 8; index += 1) {
      const y = mapHeight * (0.14 + index * 0.1);
      contour.beginPath();
      contour.moveTo(0, y);
      for (let x = 0; x <= mapWidth; x += 80) {
        const offset =
          Math.sin((x + index * 90) / 180) * 16 +
          Math.cos((x + index * 40) / 120) * 8;
        contour.lineTo(x, y + offset);
      }
      contour.strokePath();
    }

    if (mapId === "dragonValley" || mapId === "ancientCave") {
      contour.fillStyle(0x0b0807, 0.16);
      contour.fillEllipse(
        mapWidth * 0.52,
        mapHeight * 0.48,
        mapWidth * 0.72,
        mapHeight * 0.26,
      );
    }

    this.groundLayer?.add(contour);
  }

  private drawRoads(mapId: string, mapWidth: number, mapHeight: number) {
    const road = this.add.graphics();
    const roadColor =
      mapId === "silverKnightTown" || mapId === "giranTown"
        ? 0x848d92
        : mapId === "dragonValley"
          ? 0x6e5545
          : 0x8d7850;
    road.fillStyle(roadColor, 0.9);

    if (mapId === "speakingIsland") {
      road.fillRoundedRect(240, 360, 680, 88, 24);
      road.fillRoundedRect(470, 220, 120, 260, 18);
      road.fillRoundedRect(320, 270, 360, 120, 28);
      road.fillStyle(0xd7bc86, 0.2);
      road.fillEllipse(520, 330, 220, 110);
      road.fillStyle(0xc7a46d, 0.14);
      road.fillRoundedRect(804, 360, 180, 64, 20);
    } else if (mapId === "silverKnightTown") {
      road.fillRoundedRect(160, 290, 1200, 122, 30);
      road.fillRoundedRect(660, 120, 152, 780, 24);
      road.fillStyle(0xd3d9df, 0.18);
      road.fillEllipse(mapWidth * 0.5, mapHeight * 0.5, 320, 180);
      road.fillStyle(0xc6ccd3, 0.12);
      road.fillRoundedRect(mapWidth * 0.5 - 250, 314, 500, 74, 20);
    } else if (mapId === "giranTown") {
      road.fillRoundedRect(220, 340, mapWidth - 440, 126, 30);
      road.fillRoundedRect(mapWidth * 0.5 - 66, 140, 132, mapHeight - 300, 26);
      road.fillStyle(0xd4c091, 0.16);
      road.fillEllipse(mapWidth * 0.5, 330, 260, 124);
      road.fillRoundedRect(274, 330, 190, 70, 18);
      road.fillRoundedRect(mapWidth - 464, 330, 190, 70, 18);
    } else if (mapId === "windwoodForest") {
      road.fillRoundedRect(210, 344, mapWidth - 420, 82, 22);
      road.fillRoundedRect(mapWidth * 0.5 - 58, 210, 116, 300, 20);
      road.fillStyle(0xb49c71, 0.14);
      road.fillEllipse(mapWidth * 0.5, 314, 180, 96);
    } else if (mapId === "orcForest") {
      road.fillRoundedRect(160, 344, mapWidth - 320, 86, 22);
      road.fillRoundedRect(mapWidth * 0.54 - 48, 264, 96, 220, 18);
      road.fillStyle(0x8d684a, 0.16);
      road.fillEllipse(mapWidth * 0.54, 360, 210, 114);
    } else if (mapId === "gludioPlain") {
      road.fillRoundedRect(170, 346, mapWidth - 340, 84, 22);
      road.fillRoundedRect(mapWidth * 0.5 - 56, 188, 112, 278, 18);
      road.fillStyle(0xd2bc86, 0.15);
      road.fillEllipse(mapWidth * 0.34, 332, 190, 96);
      road.fillEllipse(mapWidth * 0.68, 420, 170, 84);
    } else if (mapId === "moonlitWetland") {
      road.fillRoundedRect(170, 350, mapWidth - 340, 76, 20);
      road.fillRoundedRect(552, 182, 96, 260, 18);
      road.fillStyle(0x8f8a6c, 0.12);
      road.fillEllipse(mapWidth * 0.54, 360, 210, 108);
    } else {
      road.fillRoundedRect(160, 340, mapWidth - 320, 84, 20);
    }

    road.fillStyle(0xf3e0b0, 0.08);
    road.fillRoundedRect(180, 372, Math.max(500, mapWidth * 0.35), 18, 10);
    road.fillStyle(0x2c180d, 0.08);
    road.fillRoundedRect(180, 430, Math.max(500, mapWidth * 0.35), 12, 8);
    road.lineStyle(2, 0xffffff, 0.06);
    road.strokeRoundedRect(190, 366, Math.max(480, mapWidth * 0.34), 34, 14);
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
      // ── 중앙 호수 ──
      water.fillStyle(0x1a5e8a, 0.35);
      water.fillEllipse(7800, 5800, 900, 600);
      water.fillStyle(0x2b83aa, 0.22);
      water.fillEllipse(7800, 5800, 700, 440);
      water.fillStyle(0x4db8d9, 0.12);
      water.fillEllipse(7800, 5700, 400, 240);
      // 호수 물결 효과
      water.lineStyle(1, 0x7ecef0, 0.15);
      water.strokeEllipse(7800, 5800, 600, 360);
      water.strokeEllipse(7800, 5800, 450, 280);

      // ── 서쪽 늪지대 ──
      water.fillStyle(0x2b6b4a, 0.25);
      water.fillEllipse(800, 5000, 600, 800);
      water.fillStyle(0x3a8a5a, 0.15);
      water.fillEllipse(800, 5000, 400, 500);

      // ── 남쪽 해안선 ──
      water.fillStyle(0x1a5e8a, 0.3);
      water.fillEllipse(5000, 9800, 6000, 1200);
      water.fillStyle(0x2b83aa, 0.2);
      water.fillEllipse(5000, 10000, 5400, 800);
      water.fillStyle(0x4db8d9, 0.1);
      water.fillEllipse(5000, 10200, 4800, 500);

      // ── 동쪽 작은 연못 ──
      water.fillStyle(0x2b83aa, 0.28);
      water.fillEllipse(13000, 6800, 340, 220);
      water.fillStyle(0x4db8d9, 0.14);
      water.fillEllipse(13000, 6750, 200, 130);
    } else if (mapId === "moonlitWetland") {
      water.fillEllipse(1440, 560, 760, 820);
      water.fillEllipse(880, 1120, 520, 360);
      water.fillEllipse(780, 360, 180, 110);
      water.fillEllipse(1090, 420, 220, 130);
    } else {
      water.fillEllipse(1560, 540, 420, 520);
    }

    water.fillStyle(0xa7efff, 0.12);
    water.fillEllipse(1500, 420, 280, 140);
    water.lineStyle(3, 0xd3f7ff, 0.08);
    water.strokeEllipse(
      mapId === "moonlitWetland" ? 1440 : 1480,
      mapId === "moonlitWetland" ? 560 : 480,
      mapId === "moonlitWetland" ? 760 : 520,
      mapId === "moonlitWetland" ? 820 : 720,
    );
    this.waterLayer?.add(water);

    const shimmer = this.add.graphics();
    shimmer.fillStyle(0xdff8ff, 0.08);

    const puddles =
      mapId === "speakingIsland"
        ? [
            { x: 1500, y: 420, w: 260, h: 120 },
            { x: 1420, y: 980, w: 180, h: 90 },
            { x: 1180, y: 356, w: 96, h: 34 },
          ]
        : mapId === "moonlitWetland"
          ? [
              { x: 1440, y: 520, w: 320, h: 140 },
              { x: 920, y: 1140, w: 210, h: 90 },
              { x: 780, y: 360, w: 110, h: 48 },
              { x: 1090, y: 420, w: 130, h: 56 },
            ]
          : [{ x: 1560, y: 520, w: 180, h: 90 }];

    puddles.forEach((puddle) => {
      shimmer.fillEllipse(puddle.x, puddle.y, puddle.w, puddle.h);
    });
    this.waterLayer?.add(shimmer);

    const ripples = this.add.graphics();
    ripples.lineStyle(2, 0xd5f7ff, 0.12);
    puddles.forEach((puddle) => {
      ripples.strokeEllipse(
        puddle.x,
        puddle.y,
        puddle.w * 0.72,
        puddle.h * 0.52,
      );
      ripples.strokeEllipse(
        puddle.x + 18,
        puddle.y + 12,
        puddle.w * 0.36,
        puddle.h * 0.22,
      );
    });
    this.waterLayer?.add(ripples);
  }

  private drawMapLandmarks(mapId: string, mapWidth: number, mapHeight: number) {
    const layer = this.overlayLayer;
    if (!layer) {
      return;
    }

    const g = this.add.graphics();

    if (mapId === "silverKnightTown" || mapId === "giranTown") {
      g.fillStyle(0xe7d6b5, 0.08);
      g.fillRoundedRect(
        mapWidth * 0.5 - 150,
        mapHeight * 0.5 - 90,
        300,
        180,
        36,
      );
      g.lineStyle(2, 0xf7ebcd, 0.1);
      g.strokeRoundedRect(
        mapWidth * 0.5 - 150,
        mapHeight * 0.5 - 90,
        300,
        180,
        36,
      );
    }

    if (mapId === "speakingIsland") {
      // ── 마을 광장 ──
      g.fillStyle(0xf2d9a2, 0.08);
      g.fillEllipse(520, 330, 260, 132);
      g.lineStyle(2, 0xf5dfae, 0.1);
      g.strokeEllipse(520, 330, 220, 96);

      // ── 북쪽 산맥 ──
      g.fillStyle(0x6b7b6e, 0.35);
      g.fillTriangle(6000, 600, 7200, 600, 6600, -200); // 큰 산
      g.fillStyle(0x7d8d80, 0.3);
      g.fillTriangle(7000, 600, 8000, 600, 7500, -100); // 중간 산
      g.fillStyle(0x5a6a5d, 0.28);
      g.fillTriangle(8200, 800, 9200, 800, 8700, 100);  // 작은 산
      // 산 눈 덮인 봉우리
      g.fillStyle(0xe8e8e8, 0.2);
      g.fillTriangle(6400, 100, 6800, 100, 6600, -200);
      g.fillTriangle(7300, 200, 7700, 200, 7500, -100);
      // 산 그림자
      g.fillStyle(0x3a4a3d, 0.15);
      g.fillTriangle(6600, 600, 7200, 600, 6900, 200);
      g.fillTriangle(7500, 600, 8000, 600, 7750, 250);

      // ── 동쪽 동굴 ──
      g.fillStyle(0x2a1f1a, 0.45);
      g.fillEllipse(15000, 3000, 600, 400);
      g.fillStyle(0x1a1210, 0.55);
      g.fillEllipse(15000, 3000, 350, 240);
      g.fillStyle(0x0d0a08, 0.65);
      g.fillEllipse(15000, 3000, 180, 120);
      // 동굴 입구 테두리
      g.lineStyle(3, 0x5a4030, 0.4);
      g.strokeEllipse(15000, 3000, 360, 250);
      // 동굴 라벨
      const caveLbl = this.add.text(15000, 2700, "해골 동굴", {
        fontSize: "14px", color: "#c8a878", stroke: "#000", strokeThickness: 3,
      }).setOrigin(0.5);
      layer?.add(caveLbl);

      // ── 서쪽 숲 (짙은 초록) ──
      g.fillStyle(0x1a3a1a, 0.3);
      g.fillEllipse(1600, 4200, 800, 600);
      g.fillStyle(0x2a5a2a, 0.2);
      g.fillEllipse(1600, 4200, 500, 380);

      // ── 남서쪽 늪 표시 ──
      g.fillStyle(0x2a4a30, 0.25);
      g.fillEllipse(800, 5000, 700, 900);
      const swampLbl = this.add.text(800, 4400, "독의 늪", {
        fontSize: "13px", color: "#8ab88a", stroke: "#000", strokeThickness: 3,
      }).setOrigin(0.5);
      layer?.add(swampLbl);

      // ── 동쪽 초원 표시 ──
      const plainLbl = this.add.text(12000, 3200, "멧돼지 들판", {
        fontSize: "13px", color: "#d4c090", stroke: "#000", strokeThickness: 3,
      }).setOrigin(0.5);
      layer?.add(plainLbl);

      // ── 중앙 호수 표시 ──
      const lakeLbl = this.add.text(7800, 5400, "은빛 호수", {
        fontSize: "14px", color: "#88ccee", stroke: "#000", strokeThickness: 3,
      }).setOrigin(0.5);
      layer?.add(lakeLbl);

      // ── 고블린 야영지 표시 ──
      const goblinLbl = this.add.text(4800, 1800, "고블린 야영지", {
        fontSize: "13px", color: "#c89060", stroke: "#000", strokeThickness: 3,
      }).setOrigin(0.5);
      layer?.add(goblinLbl);
    }

    if (mapId === "silverKnightTown") {
      g.fillStyle(0xdfe5ec, 0.08);
      g.fillEllipse(mapWidth * 0.5, 352, 360, 150);
      g.lineStyle(2, 0xf6fbff, 0.1);
      g.strokeEllipse(mapWidth * 0.5, 352, 280, 102);
      g.fillStyle(0xc7d3de, 0.06);
      g.fillRoundedRect(mapWidth * 0.5 - 90, 168, 180, 72, 22);
      g.fillRoundedRect(238, 332, 126, 54, 18);
      g.fillRoundedRect(mapWidth - 364, 332, 126, 54, 18);
    }

    if (mapId === "windwoodForest" || mapId === "moonlitWetland") {
      g.fillStyle(0x0d1613, 0.22);
      g.fillEllipse(mapWidth * 0.68, mapHeight * 0.42, 460, 220);
      g.fillStyle(0xb8ffd3, 0.04);
      g.fillEllipse(mapWidth * 0.68, mapHeight * 0.38, 240, 90);
    }

    if (mapId === "windwoodForest") {
      g.fillStyle(0xbfe6a6, 0.06);
      g.fillEllipse(mapWidth * 0.5, 314, 220, 112);
      g.lineStyle(2, 0xd8f6bc, 0.08);
      g.strokeEllipse(mapWidth * 0.5, 314, 170, 72);
      g.fillStyle(0x153423, 0.18);
      g.fillEllipse(338, 278, 220, 96);
      g.fillEllipse(mapWidth - 338, 278, 220, 96);
    }

    if (mapId === "orcForest") {
      g.fillStyle(0x2d1b11, 0.22);
      g.fillEllipse(mapWidth * 0.54, 360, 260, 132);
      g.lineStyle(2, 0xc18f57, 0.08);
      g.strokeEllipse(mapWidth * 0.54, 360, 206, 88);
      g.fillStyle(0x5e3f27, 0.1);
      g.fillRoundedRect(296, 304, 120, 70, 18);
      g.fillRoundedRect(mapWidth - 416, 404, 140, 74, 18);
    }

    if (mapId === "gludioPlain") {
      g.fillStyle(0xd8c89d, 0.06);
      g.fillEllipse(mapWidth * 0.34, 332, 220, 108);
      g.fillEllipse(mapWidth * 0.68, 420, 210, 98);
      g.lineStyle(2, 0xf0e2b3, 0.08);
      g.strokeEllipse(mapWidth * 0.34, 332, 168, 72);
      g.fillStyle(0xa6b66d, 0.08);
      g.fillRoundedRect(mapWidth * 0.5 - 84, 338, 168, 74, 20);
    }

    if (mapId === "moonlitWetland") {
      g.fillStyle(0x10201d, 0.2);
      g.fillEllipse(mapWidth * 0.54, 360, 260, 120);
      g.fillStyle(0xc4fff2, 0.06);
      g.fillEllipse(780, 360, 160, 84);
      g.fillEllipse(1090, 420, 190, 94);
      g.lineStyle(2, 0xcafef4, 0.08);
      g.strokeEllipse(mapWidth * 0.54, 360, 198, 80);
    }

    if (mapId === "giranTown") {
      g.fillStyle(0xe8d8b1, 0.08);
      g.fillEllipse(mapWidth * 0.5, 330, 300, 140);
      g.lineStyle(2, 0xffefc6, 0.08);
      g.strokeEllipse(mapWidth * 0.5, 330, 226, 90);
      g.fillStyle(0xc09b62, 0.08);
      g.fillRoundedRect(274, 330, 190, 70, 18);
      g.fillRoundedRect(mapWidth - 464, 330, 190, 70, 18);
    }

    if (mapId === "dragonValley") {
      g.fillStyle(0x1b0b08, 0.24);
      g.fillTriangle(
        mapWidth * 0.24,
        180,
        mapWidth * 0.42,
        mapHeight * 0.62,
        mapWidth * 0.07,
        mapHeight * 0.62,
      );
      g.fillTriangle(
        mapWidth * 0.82,
        160,
        mapWidth * 0.96,
        mapHeight * 0.58,
        mapWidth * 0.64,
        mapHeight * 0.58,
      );
      g.fillStyle(0xffa460, 0.08);
      g.fillEllipse(mapWidth * 0.52, mapHeight * 0.34, 200, 70);
      g.fillStyle(0x3b1710, 0.18);
      g.fillEllipse(mapWidth * 0.72, 418, 220, 108);
      g.lineStyle(2, 0xffbf7d, 0.08);
      g.strokeEllipse(mapWidth * 0.72, 418, 168, 70);
    }

    if (mapId === "ancientCave") {
      g.fillStyle(0x1a2d42, 0.1);
      g.fillRoundedRect(120, 120, mapWidth - 240, mapHeight - 240, 48);
      g.lineStyle(2, 0xa8c5df, 0.12);
      g.strokeRoundedRect(140, 140, mapWidth - 280, mapHeight - 280, 40);
      g.fillStyle(0x92dfff, 0.08);
      g.fillEllipse(mapWidth * 0.32, 340, 150, 74);
      g.fillEllipse(mapWidth * 0.68, 340, 150, 74);
      g.fillEllipse(mapWidth * 0.5, 220, 180, 86);
    }

    layer.add(g);
  }

  private drawMapStructures(
    mapId: string,
    mapWidth: number,
    mapHeight: number,
  ) {
    const layer = this.propLayer;
    if (!layer) {
      return;
    }

    const structure = this.add.graphics();

    if (mapId === "speakingIsland") {
      this.drawHouseCluster(structure, 360, 260, 0xa36d44, 0x6f4322, 1);
      this.drawHouseCluster(structure, 650, 290, 0xb78754, 0x7a4f2e, 0.92);
      this.drawHouseCluster(structure, 790, 395, 0x8f6746, 0x684329, 0.84);
      this.drawDock(structure, 1080, 388, 1);
      this.drawLighthouse(structure, 1228, 236, 0.92);
      this.drawMarketStalls(structure, 516, 334, 0.94);
    }

    if (mapId === "silverKnightTown") {
      this.drawKeep(structure, mapWidth * 0.5, 260, 1.08, 0xbec7cf, 0x74818f);
      this.drawWatchTower(structure, 330, 260, 0.96, 0xaab1b6);
      this.drawWatchTower(structure, mapWidth - 330, 260, 0.96, 0xaab1b6);
      this.drawGatehouse(structure, mapWidth * 0.5, 164, 1);
      this.drawFountain(structure, mapWidth * 0.5, 352, 1.04);
      this.drawBarracks(structure, 280, 368, 0.94);
      this.drawBarracks(structure, mapWidth - 280, 368, 0.94);
    }

    if (mapId === "giranTown") {
      this.drawMarketHall(structure, mapWidth * 0.5, 280, 1.08);
      this.drawHouseCluster(structure, 320, 320, 0xb98757, 0x7a4f2d, 0.88);
      this.drawHouseCluster(
        structure,
        mapWidth - 320,
        340,
        0xa86c48,
        0x704125,
        0.88,
      );
      this.drawCaravanCanopy(structure, 350, 362, 0.94);
      this.drawCaravanCanopy(structure, mapWidth - 350, 362, 0.94);
      this.drawFountain(structure, mapWidth * 0.5, 334, 0.92);
    }

    if (mapId === "windwoodForest") {
      this.drawShrine(structure, mapWidth * 0.5, 310, 0x6b8a59, 0xced8b4);
      this.drawForestArch(structure, 332, 286, 0.96);
      this.drawForestArch(structure, mapWidth - 332, 286, 0.96);
      this.drawMoonwell(structure, mapWidth * 0.5, 314, 0.98);
    }

    if (mapId === "orcForest") {
      this.drawTotem(structure, mapWidth * 0.38, 320, 1.06);
      this.drawTotem(structure, mapWidth * 0.7, 420, 0.92);
      this.drawCampfire(structure, mapWidth * 0.54, 360, 1);
      this.drawWarTent(structure, 326, 332, 0.98);
      this.drawWarTent(structure, mapWidth - 326, 430, 0.9);
      this.drawPalisade(structure, mapWidth * 0.54, 360, 1.02);
    }

    if (mapId === "gludioPlain") {
      this.drawFarmstead(structure, mapWidth * 0.34, 330, 1);
      this.drawStoneCircle(structure, mapWidth * 0.68, 420, 1.04);
      this.drawBridge(structure, mapWidth * 0.5, 390, 1);
      this.drawWindmill(structure, 334, 250, 0.94);
      this.drawWagon(structure, mapWidth * 0.5 + 96, 366, 0.92);
    }

    if (mapId === "moonlitWetland") {
      this.drawShrine(structure, mapWidth * 0.54, 360, 0x56706a, 0xc8fff1);
      this.drawRuinedArch(structure, mapWidth * 0.74, mapHeight * 0.55, 1);
      this.drawBogPlatform(structure, 778, 360, 0.96);
      this.drawSunkenBarge(structure, 1090, 424, 0.94);
      this.drawReedCluster(structure, mapWidth * 0.54 - 118, 386, 1);
      this.drawReedCluster(structure, mapWidth * 0.54 + 132, 334, 0.86);
    }

    if (mapId === "dragonValley") {
      this.drawRuinedArch(structure, mapWidth * 0.5, 260, 1.18);
      this.drawLavaForge(structure, mapWidth * 0.72, 420, 1);
      this.drawObsidianSpire(structure, mapWidth * 0.26, 314, 1.02);
      this.drawObsidianSpire(structure, mapWidth * 0.78, 278, 0.9);
      this.drawLavaVent(structure, mapWidth * 0.58, 418, 1);
    }

    if (mapId === "ancientCave") {
      this.drawRuinedArch(structure, mapWidth * 0.5, 220, 1.08);
      this.drawCrystalObelisk(structure, mapWidth * 0.32, 340, 0.86);
      this.drawCrystalObelisk(structure, mapWidth * 0.68, 340, 0.86);
      this.drawCrystalRing(structure, mapWidth * 0.5, 226, 1);
      this.drawCrystalAltar(structure, mapWidth * 0.5, 360, 0.98);
    }

    layer.add(structure);
  }

  private drawHouseCluster(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    wall: number,
    roof: number,
    scale: number,
  ) {
    const w = 110 * scale;
    const h = 64 * scale;
    g.fillStyle(0x070b0f, 0.16);
    g.fillEllipse(x, y + 44 * scale, 120 * scale, 24 * scale);
    g.fillStyle(wall, 0.95);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 16 * scale);
    g.fillStyle(roof, 0.98);
    g.fillTriangle(
      x - w / 2 - 10 * scale,
      y - h / 2 + 10 * scale,
      x,
      y - h / 2 - 34 * scale,
      x + w / 2 + 10 * scale,
      y - h / 2 + 10 * scale,
    );
    g.fillStyle(0xe7d2a2, 0.2);
    g.fillRect(x - 10 * scale, y - 4 * scale, 20 * scale, 28 * scale);
    g.fillStyle(0x59311c, 0.9);
    g.fillRect(x - 9 * scale, y + 2 * scale, 18 * scale, 22 * scale);
    g.fillStyle(0xeed9a9, 0.26);
    g.fillRect(x - 34 * scale, y - 6 * scale, 18 * scale, 14 * scale);
    g.fillRect(x + 16 * scale, y - 6 * scale, 18 * scale, 14 * scale);
  }

  private drawKeep(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
    wall: number,
    roof: number,
  ) {
    const w = 220 * scale;
    const h = 120 * scale;
    g.fillStyle(0x070b0f, 0.2);
    g.fillEllipse(x, y + 74 * scale, 240 * scale, 28 * scale);
    g.fillStyle(wall, 0.94);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 18 * scale);
    g.fillStyle(roof, 0.98);
    g.fillRect(x - w / 2, y - h / 2 - 14 * scale, w, 20 * scale);
    g.fillStyle(roof, 0.95);
    g.fillRect(
      x - w / 2 - 24 * scale,
      y - h / 2 - 2 * scale,
      42 * scale,
      110 * scale,
    );
    g.fillRect(
      x + w / 2 - 18 * scale,
      y - h / 2 - 2 * scale,
      42 * scale,
      110 * scale,
    );
    g.fillStyle(0x5a6470, 0.98);
    g.fillRect(x - 16 * scale, y - 10 * scale, 32 * scale, 50 * scale);
    g.fillStyle(0xeaf3ff, 0.16);
    g.fillRect(x - 64 * scale, y - 16 * scale, 18 * scale, 22 * scale);
    g.fillRect(x + 46 * scale, y - 16 * scale, 18 * scale, 22 * scale);
  }

  private drawWatchTower(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
    wall: number,
  ) {
    g.fillStyle(0x090d12, 0.18);
    g.fillEllipse(x, y + 68 * scale, 90 * scale, 18 * scale);
    g.fillStyle(wall, 0.95);
    g.fillRect(x - 24 * scale, y - 40 * scale, 48 * scale, 108 * scale);
    g.fillStyle(0x687280, 0.98);
    g.fillRect(x - 34 * scale, y - 56 * scale, 68 * scale, 22 * scale);
    g.fillStyle(0xe8f3ff, 0.16);
    g.fillRect(x - 8 * scale, y - 8 * scale, 16 * scale, 24 * scale);
  }

  private drawMarketHall(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x090b0d, 0.2);
    g.fillEllipse(x, y + 62 * scale, 210 * scale, 26 * scale);
    g.fillStyle(0xc49a69, 0.95);
    g.fillRoundedRect(
      x - 100 * scale,
      y - 30 * scale,
      200 * scale,
      82 * scale,
      18 * scale,
    );
    g.fillStyle(0x7a382a, 0.98);
    g.fillTriangle(
      x - 118 * scale,
      y - 14 * scale,
      x,
      y - 74 * scale,
      x + 118 * scale,
      y - 14 * scale,
    );
    g.fillStyle(0xefdbb2, 0.22);
    g.fillRect(x - 68 * scale, y - 4 * scale, 20 * scale, 24 * scale);
    g.fillRect(x - 10 * scale, y - 4 * scale, 20 * scale, 24 * scale);
    g.fillRect(x + 48 * scale, y - 4 * scale, 20 * scale, 24 * scale);
  }

  private drawShrine(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    stone: number,
    glow: number,
  ) {
    g.fillStyle(0x06080a, 0.2);
    g.fillEllipse(x, y + 36, 120, 24);
    g.fillStyle(stone, 0.94);
    g.fillRoundedRect(x - 50, y - 18, 100, 52, 16);
    g.fillStyle(stone, 0.98);
    g.fillTriangle(x - 66, y - 4, x, y - 58, x + 66, y - 4);
    g.fillStyle(glow, 0.18);
    g.fillEllipse(x, y - 8, 24, 42);
    g.fillStyle(0xffffff, 0.1);
    g.fillRect(x - 6, y - 12, 12, 32);
  }

  private drawRuinedArch(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x07090b, 0.22);
    g.fillEllipse(x, y + 52 * scale, 140 * scale, 28 * scale);
    g.fillStyle(0x666a67, 0.94);
    g.fillRect(x - 52 * scale, y - 40 * scale, 22 * scale, 92 * scale);
    g.fillRect(x + 30 * scale, y - 40 * scale, 22 * scale, 92 * scale);
    g.lineStyle(10 * scale, 0x7d817d, 0.96);
    g.beginPath();
    g.arc(x, y - 8 * scale, 48 * scale, Math.PI, Math.PI * 2, false);
    g.strokePath();
  }

  private drawLavaForge(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x080506, 0.22);
    g.fillEllipse(x, y + 40 * scale, 120 * scale, 24 * scale);
    g.fillStyle(0x524847, 0.96);
    g.fillRoundedRect(
      x - 56 * scale,
      y - 12 * scale,
      112 * scale,
      42 * scale,
      12 * scale,
    );
    g.fillStyle(0xff8a41, 0.4);
    g.fillRoundedRect(
      x - 34 * scale,
      y - 2 * scale,
      68 * scale,
      18 * scale,
      8 * scale,
    );
    g.fillStyle(0xffd89a, 0.14);
    g.fillEllipse(x, y + 6 * scale, 54 * scale, 12 * scale);
  }

  private drawCrystalObelisk(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x081016, 0.18);
    g.fillEllipse(x, y + 30 * scale, 72 * scale, 16 * scale);
    g.fillStyle(0x6fe2ff, 0.82);
    g.fillTriangle(
      x,
      y - 42 * scale,
      x + 18 * scale,
      y + 6 * scale,
      x - 18 * scale,
      y + 6 * scale,
    );
    g.fillStyle(0xdfffff, 0.45);
    g.fillTriangle(
      x,
      y - 28 * scale,
      x + 8 * scale,
      y - 2 * scale,
      x - 8 * scale,
      y - 2 * scale,
    );
    g.fillStyle(0x52585e, 0.96);
    g.fillRoundedRect(
      x - 16 * scale,
      y + 6 * scale,
      32 * scale,
      18 * scale,
      6 * scale,
    );
  }

  private drawTotem(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x090708, 0.2);
    g.fillEllipse(x, y + 38 * scale, 90 * scale, 20 * scale);
    g.fillStyle(0x6a4931, 0.96);
    g.fillRect(x - 12 * scale, y - 54 * scale, 24 * scale, 92 * scale);
    g.fillStyle(0x9aa05c, 0.8);
    g.fillEllipse(x, y - 22 * scale, 34 * scale, 24 * scale);
    g.fillStyle(0xffc96d, 0.18);
    g.fillEllipse(x, y - 18 * scale, 12 * scale, 12 * scale);
  }

  private drawCampfire(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x090607, 0.22);
    g.fillEllipse(x, y + 22 * scale, 76 * scale, 18 * scale);
    g.fillStyle(0x6f5140, 0.95);
    g.fillRect(x - 20 * scale, y + 2 * scale, 40 * scale, 6 * scale);
    g.fillRect(x - 6 * scale, y - 10 * scale, 12 * scale, 26 * scale);
    g.fillStyle(0xff8a4a, 0.52);
    g.fillTriangle(
      x,
      y - 28 * scale,
      x + 12 * scale,
      y - 4 * scale,
      x - 12 * scale,
      y - 4 * scale,
    );
    g.fillStyle(0xffde8a, 0.24);
    g.fillEllipse(x, y - 10 * scale, 26 * scale, 18 * scale);
  }

  private drawFarmstead(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    this.drawHouseCluster(g, x, y, 0xbe9a62, 0x835534, scale);
    g.fillStyle(0xb3a164, 0.24);
    g.fillRect(x + 68 * scale, y - 4 * scale, 72 * scale, 36 * scale);
    g.fillStyle(0xd8c788, 0.12);
    g.fillRect(x + 74 * scale, y + 2 * scale, 60 * scale, 24 * scale);
  }

  private drawStoneCircle(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x07090b, 0.18);
    g.fillEllipse(x, y + 26 * scale, 120 * scale, 24 * scale);
    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2;
      const sx = x + Math.cos(angle) * 36 * scale;
      const sy = y + Math.sin(angle) * 14 * scale;
      g.fillStyle(0x78796f, 0.95);
      g.fillRoundedRect(
        sx - 6 * scale,
        sy - 18 * scale,
        12 * scale,
        28 * scale,
        4 * scale,
      );
    }
    g.fillStyle(0xe2efc4, 0.08);
    g.fillEllipse(x, y, 28 * scale, 16 * scale);
  }

  private drawBridge(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x0a0e11, 0.16);
    g.fillEllipse(x, y + 24 * scale, 140 * scale, 20 * scale);
    g.fillStyle(0x7d5c3a, 0.95);
    g.fillRoundedRect(
      x - 58 * scale,
      y - 6 * scale,
      116 * scale,
      16 * scale,
      8 * scale,
    );
    g.fillStyle(0xa47d54, 0.95);
    for (let index = 0; index < 6; index += 1) {
      g.fillRect(
        x - 48 * scale + index * 18 * scale,
        y - 4 * scale,
        10 * scale,
        12 * scale,
      );
    }
  }

  private drawDock(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x090d11, 0.18);
    g.fillEllipse(x, y + 26 * scale, 180 * scale, 24 * scale);
    g.fillStyle(0x805b39, 0.96);
    g.fillRoundedRect(
      x - 72 * scale,
      y - 10 * scale,
      144 * scale,
      18 * scale,
      8 * scale,
    );
    for (let index = 0; index < 4; index += 1) {
      const px = x - 54 * scale + index * 36 * scale;
      g.fillRect(px, y + 8 * scale, 8 * scale, 28 * scale);
    }
    g.fillStyle(0xe9dcc0, 0.22);
    g.fillRect(x - 48 * scale, y - 2 * scale, 22 * scale, 6 * scale);
    g.fillRect(x + 20 * scale, y - 2 * scale, 22 * scale, 6 * scale);
  }

  private drawLighthouse(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x070b0f, 0.18);
    g.fillEllipse(x, y + 64 * scale, 96 * scale, 18 * scale);
    g.fillStyle(0xd8ddd8, 0.96);
    g.fillRoundedRect(
      x - 24 * scale,
      y - 46 * scale,
      48 * scale,
      112 * scale,
      16 * scale,
    );
    g.fillStyle(0xc06743, 0.96);
    g.fillRect(x - 28 * scale, y - 56 * scale, 56 * scale, 18 * scale);
    g.fillStyle(0xffefba, 0.28);
    g.fillEllipse(x, y - 40 * scale, 32 * scale, 20 * scale);
    g.fillStyle(0xfef9da, 0.16);
    g.fillTriangle(
      x + 4 * scale,
      y - 48 * scale,
      x + 68 * scale,
      y - 26 * scale,
      x + 12 * scale,
      y - 12 * scale,
    );
  }

  private drawMarketStalls(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    for (let index = -1; index <= 1; index += 1) {
      const ox = x + index * 52 * scale;
      g.fillStyle(0x0a0c0e, 0.16);
      g.fillEllipse(ox, y + 18 * scale, 48 * scale, 10 * scale);
      g.fillStyle(0x8c623d, 0.95);
      g.fillRoundedRect(
        ox - 18 * scale,
        y - 2 * scale,
        36 * scale,
        18 * scale,
        6 * scale,
      );
      g.fillStyle(index === 0 ? 0xb33d2f : 0xd0b25f, 0.96);
      g.fillTriangle(
        ox - 24 * scale,
        y + 2 * scale,
        ox,
        y - 22 * scale,
        ox + 24 * scale,
        y + 2 * scale,
      );
    }
  }

  private drawGatehouse(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x070b0f, 0.18);
    g.fillEllipse(x, y + 50 * scale, 180 * scale, 22 * scale);
    g.fillStyle(0xaab4bf, 0.96);
    g.fillRoundedRect(
      x - 84 * scale,
      y - 20 * scale,
      168 * scale,
      54 * scale,
      14 * scale,
    );
    g.fillRect(x - 108 * scale, y - 8 * scale, 28 * scale, 72 * scale);
    g.fillRect(x + 80 * scale, y - 8 * scale, 28 * scale, 72 * scale);
    g.fillStyle(0x5d6875, 0.96);
    g.fillRect(x - 24 * scale, y + 2 * scale, 48 * scale, 32 * scale);
    g.fillStyle(0xeaf3ff, 0.18);
    g.fillRect(x - 54 * scale, y - 8 * scale, 16 * scale, 14 * scale);
    g.fillRect(x + 38 * scale, y - 8 * scale, 16 * scale, 14 * scale);
  }

  private drawFountain(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x0b1014, 0.18);
    g.fillEllipse(x, y + 26 * scale, 140 * scale, 22 * scale);
    g.fillStyle(0x98a7b6, 0.96);
    g.fillEllipse(x, y, 112 * scale, 44 * scale);
    g.fillStyle(0x5fcfff, 0.24);
    g.fillEllipse(x, y - 2 * scale, 82 * scale, 26 * scale);
    g.fillStyle(0xcad7e3, 0.98);
    g.fillRect(x - 10 * scale, y - 34 * scale, 20 * scale, 28 * scale);
    g.fillStyle(0xe8fbff, 0.3);
    g.fillEllipse(x, y - 22 * scale, 26 * scale, 18 * scale);
  }

  private drawBarracks(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x080b0f, 0.18);
    g.fillEllipse(x, y + 38 * scale, 132 * scale, 20 * scale);
    g.fillStyle(0xadb6bd, 0.95);
    g.fillRoundedRect(
      x - 58 * scale,
      y - 22 * scale,
      116 * scale,
      54 * scale,
      12 * scale,
    );
    g.fillStyle(0x6d7885, 0.98);
    g.fillTriangle(
      x - 72 * scale,
      y - 6 * scale,
      x,
      y - 46 * scale,
      x + 72 * scale,
      y - 6 * scale,
    );
    g.fillStyle(0xe7f2ff, 0.16);
    g.fillRect(x - 34 * scale, y - 4 * scale, 18 * scale, 14 * scale);
    g.fillRect(x + 16 * scale, y - 4 * scale, 18 * scale, 14 * scale);
    g.fillStyle(0xb48a46, 0.22);
    g.fillRect(x - 4 * scale, y - 18 * scale, 8 * scale, 16 * scale);
  }

  private drawForestArch(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x060909, 0.18);
    g.fillEllipse(x, y + 30 * scale, 110 * scale, 18 * scale);
    g.fillStyle(0x456445, 0.92);
    g.fillRect(x - 36 * scale, y - 8 * scale, 12 * scale, 46 * scale);
    g.fillRect(x + 24 * scale, y - 8 * scale, 12 * scale, 46 * scale);
    g.lineStyle(10 * scale, 0x5d8a61, 0.94);
    g.beginPath();
    g.arc(x, y - 4 * scale, 36 * scale, Math.PI, Math.PI * 2, false);
    g.strokePath();
    g.fillStyle(0xc9f8a4, 0.14);
    g.fillEllipse(x, y - 6 * scale, 30 * scale, 16 * scale);
  }

  private drawMoonwell(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x081113, 0.16);
    g.fillEllipse(x, y + 22 * scale, 128 * scale, 18 * scale);
    g.fillStyle(0x6b7c77, 0.96);
    g.fillEllipse(x, y, 108 * scale, 36 * scale);
    g.fillStyle(0x92ffe0, 0.22);
    g.fillEllipse(x, y - 2 * scale, 74 * scale, 18 * scale);
    g.fillStyle(0xe7fff8, 0.16);
    g.fillEllipse(x, y - 4 * scale, 28 * scale, 8 * scale);
  }

  private drawWarTent(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x090607, 0.18);
    g.fillEllipse(x, y + 28 * scale, 116 * scale, 18 * scale);
    g.fillStyle(0x6f4c36, 0.95);
    g.fillTriangle(
      x - 62 * scale,
      y + 16 * scale,
      x,
      y - 34 * scale,
      x + 62 * scale,
      y + 16 * scale,
    );
    g.fillStyle(0x3b2417, 0.96);
    g.fillRect(x - 12 * scale, y - 2 * scale, 24 * scale, 20 * scale);
    g.fillStyle(0xc6774a, 0.2);
    g.fillTriangle(
      x - 30 * scale,
      y + 8 * scale,
      x,
      y - 16 * scale,
      x + 30 * scale,
      y + 8 * scale,
    );
  }

  private drawPalisade(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x090707, 0.16);
    g.fillEllipse(x, y + 36 * scale, 220 * scale, 20 * scale);
    g.fillStyle(0x64432c, 0.95);
    for (let index = 0; index < 8; index += 1) {
      const px = x - 84 * scale + index * 24 * scale;
      g.fillTriangle(
        px - 7 * scale,
        y + 12 * scale,
        px,
        y - 26 * scale,
        px + 7 * scale,
        y + 12 * scale,
      );
    }
    g.fillStyle(0x7d5638, 0.95);
    g.fillRect(x - 90 * scale, y + 8 * scale, 180 * scale, 8 * scale);
  }

  private drawWindmill(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x090c0f, 0.16);
    g.fillEllipse(x, y + 48 * scale, 110 * scale, 18 * scale);
    g.fillStyle(0xc8bfac, 0.96);
    g.fillRoundedRect(
      x - 28 * scale,
      y - 34 * scale,
      56 * scale,
      82 * scale,
      16 * scale,
    );
    g.fillStyle(0x916848, 0.96);
    g.fillTriangle(
      x - 40 * scale,
      y - 18 * scale,
      x,
      y - 60 * scale,
      x + 40 * scale,
      y - 18 * scale,
    );
    g.lineStyle(4 * scale, 0xead9b4, 0.9);
    g.lineBetween(x, y - 8 * scale, x + 36 * scale, y - 32 * scale);
    g.lineBetween(x, y - 8 * scale, x - 36 * scale, y - 32 * scale);
    g.lineBetween(x, y - 8 * scale, x + 24 * scale, y + 24 * scale);
    g.lineBetween(x, y - 8 * scale, x - 24 * scale, y + 24 * scale);
  }

  private drawWagon(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x080a0c, 0.16);
    g.fillEllipse(x, y + 24 * scale, 100 * scale, 16 * scale);
    g.fillStyle(0x8a623c, 0.95);
    g.fillRoundedRect(
      x - 36 * scale,
      y - 10 * scale,
      72 * scale,
      22 * scale,
      8 * scale,
    );
    g.fillStyle(0x604527, 0.95);
    g.fillCircle(x - 22 * scale, y + 18 * scale, 11 * scale);
    g.fillCircle(x + 22 * scale, y + 18 * scale, 11 * scale);
    g.fillStyle(0xd3be8b, 0.2);
    g.fillRect(x - 18 * scale, y - 2 * scale, 36 * scale, 8 * scale);
  }

  private drawBogPlatform(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x071012, 0.18);
    g.fillEllipse(x, y + 24 * scale, 126 * scale, 18 * scale);
    g.fillStyle(0x6d5d47, 0.94);
    g.fillRoundedRect(
      x - 54 * scale,
      y - 8 * scale,
      108 * scale,
      14 * scale,
      6 * scale,
    );
    for (let index = 0; index < 4; index += 1) {
      const px = x - 40 * scale + index * 26 * scale;
      g.fillRect(px, y + 6 * scale, 8 * scale, 18 * scale);
    }
    g.fillStyle(0xbef7ea, 0.18);
    g.fillEllipse(x, y - 2 * scale, 36 * scale, 10 * scale);
  }

  private drawSunkenBarge(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x070b0d, 0.18);
    g.fillEllipse(x, y + 24 * scale, 132 * scale, 18 * scale);
    g.fillStyle(0x4c3a2e, 0.9);
    g.fillEllipse(x, y, 110 * scale, 28 * scale);
    g.fillStyle(0x2b1e18, 0.95);
    g.fillRect(x - 6 * scale, y - 34 * scale, 12 * scale, 34 * scale);
    g.fillStyle(0xb4fff2, 0.14);
    g.fillTriangle(
      x + 4 * scale,
      y - 30 * scale,
      x + 38 * scale,
      y - 18 * scale,
      x + 8 * scale,
      y - 8 * scale,
    );
  }

  private drawReedCluster(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x243826, 0.92);
    for (let index = 0; index < 5; index += 1) {
      const px = x + (index - 2) * 8 * scale;
      g.fillTriangle(
        px - 3 * scale,
        y + 12 * scale,
        px,
        y - 22 * scale,
        px + 3 * scale,
        y + 12 * scale,
      );
    }
    g.fillStyle(0xc7f6d8, 0.08);
    g.fillEllipse(x, y - 4 * scale, 26 * scale, 10 * scale);
  }

  private drawCaravanCanopy(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x0a0c0e, 0.16);
    g.fillEllipse(x, y + 18 * scale, 92 * scale, 14 * scale);
    g.fillStyle(0x9a6b42, 0.95);
    g.fillRoundedRect(
      x - 34 * scale,
      y - 4 * scale,
      68 * scale,
      18 * scale,
      6 * scale,
    );
    g.fillStyle(0xcfb462, 0.96);
    g.fillTriangle(
      x - 44 * scale,
      y + 4 * scale,
      x,
      y - 28 * scale,
      x + 44 * scale,
      y + 4 * scale,
    );
    g.fillStyle(0xead9a1, 0.18);
    g.fillRect(x - 16 * scale, y - 2 * scale, 32 * scale, 7 * scale);
  }

  private drawObsidianSpire(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x060506, 0.18);
    g.fillEllipse(x, y + 28 * scale, 96 * scale, 16 * scale);
    g.fillStyle(0x2a2024, 0.96);
    g.fillTriangle(
      x,
      y - 54 * scale,
      x + 22 * scale,
      y + 10 * scale,
      x - 22 * scale,
      y + 10 * scale,
    );
    g.fillStyle(0xff9a56, 0.16);
    g.fillTriangle(
      x,
      y - 20 * scale,
      x + 8 * scale,
      y + 2 * scale,
      x - 8 * scale,
      y + 2 * scale,
    );
  }

  private drawLavaVent(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x090505, 0.18);
    g.fillEllipse(x, y + 18 * scale, 84 * scale, 14 * scale);
    g.fillStyle(0x5a433a, 0.94);
    g.fillEllipse(x, y, 64 * scale, 20 * scale);
    g.fillStyle(0xff8a3c, 0.4);
    g.fillEllipse(x, y - 2 * scale, 36 * scale, 10 * scale);
    g.fillStyle(0xffd6a0, 0.14);
    g.fillEllipse(x, y - 10 * scale, 18 * scale, 20 * scale);
  }

  private drawCrystalRing(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.lineStyle(6 * scale, 0x7fdfff, 0.6);
    g.strokeEllipse(x, y, 126 * scale, 54 * scale);
    g.fillStyle(0xe8ffff, 0.14);
    g.fillEllipse(x, y, 52 * scale, 16 * scale);
  }

  private drawCrystalAltar(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
  ) {
    g.fillStyle(0x081118, 0.18);
    g.fillEllipse(x, y + 22 * scale, 126 * scale, 18 * scale);
    g.fillStyle(0x57636e, 0.95);
    g.fillRoundedRect(
      x - 48 * scale,
      y - 8 * scale,
      96 * scale,
      22 * scale,
      8 * scale,
    );
    g.fillStyle(0x95eeff, 0.2);
    g.fillTriangle(
      x,
      y - 34 * scale,
      x + 16 * scale,
      y - 2 * scale,
      x - 16 * scale,
      y - 2 * scale,
    );
    g.fillStyle(0xe8ffff, 0.16);
    g.fillEllipse(x, y - 6 * scale, 26 * scale, 8 * scale);
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
      if (mapId === "dragonValley" || mapId === "ancientCave") {
        if (roll < 0.34) texture = "prop_rock";
        else if (roll < 0.48) texture = "prop_ruin";
        else if (roll < 0.56) texture = "prop_crystal";
        else if (roll < 0.62) texture = "prop_banner";
      } else if (mapId === "silverKnightTown" || mapId === "giranTown") {
        if (roll < 0.18) texture = "prop_rock";
        else if (roll < 0.36) texture = "prop_banner";
        else if (roll < 0.48) texture = "prop_fence";
        else if (roll < 0.56) texture = "prop_ruin";
      } else {
        if (roll < 0.16) texture = "prop_rock";
        else if (roll < 0.24) texture = "prop_ruin";
        else if (roll < 0.28 && mapId !== "speakingIsland")
          texture = "prop_crystal";
        else if (roll < 0.32) texture = "prop_banner";
        else if (roll < 0.34) texture = "prop_fence";
      }
      const image = this.add.image(x, y, texture).setOrigin(0.5, 0.85);
      const propShadow = this.add
        .ellipse(
          x + 2,
          y + 10,
          texture === "prop_tree" ? 38 : 24,
          texture === "prop_tree" ? 12 : 8,
          0x050709,
          0.14,
        )
        .setScale(0.9 + this.noise(index, 5.1) * 0.2);
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
      this.propLayer?.add(propShadow);
      this.propLayer?.add(image);
    }

    // 특수 지형지물 고정 배치
    if (mapId === "speakingIsland") {
      // 동굴 입구 (북쪽 해골 구역)
      const cave1 = this.add.graphics();
      cave1.fillStyle(0x1a0d00, 0.9);
      cave1.fillEllipse(2800, 155, 80, 50);
      cave1.lineStyle(3, 0x5a3a10, 0.8);
      cave1.strokeEllipse(2800, 155, 80, 50);
      cave1.fillStyle(0x000000, 1);
      cave1.fillEllipse(2800, 162, 50, 32);
      this.propLayer?.add(cave1);
      this.add
        .text(2800, 130, "고대 동굴", {
          fontSize: "10px",
          color: "#aa8855",
          stroke: "#000000",
          strokeThickness: 3,
        })
        .setOrigin(0.5);

      // 폐허 던전 입구 (동쪽 코볼드 구역)
      const cave2 = this.add.graphics();
      cave2.fillStyle(0x100800, 0.9);
      cave2.fillEllipse(2700, 500, 90, 56);
      cave2.lineStyle(3, 0x6a3a08, 0.9);
      cave2.strokeEllipse(2700, 500, 90, 56);
      cave2.fillStyle(0x000000, 1);
      cave2.fillEllipse(2700, 508, 58, 36);
      // 바위 장식
      cave2.fillStyle(0x4a3820, 0.8);
      cave2.fillRect(2658, 478, 14, 24);
      cave2.fillRect(2726, 478, 14, 24);
      this.propLayer?.add(cave2);
      this.add
        .text(2700, 474, "코볼드 소굴", {
          fontSize: "10px",
          color: "#aa8855",
          stroke: "#000000",
          strokeThickness: 3,
        })
        .setOrigin(0.5);
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

  private drawGroundShade(mapWidth: number, mapHeight: number) {
    const shade = this.add.graphics();
    shade.fillStyle(0x061016, 0.12);
    shade.fillEllipse(
      mapWidth * 0.58,
      mapHeight * 0.56,
      mapWidth * 0.82,
      mapHeight * 0.46,
    );
    shade.fillStyle(0xecd2a2, 0.04);
    shade.fillEllipse(mapWidth * 0.24, mapHeight * 0.2, 520, 180);
    this.overlayLayer?.add(shade);
  }

  private drawAtmosphere(mapWidth: number, mapHeight: number) {
    const haze = this.add.graphics();
    haze.fillStyle(0xffd36e, 0.045);
    haze.fillEllipse(mapWidth * 0.28, mapHeight * 0.18, 620, 240);
    haze.fillStyle(0x86d8ff, 0.035);
    haze.fillEllipse(mapWidth * 0.78, mapHeight * 0.3, 520, 180);
    haze.fillStyle(0xffffff, 0.025);
    haze.fillEllipse(mapWidth * 0.52, mapHeight * 0.48, mapWidth * 0.74, 120);
    this.overlayLayer?.add(haze);
  }

  private drawWeatherEffects(
    mapId: string,
    mapWidth: number,
    mapHeight: number,
  ) {
    const layer = this.weatherLayer;
    if (!layer) {
      return;
    }

    const addFloatingParticle = (
      x: number,
      y: number,
      width: number,
      height: number,
      color: number,
      alpha: number,
      driftX: number,
      driftY: number,
      duration: number,
    ) => {
      const particle = this.add
        .ellipse(x, y, width, height, color, alpha)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      layer.add(particle);
      this.tweens.add({
        targets: particle,
        x: x + driftX,
        y: y + driftY,
        alpha: alpha * 0.42,
        duration,
        repeat: -1,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    };

    const addDriftBand = (
      x: number,
      y: number,
      width: number,
      height: number,
      color: number,
      alpha: number,
      driftX: number,
      duration: number,
    ) => {
      const band = this.add
        .ellipse(x, y, width, height, color, alpha)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      layer.add(band);
      this.tweens.add({
        targets: band,
        x: x + driftX,
        alpha: alpha * 0.45,
        duration,
        repeat: -1,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    };

    const addVerticalGlow = (
      x: number,
      y: number,
      width: number,
      height: number,
      color: number,
      alpha: number,
      rise: number,
      duration: number,
    ) => {
      const glow = this.add
        .ellipse(x, y, width, height, color, alpha)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      layer.add(glow);
      this.tweens.add({
        targets: glow,
        y: y + rise,
        alpha: alpha * 0.35,
        duration,
        repeat: -1,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    };

    if (mapId === "moonlitWetland") {
      addDriftBand(
        mapWidth * 0.52,
        mapHeight * 0.46,
        mapWidth * 0.72,
        84,
        0xd8fff8,
        0.06,
        40,
        5200,
      );
      addDriftBand(
        mapWidth * 0.66,
        mapHeight * 0.62,
        mapWidth * 0.46,
        68,
        0xbff9ee,
        0.05,
        -34,
        4600,
      );
      addVerticalGlow(780, 352, 110, 42, 0x9ffff1, 0.06, -10, 2200);
      addVerticalGlow(1090, 414, 140, 48, 0x8aeede, 0.05, -12, 2400);
      for (let index = 0; index < 26; index += 1) {
        addFloatingParticle(
          Phaser.Math.Between(120, mapWidth - 120),
          Phaser.Math.Between(90, mapHeight - 90),
          Phaser.Math.Between(26, 54),
          Phaser.Math.Between(10, 18),
          0xc9fff2,
          Phaser.Math.FloatBetween(0.05, 0.12),
          Phaser.Math.Between(-26, 26),
          Phaser.Math.Between(-18, 18),
          Phaser.Math.Between(2400, 4400),
        );
      }
      return;
    }

    if (mapId === "gludioPlain") {
      addDriftBand(
        mapWidth * 0.34,
        mapHeight * 0.26,
        220,
        44,
        0xf6e6b4,
        0.035,
        16,
        4200,
      );
      for (let index = 0; index < 14; index += 1) {
        addFloatingParticle(
          Phaser.Math.Between(140, mapWidth - 140),
          Phaser.Math.Between(120, mapHeight - 120),
          Phaser.Math.Between(12, 24),
          Phaser.Math.Between(6, 12),
          0xf5dea0,
          Phaser.Math.FloatBetween(0.03, 0.08),
          Phaser.Math.Between(-16, 16),
          Phaser.Math.Between(-6, 6),
          Phaser.Math.Between(2800, 4200),
        );
      }
      return;
    }

    if (mapId === "windwoodForest") {
      addDriftBand(
        mapWidth * 0.42,
        mapHeight * 0.28,
        mapWidth * 0.34,
        56,
        0xcdf7be,
        0.04,
        26,
        4200,
      );
      addDriftBand(
        mapWidth * 0.58,
        mapHeight * 0.46,
        mapWidth * 0.28,
        44,
        0xe1ffd6,
        0.035,
        -18,
        3600,
      );
      for (let index = 0; index < 22; index += 1) {
        addFloatingParticle(
          Phaser.Math.Between(120, mapWidth - 120),
          Phaser.Math.Between(90, mapHeight - 90),
          Phaser.Math.Between(5, 9),
          Phaser.Math.Between(5, 9),
          0xaef7a6,
          Phaser.Math.FloatBetween(0.18, 0.34),
          Phaser.Math.Between(-16, 16),
          Phaser.Math.Between(-24, 12),
          Phaser.Math.Between(1800, 3200),
        );
      }
      return;
    }

    if (mapId === "orcForest") {
      addDriftBand(
        mapWidth * 0.54,
        mapHeight * 0.42,
        mapWidth * 0.38,
        62,
        0xffc17a,
        0.035,
        18,
        3800,
      );
      addVerticalGlow(
        mapWidth * 0.54,
        mapHeight * 0.36,
        180,
        68,
        0xff9b52,
        0.05,
        -14,
        2000,
      );
      for (let index = 0; index < 18; index += 1) {
        addFloatingParticle(
          Phaser.Math.Between(140, mapWidth - 140),
          Phaser.Math.Between(120, mapHeight - 120),
          Phaser.Math.Between(6, 12),
          Phaser.Math.Between(8, 14),
          0xffb06b,
          Phaser.Math.FloatBetween(0.08, 0.18),
          Phaser.Math.Between(-10, 12),
          Phaser.Math.Between(-28, -8),
          Phaser.Math.Between(1500, 2800),
        );
      }
      return;
    }

    if (mapId === "dragonValley") {
      addVerticalGlow(
        mapWidth * 0.52,
        mapHeight * 0.36,
        240,
        90,
        0xffb56e,
        0.08,
        -24,
        2200,
      );
      addVerticalGlow(
        mapWidth * 0.72,
        mapHeight * 0.44,
        180,
        72,
        0xff8a57,
        0.06,
        -18,
        1800,
      );
      addVerticalGlow(mapWidth * 0.58, 418, 120, 46, 0xff7b3f, 0.08, -16, 1600);
      for (let index = 0; index < 24; index += 1) {
        addFloatingParticle(
          Phaser.Math.Between(120, mapWidth - 120),
          Phaser.Math.Between(90, mapHeight - 90),
          Phaser.Math.Between(6, 12),
          Phaser.Math.Between(8, 16),
          0xffb36b,
          Phaser.Math.FloatBetween(0.12, 0.24),
          Phaser.Math.Between(-10, 14),
          Phaser.Math.Between(-40, -12),
          Phaser.Math.Between(1400, 2600),
        );
      }
      return;
    }

    if (mapId === "ancientCave") {
      addDriftBand(
        mapWidth * 0.5,
        mapHeight * 0.34,
        mapWidth * 0.52,
        60,
        0xa7cfff,
        0.045,
        22,
        5400,
      );
      addVerticalGlow(mapWidth * 0.5, 226, 160, 48, 0x86deff, 0.05, -10, 2600);
      for (let index = 0; index < 18; index += 1) {
        addFloatingParticle(
          Phaser.Math.Between(120, mapWidth - 120),
          Phaser.Math.Between(90, mapHeight - 90),
          Phaser.Math.Between(18, 36),
          Phaser.Math.Between(8, 14),
          0x8db7d8,
          Phaser.Math.FloatBetween(0.04, 0.08),
          Phaser.Math.Between(-18, 18),
          Phaser.Math.Between(-10, 10),
          Phaser.Math.Between(2800, 4200),
        );
      }
      return;
    }

    if (mapId === "speakingIsland") {
      addDriftBand(
        mapWidth * 0.76,
        mapHeight * 0.22,
        320,
        52,
        0xdff8ff,
        0.05,
        24,
        4600,
      );
      addDriftBand(
        mapWidth * 0.84,
        mapHeight * 0.5,
        240,
        38,
        0x9fe8ff,
        0.05,
        -18,
        3800,
      );
    }

    for (let index = 0; index < 16; index += 1) {
      addFloatingParticle(
        Phaser.Math.Between(120, mapWidth - 120),
        Phaser.Math.Between(90, mapHeight - 90),
        Phaser.Math.Between(8, 20),
        Phaser.Math.Between(8, 20),
        0xf9df9f,
        Phaser.Math.FloatBetween(0.05, 0.12),
        Phaser.Math.Between(-20, 20),
        Phaser.Math.Between(-14, 14),
        Phaser.Math.Between(2600, 4200),
      );
    }
  }

  private drawPortals() {
    const map = MAPS[this.mapId] ?? MAPS.speakingIsland;
    const mapW = map.width * TILE_WIDTH + 320;
    const mapH = map.height * TILE_HEIGHT + 260;
    this.portalGlows = [];

    const portals: Array<{ x: number; y: number; label: string }> = [];

    switch (this.mapId) {
      case "speakingIsland":
        portals.push({ x: mapW - 150, y: 400, label: "은기사의 마을 →" });
        portals.push({ x: 2800, y: 162, label: "↑ 고대 동굴" });
        break;
      case "ancientCave":
        portals.push({ x: mapW * 0.5, y: mapH - 120, label: "↓ 동굴 출구" });
        break;
      case "silverKnightTown":
        portals.push({ x: 150, y: 400, label: "← 이야기의 섬" });
        portals.push({ x: mapW * 0.5, y: 150, label: "↑ 바람숲" });
        portals.push({ x: mapW - 150, y: 400, label: "오크 부락 →" });
        portals.push({
          x: mapW * 0.5,
          y: mapH - 150,
          label: "↓ 글루디오 평원",
        });
        break;
      case "windwoodForest":
        portals.push({ x: 600, y: mapH - 150, label: "↓ 은기사의 마을" });
        portals.push({ x: mapW - 150, y: 400, label: "기란 도시 →" });
        portals.push({ x: mapW * 0.6, y: mapH - 150, label: "↓ 달안개 습지" });
        break;
      case "orcForest":
        portals.push({ x: 150, y: 400, label: "← 은기사의 마을" });
        break;
      case "gludioPlain":
        portals.push({ x: mapW * 0.5, y: 150, label: "↑ 은기사의 마을" });
        break;
      case "moonlitWetland":
        portals.push({ x: 600, y: 150, label: "↑ 바람숲" });
        break;
      case "giranTown":
        portals.push({ x: 150, y: 400, label: "← 바람숲" });
        portals.push({ x: mapW - 150, y: 400, label: "용의 계곡 →" });
        break;
      case "dragonValley":
        portals.push({ x: 150, y: 400, label: "← 기란 도시" });
        break;
    }

    portals.forEach(({ x, y, label }) => this.createPortalAt(x, y, label));
  }

  private createPortalAt(x: number, y: number, label: string) {
    const gfx = this.add.graphics();

    // 포탈 바닥 빛
    gfx.fillStyle(0x44aaff, 0.12);
    gfx.fillEllipse(x, y + 32, 138, 44);
    gfx.fillStyle(0xf2d28e, 0.18);
    gfx.fillEllipse(x, y + 28, 96, 24);
    gfx.fillStyle(0x423325, 0.95);
    gfx.fillRect(x - 46, y - 40, 10, 90);
    gfx.fillRect(x + 36, y - 40, 10, 90);
    gfx.lineStyle(8, 0x725338, 0.95);
    gfx.beginPath();
    gfx.arc(x, y - 8, 46, Math.PI, Math.PI * 2, false);
    gfx.strokePath();

    // 포탈 링 (외부)
    gfx.lineStyle(4, 0x88ccff, 0.84);
    gfx.strokeEllipse(x, y, 64, 90);

    // 포탈 링 (내부)
    gfx.lineStyle(2, 0xaaddff, 0.65);
    gfx.strokeEllipse(x, y, 48, 72);

    // 포탈 내부 채우기
    gfx.fillStyle(0x2266cc, 0.26);
    gfx.fillEllipse(x, y, 48, 72);
    gfx.fillStyle(0xffffff, 0.08);
    gfx.fillEllipse(x - 10, y - 18, 18, 42);

    // 포탈 상단 크리스탈
    gfx.lineStyle(3, 0x66ddff, 0.9);
    gfx.strokeTriangle(x - 8, y - 40, x + 8, y - 40, x, y - 56);
    gfx.fillStyle(0x88eeff, 0.7);
    gfx.fillTriangle(x - 8, y - 40, x + 8, y - 40, x, y - 56);

    this.overlayLayer?.add(gfx);
    this.portalGlows.push(gfx);

    const sigil = this.add
      .ellipse(x, y + 30, 88, 20, 0xf5dda0, 0.08)
      .setStrokeStyle(2, 0xf5dda0, 0.18)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.overlayLayer?.add(sigil);
    this.tweens.add({
      targets: sigil,
      scaleX: 1.08,
      scaleY: 1.08,
      alpha: 0.03,
      duration: 1500,
      repeat: -1,
      yoyo: true,
      ease: "Sine.easeInOut",
    });

    for (let index = 0; index < 4; index += 1) {
      const spark = this.add
        .ellipse(
          x + Phaser.Math.Between(-18, 18),
          y - 8 + Phaser.Math.Between(-32, 32),
          6,
          6,
          0xdff6ff,
          0.22,
        )
        .setBlendMode(Phaser.BlendModes.SCREEN);
      this.overlayLayer?.add(spark);
      this.tweens.add({
        targets: spark,
        y: spark.y - Phaser.Math.Between(10, 24),
        x: spark.x + Phaser.Math.Between(-8, 8),
        alpha: 0.04,
        duration: Phaser.Math.Between(1000, 1600),
        repeat: -1,
        yoyo: true,
        ease: "Sine.easeInOut",
        delay: index * 140,
      });
    }

    // 포탈 레이블
    const text = this.add
      .text(x, y + 52, label, {
        fontSize: "11px",
        color: "#d4ebff",
        stroke: "#001833",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.overlayLayer?.add(text);

    // 깜빡임 효과
    this.tweens.add({
      targets: gfx,
      alpha: { from: 0.9, to: 0.5 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
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
      const shadow = this.add.ellipse(0, 14, 58, 20, 0x08131b, 0.3);
      const aura = this.createAuraSigil(0x9ce7db, 0.14, 76, 28, 0.94);
      const glow = this.createUnitBacklight(
        this.getFrameKey(textureBase, "idle", "s", 0),
        0xcaf2ff,
        0.18,
        0.98,
      );
      const sprite = this.add.image(
        0,
        0,
        this.getFrameKey(textureBase, "idle", "s", 0),
      );
      sprite.setOrigin(0.5, 0.94);
      sprite.setScale(0.86);

      const label = this.add
        .text(0, -62, npc.name, {
          fontSize: "14px",
          color: "#fff4d5",
          fontFamily: "sans-serif",
          stroke: "#07101a",
          strokeThickness: 4,
        })
        .setOrigin(0.5);

      const ring = this.add
        .ellipse(0, 14, 64, 22, 0x8fe8d3, 0.12)
        .setStrokeStyle(2, 0x8fe8d3, 0.55);
      const hitArea = this.add
        .zone(0, -24, 92, 118)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      const roleBadge = this.createBadgeMarker(
        0,
        -84,
        this.getNpcRoleBadgeText(npc.role),
        this.getNpcRoleBadgeColor(npc.role),
      );

      const container = this.add.container(worldPosition.x, worldPosition.y, [
        shadow,
        aura,
        ring,
        glow,
        sprite,
        roleBadge,
        label,
        hitArea,
      ]) as NpcSprite;
      container.npcId = npc.id;
      container.auraRing = aura;
      container.glowBody = glow;
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

  /** 몬스터 처치 시 골드/아이템을 바닥에 드롭 */
  private spawnGroundLoot(
    x: number,
    y: number,
    gold: number,
    itemIds: string[],
  ) {
    const lootItems: Array<{
      lootId: string;
      itemId: string;
      name: string;
      quantity: number;
      x: number;
      y: number;
    }> = [];

    // 골드 드롭
    if (gold > 0) {
      const id = `gold_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      lootItems.push({
        lootId: id,
        itemId: "__gold__",
        name: `${gold} Gold`,
        quantity: gold,
        x: x + (Math.random() - 0.5) * 40,
        y: y + 20 + Math.random() * 20,
      });
    }

    // 아이템 드롭
    itemIds.forEach((itemId, i) => {
      const itemData = ITEMS[itemId];
      if (!itemData) return;
      const id = `loot_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
      lootItems.push({
        lootId: id,
        itemId,
        name: itemData.name,
        quantity: 1,
        x: x + (Math.random() - 0.5) * 60,
        y: y + 20 + Math.random() * 30,
      });
    });

    if (lootItems.length === 0) return;

    // 스토어에 저장
    useGameStore.getState().addDroppedLoot(lootItems);
    // 씬에 스프라이트 생성
    this.spawnLoot({ items: lootItems });

    // 루트는 소멸하지 않음 — 플레이어가 직접 습득해야 사라짐
  }

  private pickupFrameCounter = 0;
  /** 플레이어 근처 루트 자동 습득 (10프레임마다 체크) */
  private checkAutoPickup() {
    if (++this.pickupFrameCounter % 10 !== 0) return;
    if (!this.localPlayer) return;
    const px = this.localPlayer.x;
    const py = this.localPlayer.y;
    const PICKUP_RANGE = 80;

    this.lootSprites.forEach((sprite, lootId) => {
      const dist = Phaser.Math.Distance.Between(px, py, sprite.x, sprite.y);
      if (dist > PICKUP_RANGE) return;

      // 루트 데이터 찾기
      const lootData = useGameStore.getState().droppedLoot.find(
        (l) => l.lootId === lootId,
      );
      if (!lootData) {
        this.removeLoot(lootId);
        return;
      }

      // 골드 습득
      if (lootData.itemId === "__gold__") {
        useGameStore.getState().applyOfflineReward({
          gold: lootData.quantity,
          exp: 0,
        });
        useGameStore.getState().addChat({
          id: crypto.randomUUID(),
          channel: "system",
          author: "습득",
          message: `💰 ${lootData.quantity} Gold 획득!`,
          timestamp: Date.now(),
        });
      } else {
        // 아이템 습득
        const itemData = ITEMS[lootData.itemId];
        if (itemData) {
          useGameStore.getState().applyOfflineReward({
            gold: 0,
            exp: 0,
            items: [lootData.itemId],
          });
          useGameStore.getState().addChat({
            id: crypto.randomUUID(),
            channel: "system",
            author: "습득",
            message: `📦 ${itemData.name} 획득!`,
            timestamp: Date.now(),
          });
        }
      }

      // 습득 이펙트
      this.showPickupEffect(sprite.x, sprite.y);
      this.removeLoot(lootId);
      useGameStore.getState().removeDroppedLoot(lootId);
    });
  }

  /** 아이템 습득 이펙트 */
  private showPickupEffect(x: number, y: number) {
    const sparkle = this.add
      .text(x, y, "✨", { fontSize: "18px" })
      .setOrigin(0.5);
    this.effectLayer?.add(sparkle);
    this.tweens.add({
      targets: sparkle,
      y: y - 40,
      alpha: 0,
      duration: 600,
      ease: "Quad.Out",
      onComplete: () => sparkle.destroy(),
    });
  }

  private upsertPlayer(payload: WorldPlayerPayload) {
    const textureBase = this.getPlayerTexture();
    const existing = this.playerSprites.get(payload.id);
    const classTone = this.getPlayerClassTone();

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
    const shadow = this.add.ellipse(0, 14, 60, 20, 0x08131b, 0.3);
    const aura = this.createAuraSigil(
      isSelf ? classTone.burstTint : classTone.projectileTint,
      isSelf ? 0.18 : 0.1,
      isSelf ? 84 : 78,
      isSelf ? 30 : 26,
      isSelf ? 1.02 : 0.92,
    );
    const ring = this.add
      .ellipse(0, 14, 70, 22, isSelf ? 0xffefb2 : 0x89cffd, 0.16)
      .setStrokeStyle(2, isSelf ? 0xffefb2 : 0x89cffd, 0.7);
    const glow = this.createUnitBacklight(
      this.getFrameKey(textureBase, "idle", "s", 0),
      isSelf ? 0xffe5a6 : 0x9fdcff,
      isSelf ? 0.24 : 0.16,
      isSelf ? 1.04 : 0.94,
    );
    const body = this.add
      .image(0, 0, this.getFrameKey(textureBase, "idle", "s", 0))
      .setScale(isSelf ? 0.9 : 0.82)
      .setOrigin(0.5, 0.94);
    const label = this.add
      .text(0, -56, payload.name, {
        fontSize: "11px",
        color: isSelf ? "#fff4ba" : "#f5f5f5",
        stroke: "#07101a",
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    const classBadge = this.createBadgeMarker(
      0,
      -70,
      this.getPlayerClassBadgeText(),
      classTone.burstTint,
    );

    const container = this.add.container(payload.x, payload.y, [
      shadow,
      aura,
      ring,
      glow,
      body,
      classBadge,
      label,
    ]) as PlayerSprite;
    container.playerId = payload.id;
    container.label = label;
    container.ring = ring;
    container.auraRing = aura;
    container.glowBody = glow;
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
    const isBoss = this.isBossMonster(baseId);

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
          50 * Phaser.Math.Clamp(payload.hp / Math.max(1, payload.maxHp), 0, 1);
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
        50 * Phaser.Math.Clamp(payload.hp / Math.max(1, payload.maxHp), 0, 1);
      existing.label.setText(payload.name);
      existing.textureBase = textureBase;
      this.tweenActor(existing, payload.x, payload.y, 300);
      return;
    }

    const shadow = this.add.ellipse(0, 16, 62, 22, 0x08131b, 0.3);
    const aura = this.createAuraSigil(
      isBoss ? 0xffd37f : 0xff8f74,
      isBoss ? 0.2 : 0.12,
      isBoss ? 94 : 78,
      isBoss ? 36 : 28,
      isBoss ? 1.08 : 0.94,
    );
    const ring = this.add
      .ellipse(
        0,
        16,
        isBoss ? 84 : 70,
        isBoss ? 30 : 24,
        isBoss ? 0xffc976 : 0xf57f69,
        isBoss ? 0.16 : 0.12,
      )
      .setStrokeStyle(2, isBoss ? 0xffe1a8 : 0xff9c88, isBoss ? 0.84 : 0.75);
    const glow = this.createUnitBacklight(
      this.getFrameKey(textureBase, "idle", "s", 0),
      isBoss ? 0xffd18a : 0xffa37f,
      isBoss ? 0.26 : 0.18,
      isBoss ? 1 : 0.92,
    );
    const body = this.add
      .image(0, 2, this.getFrameKey(textureBase, "idle", "s", 0))
      .setOrigin(0.5, 0.92)
      .setScale(this.getMonsterScale(baseId));
    const hpBack = this.add
      .rectangle(0, -68, 52, 7, 0x160808, 0.78)
      .setOrigin(0.5);
    const hpFill = this.add
      .rectangle(-25, -68, 50, 5, 0xfb7260, 0.95)
      .setOrigin(0, 0.5);
    const label = this.add
      .text(0, -86, payload.name, {
        fontSize: isBoss ? "14px" : "13px",
        color: isBoss ? "#ffe7b4" : "#ffd9d1",
        stroke: "#07101a",
        strokeThickness: 4,
        fontStyle: isBoss ? "bold" : "normal",
      })
      .setOrigin(0.5);
    const hitArea = this.add
      .zone(0, -20, 112, 112)
      .setInteractive({ useHandCursor: true });
    const bossCrest = isBoss
      ? this.add
          .text(0, -102, "BOSS", {
            fontSize: "10px",
            color: "#221508",
            backgroundColor: "#f6cf83",
            padding: { x: 6, y: 2 },
          })
          .setOrigin(0.5)
      : null;
    const bossHalo = isBoss
      ? this.add
          .ellipse(0, -16, 116, 116, 0xffd07a, 0.08)
          .setStrokeStyle(2, 0xffefb5, 0.3)
          .setBlendMode(Phaser.BlendModes.SCREEN)
      : null;

    const container = this.add.container(payload.x, payload.y, [
      shadow,
      aura,
      ring,
      ...(bossHalo ? [bossHalo] : []),
      glow,
      body,
      hpBack,
      hpFill,
      label,
      ...(bossCrest ? [bossCrest] : []),
      hitArea,
    ]) as MonsterSprite;
    container.monsterId = payload.id;
    container.hpFill = hpFill;
    container.hpBack = hpBack;
    container.label = label;
    container.ring = ring;
    container.auraRing = aura;
    container.glowBody = glow;
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
    container.isBoss = isBoss;

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
    if (isBoss) {
      this.playBossEntrance(container.x, container.y);
    }
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
    // 마을 안전구역 안에서는 공격 불가
    if (
      this.mapId === "speakingIsland" &&
      STARTER_TOWN_RECT.contains(this.localPlayer.x, this.localPlayer.y)
    ) {
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
      // Only issue a new move if not already tweening toward this monster
      const existingTweens = this.tweens.getTweensOf(this.localPlayer);
      if (existingTweens.length > 0 && existingTweens[0].isPlaying()) {
        return;
      }
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
    const meleeStyle = this.getMeleeWeaponStyle();
    this.localPlayer.attackUntil =
      now +
      (meleeStyle === "dagger" ? 220 : meleeStyle === "greatsword" ? 340 : 280);
    const classTone = this.getPlayerClassTone();

    if (this.isRangedClass()) {
      const startX = this.localPlayer.x + 10;
      const startY = this.localPlayer.y - 28;
      this.spawnWeaponTrail(
        this.localPlayer.x,
        this.localPlayer.y - 18,
        monster.x,
        monster.y - 18,
        classTone.trailTint,
      );
      const projectile = this.add
        .image(startX, startY, "projectile_arrow")
        .setOrigin(0.2, 0.5)
        .setScale(1.1);
      projectile.setTint(classTone.projectileTint);
      projectile.setRotation(
        Phaser.Math.Angle.Between(startX, startY, monster.x, monster.y - 18),
      );
      this.effectLayer?.add(projectile);
      this.attachProjectileTrail(projectile, classTone.projectileTint);
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
            classTone.impactTint,
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
          this.spawnArcaneBurst(monster.x, monster.y - 18, classTone.burstTint);
          if (classTone.classId === "ranger") {
            this.spawnLeafBurst(monster.x, monster.y - 18, classTone.burstTint);
          }
          projectile.destroy();
        },
      });
    } else {
      this.spawnMeleeAfterimage(classTone.afterimageTint);
      if (meleeStyle === "dagger") {
        const stab = this.add
          .ellipse(monster.x, monster.y - 12, 54, 10, classTone.slashTint, 0.26)
          .setRotation(
            Phaser.Math.Angle.Between(
              this.localPlayer.x,
              this.localPlayer.y,
              monster.x,
              monster.y,
            ),
          )
          .setBlendMode(Phaser.BlendModes.SCREEN);
        const pierce = this.add
          .ellipse(
            monster.x,
            monster.y - 12,
            18,
            30,
            classTone.impactTint,
            0.36,
          )
          .setBlendMode(Phaser.BlendModes.SCREEN);
        this.effectLayer?.add(stab);
        this.effectLayer?.add(pierce);
        this.tweens.add({
          targets: stab,
          alpha: 0,
          scaleX: 1.35,
          duration: 120,
          ease: "Power2.Out",
          onComplete: () => stab.destroy(),
        });
        this.tweens.add({
          targets: pierce,
          alpha: 0,
          scaleY: 1.6,
          duration: 110,
          ease: "Power2.Out",
          onComplete: () => pierce.destroy(),
        });
      } else if (meleeStyle === "greatsword") {
        const slash = this.add
          .arc(
            monster.x,
            monster.y - 10,
            42,
            188,
            348,
            false,
            classTone.slashTint,
            0.38,
          )
          .setStrokeStyle(6, classTone.slashTint, 0.95);
        this.effectLayer?.add(slash);
        this.tweens.add({
          targets: slash,
          alpha: 0,
          scaleX: 1.55,
          scaleY: 1.55,
          duration: 240,
          ease: "Power2.Out",
          onComplete: () => slash.destroy(),
        });
        const impact = this.add.ellipse(
          monster.x,
          monster.y - 10,
          52,
          34,
          classTone.impactTint,
          0.5,
        );
        this.effectLayer?.add(impact);
        this.tweens.add({
          targets: impact,
          alpha: 0,
          scaleX: 2.1,
          scaleY: 2.1,
          duration: 180,
          ease: "Power2.Out",
          onComplete: () => impact.destroy(),
        });
      } else {
        const slash = this.add
          .arc(
            monster.x,
            monster.y - 8,
            32,
            200,
            340,
            false,
            classTone.slashTint,
            0.32,
          )
          .setStrokeStyle(4, classTone.slashTint, 0.95);
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
        const impact = this.add.ellipse(
          monster.x,
          monster.y - 12,
          38,
          28,
          classTone.impactTint,
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
      }
      this.tweens.add({
        targets: this.localPlayer,
        scaleX:
          meleeStyle === "dagger"
            ? 1.03
            : meleeStyle === "greatsword"
              ? 1.08
              : 1.06,
        scaleY:
          meleeStyle === "dagger"
            ? 1.03
            : meleeStyle === "greatsword"
              ? 1.08
              : 1.06,
        duration:
          meleeStyle === "dagger" ? 55 : meleeStyle === "greatsword" ? 90 : 70,
        yoyo: true,
      });
      this.spawnWeaponTrail(
        this.localPlayer.x,
        this.localPlayer.y - 24,
        monster.x,
        monster.y - 14,
        classTone.trailTint,
        meleeStyle as "dagger" | "sword" | "greatsword",
      );
      if (classTone.classId === "guardian") {
        this.spawnShieldPulse(monster.x, monster.y - 14, classTone.burstTint);
      }
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
        1 +
        Math.floor(attackProfile.str * 0.5) +
        Math.floor(attackProfile.dex * 0.4) +
        Math.floor(attackProfile.int * 0.3);
      const variance = Math.floor(Math.random() * 3); // 0 ~ +2
      const damage = Math.max(1, baseDamage + variance);
      const isCrit = Math.random() < 0.1;
      const finalDamage = isCrit ? Math.floor(damage * 1.6) : damage;

      const newHp = Math.max(0, monsterData.hp - finalDamage);
      this.offlineMonsterHp.set(monsterId, {
        ...monsterData,
        hp: newHp,
        lastPlayerAttack: this.time.now,
      });

      // 데미지 숫자 표시
      if (monsterSprite) {
        this.showEnhancedHitFeedback(
          monsterSprite.x,
          monsterSprite.y,
          finalDamage,
          isCrit,
          classTone.slashTint,
        );
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

        // 랜덤 드랍 처리
        const mBase2 = monsterId.split("-offline-")[0];
        const mDef2 = MONSTERS[mBase2];
        const droppedItems: string[] = [];
        if (mDef2?.drops) {
          for (const drop of mDef2.drops) {
            if (Math.random() < drop.rate) {
              droppedItems.push(drop.itemId);
              // 레어 이상 드랍 시 채팅 공지
              const itemData = ITEMS[drop.itemId];
              if (
                itemData &&
                ["rare", "epic", "legendary", "mythic"].includes(
                  itemData.rarity,
                )
              ) {
                const rarityLabel: Record<string, string> = {
                  rare: "레어",
                  epic: "에픽",
                  legendary: "전설",
                  mythic: "신화",
                };
                useGameStore.getState().addChat({
                  id: crypto.randomUUID(),
                  channel: "system",
                  author: "드랍",
                  message: `✨ [${rarityLabel[itemData.rarity] ?? itemData.rarity}] ${itemData.name} 획득!`,
                  timestamp: Date.now(),
                });
              }
            }
          }
        }

        // EXP는 즉시 지급, 골드+아이템은 바닥 드롭
        useGameStore.getState().applyOfflineReward({
          gold: 0,
          exp: expReward,
        });

        // 바닥에 루트 드롭
        this.spawnGroundLoot(
          monsterSprite?.x ?? 0,
          monsterSprite?.y ?? 0,
          goldReward,
          droppedItems,
        );

        // 킬 트래킹 (업적)
        const isBoss2 = mDef2?.isBoss ?? false;
        useGameStore.getState().registerKill(mBase2, isBoss2);

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

        // 리스폰 - 원래 스폰 위치로, 몬스터 respawnTime 사용
        const ai = this.monsterAI.get(monsterId);
        const mBase = monsterId.split("-offline-")[0];
        const mDef = MONSTERS[mBase];
        const respawnMs = (mDef?.respawnTime ?? 30) * 1000;
        this.time.delayedCall(respawnMs, () => {
          const sprite = this.monsterSprites.get(monsterId);
          if (!sprite) return;
          const fullHp = monsterData.maxHp;
          const rx = ai?.spawnX ?? sprite.x;
          const ry = ai?.spawnY ?? sprite.y;
          this.offlineMonsterHp.set(monsterId, { ...monsterData, hp: fullHp });
          if (ai) {
            ai.state = "idle";
            ai.lastChaseAt = 0;
          }
          sprite.setPosition(rx, ry);
          sprite.hpFill.width = 50;
          sprite.prevHp = fullHp;
          useGameStore.getState().upsertMonster({
            id: monsterId,
            mapId: this.mapId,
            name: sprite.label.text,
            level: 1,
            hp: fullHp,
            maxHp: fullHp,
            x: rx,
            y: ry,
          });
          sprite.setVisible(true);
          sprite.setAlpha(0);
          this.tweens.add({ targets: sprite, alpha: 1, duration: 600 });
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

  /** 좌표가 이동 불가 지형인지 체크 */
  private isBlocked(x: number, y: number): boolean {
    const zones = COLLISION_ZONES[this.mapId];
    if (!zones) return false;
    for (const z of zones) {
      const dx = (x - z.x) / z.rx;
      const dy = (y - z.y) / z.ry;
      if (dx * dx + dy * dy < 1) return true;
    }
    return false;
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
    let clampedX = Phaser.Math.Clamp(targetX, 110, maxX);
    let clampedY = Phaser.Math.Clamp(targetY, 120, maxY);

    // 이동 불가 지형이면 가장 가까운 경계로 밀어냄
    if (this.isBlocked(clampedX, clampedY)) {
      return; // 이동 차단
    }
    const distance = Phaser.Math.Distance.Between(
      this.localPlayer.x,
      this.localPlayer.y,
      clampedX,
      clampedY,
    );
    // 이동 속도 버프 적용
    const pBuffs = useGameStore.getState().player.buffs;
    const hasSpeedBuff = pBuffs.some((b) => b.name === "신속" || b.name === "질풍");
    const hasFrenzy = pBuffs.some((b) => b.name === "광전사의 격노");
    let effectiveSpeed = MOVE_SPEED;
    if (hasSpeedBuff) effectiveSpeed *= 1.4;
    if (hasFrenzy) effectiveSpeed *= 1.5; // 추가 50% 이속 (중첩)
    const duration = Math.max(200, (distance / effectiveSpeed) * 1000);

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
    if (!sprite.spriteBody?.scene || !sprite.glowBody?.scene) return;

    if ("playerId" in sprite && sprite.playerId === this.selfId) {
      const nextTextureBase = this.getPlayerTexture();
      if (sprite.textureBase !== nextTextureBase) {
        sprite.textureBase = nextTextureBase;
      }
    }

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
    let frameAdvanced = false;
    const previousFrame = sprite.animFrame;

    if (sprite.animState !== nextState) {
      sprite.animState = nextState;
      sprite.animFrame = 0;
      sprite.frameTimer = now;
    } else if (now - sprite.frameTimer >= frameInterval) {
      sprite.animFrame = (sprite.animFrame + 1) % frameCount;
      sprite.frameTimer = now;
      frameAdvanced = sprite.animFrame !== previousFrame;
    }

    // 걸음 효과는 플레이어만 (성능 최적화)
    if (nextState === "walk" && frameAdvanced && sprite.animFrame !== 0 && "playerId" in sprite) {
      this.spawnWalkStepEffect(
        sprite.x,
        sprite.y + 10,
        sprite.facing,
        sprite.playerId === this.selfId ? 0xffefb2 : 0x9fdcff,
      );
    }

    sprite.spriteBody.setTexture(
      this.getFrameKey(
        sprite.textureBase,
        sprite.animState,
        sprite.facing,
        sprite.animFrame,
      ),
    );
    sprite.glowBody.setTexture(
      this.getFrameKey(
        sprite.textureBase,
        sprite.animState,
        sprite.facing,
        sprite.animFrame,
      ),
    );
    const bob =
      sprite.animState === "walk"
        ? [0, -2.2, -0.8, -1.5][sprite.animFrame % 4]
        : sprite.animState === "attack"
          ? [-1, -3.5, 2, 0][sprite.animFrame % 4]
          : 0;
    const walkSway =
      sprite.animState === "walk"
        ? (
            {
              n: [0, 0.5, -0.5, 0.2],
              ne: [1.4, 2.8, 1, 2.0],
              e: [1.8, 3.2, 1.2, 2.4],
              se: [1.4, 2.6, 1, 1.8],
              s: [0, 0.7, -0.7, 0.3],
              sw: [-1.4, -2.8, -1, -2.0],
              w: [-1.8, -3.2, -1.2, -2.4],
              nw: [-1.4, -2.6, -1, -1.8],
            } as const
          )[sprite.facing][sprite.animFrame % 4]
        : sprite.animState === "attack"
          ? (
              {
                n: 0,
                ne: 1.4,
                e: 1.8,
                se: 1.4,
                s: 0,
                sw: -1.4,
                w: -1.8,
                nw: -1.4,
              } as const
            )[sprite.facing]
          : 0;
    const walkLean =
      sprite.animState === "walk"
        ? (
            {
              n: 0,
              ne: 0.04,
              e: 0.06,
              se: 0.035,
              s: 0,
              sw: -0.035,
              w: -0.06,
              nw: -0.04,
            } as const
          )[sprite.facing]
        : sprite.animState === "attack"
          ? (
              {
                n: 0,
                ne: 0.07,
                e: 0.09,
                se: 0.05,
                s: 0,
                sw: -0.05,
                w: -0.09,
                nw: -0.07,
              } as const
            )[sprite.facing]
          : 0;
    const bodyScaleX =
      sprite.animState === "walk"
        ? [0.985, 1.035, 1.005, 1.015][sprite.animFrame % 4]
        : sprite.animState === "attack"
          ? [1, 1.05, 1.08, 1.02][sprite.animFrame % 4]
          : 1;
    const bodyScaleY =
      sprite.animState === "walk"
        ? [1.02, 0.96, 1.01, 0.99][sprite.animFrame % 4]
        : sprite.animState === "attack"
          ? [1, 0.95, 0.92, 0.98][sprite.animFrame % 4]
          : 1;
    const labelFloat =
      sprite.animState === "walk"
        ? [0, -1.2, -0.4, -0.8][sprite.animFrame % 4]
        : sprite.animState === "attack"
          ? [-0.4, -1.6, 0.2, 0][sprite.animFrame % 4]
          : 0;
    const ringScaleBoost =
      sprite.animState === "walk"
        ? [0, 0.035, 0.012, 0.022][sprite.animFrame % 4]
        : sprite.animState === "attack"
          ? [0.02, 0.05, 0.07, 0.03][sprite.animFrame % 4]
          : 0;
    const pulseBase =
      "playerId" in sprite && sprite.playerId === this.selfId
        ? 0.2
        : "monsterId" in sprite && sprite.monsterId === this.selectedMonsterId
          ? 0.24
          : 0.14;
    const auraPulse =
      "playerId" in sprite
        ? sprite.playerId === this.selfId
          ? 1.06
          : 0.96
        : sprite.isBoss
          ? 1.12
          : sprite.monsterId === this.selectedMonsterId
            ? 1.03
            : 0.95;
    sprite.spriteBody.x = walkSway;
    sprite.spriteBody.y = bob;
    sprite.spriteBody.rotation = walkLean;
    sprite.spriteBody.scaleX = bodyScaleX;
    sprite.spriteBody.scaleY = bodyScaleY;
    sprite.glowBody.x = walkSway * 0.72;
    sprite.glowBody.y = bob - 1;
    sprite.glowBody.rotation = walkLean * 0.8;
    sprite.glowBody.scaleX = bodyScaleX * 1.02;
    sprite.glowBody.scaleY = bodyScaleY * 1.02;
    sprite.glowBody.alpha = pulseBase + Math.sin(now / 180) * 0.04;
    sprite.ring.x = walkSway * 0.28;
    sprite.ring.y = 14 + bob * 0.12;
    sprite.ring.scaleX = 1 + ringScaleBoost;
    sprite.ring.scaleY = 1 - ringScaleBoost * 0.38;
    sprite.auraRing.x = walkSway * 0.2;
    sprite.auraRing.y = 10 + bob * 0.2;
    sprite.auraRing.scaleX = auraPulse + Math.sin(now / 220) * 0.04;
    sprite.auraRing.scaleY = auraPulse * 0.82 + Math.cos(now / 260) * 0.03;
    sprite.auraRing.alpha =
      ("monsterId" in sprite && sprite.isBoss ? 0.18 : 0.1) +
      Math.sin(now / 200) * 0.025;
    sprite.label.x = walkSway * 0.36;
    sprite.label.y =
      ("playerId" in sprite ? -68 : -82) + bob * 0.16 + labelFloat;
    if (
      "monsterId" in sprite &&
      sprite.isBoss &&
      sprite.list[3] instanceof Phaser.GameObjects.Ellipse
    ) {
      const halo = sprite.list[3] as Phaser.GameObjects.Ellipse;
      halo.alpha = 0.06 + Math.sin(now / 220) * 0.02;
      halo.scaleX = 1.02 + Math.sin(now / 260) * 0.04;
      halo.scaleY = 1.02 + Math.cos(now / 280) * 0.04;
    }
    sprite.lastX = sprite.x;
    sprite.lastY = sprite.y;
  }

  private spawnWalkStepEffect(
    x: number,
    y: number,
    facing: DirectionKey,
    tint: number,
  ) {
    const directionOffset = {
      n: { x: 0, y: 5 },
      ne: { x: -8, y: 4 },
      e: { x: -10, y: 2 },
      se: { x: -8, y: 0 },
      s: { x: 0, y: -1 },
      sw: { x: 8, y: 0 },
      w: { x: 10, y: 2 },
      nw: { x: 8, y: 4 },
    } as const;
    const drift = {
      n: { x: 0, y: -10 },
      ne: { x: 8, y: -8 },
      e: { x: 12, y: -3 },
      se: { x: 8, y: 4 },
      s: { x: 0, y: 8 },
      sw: { x: -8, y: 4 },
      w: { x: -12, y: -3 },
      nw: { x: -8, y: -8 },
    } as const;
    const origin = directionOffset[facing];
    const velocity = drift[facing];
    const dust = this.add
      .ellipse(x + origin.x, y + origin.y, 16, 8, tint, 0.16)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const spark = this.add
      .ellipse(x + origin.x * 0.7, y + origin.y - 3, 8, 3, 0xffffff, 0.18)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.effectLayer?.add(dust);
    this.effectLayer?.add(spark);
    this.tweens.add({
      targets: dust,
      x: dust.x + velocity.x,
      y: dust.y + velocity.y,
      alpha: 0,
      scaleX: 1.8,
      scaleY: 1.2,
      duration: 260,
      ease: "Quad.Out",
      onComplete: () => dust.destroy(),
    });
    this.tweens.add({
      targets: spark,
      x: spark.x + velocity.x * 0.7,
      y: spark.y + velocity.y * 0.6,
      alpha: 0,
      scaleX: 1.5,
      duration: 220,
      ease: "Quad.Out",
      onComplete: () => spark.destroy(),
    });
  }

  private updateAnimatedNpc(sprite: NpcSprite, now: number) {
    if (!sprite.spriteBody?.scene || !sprite.glowBody?.scene) return;
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
      sprite.glowBody.setTexture(
        this.getFrameKey(
          sprite.textureBase,
          "idle",
          sprite.facing,
          sprite.animFrame,
        ),
      );
      sprite.spriteBody.y = sprite.animFrame === 0 ? 0 : -0.5;
      sprite.glowBody.y = sprite.animFrame === 0 ? -1 : -1.5;
    }
    sprite.auraRing.alpha = 0.1 + Math.sin(now / 240) * 0.02;
    sprite.auraRing.scaleX = 0.95 + Math.sin(now / 320) * 0.03;
    sprite.auraRing.scaleY = 0.92 + Math.cos(now / 360) * 0.02;
  }

  private createAtmosphere() {
    // === Lineage Remaster atmospheric lighting system ===
    // Sun/golden light bloom
    this.ambientBloom = this.add
      .ellipse(this.scale.width * 0.22, 100, 480, 260, 0xffc36b, 0.14)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setScrollFactor(0)
      .setDepth(1400);

    // Secondary warm haze around sun
    const sunHaze = this.add
      .ellipse(this.scale.width * 0.24, 130, 640, 340, 0xffa040, 0.04)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setScrollFactor(0)
      .setDepth(1399);
    this.weatherLayer?.add(sunHaze);

    // Moon/cool light
    this.ambientMoon = this.add
      .ellipse(this.scale.width * 0.78, 80, 280, 160, 0xc7e7ff, 0.06)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setScrollFactor(0)
      .setDepth(1400);

    // Ambient veil — overall tone overlay
    this.ambientVeil = this.add
      .rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0x07101a,
        0.06,
      )
      .setScrollFactor(0)
      .setDepth(1401);

    // World-space atmospheric effects
    const upperGlow = this.add
      .ellipse(980, 260, 920, 680, 0x78c9ff, 0.07)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const lowerGlow = this.add
      .ellipse(890, 760, 480, 320, 0x9effcf, 0.04)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    // Volumetric fog bands
    const fogBand1 = this.add
      .rectangle(920, 280, 1800, 100, 0xd9c9aa, 0.05)
      .setBlendMode(Phaser.BlendModes.SOFT_LIGHT);
    const fogBand2 = this.add
      .rectangle(600, 500, 1400, 80, 0xc0b898, 0.03)
      .setBlendMode(Phaser.BlendModes.SOFT_LIGHT);

    // Moon pool reflection
    const moonPool = this.add
      .ellipse(980, 310, 200, 100, 0xe8f6ff, 0.16)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    // God rays — diagonal light shafts
    const godRay1 = this.add
      .rectangle(400, 200, 60, 600, 0xffd080, 0.03)
      .setRotation(-0.3)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const godRay2 = this.add
      .rectangle(700, 180, 40, 500, 0xffd080, 0.02)
      .setRotation(-0.2)
      .setBlendMode(Phaser.BlendModes.SCREEN);

    // Floating dust motes
    const dustParticles: Phaser.GameObjects.Ellipse[] = [];
    for (let i = 0; i < 12; i++) {
      const dust = this.add
        .ellipse(
          200 + Math.random() * 1200,
          100 + Math.random() * 600,
          3,
          3,
          0xfff8e0,
          0.15 + Math.random() * 0.1,
        )
        .setBlendMode(Phaser.BlendModes.SCREEN);
      dustParticles.push(dust);
      // Slow floating animation
      this.tweens.add({
        targets: dust,
        x: dust.x + (Math.random() - 0.5) * 200,
        y: dust.y - 50 - Math.random() * 100,
        alpha: 0,
        duration: 8000 + Math.random() * 6000,
        ease: "Sine.InOut",
        repeat: -1,
        yoyo: true,
      });
    }

    this.overlayLayer?.add([
      upperGlow,
      lowerGlow,
      fogBand1,
      fogBand2,
      moonPool,
      godRay1,
      godRay2,
      ...dustParticles,
    ]);
  }

  private updateAmbientLighting() {
    // === Lineage Remaster — dynamic day/night cycle + map-specific atmospherics ===
    const phase = (Math.sin(this.time.now / 22000) + 1) / 2;
    const breathe = Math.sin(this.time.now / 4000) * 0.02;

    if (this.ambientVeil) {
      const ambientBase =
        this.mapId === "dragonValley"
          ? { r: 32, g: 14, b: 8, alpha: 0.14 }
          : this.mapId === "moonlitWetland"
            ? { r: 4, g: 16, b: 22, alpha: 0.12 }
            : this.mapId === "ancientCave"
              ? { r: 12, g: 22, b: 40, alpha: 0.1 }
              : this.mapId === "silverKnightTown" || this.mapId === "giranTown"
                ? { r: 8, g: 10, b: 16, alpha: 0.05 }
                : { r: 7, g: 16, b: 26, alpha: 0.06 };
      this.ambientVeil.alpha = ambientBase.alpha + phase * 0.1 + breathe;
      this.ambientVeil.fillColor = Phaser.Display.Color.GetColor(
        Phaser.Math.Linear(ambientBase.r, ambientBase.r + 12, 1 - phase),
        Phaser.Math.Linear(ambientBase.g, ambientBase.g + 20, 1 - phase),
        Phaser.Math.Linear(ambientBase.b, ambientBase.b + 35, phase),
      );
    }

    if (this.ambientBloom) {
      const bloomAlpha =
        this.mapId === "dragonValley"
          ? 0.18
          : this.mapId === "moonlitWetland"
            ? 0.08
            : this.mapId === "ancientCave"
              ? 0.04
              : 0.2;
      this.ambientBloom.alpha = bloomAlpha - phase * 0.1 + breathe;
      this.ambientBloom.setScale(
        0.92 + Math.sin(this.time.now / 5500) * 0.05 + breathe,
      );
      this.ambientBloom.x = this.scale.width * (0.18 + phase * 0.12);
      // Color shift from warm gold to cooler as phase increases
      const bloomR = Math.floor(Phaser.Math.Linear(255, 200, phase));
      const bloomG = Math.floor(Phaser.Math.Linear(195, 160, phase));
      const bloomB = Math.floor(Phaser.Math.Linear(107, 140, phase));
      this.ambientBloom.fillColor = Phaser.Display.Color.GetColor(
        bloomR,
        bloomG,
        bloomB,
      );
    }

    if (this.ambientMoon) {
      const moonAlpha =
        this.mapId === "moonlitWetland" || this.mapId === "ancientCave"
          ? 0.1
          : 0.04;
      this.ambientMoon.alpha = moonAlpha + phase * 0.14;
      this.ambientMoon.setScale(0.9 + Math.cos(this.time.now / 6500) * 0.06);
      this.ambientMoon.x = this.scale.width * (0.7 + phase * 0.08);
    }
  }

  private createUnitBacklight(
    textureKey: string,
    tint: number,
    alpha: number,
    scale: number,
  ) {
    return this.add
      .image(0, -1, textureKey)
      .setOrigin(0.5, 0.94)
      .setTint(tint)
      .setAlpha(alpha)
      .setScale(scale)
      .setBlendMode(Phaser.BlendModes.SCREEN);
  }

  private createAuraSigil(
    tint: number,
    alpha: number,
    width: number,
    height: number,
    scale: number,
  ) {
    return this.add
      .ellipse(0, 10, width, height, tint, alpha)
      .setStrokeStyle(2, tint, Math.min(0.6, alpha + 0.2))
      .setScale(scale)
      .setBlendMode(Phaser.BlendModes.SCREEN);
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
    const state = useGameStore.getState();
    const className = state.player.className.toLowerCase();
    const weaponId = state.equipment.weapon?.id;
    const weaponSubtype = weaponId ? ITEMS[weaponId]?.subtype : undefined;
    const weaponVariant =
      weaponSubtype === WeaponSubType.DAGGER
        ? "dagger"
        : weaponSubtype === WeaponSubType.TWO_HAND_SWORD
          ? "greatsword"
          : weaponSubtype === WeaponSubType.ONE_HAND_SWORD
            ? "sword"
            : null;

    if (className.includes("guardian")) {
      if (weaponVariant === "dagger") return "anim_player_guardian_dagger";
      if (weaponVariant === "sword") return "anim_player_guardian_sword";
      if (weaponVariant === "greatsword")
        return "anim_player_guardian_greatsword";
      return "anim_player_guardian";
    }
    if (className.includes("ranger")) return "anim_player_ranger";
    if (className.includes("arcan")) return "anim_player_arcanist";
    if (className.includes("sovereign")) {
      if (weaponVariant === "dagger") return "anim_player_sovereign_dagger";
      if (weaponVariant === "sword") return "anim_player_sovereign_sword";
      if (weaponVariant === "greatsword")
        return "anim_player_sovereign_greatsword";
      return "anim_player_sovereign";
    }
    return weaponVariant === "dagger"
      ? "anim_player_guardian_dagger"
      : weaponVariant === "greatsword"
        ? "anim_player_guardian_greatsword"
        : weaponVariant === "sword"
          ? "anim_player_guardian_sword"
          : "anim_player_guardian";
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
    if (baseId.includes("goblin")) return "anim_monster_orc";
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

  private isBossMonster(baseId: string) {
    return (
      baseId.includes("boss") ||
      baseId.includes("queen") ||
      baseId.includes("lord") ||
      baseId.includes("king")
    );
  }

  private getMonsterScale(baseId: string) {
    if (this.isBossMonster(baseId)) return 1.08;
    if (baseId.includes("dragon") || baseId.includes("wyvern")) return 0.98;
    if (baseId.includes("golem")) return 0.92;
    if (baseId.includes("boar") || baseId.includes("orc")) return 0.86;
    return 0.8;
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
    const state = useGameStore.getState();
    const weaponId = state.equipment.weapon?.id ?? "";
    let base = 760;
    if (weaponId === "hunter_bow") base = 900;
    else if (weaponId === "arcana_staff") base = 1050;
    else if (this.getEquippedWeaponSubtype() === WeaponSubType.DAGGER) base = 620;
    else if (this.getEquippedWeaponSubtype() === WeaponSubType.TWO_HAND_SWORD) base = 920;

    // 공격 속도 버프 적용
    const buffs = state.player.buffs;
    const hasHaste = buffs.some((b) => b.name === "신속" || b.name === "전사의 광기");
    const hasFrenzy = buffs.some((b) => b.name === "광전사의 격노");
    if (hasHaste) base = Math.floor(base * 0.6);
    if (hasFrenzy) base = Math.floor(base * 0.5); // 추가 50% 공속 증가 (중첩)
    return base;
  }

  private getEquippedWeaponSubtype() {
    const weaponId = useGameStore.getState().equipment.weapon?.id;
    return weaponId ? ITEMS[weaponId]?.subtype : undefined;
  }

  private getMeleeWeaponStyle() {
    const subtype = this.getEquippedWeaponSubtype();
    if (subtype === WeaponSubType.DAGGER) {
      return "dagger" as const;
    }
    if (subtype === WeaponSubType.TWO_HAND_SWORD) {
      return "greatsword" as const;
    }
    if (subtype === WeaponSubType.ONE_HAND_SWORD) {
      return "sword" as const;
    }
    return "sword" as const;
  }

  private createGroundPatch(x: number, y: number, mapId: string) {
    const seed = this.noise(
      x * 0.31 + mapId.length,
      y * 0.29 + mapId.length * 2,
    );
    const moisture = this.noise(x * 0.11 + 9, y * 0.17 + 17);
    const ridge = this.noise(x * 0.07 + 41, y * 0.09 + 23);
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
        alpha: 0.94,
        tint: 0xffffff,
        rotation: 0,
        scaleX: 0,
        scaleY: 0,
      };
    }

    if (mapId === "moonlitWetland" && moisture > 0.7) {
      return {
        texture: moisture > 0.82 ? "tile_water" : "tile_wet_stone",
        alpha: 0.85,
        tint: 0xffffff,
        rotation: 0,
        scaleX: 0,
        scaleY: 0,
      };
    }

    if (mapId === "dragonValley") {
      return {
        texture:
          ridge > 0.8
            ? "tile_lava"
            : seed > 0.56
              ? "tile_volcanic"
              : "tile_dirt",
        alpha: ridge > 0.8 ? 0.95 : 0.9,
        tint: 0xffffff,
        rotation: 0,
        scaleX: 0,
        scaleY: 0,
      };
    }

    if (mapId === "silverKnightTown") {
      return {
        texture:
          seed > 0.72
            ? "tile_cobble"
            : seed > 0.34
              ? "tile_marble"
              : "tile_meadow",
        alpha: 0.92,
        tint: 0xffffff,
        rotation: 0,
        scaleX: 0,
        scaleY: 0,
      };
    }

    if (mapId === "giranTown") {
      return {
        texture:
          seed > 0.66
            ? "tile_cobble"
            : seed > 0.32
              ? "tile_marble"
              : "tile_path",
        alpha: 0.9,
        tint: 0xffffff,
        rotation: 0,
        scaleX: 0,
        scaleY: 0,
      };
    }

    if (mapId === "windwoodForest") {
      return {
        texture:
          moisture > 0.62
            ? "tile_moss"
            : seed > 0.48
              ? "tile_forest"
              : "tile_dirt",
        alpha: 0.88,
        tint: 0xffffff,
        rotation: 0,
        scaleX: 0,
        scaleY: 0,
      };
    }

    if (mapId === "orcForest") {
      return {
        texture:
          seed > 0.62
            ? "tile_dirt"
            : ridge > 0.64
              ? "tile_volcanic"
              : "tile_moss",
        alpha: 0.88,
        tint: 0xffffff,
        rotation: 0,
        scaleX: 0,
        scaleY: 0,
      };
    }

    if (mapId === "gludioPlain") {
      return {
        texture:
          moisture > 0.58
            ? "tile_meadow"
            : seed > 0.48
              ? "tile_grass_a"
              : "tile_dirt",
        alpha: 0.9,
        tint: 0xffffff,
        rotation: 0,
        scaleX: 0,
        scaleY: 0,
      };
    }

    if (mapId === "ancientCave") {
      // Dungeon: mix of dark stone, volcanic cracks, cobble floors
      const caveNoise = this.noise(x * 0.23 + 71, y * 0.19 + 53);
      const caveTexture =
        ridge > 0.78
          ? "tile_volcanic"
          : ridge > 0.62
            ? "tile_cobble"
            : caveNoise > 0.6
              ? "tile_wet_stone"
              : "tile_cobble";
      return {
        texture: caveTexture,
        alpha: 0.88 + caveNoise * 0.08,
        tint: 0xd8d0c8,
        rotation: 0,
        scaleX: 0,
        scaleY: 0,
      };
    }

    return {
      texture:
        moisture > 0.6
          ? "tile_meadow"
          : seed > 0.54
            ? "tile_grass_a"
            : "tile_grass_b",
      alpha: 0.92,
      tint: 0xffffff,
      rotation: 0,
      scaleX: 0,
      scaleY: 0,
    };
  }

  private noise(x: number, y: number) {
    const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return value - Math.floor(value);
  }

  private getGradeVocabulary(): VocabularyEntry[] {
    const grade = useGameStore.getState().grade ?? 3;
    const fullVocab =
      grade >= 6
        ? GRADE6_VOCABULARY
        : grade >= 5
          ? GRADE5_VOCABULARY
          : grade >= 4
            ? GRADE4_VOCABULARY
            : GRADE3_VOCABULARY;

    const store = useGameStore.getState();
    const usedIds = store.usedWordIds;
    const wrongIds = store.wrongWordIds;

    // 아직 안 나온 단어 + 틀렸던 단어 우선
    const unused = fullVocab.filter((w) => !usedIds.has(w.en));
    const wrong = fullVocab.filter((w) => wrongIds.has(w.en));

    // 풀에서 아직 안 나온 단어가 충분하면 그것을 사용
    // 부족하면 틀렸던 단어 포함, 그래도 부족하면 전체 리셋
    if (unused.length >= 10) {
      return unused;
    }
    if (wrong.length >= 4) {
      return wrong;
    }
    // 모든 단어를 다 풀었으면 리셋
    useGameStore.getState().usedWordIds.clear();
    return fullVocab;
  }

  private pickQuizWord(vocab: VocabularyEntry[]): {
    entry: VocabularyEntry;
    index: number;
  } {
    const idx = Math.floor(Math.random() * vocab.length);
    const entry = vocab[idx];
    // 사용한 단어 기록
    useGameStore.getState().markWordUsed(entry.en);
    return { entry, index: idx };
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

  private checkPortalTransitions() {
    if (!this.isOfflineMode || !this.localPlayer || this.isTransitioning)
      return;
    const px = this.localPlayer.x;
    const py = this.localPlayer.y;
    const map = MAPS[this.mapId] ?? MAPS.speakingIsland;
    const mapW = map.width * TILE_WIDTH + 320;
    const mapH = map.height * TILE_HEIGHT + 260;

    switch (this.mapId) {
      case "speakingIsland":
        if (px > mapW - 180 && py > 320 && py < 480)
          this.handleMapTransition("silverKnightTown", 240, 400);
        // 고대 동굴 입구 (픽셀 2800, 162)
        if (Math.abs(px - 2800) < 55 && Math.abs(py - 162) < 55)
          this.handleMapTransition("ancientCave", 600, 2400);
        break;
      case "ancientCave":
        // 동굴 출구 (맵 하단 중앙)
        if (py > mapH - 150 && px > mapW * 0.35 && px < mapW * 0.65)
          this.handleMapTransition("speakingIsland", 2800, 200);
        break;
      case "silverKnightTown":
        if (px < 180 && py > 320 && py < 480)
          this.handleMapTransition("speakingIsland", mapW - 240, 400);
        if (py < 180 && px > mapW * 0.35 && px < mapW * 0.65)
          this.handleMapTransition("windwoodForest", 600, 400);
        if (px > mapW - 180 && py > 320 && py < 480)
          this.handleMapTransition("orcForest", 240, 400);
        if (py > mapH - 180 && px > mapW * 0.35 && px < mapW * 0.65)
          this.handleMapTransition("gludioPlain", 600, 300);
        break;
      case "windwoodForest":
        if (py > mapH - 180 && px > 400 && px < 800)
          this.handleMapTransition("silverKnightTown", mapW * 0.5, 240);
        if (px > mapW - 180 && py > 320 && py < 480)
          this.handleMapTransition("giranTown", 240, 400);
        if (py > mapH - 180 && px > mapW * 0.5 && px < mapW * 0.7)
          this.handleMapTransition("moonlitWetland", 400, 300);
        break;
      case "orcForest":
        if (px < 180 && py > 320 && py < 480)
          this.handleMapTransition("silverKnightTown", mapW - 240, 400);
        break;
      case "gludioPlain":
        if (py < 180 && px > mapW * 0.35 && px < mapW * 0.65)
          this.handleMapTransition("silverKnightTown", mapW * 0.5, mapH - 240);
        break;
      case "moonlitWetland":
        if (py < 180 && px > 400 && px < 800)
          this.handleMapTransition("windwoodForest", mapW * 0.55, mapH - 240);
        break;
      case "giranTown":
        if (px < 180 && py > 320 && py < 480)
          this.handleMapTransition("windwoodForest", mapW - 240, 400);
        if (px > mapW - 180 && py > 320 && py < 480)
          this.handleMapTransition("dragonValley", 240, 400);
        break;
      case "dragonValley":
        if (px < 180 && py > 320 && py < 480)
          this.handleMapTransition("giranTown", mapW - 240, 400);
        break;
    }
  }

  private handleMapTransition(
    newMapId: string,
    spawnX: number,
    spawnY: number,
  ) {
    this.isTransitioning = true;
    this.stopAutoAttack();

    // 채팅 알림
    useGameStore.getState().addChat({
      id: `transition-${Date.now()}`,
      author: "시스템",
      channel: "system",
      message: `${MAPS[newMapId]?.name ?? newMapId}(으)로 이동합니다...`,
      timestamp: Date.now(),
    });

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      useGameStore.getState().setCurrentMapId(newMapId);
      this.scene.restart({ mapId: newMapId, spawnX, spawnY });
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
      const mBase = monsterId.split("-offline-")[0];
      const isAggressive = MONSTERS[mBase]?.aggressive ?? true;
      // Aggressive monsters spot player from further away
      const AGGRO_RANGE = isAggressive ? 320 : 240;
      const ATTACK_RANGE = 50;
      // Leash: monster gives up if too far from spawn
      const LEASH_DIST = 900;

      // Check if monster was recently attacked by player (fight back mechanic)
      const monsterData = this.offlineMonsterHp.get(monsterId);
      const wasRecentlyAttacked =
        monsterData?.lastPlayerAttack &&
        now - monsterData.lastPlayerAttack < 10000;
      const distToSpawn = Phaser.Math.Distance.Between(
        sprite.x,
        sprite.y,
        ai.spawnX,
        ai.spawnY,
      );

      if (distToPlayer < AGGRO_RANGE || wasRecentlyAttacked) {
        ai.state = "chase";
        ai.lastChaseAt = now;
      } else if (ai.state === "chase" && now - ai.lastChaseAt > 8000) {
        // Give up chase after 8 seconds without sighting
        ai.state = "idle";
      } else if (distToSpawn > LEASH_DIST) {
        // Too far from home — return to spawn
        ai.state = "idle";
        ai.wanderTargetX = ai.spawnX;
        ai.wanderTargetY = ai.spawnY;
      }

      if (ai.state === "chase") {
        // Don't chase player into village safe zone
        if (
          STARTER_TOWN_RECT.contains(this.localPlayer!.x, this.localPlayer!.y)
        ) {
          ai.state = "idle";
          ai.lastChaseAt = 0;
        } else if (distToPlayer > ATTACK_RANGE) {
          const speed = (MONSTERS[mBase]?.moveSpeed ?? 2) * 200; // Fast chase speed
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
        } else {
          // Within attack range — deal damage to player
          const ATTACK_INTERVAL = 1200;
          if (now - ai.lastAttackAt >= ATTACK_INTERVAL) {
            const store = useGameStore.getState();
            if (store.ui.deathOpen || store.player.hp <= 0) return;

            const monsterData = this.offlineMonsterHp.get(monsterId);
            if (!monsterData) return;

            const dmg = Math.max(
              1,
              monsterData.atk + Phaser.Math.Between(-1, 2),
            );
            const newHp = Math.max(0, store.player.hp - dmg);
            store.setPlayer({ hp: newHp });
            ai.lastAttackAt = now;

            // Add system message for damage taken
            store.addChat({
              id: `monster_damage_${Date.now()}`,
              channel: "system",
              author: "시스템",
              message: `몬스터가 당신에게 ${dmg} 데미지를 입혔습니다!`,
              timestamp: Date.now(),
            });

            // Mark player in combat and reset the 6-second exit timer
            store.setInCombat(true);
            if (this.combatEndTimer) this.combatEndTimer.remove();
            this.combatEndTimer = this.time.delayedCall(6000, () => {
              useGameStore.getState().setInCombat(false);
            });

            if (this.localPlayer) {
              this.showDamageNumber(
                this.localPlayer.x,
                this.localPlayer.y,
                dmg,
                false,
              );
              this.tweens.add({
                targets: this.localPlayer.spriteBody,
                alpha: 0.15,
                duration: 60,
                yoyo: true,
                repeat: 2,
                ease: "Linear",
              });
            }

            if (newHp <= 0) {
              const expLost = Math.floor(store.player.exp * 0.05);
              store.openDeath(expLost);
            }
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

  private showChatBubble(playerId: string, message: string) {
    const sprite = this.playerSprites.get(playerId);
    if (!sprite) return;

    // Truncate long messages
    const displayMsg =
      message.length > 30 ? message.slice(0, 30) + "..." : message;

    // Background plate
    const bubbleBg = this.add.graphics();
    const textObj = this.add
      .text(0, -82, displayMsg, {
        fontSize: "11px",
        color: "#f2e4c2",
        fontFamily: "sans-serif",
        stroke: "#07101a",
        strokeThickness: 2,
        wordWrap: { width: 140 },
        align: "center",
      })
      .setOrigin(0.5, 1);

    const bounds = textObj.getBounds();
    const padX = 8;
    const padY = 5;
    const bgW = bounds.width + padX * 2;
    const bgH = bounds.height + padY * 2;

    // Draw rounded bubble with tail
    bubbleBg.fillStyle(0x0a0e18, 0.88);
    bubbleBg.fillRoundedRect(-bgW / 2, -74 - bgH, bgW, bgH, 6);
    bubbleBg.lineStyle(1, 0xb48a46, 0.5);
    bubbleBg.strokeRoundedRect(-bgW / 2, -74 - bgH, bgW, bgH, 6);
    // Tail triangle
    bubbleBg.fillStyle(0x0a0e18, 0.88);
    bubbleBg.fillTriangle(-4, -74, 4, -74, 0, -68);

    textObj.setPosition(0, -74 - padY);

    const container = this.add.container(0, 0, [bubbleBg, textObj]);
    sprite.add(container);

    // Fade in
    container.setAlpha(0);
    container.y = 4;
    this.tweens.add({
      targets: container,
      alpha: 1,
      y: 0,
      duration: 200,
      ease: "Quad.Out",
    });

    // Auto remove after 4 seconds
    this.time.delayedCall(4000, () => {
      this.tweens.add({
        targets: container,
        alpha: 0,
        y: -8,
        duration: 300,
        ease: "Quad.In",
        onComplete: () => container.destroy(),
      });
    });
  }

  private showDamageNumber(
    x: number,
    y: number,
    damage: number,
    isCrit: boolean,
  ) {
    // === Lineage Remaster damage numbers — dramatic impact ===
    // Outer impact glow
    const outerGlow = this.add
      .ellipse(
        x,
        y - 30,
        isCrit ? 96 : 64,
        isCrit ? 48 : 32,
        isCrit ? 0xffdc73 : 0xffffff,
        isCrit ? 0.28 : 0.14,
      )
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(9997);
    // Inner bright flash
    const innerFlash = this.add
      .ellipse(
        x,
        y - 30,
        isCrit ? 48 : 32,
        isCrit ? 24 : 16,
        0xffffff,
        isCrit ? 0.5 : 0.3,
      )
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(9998);

    // Shadow text for depth
    const shadow = this.add
      .text(x + 1, y - 28, isCrit ? `${damage}!` : String(damage), {
        fontSize: isCrit ? "26px" : "20px",
        color: "#000000",
        fontFamily: "serif",
        fontStyle: isCrit ? "bold" : "normal",
      })
      .setOrigin(0.5)
      .setAlpha(0.5)
      .setDepth(9998);

    // Main damage text
    const text = this.add
      .text(x, y - 30, isCrit ? `${damage}!` : String(damage), {
        fontSize: isCrit ? "26px" : "20px",
        color: isCrit ? "#ffe58a" : "#f7fbff",
        fontFamily: "serif",
        stroke: isCrit ? "#8b4513" : "#07101a",
        strokeThickness: isCrit ? 5 : 4,
        fontStyle: isCrit ? "bold" : "normal",
      })
      .setOrigin(0.5)
      .setDepth(9999);

    // Crit: spawn additional star burst
    if (isCrit) {
      for (let si = 0; si < 4; si++) {
        const sAngle = (si / 4) * Math.PI * 2 + Math.random() * 0.5;
        const star = this.add
          .ellipse(x, y - 30, 4, 4, 0xffe58a, 0.8)
          .setDepth(9998);
        this.effectLayer?.add(star);
        this.tweens.add({
          targets: star,
          x: x + Math.cos(sAngle) * 28,
          y: y - 30 + Math.sin(sAngle) * 18,
          alpha: 0,
          scale: 0.2,
          duration: 350,
          ease: "Power2.Out",
          onComplete: () => star.destroy(),
        });
      }
    }

    this.effectLayer?.add(outerGlow);
    this.effectLayer?.add(innerFlash);
    this.effectLayer?.add(shadow);
    this.effectLayer?.add(text);

    // Outer glow expansion
    this.tweens.add({
      targets: outerGlow,
      scaleX: isCrit ? 2.2 : 1.6,
      scaleY: isCrit ? 2.2 : 1.6,
      alpha: 0,
      duration: 400,
      ease: "Quad.Out",
      onComplete: () => outerGlow.destroy(),
    });
    // Inner flash — fast fade
    this.tweens.add({
      targets: innerFlash,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 200,
      ease: "Quad.Out",
      onComplete: () => innerFlash.destroy(),
    });
    // Text — scale up then float
    this.tweens.add({
      targets: text,
      scale: isCrit ? 1.2 : 1.05,
      duration: 100,
      yoyo: true,
      ease: "Quad.Out",
    });
    this.tweens.add({
      targets: [text, shadow],
      y: y - (isCrit ? 100 : 88),
      alpha: 0,
      duration: isCrit ? 1100 : 950,
      ease: "Quad.Out",
      onComplete: () => {
        text.destroy();
        shadow.destroy();
      },
    });
  }

  private showHitEffect(x: number, y: number) {
    // === Lineage Remaster hit effect — impact ring + slash + sparks ===
    // Impact flash
    const flash = this.add
      .ellipse(x, y - 18, 16, 16, 0xffffff, 0.6)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.effectLayer?.add(flash);
    this.tweens.add({
      targets: flash,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 150,
      ease: "Quad.Out",
      onComplete: () => flash.destroy(),
    });

    // Expanding ring
    const ring = this.add
      .ellipse(x, y - 18, 28, 28, 0xffffff, 0.06)
      .setStrokeStyle(2.5, 0xffefb0, 0.7);
    this.effectLayer?.add(ring);
    this.tweens.add({
      targets: ring,
      scaleX: 2.0,
      scaleY: 2.0,
      alpha: 0,
      duration: 260,
      ease: "Quad.Out",
      onComplete: () => ring.destroy(),
    });

    // Slash lines (cross pattern)
    const slashAngle = Math.random() * Math.PI;
    for (let si = 0; si < 2; si++) {
      const ang = slashAngle + si * (Math.PI / 2);
      const slashLen = 18;
      const slash = this.add.graphics().setDepth(9990);
      slash.lineStyle(2, 0xffffff, 0.8);
      slash.beginPath();
      slash.moveTo(
        x + Math.cos(ang) * -slashLen,
        y - 18 + Math.sin(ang) * -slashLen,
      );
      slash.lineTo(
        x + Math.cos(ang) * slashLen,
        y - 18 + Math.sin(ang) * slashLen,
      );
      slash.strokePath();
      this.effectLayer?.add(slash);
      this.tweens.add({
        targets: slash,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 200,
        ease: "Quad.Out",
        onComplete: () => slash.destroy(),
      });
    }

    // Sparks — more varied
    for (let i = 0; i < 7; i += 1) {
      const angle = (i / 7) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 16 + Math.random() * 20;
      const sparkColor = [0xffffff, 0xffe060, 0xffb040, 0xfff0a0][i % 4];
      const spark = this.add
        .ellipse(x, y - 20, 5, 5, sparkColor, 0.9)
        .setScale(0.5 + Math.random() * 0.7);
      this.effectLayer?.add(spark);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * dist,
        y: y - 20 + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.08,
        duration: 300 + Math.random() * 180,
        ease: "Power2.Out",
        onComplete: () => spark.destroy(),
      });
    }
  }

  private showEnhancedHitFeedback(
    x: number,
    y: number,
    damage: number,
    isCrit: boolean,
    tint = 0xffc98f,
  ) {
    const slashTint = isCrit ? 0xfff1a8 : tint;
    const slash = this.add
      .arc(x, y - 12, isCrit ? 40 : 30, 210, 338, false, slashTint, 0.18)
      .setStrokeStyle(isCrit ? 5 : 4, slashTint, 0.95)
      .setRotation(Phaser.Math.FloatBetween(-0.14, 0.14));
    const shock = this.add
      .ellipse(x, y - 14, isCrit ? 40 : 30, isCrit ? 24 : 18, slashTint, 0.18)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.effectLayer?.add(slash);
    this.effectLayer?.add(shock);
    this.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: isCrit ? 1.8 : 1.45,
      scaleY: isCrit ? 1.8 : 1.45,
      duration: isCrit ? 230 : 180,
      ease: "Power2.Out",
      onComplete: () => slash.destroy(),
    });
    this.tweens.add({
      targets: shock,
      scaleX: isCrit ? 2 : 1.65,
      scaleY: isCrit ? 2 : 1.65,
      alpha: 0,
      duration: isCrit ? 240 : 180,
      ease: "Power2.Out",
      onComplete: () => shock.destroy(),
    });

    if (isCrit) {
      this.spawnCriticalBurst(x, y - 16, damage);
    }
  }

  private spawnCriticalBurst(x: number, y: number, damage: number) {
    const burst = this.add
      .star(x, y, 8, 10, 24, 0xfff2a6, 0.9)
      .setStrokeStyle(2, 0xffffff, 0.9);
    this.effectLayer?.add(burst);
    this.tweens.add({
      targets: burst,
      scaleX: 1.9,
      scaleY: 1.9,
      alpha: 0,
      duration: 280,
      ease: "Cubic.Out",
      onComplete: () => burst.destroy(),
    });

    const crit = this.add
      .text(x, y - 26, `CRIT ${damage}`, {
        fontSize: "14px",
        color: "#fff4a3",
        stroke: "#4a2300",
        strokeThickness: 4,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(9999);
    this.effectLayer?.add(crit);
    this.tweens.add({
      targets: crit,
      y: y - 58,
      alpha: 0,
      duration: 620,
      ease: "Quad.Out",
      onComplete: () => crit.destroy(),
    });
  }

  private createBadgeMarker(x: number, y: number, text: string, tint: number) {
    const badge = this.add.container(x, y);
    const plate = this.add
      .ellipse(0, 0, 44, 18, tint, 0.18)
      .setStrokeStyle(1, 0xffffff, 0.16);
    const label = this.add
      .text(0, 0, text, {
        fontSize: "9px",
        color: "#fdf7e6",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    badge.add([plate, label]);
    return badge;
  }

  private getPlayerClassBadgeText() {
    const className = useGameStore.getState().player.className.toLowerCase();
    if (className.includes("guardian")) return "GDN";
    if (className.includes("ranger")) return "RNG";
    if (className.includes("arcan")) return "ARC";
    if (className.includes("sovereign")) return "SVR";
    return "ADV";
  }

  private getNpcRoleBadgeText(role: string) {
    switch (role) {
      case "weapon":
        return "FORGE";
      case "armor":
        return "WARD";
      case "magic":
        return "ARC";
      case "inn":
        return "REST";
      case "blacksmith":
        return "SMITH";
      default:
        return "NPC";
    }
  }

  private getNpcRoleBadgeColor(role: string) {
    switch (role) {
      case "weapon":
        return 0x7fc2ff;
      case "armor":
        return 0x7ee0c1;
      case "magic":
        return 0xd889ff;
      case "inn":
        return 0xffb17f;
      case "blacksmith":
        return 0xff8a68;
      default:
        return 0xe6db97;
    }
  }

  private spawnArcaneBurst(x: number, y: number, tint: number) {
    const ring = this.add
      .ellipse(x, y, 28, 28, tint, 0.18)
      .setStrokeStyle(2, 0xffffff, 0.7);
    const core = this.add
      .star(x, y, 6, 6, 14, tint, 0.42)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.effectLayer?.add(ring);
    this.effectLayer?.add(core);
    this.tweens.add({
      targets: ring,
      scaleX: 2.2,
      scaleY: 2.2,
      alpha: 0,
      duration: 240,
      ease: "Sine.Out",
      onComplete: () => ring.destroy(),
    });
    this.tweens.add({
      targets: core,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 220,
      ease: "Sine.Out",
      onComplete: () => core.destroy(),
    });
  }

  private spawnWeaponTrail(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    tint: number,
    style: "dagger" | "sword" | "greatsword" = "sword",
  ) {
    const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY);
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const distance = Phaser.Math.Distance.Between(startX, startY, endX, endY);
    const trailWidth =
      style === "dagger"
        ? distance * 0.72
        : style === "greatsword"
          ? distance * 1.08
          : distance;
    const trailHeight =
      style === "dagger" ? 6 : style === "greatsword" ? 14 : 10;
    const coreWidth =
      trailWidth *
      (style === "dagger" ? 0.72 : style === "greatsword" ? 0.92 : 0.88);
    const coreHeight = style === "dagger" ? 3 : style === "greatsword" ? 5 : 4;
    const trail = this.add
      .rectangle(
        midX,
        midY,
        trailWidth,
        trailHeight,
        tint,
        style === "dagger" ? 0.22 : style === "greatsword" ? 0.2 : 0.16,
      )
      .setRotation(angle)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const trailCore = this.add
      .rectangle(
        midX,
        midY,
        coreWidth,
        coreHeight,
        0xffffff,
        style === "dagger" ? 0.24 : style === "greatsword" ? 0.2 : 0.18,
      )
      .setRotation(angle)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.effectLayer?.add(trail);
    this.effectLayer?.add(trailCore);
    this.tweens.add({
      targets: trail,
      alpha: 0,
      scaleY: style === "dagger" ? 0.12 : style === "greatsword" ? 0.24 : 0.2,
      duration: style === "dagger" ? 100 : style === "greatsword" ? 170 : 140,
      ease: "Quad.Out",
      onComplete: () => trail.destroy(),
    });
    this.tweens.add({
      targets: trailCore,
      alpha: 0,
      scaleY: style === "dagger" ? 0.1 : style === "greatsword" ? 0.18 : 0.15,
      duration: style === "dagger" ? 90 : style === "greatsword" ? 150 : 120,
      ease: "Quad.Out",
      onComplete: () => trailCore.destroy(),
    });
  }

  private spawnMeleeAfterimage(tint = 0xffdfab) {
    if (!this.localPlayer) {
      return;
    }

    const ghost = this.add
      .image(
        this.localPlayer.x,
        this.localPlayer.y + this.localPlayer.spriteBody.y,
        this.localPlayer.spriteBody.texture.key,
      )
      .setOrigin(0.5, 0.94)
      .setScale(
        this.localPlayer.spriteBody.scaleX,
        this.localPlayer.spriteBody.scaleY,
      )
      .setTint(tint)
      .setAlpha(0.22)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.effectLayer?.add(ghost);
    this.tweens.add({
      targets: ghost,
      alpha: 0,
      x:
        ghost.x +
        (this.localPlayer.facing === "e" ||
        this.localPlayer.facing === "se" ||
        this.localPlayer.facing === "ne"
          ? 14
          : -14),
      duration: 150,
      ease: "Quad.Out",
      onComplete: () => ghost.destroy(),
    });
  }

  private attachProjectileTrail(
    projectile: Phaser.GameObjects.Image,
    tint: number,
  ) {
    this.time.addEvent({
      delay: 24,
      repeat: 7,
      callback: () => {
        if (!projectile.active) {
          return;
        }

        const ember = this.add
          .ellipse(projectile.x, projectile.y, 10, 6, tint, 0.22)
          .setRotation(projectile.rotation)
          .setBlendMode(Phaser.BlendModes.SCREEN);
        const spark = this.add
          .ellipse(projectile.x, projectile.y, 4, 4, 0xffffff, 0.32)
          .setBlendMode(Phaser.BlendModes.SCREEN);
        this.effectLayer?.add(ember);
        this.effectLayer?.add(spark);
        this.tweens.add({
          targets: ember,
          alpha: 0,
          scaleX: 0.1,
          scaleY: 0.1,
          duration: 180,
          ease: "Quad.Out",
          onComplete: () => ember.destroy(),
        });
        this.tweens.add({
          targets: spark,
          alpha: 0,
          scaleX: 0.1,
          scaleY: 0.1,
          duration: 140,
          ease: "Quad.Out",
          onComplete: () => spark.destroy(),
        });
      },
    });
  }

  private spawnLeafBurst(x: number, y: number, tint: number) {
    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2;
      const leaf = this.add
        .ellipse(x, y, 10, 5, tint, 0.46)
        .setRotation(angle)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      this.effectLayer?.add(leaf);
      this.tweens.add({
        targets: leaf,
        x: x + Math.cos(angle) * (22 + index * 4),
        y: y + Math.sin(angle) * (16 + index * 3),
        alpha: 0,
        duration: 220 + index * 20,
        ease: "Quad.Out",
        onComplete: () => leaf.destroy(),
      });
    }
  }

  private spawnShieldPulse(x: number, y: number, tint: number) {
    const pulse = this.add
      .ellipse(x, y, 34, 26, tint, 0.18)
      .setStrokeStyle(2, tint, 0.8);
    const guard = this.add
      .star(x, y, 4, 8, 16, tint, 0.16)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.effectLayer?.add(pulse);
    this.effectLayer?.add(guard);
    this.tweens.add({
      targets: pulse,
      scaleX: 1.9,
      scaleY: 1.9,
      alpha: 0,
      duration: 220,
      ease: "Quad.Out",
      onComplete: () => pulse.destroy(),
    });
    this.tweens.add({
      targets: guard,
      alpha: 0,
      scaleX: 1.7,
      scaleY: 1.7,
      duration: 200,
      ease: "Quad.Out",
      onComplete: () => guard.destroy(),
    });
  }

  private getPlayerClassTone() {
    const className = useGameStore.getState().player.className.toLowerCase();
    if (className.includes("ranger")) {
      return {
        classId: "ranger",
        slashTint: 0xc7f19f,
        impactTint: 0xe6ffd0,
        trailTint: 0x8fe0a8,
        projectileTint: 0xe7f7c2,
        burstTint: 0xa5ee82,
        afterimageTint: 0xbdf3b8,
      };
    }
    if (className.includes("arcan")) {
      return {
        classId: "arcanist",
        slashTint: 0xe1b4ff,
        impactTint: 0xf2ddff,
        trailTint: 0xc494ff,
        projectileTint: 0xf3dcff,
        burstTint: 0xcba2ff,
        afterimageTint: 0xe0b7ff,
      };
    }
    if (className.includes("sovereign")) {
      return {
        classId: "sovereign",
        slashTint: 0xf2cb71,
        impactTint: 0xffefb8,
        trailTint: 0xe3ba54,
        projectileTint: 0xffefb8,
        burstTint: 0xf0cf85,
        afterimageTint: 0xf7d88f,
      };
    }
    return {
      classId: "guardian",
      slashTint: 0x9fc2ff,
      impactTint: 0xe0ebff,
      trailTint: 0x77a2f8,
      projectileTint: 0xd9e7ff,
      burstTint: 0x9ab8ff,
      afterimageTint: 0xb4ceff,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 소환 시스템 (마법의 돌 → 정령/전사 소환)
  // ═══════════════════════════════════════════════════════════════════════

  private activateSummonStone(stoneId: string) {
    if (!this.localPlayer) return;

    const SUMMON_CONFIG = {
      summon_stone_lesser: {
        hp: 35,
        atk: 10,
        name: "하급 정령",
        tier: "lesser",
      },
      summon_stone_mid: { hp: 70, atk: 20, name: "중급 정령", tier: "mid" },
      summon_stone_greater: {
        hp: 120,
        atk: 35,
        name: "상급 전사",
        tier: "greater",
      },
    };

    const cfg = SUMMON_CONFIG[stoneId as keyof typeof SUMMON_CONFIG];
    if (!cfg) return;

    this.clearSummons();

    const count = this.getWisWeightedSummonCount();
    const expireAt = this.time.now + 600000; // 10분

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const spawnX = this.localPlayer.x + Math.cos(angle) * 90;
      const spawnY = this.localPlayer.y + Math.sin(angle) * 60;
      const sprite = this.createSummonSprite(
        spawnX,
        spawnY,
        cfg.name,
        cfg.tier,
      );
      this.summonedAllies.push({
        sprite,
        hp: cfg.hp,
        maxHp: cfg.hp,
        atk: cfg.atk,
        expireAt,
        targetId: null,
        lastAttackAt: 0,
      });
    }

    this.spawnSummonEffect(this.localPlayer.x, this.localPlayer.y, cfg.tier);
    this.updateSummonHud();

    useGameStore.getState().addChat({
      id: crypto.randomUUID(),
      channel: "system",
      author: "소환",
      message: `✦ ${cfg.name} ${count}마리 소환! 10분간 함께 싸웁니다.`,
      timestamp: Date.now(),
    });
  }

  private createSummonSprite(x: number, y: number, name: string, tier: string) {
    const tintColor =
      tier === "greater" ? 0xffd700 : tier === "mid" ? 0x88aaff : 0x44ee88;
    const container = this.add.container(
      x,
      y,
    ) as Phaser.GameObjects.Container & {
      hpFill: Phaser.GameObjects.Rectangle;
      lastX: number;
      lastY: number;
    };

    const shadow = this.add.ellipse(0, 18, 40, 22, 0x000000, 0.28);
    const aura = this.add
      .ellipse(0, 10, 56, 34, tintColor, 0.1)
      .setStrokeStyle(1.5, tintColor, 0.55);
    const body = this.add
      .ellipse(0, -8, 34, 42, tintColor, 0.82)
      .setStrokeStyle(2, 0xffffff, 0.25);
    const glow = this.add.ellipse(0, -14, 16, 20, 0xffffff, 0.2);
    const label = this.add
      .text(0, -46, name, {
        fontSize: "9px",
        color: `#${tintColor.toString(16).padStart(6, "0")}`,
        stroke: "#000000",
        strokeThickness: 3,
        resolution: 2,
      })
      .setOrigin(0.5, 1);
    const hpBack = this.add.rectangle(0, 28, 42, 5, 0x1a0000, 0.85);
    const hpFill = this.add
      .rectangle(-21, 28, 42, 5, 0x44ff88, 0.9)
      .setOrigin(0, 0.5);

    container.add([shadow, aura, body, glow, label, hpBack, hpFill]);
    container.hpFill = hpFill;
    container.lastX = x;
    container.lastY = y;

    this.actorLayer?.add(container);

    container.setAlpha(0).setScale(0.3);
    this.tweens.add({
      targets: container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: "Back.Out",
    });

    return container;
  }

  private updateSummonedAllies() {
    if (
      !this.isOfflineMode ||
      !this.localPlayer ||
      this.summonedAllies.length === 0
    )
      return;
    const now = this.time.now;

    // Remove expired or dead allies
    this.summonedAllies = this.summonedAllies.filter((ally) => {
      if (now >= ally.expireAt || ally.hp <= 0) {
        this.tweens.add({
          targets: ally.sprite,
          alpha: 0,
          scaleX: 0.3,
          scaleY: 0.3,
          duration: 320,
          ease: "Power2.In",
          onComplete: () => {
            if (ally.sprite.active) ally.sprite.destroy();
          },
        });
        return false;
      }
      return true;
    });

    this.updateSummonHud();
    if (this.summonedAllies.length === 0) return;

    const SUMMON_ATTACK_RANGE = 58;
    const SUMMON_CHASE_RANGE = 300;
    const SUMMON_MOVE_SPEED = 130;
    const SUMMON_ATTACK_INTERVAL = 900;

    this.summonedAllies.forEach((ally) => {
      if (!ally.sprite.active) return;

      // Find nearest live monster
      let nearestId: string | null = null;
      let nearestDist = Infinity;

      this.monsterSprites.forEach((ms, mid) => {
        if (!ms.visible) return;
        const monData = this.offlineMonsterHp.get(mid);
        if (!monData || monData.hp <= 0) return;
        const dist = Phaser.Math.Distance.Between(
          ally.sprite.x,
          ally.sprite.y,
          ms.x,
          ms.y,
        );
        if (dist < SUMMON_CHASE_RANGE && dist < nearestDist) {
          nearestDist = dist;
          nearestId = mid;
        }
      });

      ally.targetId = nearestId;

      if (nearestId) {
        const lockedId = nearestId as string; // narrow type for closures
        const target = this.monsterSprites.get(lockedId);
        if (!target) return;

        if (nearestDist > SUMMON_ATTACK_RANGE) {
          // Chase
          const angle = Phaser.Math.Angle.Between(
            ally.sprite.x,
            ally.sprite.y,
            target.x,
            target.y,
          );
          ally.sprite.lastX = ally.sprite.x;
          ally.sprite.lastY = ally.sprite.y;
          ally.sprite.x += Math.cos(angle) * SUMMON_MOVE_SPEED * (1 / 60);
          ally.sprite.y += Math.sin(angle) * SUMMON_MOVE_SPEED * (1 / 60);
        } else {
          // Attack
          if (now - ally.lastAttackAt >= SUMMON_ATTACK_INTERVAL) {
            ally.lastAttackAt = now;
            const monData = this.offlineMonsterHp.get(lockedId);
            if (monData && monData.hp > 0) {
              const dmg = ally.atk + Math.floor(Math.random() * 5);
              const newHp = Math.max(0, monData.hp - dmg);
              this.offlineMonsterHp.set(lockedId, { ...monData, hp: newHp });

              this.showDamageNumber(target.x, target.y - 10, dmg, false);

              if (target.spriteBody) {
                this.tweens.add({
                  targets: target.spriteBody,
                  alpha: 0.18,
                  duration: 50,
                  yoyo: true,
                });
              }

              // Update monster HP bar
              const ratio = newHp / monData.maxHp;
              target.hpFill.width = 50 * ratio;

              // Monster dies
              if (newHp <= 0) {
                const mBase = lockedId.split("-offline-")[0];
                const mDef = MONSTERS[mBase];
                const goldMin = mDef?.goldRange?.[0] ?? 5;
                const goldMax = mDef?.goldRange?.[1] ?? 15;
                const gold =
                  goldMin + Math.floor(Math.random() * (goldMax - goldMin + 1));
                const exp = Math.floor((mDef?.exp ?? 10) * 0.5);

                useGameStore
                  .getState()
                  .applyOfflineReward({ gold, exp, items: [] });
                useGameStore
                  .getState()
                  .registerKill(mBase, mDef?.isBoss ?? false);

                const ai = this.monsterAI.get(lockedId);
                const respawnMs = (mDef?.respawnTime ?? 30) * 1000;
                target.setVisible(false);
                this.showDeathEffect(target.x, target.y);

                this.time.delayedCall(respawnMs, () => {
                  if (!target.active) return;
                  this.offlineMonsterHp.set(lockedId, {
                    ...monData,
                    hp: monData.maxHp,
                  });
                  if (ai) {
                    ai.state = "idle";
                    ai.lastChaseAt = 0;
                  }
                  target.setPosition(
                    ai?.spawnX ?? target.x,
                    ai?.spawnY ?? target.y,
                  );
                  target.hpFill.width = 50;
                  target.setVisible(true);
                  target.setAlpha(0);
                  this.tweens.add({ targets: target, alpha: 1, duration: 600 });
                });
              }
            }
          }
        }
      } else {
        // No target: loosely follow player
        const distToPlayer = Phaser.Math.Distance.Between(
          ally.sprite.x,
          ally.sprite.y,
          this.localPlayer!.x,
          this.localPlayer!.y,
        );
        if (distToPlayer > 110) {
          const angle = Phaser.Math.Angle.Between(
            ally.sprite.x,
            ally.sprite.y,
            this.localPlayer!.x,
            this.localPlayer!.y,
          );
          ally.sprite.lastX = ally.sprite.x;
          ally.sprite.lastY = ally.sprite.y;
          ally.sprite.x +=
            Math.cos(angle) * SUMMON_MOVE_SPEED * 0.75 * (1 / 60);
          ally.sprite.y +=
            Math.sin(angle) * SUMMON_MOVE_SPEED * 0.75 * (1 / 60);
        }
      }
    });
  }

  private updateSummonHud() {
    if (this.summonedAllies.length === 0) {
      this.summonHudText?.setVisible(false);
      this.summonHudBg?.setVisible(false);
      return;
    }

    const now = this.time.now;
    const minExpire = Math.min(...this.summonedAllies.map((a) => a.expireAt));
    const secsLeft = Math.max(0, Math.ceil((minExpire - now) / 1000));

    if (!this.summonHudText) {
      const w = this.scale.width;
      this.summonHudBg = this.add.graphics().setScrollFactor(0).setDepth(1500);
      this.summonHudText = this.add
        .text(w / 2, 145, "", {
          fontSize: "11px",
          color: "#88ffbb",
          stroke: "#001a08",
          strokeThickness: 4,
          resolution: 2,
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(1501);
    }

    const w = this.scale.width;
    this.summonHudBg!.clear();
    this.summonHudBg!.fillStyle(0x061a0c, 0.88);
    this.summonHudBg!.fillRoundedRect(w / 2 - 90, 133, 180, 24, 8);
    this.summonHudBg!.lineStyle(1, 0x44ff88, 0.45);
    this.summonHudBg!.strokeRoundedRect(w / 2 - 90, 133, 180, 24, 8);

    this.summonHudText!.setText(
      `✦ 소환수 ${this.summonedAllies.length}마리 활성 · ${secsLeft}s`,
    );
    this.summonHudText!.setVisible(true);
    this.summonHudBg!.setVisible(true);
  }

  private clearSummons() {
    this.summonedAllies.forEach((ally) => {
      if (ally.sprite.active) ally.sprite.destroy();
    });
    this.summonedAllies = [];
    this.summonHudText?.setVisible(false);
    this.summonHudBg?.setVisible(false);
  }

  // ─── WIS 가중치 소환 수 ─────────────────────────────────────────────────
  // 레벨이 높을수록 WIS 스코어 상승 → 5마리 소환 확률 증가
  private getWisWeightedSummonCount(): number {
    const { player } = useGameStore.getState();
    // WIS score 0~10: level/5 + arcanist bonus
    const wisScore = Math.min(
      10,
      Math.floor(player.level / 5) + (player.className === "Arcanist" ? 3 : 1),
    );
    // 가중치 배열: [w1, w2, w3, w4, w5]
    // wisScore 낮으면 1마리, 높으면 5마리 가중치 상승
    const w1 = Math.max(1, 10 - wisScore * 2);
    const w2 = Math.max(1, 8 - wisScore);
    const w3 = Math.max(1, 4 + wisScore / 2);
    const w4 = Math.max(1, wisScore - 1);
    const w5 = Math.max(1, wisScore - 3);
    const weights = [w1, w2, w3, w4, w5];
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return i + 1;
    }
    return 1;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 테이밍 시스템
  // ═══════════════════════════════════════════════════════════════════════

  private attemptTaming() {
    if (!this.isOfflineMode || !this.localPlayer) {
      useGameStore.getState().addChat({
        id: crypto.randomUUID(),
        channel: "system",
        author: "테이밍",
        message: "오프라인 모드에서만 테이밍이 가능합니다.",
        timestamp: Date.now(),
      });
      return;
    }

    if (!this.selectedMonsterId) {
      useGameStore.getState().addChat({
        id: crypto.randomUUID(),
        channel: "system",
        author: "테이밍",
        message: "먼저 몬스터를 선택(우클릭)하세요.",
        timestamp: Date.now(),
      });
      return;
    }

    if (this.tamedMonsters.length >= 2) {
      useGameStore.getState().addChat({
        id: crypto.randomUUID(),
        channel: "system",
        author: "테이밍",
        message: "테이밍 몬스터는 최대 2마리까지 보유 가능합니다.",
        timestamp: Date.now(),
      });
      return;
    }

    const monsterId = this.selectedMonsterId;
    const monData = this.offlineMonsterHp.get(monsterId);
    const monSprite = this.monsterSprites.get(monsterId);
    if (!monData || monData.hp <= 0 || !monSprite) {
      useGameStore.getState().addChat({
        id: crypto.randomUUID(),
        channel: "system",
        author: "테이밍",
        message: "살아있는 몬스터를 선택하세요.",
        timestamp: Date.now(),
      });
      return;
    }

    const mBase = monsterId.split("-offline-")[0];
    const mDef = MONSTERS[mBase];
    const monsterLevel = mDef?.level ?? 1;

    // 성공 확률: 약할수록 높음. 보스는 5%로 고정
    const isBoss = mDef?.isBoss ?? false;
    const baseChance = isBoss
      ? 0.05
      : Math.max(0.05, 0.75 - monsterLevel * 0.04);
    const roll = Math.random();
    const success = roll < baseChance;

    if (!success) {
      const pct = Math.round(baseChance * 100);
      useGameStore.getState().addChat({
        id: crypto.randomUUID(),
        channel: "system",
        author: "테이밍",
        message: `♦ 테이밍 실패... (성공률 ${pct}%, 주문서 소모)`,
        timestamp: Date.now(),
      });
      // Anger effect
      this.cameras.main.shake(120, 0.006);
      return;
    }

    // ─ 성공 ─
    const tamedName = `[길들인] ${mDef?.name ?? "몬스터"}`;
    const tamedHp = (mDef?.hp ?? 40) + 20;
    const tamedAtk = Math.floor((mDef?.atk ?? 10) * 0.75); // 75% 전투력

    const sprite = this.createTamedSprite(monSprite.x, monSprite.y, tamedName);
    this.tamedMonsters.push({
      sprite,
      originalMonsterId: mBase,
      name: tamedName,
      hp: tamedHp,
      maxHp: tamedHp,
      atk: tamedAtk,
      expireAt: this.time.now + 1800000, // 30분
      targetId: null,
      lastAttackAt: 0,
    });

    // 원래 몬스터 잠시 숨기고 리스폰
    monSprite.setVisible(false);
    this.showDeathEffect(monSprite.x, monSprite.y);
    this.time.delayedCall((mDef?.respawnTime ?? 30) * 1000, () => {
      if (!monSprite.active) return;
      this.offlineMonsterHp.set(monsterId, { ...monData, hp: monData.maxHp });
      const ai = this.monsterAI.get(monsterId);
      if (ai) {
        ai.state = "idle";
        ai.lastChaseAt = 0;
      }
      monSprite.setPosition(
        ai?.spawnX ?? monSprite.x,
        ai?.spawnY ?? monSprite.y,
      );
      monSprite.hpFill.width = 50;
      monSprite.setVisible(true);
      monSprite.setAlpha(0);
      this.tweens.add({ targets: monSprite, alpha: 1, duration: 600 });
    });

    this.selectMonster(null);
    this.updateTamingHud();

    // 소환 이펙트 (붉은/황금색)
    this.spawnSummonEffect(
      this.localPlayer.x,
      this.localPlayer.y - 20,
      "greater",
    );

    useGameStore.getState().addChat({
      id: crypto.randomUUID(),
      channel: "system",
      author: "테이밍",
      message: `♦ 테이밍 성공! [${mDef?.name ?? "몬스터"}] 이(가) 30분간 함께합니다.`,
      timestamp: Date.now(),
    });
  }

  private createTamedSprite(x: number, y: number, name: string) {
    const tintColor = 0xff8c42; // 따뜻한 오렌지 — 소환(초록)과 구분
    const container = this.add.container(
      x,
      y,
    ) as Phaser.GameObjects.Container & {
      hpFill: Phaser.GameObjects.Rectangle;
      lastX: number;
      lastY: number;
    };

    const shadow = this.add.ellipse(0, 18, 40, 22, 0x000000, 0.28);
    const aura = this.add
      .ellipse(0, 10, 56, 34, tintColor, 0.1)
      .setStrokeStyle(1.5, tintColor, 0.55);
    const body = this.add
      .ellipse(0, -8, 34, 42, tintColor, 0.82)
      .setStrokeStyle(2, 0xffffff, 0.25);
    const glow = this.add.ellipse(0, -14, 16, 20, 0xffffff, 0.2);
    const label = this.add
      .text(0, -46, name, {
        fontSize: "8px",
        color: `#${tintColor.toString(16).padStart(6, "0")}`,
        stroke: "#000000",
        strokeThickness: 3,
        resolution: 2,
      })
      .setOrigin(0.5, 1);
    const hpBack = this.add.rectangle(0, 28, 42, 5, 0x1a0000, 0.85);
    const hpFill = this.add
      .rectangle(-21, 28, 42, 5, 0xff8c42, 0.9)
      .setOrigin(0, 0.5);

    container.add([shadow, aura, body, glow, label, hpBack, hpFill]);
    container.hpFill = hpFill;
    container.lastX = x;
    container.lastY = y;

    this.actorLayer?.add(container);
    container.setAlpha(0).setScale(0.3);
    this.tweens.add({
      targets: container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: "Back.Out",
    });

    return container;
  }

  private updateTamedMonsters() {
    if (
      !this.isOfflineMode ||
      !this.localPlayer ||
      this.tamedMonsters.length === 0
    )
      return;
    const now = this.time.now;

    // Remove expired
    this.tamedMonsters = this.tamedMonsters.filter((tm) => {
      if (now >= tm.expireAt || tm.hp <= 0) {
        this.tweens.add({
          targets: tm.sprite,
          alpha: 0,
          scaleX: 0.3,
          scaleY: 0.3,
          duration: 380,
          ease: "Power2.In",
          onComplete: () => {
            if (tm.sprite.active) tm.sprite.destroy();
          },
        });
        if (now >= tm.expireAt) {
          useGameStore.getState().addChat({
            id: crypto.randomUUID(),
            channel: "system",
            author: "테이밍",
            message: `♦ [${tm.name}] 테이밍 시간이 종료되었습니다.`,
            timestamp: Date.now(),
          });
        }
        return false;
      }
      return true;
    });

    this.updateTamingHud();
    if (this.tamedMonsters.length === 0) return;

    const TAME_ATTACK_RANGE = 58;
    const TAME_CHASE_RANGE = 340;
    const TAME_MOVE_SPEED = 120;
    const TAME_ATTACK_INTERVAL = 1000;

    this.tamedMonsters.forEach((tm) => {
      if (!tm.sprite.active) return;

      let nearestId: string | null = null;
      let nearestDist = Infinity;

      this.monsterSprites.forEach((ms, mid) => {
        if (!ms.visible) return;
        const monData = this.offlineMonsterHp.get(mid);
        if (!monData || monData.hp <= 0) return;
        const dist = Phaser.Math.Distance.Between(
          tm.sprite.x,
          tm.sprite.y,
          ms.x,
          ms.y,
        );
        if (dist < TAME_CHASE_RANGE && dist < nearestDist) {
          nearestDist = dist;
          nearestId = mid;
        }
      });

      tm.targetId = nearestId;

      if (nearestId) {
        const lockedId = nearestId as string;
        const target = this.monsterSprites.get(lockedId);
        if (!target) return;

        if (nearestDist > TAME_ATTACK_RANGE) {
          const angle = Phaser.Math.Angle.Between(
            tm.sprite.x,
            tm.sprite.y,
            target.x,
            target.y,
          );
          tm.sprite.lastX = tm.sprite.x;
          tm.sprite.lastY = tm.sprite.y;
          tm.sprite.x += Math.cos(angle) * TAME_MOVE_SPEED * (1 / 60);
          tm.sprite.y += Math.sin(angle) * TAME_MOVE_SPEED * (1 / 60);
        } else {
          if (now - tm.lastAttackAt >= TAME_ATTACK_INTERVAL) {
            tm.lastAttackAt = now;
            const monData = this.offlineMonsterHp.get(lockedId);
            if (monData && monData.hp > 0) {
              const dmg = tm.atk + Math.floor(Math.random() * 6);
              const newHp = Math.max(0, monData.hp - dmg);
              this.offlineMonsterHp.set(lockedId, { ...monData, hp: newHp });

              this.showDamageNumber(target.x, target.y - 10, dmg, false);
              if (target.spriteBody)
                this.tweens.add({
                  targets: target.spriteBody,
                  alpha: 0.18,
                  duration: 50,
                  yoyo: true,
                });

              target.hpFill.width = 50 * (newHp / monData.maxHp);

              if (newHp <= 0) {
                const mBase = lockedId.split("-offline-")[0];
                const mDef = MONSTERS[mBase];
                const gold =
                  (mDef?.goldRange?.[0] ?? 5) +
                  Math.floor(
                    Math.random() *
                      ((mDef?.goldRange?.[1] ?? 15) -
                        (mDef?.goldRange?.[0] ?? 5) +
                        1),
                  );
                const exp = Math.floor((mDef?.exp ?? 10) * 0.6);

                useGameStore
                  .getState()
                  .applyOfflineReward({ gold, exp, items: [] });
                useGameStore
                  .getState()
                  .registerKill(mBase, mDef?.isBoss ?? false);

                const ai = this.monsterAI.get(lockedId);
                target.setVisible(false);
                this.showDeathEffect(target.x, target.y);

                this.time.delayedCall((mDef?.respawnTime ?? 30) * 1000, () => {
                  if (!target.active) return;
                  this.offlineMonsterHp.set(lockedId, {
                    ...monData,
                    hp: monData.maxHp,
                  });
                  if (ai) {
                    ai.state = "idle";
                    ai.lastChaseAt = 0;
                  }
                  target.setPosition(
                    ai?.spawnX ?? target.x,
                    ai?.spawnY ?? target.y,
                  );
                  target.hpFill.width = 50;
                  target.setVisible(true);
                  target.setAlpha(0);
                  this.tweens.add({ targets: target, alpha: 1, duration: 600 });
                });
              }
            }
          }
        }
      } else {
        const distToPlayer = Phaser.Math.Distance.Between(
          tm.sprite.x,
          tm.sprite.y,
          this.localPlayer!.x,
          this.localPlayer!.y,
        );
        if (distToPlayer > 120) {
          const angle = Phaser.Math.Angle.Between(
            tm.sprite.x,
            tm.sprite.y,
            this.localPlayer!.x,
            this.localPlayer!.y,
          );
          tm.sprite.lastX = tm.sprite.x;
          tm.sprite.lastY = tm.sprite.y;
          tm.sprite.x += Math.cos(angle) * TAME_MOVE_SPEED * 0.7 * (1 / 60);
          tm.sprite.y += Math.sin(angle) * TAME_MOVE_SPEED * 0.7 * (1 / 60);
        }
      }
    });
  }

  private updateTamingHud() {
    if (this.tamedMonsters.length === 0) {
      this.tamingHudText?.setVisible(false);
      this.tamingHudBg?.setVisible(false);
      return;
    }

    const now = this.time.now;
    const minExpire = Math.min(...this.tamedMonsters.map((t) => t.expireAt));
    const minsLeft = Math.max(0, Math.ceil((minExpire - now) / 60000));
    const secsLeft = Math.max(0, Math.ceil(((minExpire - now) % 60000) / 1000));

    if (!this.tamingHudText) {
      const w = this.scale.width;
      this.tamingHudBg = this.add.graphics().setScrollFactor(0).setDepth(1500);
      this.tamingHudText = this.add
        .text(w / 2, 173, "", {
          fontSize: "11px",
          color: "#ffb86c",
          stroke: "#1a0800",
          strokeThickness: 4,
          resolution: 2,
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(1501);
    }

    const w = this.scale.width;
    this.tamingHudBg!.clear();
    this.tamingHudBg!.fillStyle(0x1a0800, 0.88);
    this.tamingHudBg!.fillRoundedRect(w / 2 - 90, 161, 180, 24, 8);
    this.tamingHudBg!.lineStyle(1, 0xff8c42, 0.45);
    this.tamingHudBg!.strokeRoundedRect(w / 2 - 90, 161, 180, 24, 8);

    this.tamingHudText!.setText(
      `♦ 테이밍 ${this.tamedMonsters.length}마리 · ${minsLeft}m ${secsLeft}s`,
    );
    this.tamingHudText!.setVisible(true);
    this.tamingHudBg!.setVisible(true);
  }

  private clearTamed() {
    this.tamedMonsters.forEach((tm) => {
      if (tm.sprite.active) tm.sprite.destroy();
    });
    this.tamedMonsters = [];
    this.tamingHudText?.setVisible(false);
    this.tamingHudBg?.setVisible(false);
  }

  private spawnSummonEffect(x: number, y: number, tier: string) {
    const color =
      tier === "greater" ? 0xffd700 : tier === "mid" ? 0x88aaff : 0x44ee88;
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const r = 45 + Math.random() * 35;
      const p = this.add.ellipse(
        x + Math.cos(angle) * 22,
        y + Math.sin(angle) * 14,
        6,
        6,
        color,
        0.9,
      );
      this.effectLayer?.add(p);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * r,
        y: y + Math.sin(angle) * r * 0.65,
        alpha: 0,
        scale: 0.18,
        duration: 520 + Math.random() * 200,
        ease: "Power2.Out",
        onComplete: () => p.destroy(),
      });
    }
    const ring = this.add
      .ellipse(x, y, 90, 54, color, 0.12)
      .setStrokeStyle(2, color, 0.72);
    this.effectLayer?.add(ring);
    this.tweens.add({
      targets: ring,
      scaleX: 2.6,
      scaleY: 2.6,
      alpha: 0,
      duration: 650,
      ease: "Power2.Out",
      onComplete: () => ring.destroy(),
    });
  }

  private showDeathEffect(x: number, y: number) {
    const flash = this.add.ellipse(x, y - 16, 56, 36, 0xffffff, 0.72);
    const sigil = this.add
      .star(x, y - 16, 7, 12, 26, 0xffdd8b, 0.32)
      .setStrokeStyle(2, 0xfff2c8, 0.65);
    this.effectLayer?.add(flash);
    this.effectLayer?.add(sigil);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2.4,
      scaleY: 2.4,
      duration: 420,
      ease: "Power2.Out",
      onComplete: () => flash.destroy(),
    });
    this.tweens.add({
      targets: sigil,
      alpha: 0,
      scaleX: 2.2,
      scaleY: 2.2,
      duration: 380,
      ease: "Power2.Out",
      onComplete: () => sigil.destroy(),
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

  private playBossEntrance(x: number, y: number) {
    this.cameras.main.shake(220, 0.0026);
    const wave = this.add
      .ellipse(x, y - 8, 64, 36, 0xffd07a, 0.2)
      .setStrokeStyle(3, 0xfff0bf, 0.65)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const crown = this.add
      .star(x, y - 48, 6, 10, 22, 0xffd07a, 0.38)
      .setStrokeStyle(2, 0xfff4cf, 0.7);
    this.effectLayer?.add(wave);
    this.effectLayer?.add(crown);
    this.tweens.add({
      targets: wave,
      scaleX: 2.4,
      scaleY: 2.1,
      alpha: 0,
      duration: 520,
      ease: "Cubic.Out",
      onComplete: () => wave.destroy(),
    });
    this.tweens.add({
      targets: crown,
      y: y - 68,
      alpha: 0,
      scaleX: 1.8,
      scaleY: 1.8,
      duration: 460,
      ease: "Cubic.Out",
      onComplete: () => crown.destroy(),
    });
  }

  private handleTeleportRandom() {
    if (!this.localPlayer) return;

    const map = MAPS[this.mapId] ?? MAPS.speakingIsland;
    const mapW = map.width * TILE_WIDTH + 320;
    const mapH = map.height * TILE_HEIGHT + 260;

    // Move player to a random nearby position (±300px)
    const randomX = this.localPlayer.x + (Math.random() - 0.5) * 600;
    const randomY = this.localPlayer.y + (Math.random() - 0.5) * 600;

    // Clamp to map boundaries
    const clampedX = Math.max(200, Math.min(randomX, mapW - 200));
    const clampedY = Math.max(200, Math.min(randomY, mapH - 200));

    // Teleport with visual effect
    this.showTeleportEffect(this.localPlayer.x, this.localPlayer.y);
    this.localPlayer.setPosition(clampedX, clampedY);
    this.showTeleportEffect(clampedX, clampedY);

    // Update game store with new position
    useGameStore.getState().upsertWorldPlayer({
      id: "localPlayer",
      name: "Player",
      mapId: useGameStore.getState().currentMapId,
      x: clampedX,
      y: clampedY,
    });

    // Center camera on new position
    this.cameras.main.centerOn(clampedX, clampedY);

    // Add system message
    useGameStore.getState().addChat({
      id: `teleport_${Date.now()}`,
      channel: "system",
      author: "시스템",
      message: "순간이동 스크롤을 사용했습니다!",
      timestamp: Date.now(),
    });
  }

  private handleReturnToTown() {
    // Transition to speakingIsland map (spawn at town center)
    const spawnX = 400;
    const spawnY = 350;

    useGameStore.getState().setCurrentMapId("speakingIsland");
    this.scene.restart({ mapId: "speakingIsland", spawnX, spawnY });

    // Add system message
    useGameStore.getState().addChat({
      id: `return_town_${Date.now()}`,
      channel: "system",
      author: "시스템",
      message: "귀환 스크롤을 사용하여 마을로 돌아왔습니다!",
      timestamp: Date.now(),
    });
  }

  private showTeleportEffect(x: number, y: number) {
    // Create a magical teleport effect
    const particles = this.add.particles(x, y, "particle_sparkle", {
      scale: { start: 0.3, end: 0 },
      speed: { min: 50, max: 150 },
      lifespan: 600,
      quantity: 12,
      alpha: { start: 0.8, end: 0 },
      tint: [0x66ccff, 0xffffff, 0xaaaaff],
    });

    this.effectLayer?.add(particles);

    // Remove particles after animation
    this.time.delayedCall(600, () => {
      particles.destroy();
    });
  }
}

type DirectionKey = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
type AnimState = "idle" | "walk" | "attack";
