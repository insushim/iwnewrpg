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
const WALK_FRAME_COUNT = 2;
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

  constructor() {
    super("WorldScene");
  }

  create(data?: { mapId?: string; spawnX?: number; spawnY?: number; serverName?: string }) {
    if (data?.mapId) {
      this.mapId = data.mapId;
      if (data.spawnX !== undefined) this.spawnX = data.spawnX;
      if (data.spawnY !== undefined) this.spawnY = data.spawnY;
    }
    this.serverName = data?.serverName ?? useGameStore.getState().serverName;

    this.cameras.main.setBackgroundColor("#07101a");
    this.cameras.main.setZoom(0.94);
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
    this.checkPortalTransitions();

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
    const width = this.scale.width;
    const banner = this.add.container(width / 2, 94).setDepth(1600).setScrollFactor(0);

    const plate = this.add.graphics();
    plate.fillStyle(0x091019, 0.88);
    plate.fillRoundedRect(-220, -34, 440, 68, 22);
    plate.lineStyle(2, 0xb48a46, 0.42);
    plate.strokeRoundedRect(-220, -34, 440, 68, 22);
    plate.lineStyle(1, 0xffffff, 0.06);
    plate.strokeRoundedRect(-212, -26, 424, 52, 18);
    banner.add(plate);

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
        .text(0, 10, `${player.name} · ${this.formatClassLabel(player.className)} 입장`, {
          color: "#f2e4c2",
          fontFamily: "serif",
          fontSize: "22px",
          fontStyle: "bold",
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
    id: string; mapId: string; name: string; level: number;
    hp: number; maxHp: number; atk: number; x: number; y: number;
  }> {
    type SpawnEntry = { monsterId: string; x: number; y: number };

    // ──────────────────────────────────────────────────────────────────────
    // 이야기의 섬 (speakingIsland) Lv 1-10
    // 맵: 120x100 타일 → ~8960x5460 px, 마을 x:220-980, y:180-610
    // ──────────────────────────────────────────────────────────────────────
    const speakingIsland: SpawnEntry[] = [
      // Zone 1 - 슬라임 습지 (서쪽, lv1)
      { monsterId:"slime", x:160,y:280 }, { monsterId:"slime", x:200,y:380 },
      { monsterId:"slime", x:155,y:480 }, { monsterId:"slime", x:210,y:580 },
      { monsterId:"slime", x:160,y:700 }, { monsterId:"slime", x:205,y:820 },
      { monsterId:"slime", x:155,y:950 }, { monsterId:"slime", x:200,y:1080 },
      { monsterId:"slime", x:160,y:1200 }, { monsterId:"slime", x:205,y:1320 },
      // Zone 2 - 고블린 야영지 (남서, lv2)
      { monsterId:"goblin_child", x:300,y:900 }, { monsterId:"goblin_child", x:500,y:850 },
      { monsterId:"goblin_child", x:700,y:920 }, { monsterId:"goblin_child", x:400,y:1050 },
      { monsterId:"goblin_child", x:600,y:1100 }, { monsterId:"goblin_child", x:800,y:1030 },
      { monsterId:"goblin_child", x:350,y:1200 }, { monsterId:"goblin_child", x:550,y:1250 },
      { monsterId:"goblin_child", x:750,y:1180 }, { monsterId:"goblin_child", x:900,y:1260 },
      // Zone 3 - 멧돼지 평원 (동쪽, lv5)
      { monsterId:"wild_boar", x:1200,y:250 }, { monsterId:"wild_boar", x:1500,y:320 },
      { monsterId:"wild_boar", x:1800,y:260 }, { monsterId:"wild_boar", x:2100,y:340 },
      { monsterId:"wild_boar", x:1350,y:480 }, { monsterId:"wild_boar", x:1650,y:550 },
      { monsterId:"wild_boar", x:1950,y:480 }, { monsterId:"wild_boar", x:2300,y:400 },
      { monsterId:"wild_boar", x:1400,y:680 }, { monsterId:"wild_boar", x:1700,y:720 },
      // Zone 4 - 해골 고원 (북쪽, lv7)
      { monsterId:"skeleton_warrior", x:300,y:155 }, { monsterId:"skeleton_warrior", x:600,y:148 },
      { monsterId:"skeleton_warrior", x:900,y:155 }, { monsterId:"skeleton_warrior", x:1200,y:148 },
      { monsterId:"skeleton_warrior", x:1500,y:155 }, { monsterId:"skeleton_warrior", x:1800,y:148 },
      { monsterId:"skeleton_warrior", x:2100,y:155 }, { monsterId:"skeleton_warrior", x:2400,y:148 },
      { monsterId:"skeleton_warrior", x:2700,y:155 }, { monsterId:"skeleton_warrior", x:3000,y:148 },
      // Zone 5 - 개구리 늪 (남쪽 중앙, lv4)
      { monsterId:"bog_frog", x:600,y:1500 }, { monsterId:"bog_frog", x:850,y:1580 },
      { monsterId:"bog_frog", x:1100,y:1520 }, { monsterId:"bog_frog", x:1350,y:1600 },
      { monsterId:"bog_frog", x:700,y:1750 }, { monsterId:"bog_frog", x:950,y:1820 },
      { monsterId:"bog_frog", x:1200,y:1760 }, { monsterId:"bog_frog", x:1500,y:1680 },
      // Zone 6 - 코볼드 광산 (극동, lv9)
      { monsterId:"kobold_raider", x:2600,y:650 }, { monsterId:"kobold_raider", x:2900,y:750 },
      { monsterId:"kobold_raider", x:3200,y:680 }, { monsterId:"kobold_raider", x:3500,y:800 },
      { monsterId:"kobold_raider", x:2750,y:950 }, { monsterId:"kobold_raider", x:3050,y:1050 },
      { monsterId:"kobold_raider", x:3350,y:980 }, { monsterId:"kobold_raider", x:3650,y:880 },
      { monsterId:"kobold_raider", x:2850,y:1200 }, { monsterId:"kobold_raider", x:3150,y:1280 },
      { monsterId:"kobold_raider", x:3450,y:1180 }, { monsterId:"kobold_raider", x:3800,y:1050 },
      // Zone 7 - 오크 진지 (남동, lv8)
      { monsterId:"orc_archer", x:1200,y:2100 }, { monsterId:"orc_archer", x:1500,y:2200 },
      { monsterId:"orc_archer", x:1800,y:2150 }, { monsterId:"orc_archer", x:2100,y:2250 },
      { monsterId:"orc_archer", x:1350,y:2380 }, { monsterId:"orc_archer", x:1650,y:2450 },
      { monsterId:"orc_archer", x:1950,y:2400 }, { monsterId:"orc_archer", x:2250,y:2300 },
      // Boss
      { monsterId:"slime_boss",    x:180,  y:1600 },
      { monsterId:"goblin_boss",   x:900,  y:2100 },
      { monsterId:"skeleton_boss", x:3200, y:160  },
    ];

    // ──────────────────────────────────────────────────────────────────────
    // 은기사의 마을 (silverKnightTown) Lv 10-20
    // 맵: 110x90 타일 → ~8240x4940 px, 마을 중심 x:300-1200, y:200-700
    // ──────────────────────────────────────────────────────────────────────
    const silverKnightTown: SpawnEntry[] = [
      // Zone 1 - 늑대 무리 (남서 숲, lv13)
      { monsterId:"werewolf", x:350,y:900 }, { monsterId:"werewolf", x:600,y:980 },
      { monsterId:"werewolf", x:850,y:920 }, { monsterId:"werewolf", x:1100,y:1000 },
      { monsterId:"werewolf", x:450,y:1150 }, { monsterId:"werewolf", x:700,y:1220 },
      { monsterId:"werewolf", x:950,y:1160 }, { monsterId:"werewolf", x:1200,y:1080 },
      { monsterId:"werewolf", x:550,y:1380 }, { monsterId:"werewolf", x:800,y:1450 },
      { monsterId:"werewolf", x:1050,y:1380 }, { monsterId:"werewolf", x:1300,y:1300 },
      // Zone 2 - 독거미 숲 (동쪽, lv17)
      { monsterId:"poison_spider", x:1900,y:350 }, { monsterId:"poison_spider", x:2200,y:450 },
      { monsterId:"poison_spider", x:2500,y:380 }, { monsterId:"poison_spider", x:2800,y:500 },
      { monsterId:"poison_spider", x:2050,y:650 }, { monsterId:"poison_spider", x:2350,y:720 },
      { monsterId:"poison_spider", x:2650,y:660 }, { monsterId:"poison_spider", x:2950,y:580 },
      { monsterId:"poison_spider", x:2150,y:900 }, { monsterId:"poison_spider", x:2450,y:950 },
      // Zone 3 - 도마뱀 척후대 (남쪽 평원, lv16)
      { monsterId:"lizard_scout", x:500,y:1700 }, { monsterId:"lizard_scout", x:800,y:1780 },
      { monsterId:"lizard_scout", x:1100,y:1720 }, { monsterId:"lizard_scout", x:1400,y:1800 },
      { monsterId:"lizard_scout", x:650,y:1950 }, { monsterId:"lizard_scout", x:950,y:2020 },
      { monsterId:"lizard_scout", x:1250,y:1970 }, { monsterId:"lizard_scout", x:1550,y:1880 },
      { monsterId:"lizard_scout", x:750,y:2200 }, { monsterId:"lizard_scout", x:1050,y:2250 },
      // Zone 4 - 해골 폐허 (북쪽, lv7)
      { monsterId:"skeleton_warrior", x:350,y:160 }, { monsterId:"skeleton_warrior", x:700,y:150 },
      { monsterId:"skeleton_warrior", x:1050,y:160 }, { monsterId:"skeleton_warrior", x:1400,y:150 },
      { monsterId:"skeleton_warrior", x:1750,y:160 }, { monsterId:"skeleton_warrior", x:500,y:260 },
      { monsterId:"skeleton_warrior", x:900,y:250 }, { monsterId:"skeleton_warrior", x:1300,y:260 },
      // Zone 5 - 석상 골렘 (동북 폐허, lv24)
      { monsterId:"stone_golem", x:2200,y:200 }, { monsterId:"stone_golem", x:2600,y:180 },
      { monsterId:"stone_golem", x:3000,y:210 }, { monsterId:"stone_golem", x:2400,y:380 },
      { monsterId:"stone_golem", x:2800,y:400 }, { monsterId:"stone_golem", x:3200,y:300 },
      // Zone 6 - 포레스트 스프라이트 (동쪽 깊은 숲, lv19)
      { monsterId:"forest_sprite", x:3300,y:600 }, { monsterId:"forest_sprite", x:3600,y:700 },
      { monsterId:"forest_sprite", x:3900,y:650 }, { monsterId:"forest_sprite", x:3450,y:900 },
      { monsterId:"forest_sprite", x:3750,y:950 }, { monsterId:"forest_sprite", x:4050,y:850 },
      // Boss
      { monsterId:"orc_chief", x:4000, y:1600 },
    ];

    // ──────────────────────────────────────────────────────────────────────
    // 바람숲 (windwoodForest) Lv 15-25
    // 맵: 140x110 타일 → ~10400x5980 px
    // ──────────────────────────────────────────────────────────────────────
    const windwoodForest: SpawnEntry[] = [
      // Zone 1 - 독거미 서쪽 숲
      { monsterId:"poison_spider", x:250,y:300 }, { monsterId:"poison_spider", x:500,y:380 },
      { monsterId:"poison_spider", x:750,y:320 }, { monsterId:"poison_spider", x:1000,y:400 },
      { monsterId:"poison_spider", x:350,y:550 }, { monsterId:"poison_spider", x:650,y:620 },
      { monsterId:"poison_spider", x:900,y:580 }, { monsterId:"poison_spider", x:1200,y:500 },
      { monsterId:"poison_spider", x:450,y:800 }, { monsterId:"poison_spider", x:750,y:880 },
      { monsterId:"poison_spider", x:1050,y:820 }, { monsterId:"poison_spider", x:1350,y:720 },
      // Zone 2 - 워울프 중앙
      { monsterId:"werewolf", x:1800,y:600 }, { monsterId:"werewolf", x:2100,y:700 },
      { monsterId:"werewolf", x:2400,y:640 }, { monsterId:"werewolf", x:2700,y:750 },
      { monsterId:"werewolf", x:1950,y:900 }, { monsterId:"werewolf", x:2250,y:980 },
      { monsterId:"werewolf", x:2550,y:920 }, { monsterId:"werewolf", x:2850,y:830 },
      { monsterId:"werewolf", x:2050,y:1150 }, { monsterId:"werewolf", x:2350,y:1220 },
      { monsterId:"werewolf", x:2650,y:1160 }, { monsterId:"werewolf", x:2950,y:1080 },
      // Zone 3 - 포레스트 스프라이트 동쪽
      { monsterId:"forest_sprite", x:3500,y:450 }, { monsterId:"forest_sprite", x:3800,y:550 },
      { monsterId:"forest_sprite", x:4100,y:480 }, { monsterId:"forest_sprite", x:4400,y:600 },
      { monsterId:"forest_sprite", x:3650,y:750 }, { monsterId:"forest_sprite", x:3950,y:820 },
      { monsterId:"forest_sprite", x:4250,y:760 }, { monsterId:"forest_sprite", x:4550,y:680 },
      // Zone 4 - 코볼드 남쪽 (wanderers)
      { monsterId:"kobold_raider", x:600,y:1800 }, { monsterId:"kobold_raider", x:1000,y:1900 },
      { monsterId:"kobold_raider", x:1400,y:1850 }, { monsterId:"kobold_raider", x:1800,y:1950 },
      { monsterId:"kobold_raider", x:800,y:2100 }, { monsterId:"kobold_raider", x:1200,y:2180 },
      { monsterId:"kobold_raider", x:1600,y:2120 }, { monsterId:"kobold_raider", x:2000,y:2050 },
      // Boss
      { monsterId:"stone_golem", x:4800, y:1200 },
    ];

    // ──────────────────────────────────────────────────────────────────────
    // 오크 부락지 (orcForest) Lv 18-28
    // 맵: 130x100 타일 → ~9680x5460 px
    // ──────────────────────────────────────────────────────────────────────
    const orcForest: SpawnEntry[] = [
      // Zone 1 - 오크 궁수 서쪽 야영지
      { monsterId:"orc_archer", x:250,y:300 }, { monsterId:"orc_archer", x:500,y:380 },
      { monsterId:"orc_archer", x:750,y:320 }, { monsterId:"orc_archer", x:1000,y:400 },
      { monsterId:"orc_archer", x:350,y:550 }, { monsterId:"orc_archer", x:650,y:620 },
      { monsterId:"orc_archer", x:900,y:580 }, { monsterId:"orc_archer", x:1200,y:500 },
      { monsterId:"orc_archer", x:450,y:800 }, { monsterId:"orc_archer", x:750,y:880 },
      { monsterId:"orc_archer", x:1050,y:820 }, { monsterId:"orc_archer", x:1350,y:720 },
      // Zone 2 - 코볼드 광부 중앙
      { monsterId:"kobold_raider", x:1700,y:400 }, { monsterId:"kobold_raider", x:2000,y:500 },
      { monsterId:"kobold_raider", x:2300,y:440 }, { monsterId:"kobold_raider", x:2600,y:560 },
      { monsterId:"kobold_raider", x:1850,y:700 }, { monsterId:"kobold_raider", x:2150,y:780 },
      { monsterId:"kobold_raider", x:2450,y:720 }, { monsterId:"kobold_raider", x:2750,y:640 },
      { monsterId:"kobold_raider", x:1950,y:950 }, { monsterId:"kobold_raider", x:2250,y:1020 },
      // Zone 3 - 오크 궁수 동쪽 요새
      { monsterId:"orc_archer", x:3000,y:350 }, { monsterId:"orc_archer", x:3300,y:450 },
      { monsterId:"orc_archer", x:3600,y:380 }, { monsterId:"orc_archer", x:3900,y:500 },
      { monsterId:"orc_archer", x:3150,y:600 }, { monsterId:"orc_archer", x:3450,y:680 },
      { monsterId:"orc_archer", x:3750,y:620 }, { monsterId:"orc_archer", x:4050,y:540 },
      // Zone 4 - 도마뱀 정찰대 남쪽
      { monsterId:"lizard_scout", x:500,y:1400 }, { monsterId:"lizard_scout", x:900,y:1480 },
      { monsterId:"lizard_scout", x:1300,y:1420 }, { monsterId:"lizard_scout", x:1700,y:1500 },
      { monsterId:"lizard_scout", x:700,y:1650 }, { monsterId:"lizard_scout", x:1100,y:1720 },
      { monsterId:"lizard_scout", x:1500,y:1660 }, { monsterId:"lizard_scout", x:1900,y:1580 },
      // Boss x2
      { monsterId:"orc_chief", x:4500, y:800 },
      { monsterId:"orc_chief", x:2500, y:1400 },
    ];

    // ──────────────────────────────────────────────────────────────────────
    // 글루디오 평원 (gludioPlain) Lv 10-18
    // 맵: 150x120 타일 → ~11120x6500 px
    // ──────────────────────────────────────────────────────────────────────
    const gludioPlain: SpawnEntry[] = [
      // Zone 1 - 멧돼지 무리 북쪽
      { monsterId:"wild_boar", x:300,y:300 }, { monsterId:"wild_boar", x:600,y:380 },
      { monsterId:"wild_boar", x:900,y:320 }, { monsterId:"wild_boar", x:1200,y:400 },
      { monsterId:"wild_boar", x:1500,y:350 }, { monsterId:"wild_boar", x:1800,y:430 },
      { monsterId:"wild_boar", x:450,y:550 }, { monsterId:"wild_boar", x:750,y:620 },
      { monsterId:"wild_boar", x:1050,y:580 }, { monsterId:"wild_boar", x:1350,y:660 },
      { monsterId:"wild_boar", x:1650,y:600 }, { monsterId:"wild_boar", x:1950,y:540 },
      // Zone 2 - 꼬마 고블린 서쪽 캠프
      { monsterId:"goblin_child", x:250,y:900 }, { monsterId:"goblin_child", x:500,y:980 },
      { monsterId:"goblin_child", x:750,y:920 }, { monsterId:"goblin_child", x:1000,y:1000 },
      { monsterId:"goblin_child", x:350,y:1150 }, { monsterId:"goblin_child", x:650,y:1220 },
      { monsterId:"goblin_child", x:900,y:1160 }, { monsterId:"goblin_child", x:1200,y:1080 },
      // Zone 3 - 도마뱀 정찰대 동쪽
      { monsterId:"lizard_scout", x:2000,y:400 }, { monsterId:"lizard_scout", x:2300,y:500 },
      { monsterId:"lizard_scout", x:2600,y:440 }, { monsterId:"lizard_scout", x:2900,y:560 },
      { monsterId:"lizard_scout", x:2150,y:700 }, { monsterId:"lizard_scout", x:2450,y:780 },
      { monsterId:"lizard_scout", x:2750,y:720 }, { monsterId:"lizard_scout", x:3050,y:640 },
      { monsterId:"lizard_scout", x:2250,y:950 }, { monsterId:"lizard_scout", x:2550,y:1020 },
      { monsterId:"lizard_scout", x:2850,y:960 }, { monsterId:"lizard_scout", x:3150,y:880 },
      // Zone 4 - 독거미 남쪽 덤불
      { monsterId:"poison_spider", x:500,y:1600 }, { monsterId:"poison_spider", x:900,y:1680 },
      { monsterId:"poison_spider", x:1300,y:1620 }, { monsterId:"poison_spider", x:1700,y:1700 },
      { monsterId:"poison_spider", x:700,y:1850 }, { monsterId:"poison_spider", x:1100,y:1920 },
      { monsterId:"poison_spider", x:1500,y:1860 }, { monsterId:"poison_spider", x:1900,y:1780 },
      // Boss
      { monsterId:"goblin_boss", x:1500, y:1500 },
    ];

    // ──────────────────────────────────────────────────────────────────────
    // 달안개 습지 (moonlitWetland) Lv 20-28
    // 맵: 150x120 타일 → ~11120x6500 px
    // ──────────────────────────────────────────────────────────────────────
    const moonlitWetland: SpawnEntry[] = [
      // Zone 1 - 개구리 늪 서쪽
      { monsterId:"bog_frog", x:250,y:400 }, { monsterId:"bog_frog", x:500,y:500 },
      { monsterId:"bog_frog", x:750,y:440 }, { monsterId:"bog_frog", x:1000,y:560 },
      { monsterId:"bog_frog", x:350,y:700 }, { monsterId:"bog_frog", x:650,y:780 },
      { monsterId:"bog_frog", x:900,y:720 }, { monsterId:"bog_frog", x:1200,y:640 },
      { monsterId:"bog_frog", x:450,y:950 }, { monsterId:"bog_frog", x:750,y:1020 },
      { monsterId:"bog_frog", x:1050,y:960 }, { monsterId:"bog_frog", x:1350,y:880 },
      // Zone 2 - 독거미 중앙 습지
      { monsterId:"poison_spider", x:1700,y:350 }, { monsterId:"poison_spider", x:2000,y:450 },
      { monsterId:"poison_spider", x:2300,y:380 }, { monsterId:"poison_spider", x:2600,y:500 },
      { monsterId:"poison_spider", x:1850,y:650 }, { monsterId:"poison_spider", x:2150,y:720 },
      { monsterId:"poison_spider", x:2450,y:660 }, { monsterId:"poison_spider", x:2750,y:580 },
      { monsterId:"poison_spider", x:1950,y:900 }, { monsterId:"poison_spider", x:2250,y:970 },
      // Zone 3 - 워울프 동쪽 안개 지대
      { monsterId:"werewolf", x:3100,y:400 }, { monsterId:"werewolf", x:3400,y:500 },
      { monsterId:"werewolf", x:3700,y:440 }, { monsterId:"werewolf", x:4000,y:560 },
      { monsterId:"werewolf", x:3250,y:700 }, { monsterId:"werewolf", x:3550,y:780 },
      { monsterId:"werewolf", x:3850,y:720 }, { monsterId:"werewolf", x:4150,y:640 },
      // Zone 4 - 석상 골렘 북쪽 고지대
      { monsterId:"stone_golem", x:600,y:200 }, { monsterId:"stone_golem", x:1200,y:180 },
      { monsterId:"stone_golem", x:1800,y:200 }, { monsterId:"stone_golem", x:2400,y:180 },
      { monsterId:"stone_golem", x:3000,y:200 }, { monsterId:"stone_golem", x:3600,y:180 },
      // Boss x2
      { monsterId:"stone_golem", x:4500, y:1200 },
      { monsterId:"orc_chief",   x:2000, y:1500 },
    ];

    // ──────────────────────────────────────────────────────────────────────
    // 기란 도시 (giranTown) Lv 30-40
    // 맵: 130x100 타일 → ~9680x5460 px, 도시 중심 safe zone
    // ──────────────────────────────────────────────────────────────────────
    const giranTown: SpawnEntry[] = [
      // Zone 1 - 드레이크 북쪽 황무지
      { monsterId:"drake", x:400,y:200 }, { monsterId:"drake", x:800,y:180 },
      { monsterId:"drake", x:1200,y:210 }, { monsterId:"drake", x:1600,y:190 },
      { monsterId:"drake", x:600,y:350 }, { monsterId:"drake", x:1000,y:370 },
      { monsterId:"drake", x:1400,y:340 }, { monsterId:"drake", x:1800,y:360 },
      // Zone 2 - 석상 골렘 동쪽 평원
      { monsterId:"stone_golem", x:2200,y:400 }, { monsterId:"stone_golem", x:2600,y:480 },
      { monsterId:"stone_golem", x:3000,y:420 }, { monsterId:"stone_golem", x:3400,y:500 },
      { monsterId:"stone_golem", x:2400,y:700 }, { monsterId:"stone_golem", x:2800,y:780 },
      { monsterId:"stone_golem", x:3200,y:720 }, { monsterId:"stone_golem", x:3600,y:640 },
      // Zone 3 - 포레스트 스프라이트 서쪽 숲
      { monsterId:"forest_sprite", x:250,y:900 }, { monsterId:"forest_sprite", x:500,y:980 },
      { monsterId:"forest_sprite", x:750,y:920 }, { monsterId:"forest_sprite", x:1000,y:1000 },
      { monsterId:"forest_sprite", x:350,y:1150 }, { monsterId:"forest_sprite", x:650,y:1220 },
      { monsterId:"forest_sprite", x:900,y:1160 }, { monsterId:"forest_sprite", x:1200,y:1080 },
      // Zone 4 - 드레이크 동쪽 협곡
      { monsterId:"drake", x:3800,y:600 }, { monsterId:"drake", x:4200,y:700 },
      { monsterId:"drake", x:4600,y:640 }, { monsterId:"drake", x:4000,y:900 },
      { monsterId:"drake", x:4400,y:980 }, { monsterId:"drake", x:4800,y:920 },
      // Boss
      { monsterId:"orc_chief", x:5000, y:1400 },
    ];

    // ──────────────────────────────────────────────────────────────────────
    // 용의 계곡 (dragonValley) Lv 35-50
    // 맵: 170x130 타일 → ~12560x6820 px
    // ──────────────────────────────────────────────────────────────────────
    const dragonValley: SpawnEntry[] = [
      // Zone 1 - 드레이크 서쪽 협곡 (대규모)
      { monsterId:"drake", x:250,y:350 }, { monsterId:"drake", x:500,y:450 },
      { monsterId:"drake", x:750,y:380 }, { monsterId:"drake", x:1000,y:500 },
      { monsterId:"drake", x:1250,y:430 }, { monsterId:"drake", x:1500,y:550 },
      { monsterId:"drake", x:350,y:650 }, { monsterId:"drake", x:650,y:720 },
      { monsterId:"drake", x:950,y:660 }, { monsterId:"drake", x:1200,y:780 },
      { monsterId:"drake", x:1450,y:700 }, { monsterId:"drake", x:1700,y:620 },
      { monsterId:"drake", x:450,y:950 }, { monsterId:"drake", x:750,y:1020 },
      { monsterId:"drake", x:1050,y:960 }, { monsterId:"drake", x:1350,y:1040 },
      // Zone 2 - 드레이크 중앙 화염지대
      { monsterId:"drake", x:2000,y:450 }, { monsterId:"drake", x:2300,y:550 },
      { monsterId:"drake", x:2600,y:480 }, { monsterId:"drake", x:2900,y:600 },
      { monsterId:"drake", x:2150,y:750 }, { monsterId:"drake", x:2450,y:820 },
      { monsterId:"drake", x:2750,y:760 }, { monsterId:"drake", x:3050,y:680 },
      // Zone 3 - 레드 드래곤 동쪽 둥지 (극강)
      { monsterId:"red_dragon", x:4000,y:400 }, { monsterId:"red_dragon", x:4500,y:500 },
      { monsterId:"red_dragon", x:5000,y:450 }, { monsterId:"red_dragon", x:4250,y:700 },
      { monsterId:"red_dragon", x:4750,y:780 }, { monsterId:"red_dragon", x:5250,y:720 },
      // Zone 4 - 드레이크 남쪽 잔해
      { monsterId:"drake", x:800,y:1500 }, { monsterId:"drake", x:1200,y:1600 },
      { monsterId:"drake", x:1600,y:1540 }, { monsterId:"drake", x:2000,y:1620 },
      { monsterId:"drake", x:2400,y:1560 }, { monsterId:"drake", x:2800,y:1640 },
      // Boss x2
      { monsterId:"red_dragon", x:6000, y:1200 },
      { monsterId:"red_dragon", x:3500, y:1400 },
    ];

    // ──────────────────────────────────────────────────────────────────────
    // 고대 동굴 (ancientCave) Lv 8-15 던전
    // ──────────────────────────────────────────────────────────────────────
    const ancientCave: SpawnEntry[] = [
      { monsterId:"skeleton_warrior", x:300,y:400 }, { monsterId:"skeleton_warrior", x:500,y:350 },
      { monsterId:"skeleton_warrior", x:700,y:430 }, { monsterId:"skeleton_warrior", x:400,y:600 },
      { monsterId:"skeleton_warrior", x:600,y:650 }, { monsterId:"skeleton_warrior", x:800,y:580 },
      { monsterId:"skeleton_warrior", x:350,y:800 }, { monsterId:"skeleton_warrior", x:550,y:850 },
      { monsterId:"skeleton_warrior", x:1200,y:350 }, { monsterId:"skeleton_warrior", x:1400,y:450 },
      { monsterId:"skeleton_warrior", x:1600,y:380 }, { monsterId:"skeleton_warrior", x:1300,y:600 },
      { monsterId:"skeleton_warrior", x:1500,y:680 }, { monsterId:"skeleton_warrior", x:1700,y:620 },
      { monsterId:"skeleton_warrior", x:2200,y:400 }, { monsterId:"skeleton_warrior", x:2500,y:480 },
      { monsterId:"skeleton_warrior", x:2800,y:420 }, { monsterId:"skeleton_warrior", x:2300,y:700 },
      { monsterId:"skeleton_warrior", x:3100,y:500 }, { monsterId:"skeleton_warrior", x:3300,y:620 },
      { monsterId:"goblin_boss", x:3500, y:700 },
      { monsterId:"skeleton_boss", x:3800, y:650 },
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
        id: string; mapId: string; name: string; level: number;
        hp: number; maxHp: number; atk: number; x: number; y: number;
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
        if (ai) { ai.state = "idle"; ai.lastChaseAt = 0; }
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
    this.drawPortals();
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
    this.weatherLayer?.removeAll(true);

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
    backdrop
      .fillStyle(0xf4d693, 0.03)
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

    this.drawRoads(map.id, mapWidth, mapHeight);
    this.drawWaterBodies(map.id);
    this.scatterProps(map.id, map.width, map.height);
    this.drawTownFence(map.id);
    this.drawGroundShade(mapWidth, mapHeight);
    this.drawAtmosphere(mapWidth, mapHeight);
    this.drawWeatherEffects(map.id, mapWidth, mapHeight);
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
    road.fillStyle(0x2c180d, 0.08);
    road.fillRoundedRect(180, 430, Math.max(500, mapWidth * 0.35), 12, 8);
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
      else if (roll < 0.28 && mapId !== "speakingIsland")
        texture = "prop_crystal";
      else if (roll < 0.32) texture = "prop_banner";
      else if (roll < 0.34) texture = "prop_fence";
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
      cave1.fillEllipse(900, 155, 80, 50);
      cave1.lineStyle(3, 0x5a3a10, 0.8);
      cave1.strokeEllipse(900, 155, 80, 50);
      cave1.fillStyle(0x000000, 1);
      cave1.fillEllipse(900, 162, 50, 32);
      this.propLayer?.add(cave1);
      this.add.text(900, 130, "고대 동굴", {
        fontSize: "10px", color: "#aa8855",
        stroke: "#000000", strokeThickness: 3,
      }).setOrigin(0.5);

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
      this.add.text(2700, 474, "코볼드 소굴", {
        fontSize: "10px", color: "#aa8855",
        stroke: "#000000", strokeThickness: 3,
      }).setOrigin(0.5);
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

  private drawWeatherEffects(mapId: string, mapWidth: number, mapHeight: number) {
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

    if (mapId === "moonlitWetland") {
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

    if (mapId === "windwoodForest") {
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

    if (mapId === "dragonValley") {
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
        portals.push({ x: 900, y: 162, label: "↑ 고대 동굴" });
        break;
      case "ancientCave":
        portals.push({ x: mapW * 0.5, y: mapH - 120, label: "↓ 동굴 출구" });
        break;
      case "silverKnightTown":
        portals.push({ x: 150, y: 400, label: "← 이야기의 섬" });
        portals.push({ x: mapW * 0.5, y: 150, label: "↑ 바람숲" });
        portals.push({ x: mapW - 150, y: 400, label: "오크 부락 →" });
        portals.push({ x: mapW * 0.5, y: mapH - 150, label: "↓ 글루디오 평원" });
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
    gfx.fillStyle(0x44aaff, 0.15);
    gfx.fillEllipse(x, y + 30, 120, 40);

    // 포탈 링 (외부)
    gfx.lineStyle(4, 0x88ccff, 0.8);
    gfx.strokeEllipse(x, y, 64, 90);

    // 포탈 링 (내부)
    gfx.lineStyle(2, 0xaaddff, 0.6);
    gfx.strokeEllipse(x, y, 48, 72);

    // 포탈 내부 채우기
    gfx.fillStyle(0x2266cc, 0.25);
    gfx.fillEllipse(x, y, 48, 72);

    // 포탈 상단 크리스탈
    gfx.lineStyle(3, 0x66ddff, 0.9);
    gfx.strokeTriangle(x - 8, y - 40, x + 8, y - 40, x, y - 56);
    gfx.fillStyle(0x88eeff, 0.7);
    gfx.fillTriangle(x - 8, y - 40, x + 8, y - 40, x, y - 56);

    this.overlayLayer?.add(gfx);
    this.portalGlows.push(gfx);

    // 포탈 레이블
    const text = this.add.text(x, y + 52, label, {
      fontSize: "11px",
      color: "#88ccff",
      stroke: "#001833",
      strokeThickness: 3,
    }).setOrigin(0.5);
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

      const container = this.add.container(worldPosition.x, worldPosition.y, [
        shadow,
        aura,
        ring,
        glow,
        sprite,
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
      .text(0, -68, payload.name, {
        fontSize: "14px",
        color: isSelf ? "#fff4ba" : "#f5f5f5",
        stroke: "#07101a",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const container = this.add.container(payload.x, payload.y, [
      shadow,
      aura,
      ring,
      glow,
      body,
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
      .ellipse(0, 16, isBoss ? 84 : 70, isBoss ? 30 : 24, isBoss ? 0xffc976 : 0xf57f69, isBoss ? 0.16 : 0.12)
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
      .rectangle(0, -64, 52, 7, 0x160808, 0.78)
      .setOrigin(0.5);
    const hpFill = this.add
      .rectangle(-25, -64, 50, 5, 0xfb7260, 0.95)
      .setOrigin(0, 0.5);
    const label = this.add
      .text(0, -82, payload.name, {
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
          .text(0, -98, "BOSS", {
            fontSize: "10px",
            color: "#221508",
            backgroundColor: "#f6cf83",
            padding: { x: 6, y: 2 },
          })
          .setOrigin(0.5)
      : null;

    const container = this.add.container(payload.x, payload.y, [
      shadow,
      aura,
      ring,
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
    if (this.mapId === "speakingIsland" && STARTER_TOWN_RECT.contains(this.localPlayer.x, this.localPlayer.y)) {
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
      // Main slash arc
      const slash = this.add
        .arc(monster.x, monster.y - 8, 32, 200, 340, false, classTone.slashTint, 0.32)
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
      // Secondary impact flash
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
      this.tweens.add({
        targets: this.localPlayer,
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 70,
        yoyo: true,
      });
      this.spawnWeaponTrail(
        this.localPlayer.x,
        this.localPlayer.y - 24,
        monster.x,
        monster.y - 14,
        classTone.trailTint,
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
        1 + Math.floor(attackProfile.str * 0.5) + Math.floor(attackProfile.dex * 0.4) + Math.floor(attackProfile.int * 0.3);
      const variance = Math.floor(Math.random() * 3); // 0 ~ +2
      const damage = Math.max(1, baseDamage + variance);
      const isCrit = Math.random() < 0.10;
      const finalDamage = isCrit ? Math.floor(damage * 1.6) : damage;

      const newHp = Math.max(0, monsterData.hp - finalDamage);
      this.offlineMonsterHp.set(monsterId, { ...monsterData, hp: newHp });

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
          if (ai) { ai.state = "idle"; ai.lastChaseAt = 0; }
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
    if (!sprite.spriteBody?.scene || !sprite.glowBody?.scene) return;
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
        ? [0, -2.2][sprite.animFrame % 2]
        : sprite.animState === "attack"
          ? [-1, -3.5, 2, 0][sprite.animFrame % 4]
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
    sprite.spriteBody.y = bob;
    sprite.glowBody.y = bob - 1;
    sprite.glowBody.alpha = pulseBase + Math.sin(now / 180) * 0.04;
    sprite.auraRing.y = 10 + bob * 0.2;
    sprite.auraRing.scaleX = auraPulse + Math.sin(now / 220) * 0.04;
    sprite.auraRing.scaleY = auraPulse * 0.82 + Math.cos(now / 260) * 0.03;
    sprite.auraRing.alpha =
      ("monsterId" in sprite && sprite.isBoss ? 0.18 : 0.1) +
      Math.sin(now / 200) * 0.025;
    sprite.lastX = sprite.x;
    sprite.lastY = sprite.y;
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
    this.ambientBloom = this.add
      .ellipse(this.scale.width * 0.24, 118, 420, 210, 0xffc36b, 0.12)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setScrollFactor(0)
      .setDepth(1400);
    this.ambientMoon = this.add
      .ellipse(this.scale.width * 0.76, 96, 240, 140, 0xc7e7ff, 0.08)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setScrollFactor(0)
      .setDepth(1400);
    this.ambientVeil = this.add
      .rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0x07101a,
        0.08,
      )
      .setScrollFactor(0)
      .setDepth(1401);

    const upperGlow = this.add
      .ellipse(980, 280, 840, 620, 0x78c9ff, 0.09)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const lowerGlow = this.add
      .ellipse(890, 760, 420, 280, 0x9effcf, 0.05)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    const fogBand = this.add
      .rectangle(920, 300, 1600, 120, 0xd9c9aa, 0.06)
      .setBlendMode(Phaser.BlendModes.SOFT_LIGHT);
    const moonPool = this.add
      .ellipse(980, 320, 190, 92, 0xe8f6ff, 0.18)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.overlayLayer?.add([upperGlow, lowerGlow, fogBand, moonPool]);
  }

  private updateAmbientLighting() {
    const phase = (Math.sin(this.time.now / 22000) + 1) / 2;
    if (this.ambientVeil) {
      this.ambientVeil.alpha = 0.05 + phase * 0.12;
      this.ambientVeil.fillColor = Phaser.Display.Color.GetColor(
        Phaser.Math.Linear(7, 14, 1 - phase),
        Phaser.Math.Linear(16, 34, 1 - phase),
        Phaser.Math.Linear(26, 56, phase),
      );
    }

    if (this.ambientBloom) {
      this.ambientBloom.alpha = 0.18 - phase * 0.11;
      this.ambientBloom.setScale(0.94 + Math.sin(this.time.now / 6000) * 0.04);
      this.ambientBloom.x = this.scale.width * (0.2 + phase * 0.1);
    }

    if (this.ambientMoon) {
      this.ambientMoon.alpha = 0.03 + phase * 0.14;
      this.ambientMoon.setScale(0.92 + Math.cos(this.time.now / 7000) * 0.05);
      this.ambientMoon.x = this.scale.width * (0.72 + phase * 0.07);
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

  private checkPortalTransitions() {
    if (!this.isOfflineMode || !this.localPlayer || this.isTransitioning) return;
    const px = this.localPlayer.x;
    const py = this.localPlayer.y;
    const map = MAPS[this.mapId] ?? MAPS.speakingIsland;
    const mapW = map.width * TILE_WIDTH + 320;
    const mapH = map.height * TILE_HEIGHT + 260;

    switch (this.mapId) {
      case "speakingIsland":
        if (px > mapW - 180 && py > 320 && py < 480)
          this.handleMapTransition("silverKnightTown", 240, 400);
        // 고대 동굴 입구 (픽셀 900, 162)
        if (Math.abs(px - 900) < 55 && Math.abs(py - 162) < 55)
          this.handleMapTransition("ancientCave", 300, 1200);
        break;
      case "ancientCave":
        // 동굴 출구 (맵 하단 중앙)
        if (py > mapH - 150 && px > mapW * 0.35 && px < mapW * 0.65)
          this.handleMapTransition("speakingIsland", 900, 200);
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

  private handleMapTransition(newMapId: string, spawnX: number, spawnY: number) {
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
          const mBase = monsterId.split("-offline-")[0];
          const speed = (MONSTERS[mBase]?.moveSpeed ?? 2) * 38;
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
          const ATTACK_INTERVAL = 1500;
          if (now - ai.lastAttackAt >= ATTACK_INTERVAL) {
            const store = useGameStore.getState();
            if (store.ui.deathOpen || store.player.hp <= 0) return;

            const monsterData = this.offlineMonsterHp.get(monsterId);
            if (!monsterData) return;

            const dmg = Math.max(1, monsterData.atk + Phaser.Math.Between(-1, 2));
            const newHp = Math.max(0, store.player.hp - dmg);
            store.setPlayer({ hp: newHp });
            ai.lastAttackAt = now;

            if (this.localPlayer) {
              this.showDamageNumber(this.localPlayer.x, this.localPlayer.y, dmg, false);
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
    this.effectLayer?.add(slash);
    this.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: isCrit ? 1.8 : 1.45,
      scaleY: isCrit ? 1.8 : 1.45,
      duration: isCrit ? 230 : 180,
      ease: "Power2.Out",
      onComplete: () => slash.destroy(),
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

  private spawnArcaneBurst(x: number, y: number, tint: number) {
    const ring = this.add
      .ellipse(x, y, 28, 28, tint, 0.18)
      .setStrokeStyle(2, 0xffffff, 0.7);
    this.effectLayer?.add(ring);
    this.tweens.add({
      targets: ring,
      scaleX: 2.2,
      scaleY: 2.2,
      alpha: 0,
      duration: 240,
      ease: "Sine.Out",
      onComplete: () => ring.destroy(),
    });
  }

  private spawnWeaponTrail(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    tint: number,
  ) {
    const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY);
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const trail = this.add
      .rectangle(
        midX,
        midY,
        Phaser.Math.Distance.Between(startX, startY, endX, endY),
        10,
        tint,
        0.16,
      )
      .setRotation(angle)
      .setBlendMode(Phaser.BlendModes.SCREEN);
    this.effectLayer?.add(trail);
    this.tweens.add({
      targets: trail,
      alpha: 0,
      scaleY: 0.2,
      duration: 140,
      ease: "Quad.Out",
      onComplete: () => trail.destroy(),
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
      .setScale(this.localPlayer.spriteBody.scaleX, this.localPlayer.spriteBody.scaleY)
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
        this.effectLayer?.add(ember);
        this.tweens.add({
          targets: ember,
          alpha: 0,
          scaleX: 0.1,
          scaleY: 0.1,
          duration: 180,
          ease: "Quad.Out",
          onComplete: () => ember.destroy(),
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
    this.effectLayer?.add(pulse);
    this.tweens.add({
      targets: pulse,
      scaleX: 1.9,
      scaleY: 1.9,
      alpha: 0,
      duration: 220,
      ease: "Quad.Out",
      onComplete: () => pulse.destroy(),
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
