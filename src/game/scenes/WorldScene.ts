import * as Phaser from "phaser";
import { NPC_LIST } from "@/game/data/npcs";
import { EventBus } from "@/components/game/EventBus";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";

type RemotePlayer = {
  id: string;
  body: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

type RemoteMonster = {
  id: string;
  body: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Rectangle;
};

type LootSprite = {
  lootId: string;
  body: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  tween: Phaser.Tweens.Tween;
};

type NpcSprite = {
  id: string;
  body: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

const NPC_POSITION_SCALE = 36;

export class WorldScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Rectangle;
  private playerLabel?: Phaser.GameObjects.Text;
  private remotePlayers = new Map<string, RemotePlayer>();
  private remoteMonsters = new Map<string, RemoteMonster>();
  private lootSprites = new Map<string, LootSprite>();
  private npcSprites = new Map<string, NpcSprite>();
  private selfId: string | null = null;
  private currentMapId = "speakingIsland";
  private moveTimer = 0;
  private unsubscribers: Array<() => void> = [];

  constructor() {
    super("WorldScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#102033");
    this.drawWorld();
    this.drawNpcs("speakingIsland");

    this.player = this.add.rectangle(400, 300, 28, 40, 0xd6b44d);
    this.playerLabel = this.add.text(352, 246, "RuneLearner", {
      color: "#fff2c0",
      fontSize: "14px",
    });

    this.add.text(24, 24, "바닥 클릭 이동 / 몬스터 클릭 공격 / NPC 클릭 대화 / 빛 조각 클릭 루팅", {
      color: "#ffffff",
      fontSize: "16px",
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer, targets: Phaser.GameObjects.GameObject[]) => {
      if (targets.length > 0 || !this.player) return;
      this.moveLocalPlayer(pointer.worldX, pointer.worldY);
    });

    this.unsubscribers.push(
      EventBus.on("world_init", (payload) => {
        this.selfId = payload.selfId;
        this.currentMapId = payload.players.find((player) => player.id === payload.selfId)?.mapId ?? "speakingIsland";
        this.resetWorldSprites();
        this.drawNpcs(this.currentMapId);
        this.syncPlayers(payload.players);
        this.syncMonsters(payload.monsters);
      }),
    );
    this.unsubscribers.push(
      EventBus.on("player_moved", (payload) => {
        if (payload.id === this.selfId) return;
        const remote = this.ensureRemotePlayer(payload.id, payload.name);
        remote.body.setPosition(payload.x, payload.y);
        remote.label.setPosition(payload.x - 32, payload.y - 42);
      }),
    );
    this.unsubscribers.push(
      EventBus.on("player_left", (payload) => {
        const remote = this.remotePlayers.get(payload.id);
        if (!remote) return;
        remote.body.destroy();
        remote.label.destroy();
        this.remotePlayers.delete(payload.id);
      }),
    );
    this.unsubscribers.push(
      EventBus.on("monster_updated", (payload) => {
        const monster = this.ensureMonster(payload.id, payload.name, payload.x, payload.y);
        monster.body.setPosition(payload.x, payload.y);
        monster.label.setPosition(payload.x - 34, payload.y - 42);
        monster.hpBar.setPosition(payload.x - 20, payload.y - 24);
        monster.hpBar.width = Math.max(0, 40 * (payload.hp / payload.maxHp));
        monster.body.setAlpha(payload.hp === 0 ? 0.35 : 1);
      }),
    );
    this.unsubscribers.push(
      EventBus.on("loot_spawn", (payload) => {
        payload.items.forEach((item) => this.spawnLoot(item));
      }),
    );
    this.unsubscribers.push(
      EventBus.on("loot_picked", (payload) => {
        this.removeLoot(payload.lootId);
      }),
    );

    this.events.on("shutdown", this.cleanup, this);
    this.events.on("destroy", this.cleanup, this);
  }

  update(_time: number, delta: number) {
    if (!this.player || !this.playerLabel) return;
    this.playerLabel.setPosition(this.player.x - 48, this.player.y - 54);
    this.moveTimer += delta;
  }

  private drawWorld() {
    for (let x = 0; x < 16; x += 1) {
      for (let y = 0; y < 10; y += 1) {
        this.add
          .rectangle(120 + x * 76, 100 + y * 54, 72, 50, (x + y) % 2 === 0 ? 0x20391f : 0x294623)
          .setStrokeStyle(1, 0x3d5b34, 0.35);
      }
    }
  }

  private drawNpcs(mapId: string) {
    NPC_LIST.filter((npc) => npc.mapId === mapId).forEach((npc) => {
      const x = 120 + npc.position.x * NPC_POSITION_SCALE;
      const y = 100 + npc.position.y * 20;
      const body = this.add.rectangle(x, y, 24, 36, 0x4da6d6).setInteractive({ useHandCursor: true });
      const label = this.add.text(x - 40, y - 40, npc.name, { color: "#c9efff", fontSize: "13px" });

      body.on("pointerdown", () => {
        EventBus.emit("npc_interact", {
          npcId: npc.id,
          npcName: npc.name,
          dialogue: npc.dialogue,
          canShop: Boolean(npc.shopInventory?.length),
        });

        const store = useGameStore.getState();
        store.openDialogue({
          npcId: npc.id,
          npcName: npc.name,
          dialogue: npc.dialogue,
        });

        const socket = getSocket();
        if (socket.connected) {
          socket.emit("npc:interact", { npcId: npc.id });
        } else {
          const npcQuests = store.getNpcQuests(npc.id);

          npcQuests.forEach((quest) => {
            const objective = quest.objectives[0];

            if (quest.status === "ready_to_turn_in") {
              store.setQuests(
                store.quests.map((entry) =>
                  entry.questId === quest.id ? { ...entry, status: "claimable" } : entry,
                ),
              );
              return;
            }

            if (objective?.type === "talk" && quest.status === "in_progress") {
              store.updateQuestProgress(quest.id, objective.count ?? 1);
            }
          });
        }

        if (npc.shopInventory?.length && npc.role !== "quest") {
          store.setActiveShop(npc.id);
          if (!store.ui.shopOpen) {
            store.toggleShop();
          }
        }
      });

      this.npcSprites.set(npc.id, { id: npc.id, body, label });
    });
  }

  private moveLocalPlayer(x: number, y: number) {
    if (!this.player) return;

    this.tweens.add({
      targets: this.player,
      x,
      y,
      duration: 220,
      ease: "Sine.Out",
    });

    const socket = getSocket();
    if (socket.connected && this.moveTimer >= 50) {
      socket.emit("player:move", { x, y });
      this.moveTimer = 0;
    }
  }

  private syncPlayers(players: Array<{ id: string; name: string; mapId: string; x: number; y: number }>) {
    players.forEach((player) => {
      if (player.id === this.selfId) {
        this.player?.setPosition(player.x, player.y);
        this.playerLabel?.setText(player.name);
        this.playerLabel?.setPosition(player.x - 32, player.y - 42);
        return;
      }

      const remote = this.ensureRemotePlayer(player.id, player.name);
      remote.body.setPosition(player.x, player.y);
      remote.label.setPosition(player.x - 32, player.y - 42);
    });
  }

  private syncMonsters(
    monsters: Array<{ id: string; mapId: string; name: string; level: number; hp: number; maxHp: number; x: number; y: number }>,
  ) {
    monsters.forEach((monster) => {
      const next = this.ensureMonster(monster.id, monster.name, monster.x, monster.y);
      next.hpBar.width = Math.max(0, 40 * (monster.hp / monster.maxHp));
    });
  }

  private ensureRemotePlayer(id: string, name: string) {
    const existing = this.remotePlayers.get(id);
    if (existing) return existing;

    const body = this.add.rectangle(400, 300, 28, 40, 0x8cb4ff);
    const label = this.add.text(368, 258, name, { color: "#d5e3ff", fontSize: "14px" });
    const player = { id, body, label };
    this.remotePlayers.set(id, player);
    return player;
  }

  private ensureMonster(id: string, name: string, x: number, y: number) {
    const existing = this.remoteMonsters.get(id);
    if (existing) return existing;

    const body = this.add.rectangle(x, y, 30, 30, 0xb53a2c).setInteractive({ useHandCursor: true });
    const label = this.add.text(x - 34, y - 42, name, { color: "#f8b8a5", fontSize: "14px" });
    this.add.rectangle(x - 20, y - 24, 40, 4, 0x220000).setOrigin(0, 0.5);
    const hpBar = this.add.rectangle(x - 20, y - 24, 40, 4, 0xff5555).setOrigin(0, 0.5);

    body.on("pointerdown", () => {
      const socket = getSocket();
      const store = useGameStore.getState();

      if (socket.connected) {
        socket.emit("combat:attack", { monsterId: id });
        return;
      }

      if (id.startsWith("slime-")) {
        const slimeQuest = store.quests.find((quest) => quest.questId === "mq_002");
        if (slimeQuest?.status === "in_progress") {
          store.updateQuestProgress("mq_002", Math.min(5, slimeQuest.progress + 1));
        }
      }
    });

    const monster = { id, body, label, hpBar };
    this.remoteMonsters.set(id, monster);
    return monster;
  }

  private spawnLoot(item: { lootId: string; itemId: string; name: string; quantity: number; x: number; y: number }) {
    if (this.lootSprites.has(item.lootId)) {
      return;
    }

    const body = this.add.rectangle(item.x, item.y, 16, 16, 0xffd84d).setInteractive({ useHandCursor: true });
    const label = this.add.text(item.x - 24, item.y - 18, `${item.name} x${item.quantity}`, {
      color: "#ffe083",
      fontSize: "12px",
      backgroundColor: "#24180a",
    });

    body.on("pointerdown", () => {
      const socket = getSocket();
      if (socket.connected) {
        socket.emit("loot:pickup", { lootId: item.lootId });
      }
    });

    const tween = this.tweens.add({
      targets: body,
      y: body.y - 6,
      yoyo: true,
      repeat: -1,
      duration: 900,
    });

    this.lootSprites.set(item.lootId, { lootId: item.lootId, body, label, tween });
  }

  private removeLoot(lootId: string) {
    const loot = this.lootSprites.get(lootId);
    if (!loot) return;
    loot.tween.stop();
    loot.body.destroy();
    loot.label.destroy();
    this.lootSprites.delete(lootId);
  }

  private cleanup() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
    this.lootSprites.forEach((loot) => {
      loot.tween.stop();
      loot.body.destroy();
      loot.label.destroy();
    });
    this.lootSprites.clear();
    this.npcSprites.forEach((npc) => {
      npc.body.destroy();
      npc.label.destroy();
    });
    this.npcSprites.clear();
    this.remotePlayers.forEach((player) => {
      player.body.destroy();
      player.label.destroy();
    });
    this.remotePlayers.clear();
    this.remoteMonsters.forEach((monster) => {
      monster.body.destroy();
      monster.label.destroy();
      monster.hpBar.destroy();
    });
    this.remoteMonsters.clear();
  }

  private resetWorldSprites() {
    this.lootSprites.forEach((loot) => {
      loot.tween.stop();
      loot.body.destroy();
      loot.label.destroy();
    });
    this.lootSprites.clear();
    this.npcSprites.forEach((npc) => {
      npc.body.destroy();
      npc.label.destroy();
    });
    this.npcSprites.clear();
    this.remotePlayers.forEach((player) => {
      player.body.destroy();
      player.label.destroy();
    });
    this.remotePlayers.clear();
    this.remoteMonsters.forEach((monster) => {
      monster.body.destroy();
      monster.label.destroy();
      monster.hpBar.destroy();
    });
    this.remoteMonsters.clear();
  }
}
