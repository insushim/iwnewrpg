import type { Server as HttpServer } from "node:http";
import { ITEMS } from "@/game/data/items";
import { NPCS } from "@/game/data/npcs";
import { MAPS } from "@/game/data/maps";
import { QUESTS } from "@/game/data/quests";
import { ArmorSubType, ItemType, WeaponSubType } from "@/types/item";
import { Server } from "socket.io";
import { CombatHandler } from "./combatHandler";
import { MonsterManager, type MonsterState } from "./monsterManager";
import { QuizHandler } from "./quizHandler";
import { RoomManager } from "./roomManager";
import { loadPlayer, savePlayer } from "./firestore";

type ConnectPayload = {
  id: string;
  name: string;
  mapId?: string;
  className?: string;
};

type SessionInventoryItem = {
  id: string;
  name: string;
  quantity: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
  type: string;
};

type EquipmentSlot =
  | "weapon"
  | "armor"
  | "helmet"
  | "shield"
  | "cloak"
  | "boots"
  | "gloves"
  | "ring1"
  | "ring2"
  | "amulet"
  | "belt";

type SessionEquipment = Partial<Record<EquipmentSlot, SessionInventoryItem>>;
type QuestStatus = "available" | "in_progress" | "ready_to_turn_in" | "claimable" | "completed";

type SessionQuestProgress = {
  questId: string;
  status: QuestStatus;
  progress: number;
};

type SessionPlayer = {
  id: string;
  name: string;
  className: string;
  mapId: string;
  gold: number;
  exp: number;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  inventory: SessionInventoryItem[];
  equipment: SessionEquipment;
  quests: SessionQuestProgress[];
  quizCorrectStreak: number;
  lastAttackAt: number;
};

type GroundLoot = SessionInventoryItem & {
  lootId: string;
  ownerId: string;
  x: number;
  y: number;
};

function createStarterState(payload: ConnectPayload): SessionPlayer {
  const className = normalizeClassName(payload.className);
  const starterInventory = [toSessionItem("red_potion", 10), toSessionItem("teleport_scroll", 3)];
  const starterEquipment: SessionEquipment = {};

  if (className === "Ranger") {
    starterEquipment.weapon = toSessionItem("hunter_bow", 1);
    starterInventory.push(toSessionItem("training_arrow", 200));
  } else if (className === "Arcanist") {
    starterEquipment.weapon = toSessionItem("arcana_staff", 1);
  } else {
    starterEquipment.weapon = toSessionItem("trainee_dagger", 1);
  }

  return {
    id: payload.id,
    name: payload.name,
    className,
    mapId: payload.mapId ?? "speakingIsland",
    gold: 75,
    exp: 0,
    level: 1,
    hp: 52,
    maxHp: 52,
    mp: 18,
    maxMp: 18,
    equipment: starterEquipment,
    quests: QUESTS.map((quest) => ({
      questId: quest.id,
      status: "available",
      progress: 0,
    })),
    quizCorrectStreak: 0,
    lastAttackAt: 0,
    inventory: starterInventory,
  };
}

export function createGameServer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  const rooms = new RoomManager();
  const monsters = new MonsterManager();
  const combat = new CombatHandler(monsters);
  const quizzes = new QuizHandler();
  const sessions = new Map<string, SessionPlayer>();
  const groundLoot = new Map<string, GroundLoot>();

  setInterval(() => {
    const now = Date.now();

    monsters.listAll().forEach((monster) => {
      if (monster.hp <= 0) {
        return;
      }

      const playersInMap = rooms
        .list(monster.mapId)
        .map((presence) => ({
          presence,
          session: sessions.get(presence.id),
        }))
        .filter((entry): entry is { presence: ReturnType<RoomManager["list"]>[number]; session: SessionPlayer } => Boolean(entry.session));

      const currentTarget = monster.targetId
        ? playersInMap.find((entry) => entry.presence.id === monster.targetId)
        : null;

      let activeTarget = currentTarget;

      if (!activeTarget) {
        activeTarget =
          playersInMap
            .map((entry) => ({
              ...entry,
              distance: getDistance(monster.x, monster.y, entry.presence.x, entry.presence.y),
            }))
            .filter((entry) => entry.distance <= monster.aggroRange)
            .sort((a, b) => a.distance - b.distance)[0] ?? null;

        if (activeTarget) {
          monsters.setTarget(monster.id, activeTarget.presence.id);
        }
      }

      if (!activeTarget) {
        if (getDistance(monster.x, monster.y, monster.homeX, monster.homeY) > 4) {
          const returned = monsters.returnHome(monster.id);
          if (returned) {
            io.to(monster.mapId).emit("monster:updated", returned);
          }
        }
        return;
      }

      const distanceToTarget = getDistance(monster.x, monster.y, activeTarget.presence.x, activeTarget.presence.y);
      const distanceFromHome = getDistance(monster.homeX, monster.homeY, activeTarget.presence.x, activeTarget.presence.y);

      if (
        activeTarget.session.hp <= 0 ||
        distanceFromHome > monster.chaseRange ||
        isInsideMonsterSafeZone(monster.mapId, activeTarget.presence.x, activeTarget.presence.y)
      ) {
        const returned = monsters.returnHome(monster.id);
        if (returned) {
          io.to(monster.mapId).emit("monster:updated", returned);
        }
        return;
      }

      if (distanceToTarget > monster.attackRange) {
        const moved = monsters.moveTowards(monster.id, activeTarget.presence.x, activeTarget.presence.y);
        if (moved) {
          io.to(monster.mapId).emit("monster:updated", moved);
        }
        return;
      }

      if (now - monster.lastAttackAt < 1200) {
        return;
      }

      monsters.markAttack(monster.id, now);
      const incomingDamage = Math.max(1, monster.atk - Math.floor(getDerivedAc(activeTarget.session) / 3));
      activeTarget.session.hp = Math.max(0, activeTarget.session.hp - incomingDamage);

      if (activeTarget.session.hp === 0) {
        const expLost = Math.floor(getExpToNext(activeTarget.session.level) * 0.1);
        activeTarget.session.exp = Math.max(0, activeTarget.session.exp - expLost);
        activeTarget.session.hp = getDerivedMaxHp(activeTarget.session);
        activeTarget.session.mp = getDerivedMaxMp(activeTarget.session);
        activeTarget.session.mapId = "speakingIsland";
        io.to(activeTarget.presence.id).emit("player:death", { expLost, respawnMapId: "speakingIsland" });
        const returned = monsters.returnHome(monster.id);
        if (returned) {
          io.to(monster.mapId).emit("monster:updated", returned);
        }
      }

      io.to(activeTarget.presence.id).emit("player:state", serializePlayerState(activeTarget.session));
    });
  }, 400);

  io.on("connection", (socket) => {
    let currentMapId = "speakingIsland";
    let playerId = socket.id;
    let playerName = "Guest";

    socket.on("player:connect", async (payload: ConnectPayload) => {
      playerId = payload.id;
      playerName = payload.name;
      currentMapId = payload.mapId ?? "speakingIsland";
      socket.join(currentMapId);

      let session = sessions.get(playerId);
      if (!session) {
        const saved = await loadPlayer(playerId);
        if (saved) {
          session = {
            id: playerId,
            name: saved.name,
            className: saved.className,
            mapId: saved.mapId,
            gold: saved.gold,
            exp: saved.exp,
            level: saved.level,
            hp: saved.hp,
            maxHp: saved.maxHp,
            mp: saved.mp,
            maxMp: saved.maxMp,
            inventory: saved.inventory as SessionInventoryItem[],
            equipment: saved.equipment as SessionEquipment,
            quests: saved.quests as SessionQuestProgress[],
            quizCorrectStreak: saved.quizCorrectStreak,
            lastAttackAt: 0,
          };
          currentMapId = saved.mapId;
        } else {
          session = createStarterState(payload);
        }
      }
      sessions.set(playerId, session);

      const occupants = rooms.join(currentMapId, {
        id: playerId,
        name: playerName,
        mapId: currentMapId,
        x: 400,
        y: 300,
      });

      socket.emit("world:init", {
        selfId: playerId,
        players: occupants,
        monsters: monsters.list(currentMapId),
      });
      socket.emit("player:state", serializePlayerState(session));
      socket.to(currentMapId).emit("player:joined", { id: playerId, name: playerName });
    });

    socket.on("player:move", (payload: { x: number; y: number }) => {
      const player = rooms.move(currentMapId, playerId, payload.x, payload.y);
      if (player) {
        socket.to(currentMapId).emit("player:moved", player);
      }
    });

    socket.on("map:travel", (payload: { to: string }) => {
      const session = sessions.get(playerId);
      if (!session) {
        return;
      }

      const currentMap = MAPS[currentMapId];
      const connection = currentMap?.connections.find((entry) => entry.to === payload.to);
      if (!connection) {
        return;
      }

      rooms.leave(currentMapId, playerId);
      socket.to(currentMapId).emit("player:left", { id: playerId });
      socket.leave(currentMapId);

      currentMapId = payload.to;
      session.mapId = payload.to;
      socket.join(currentMapId);

      const occupants = rooms.join(currentMapId, {
        id: playerId,
        name: playerName,
        mapId: currentMapId,
        x: connection.spawn.x * 36 + 120,
        y: connection.spawn.y * 20 + 100,
      });

      progressTravelQuests(session, currentMapId);

      socket.emit("world:init", {
        selfId: playerId,
        players: occupants,
        monsters: monsters.list(currentMapId),
      });
      socket.emit("player:state", serializePlayerState(session));
      socket.to(currentMapId).emit("player:joined", { id: playerId, name: playerName });
    });

    socket.on("npc:interact", (payload: { npcId: string }) => {
      const session = sessions.get(playerId);
      if (!session || !NPCS[payload.npcId]) {
        return;
      }

      progressTalkQuests(session, payload.npcId);
      socket.emit("player:state", serializePlayerState(session));
    });

    socket.on("quest:accept", (payload: { questId: string }) => {
      const session = sessions.get(playerId);
      if (!session) {
        return;
      }

      const quest = session.quests.find((entry) => entry.questId === payload.questId);
      if (!quest || quest.status !== "available") {
        return;
      }

      quest.status = "in_progress";
      quest.progress = 0;
      socket.emit("player:state", serializePlayerState(session));
    });

    socket.on("quest:claim", (payload: { questId: string }) => {
      const session = sessions.get(playerId);
      if (!session) {
        return;
      }

      const progress = session.quests.find((entry) => entry.questId === payload.questId);
      const quest = QUESTS.find((entry) => entry.id === payload.questId);
      if (!progress || !quest || progress.status !== "claimable") {
        return;
      }

      session.gold += quest.rewards.gold;
      applyExpReward(session, quest.rewards.exp);
      quest.rewards.items.forEach((itemId) => addInventoryItem(session, toSessionItem(itemId, 1)));
      progress.status = "completed";

      socket.emit("player:state", serializePlayerState(session));
    });

    socket.on("combat:attack", (payload: { monsterId: string }) => {
      const session = sessions.get(playerId);
      if (!session) {
        return;
      }

      const weapon = session.equipment.weapon ? ITEMS[session.equipment.weapon.id] : null;
      const usesBow = weapon?.subtype === WeaponSubType.BOW;
      if (usesBow && !removeInventoryItem(session, "training_arrow", 1)) {
        socket.emit("chat:message", {
          id: crypto.randomUUID(),
          author: "System",
          channel: "system",
          message: "화살이 부족합니다.",
          timestamp: Date.now(),
        });
        socket.emit("player:state", serializePlayerState(session));
        return;
      }

      const now = Date.now();
      const attackCooldown = getAttackCooldown(session);
      if (now - session.lastAttackAt < attackCooldown) {
        return;
      }
      session.lastAttackAt = now;

      monsters.setTarget(payload.monsterId, playerId);

      const result = combat.attack(payload.monsterId, getCombatProfile(session));
      if (!result) {
        if (usesBow) {
          socket.emit("player:state", serializePlayerState(session));
        }
        return;
      }

      io.to(currentMapId).emit("monster:updated", result.monster);

      if (!result.defeated) {
        if (usesBow) {
          socket.emit("player:state", serializePlayerState(session));
        }
        return;
      }

      progressKillQuests(session, result.monster);
      socket.emit("player:state", serializePlayerState(session));

      const question = quizzes.generate(result.monster.level);
      socket.emit("quiz:open", {
        monsterId: result.monster.id,
        monsterLevel: result.monster.level,
        streak: session.quizCorrectStreak,
        question,
        choices: shuffle([question.correctAnswer, ...question.wrongAnswers]),
      });

      setTimeout(() => {
        const respawned = monsters.respawn(result.monster.id);
        if (respawned) {
          io.to(respawned.mapId).emit("monster:updated", respawned);
        }
      }, monsters.getRespawnDelay(result.monster.id));
    });

    socket.on(
      "quiz:answer",
      (payload: { questionId: string; monsterId?: string; answer: string }) => {
        const session = sessions.get(playerId);
        const monster = payload.monsterId ? monsters.get(payload.monsterId) : null;
        if (!session || !monster) {
          return;
        }

        const result = quizzes.verify(payload.questionId, payload.answer, monster);
        if (!result) {
          return;
        }

        let spawnedLoot: GroundLoot[] = [];

        if (result.correct) {
          session.quizCorrectStreak += 1;
          session.gold += result.reward.gold;
          applyExpReward(session, result.reward.exp);
          syncQuizStreakQuests(session);

          spawnedLoot = result.items.map((item, index) => {
            const loot: GroundLoot = {
              ...item,
              lootId: crypto.randomUUID(),
              ownerId: playerId,
              x: monster.x + index * 18,
              y: monster.y + 28,
            };
            groundLoot.set(loot.lootId, loot);
            return loot;
          });
        } else {
          session.quizCorrectStreak = 0;
          syncQuizStreakQuests(session);
        }

        socket.emit("quiz:result", {
          correct: result.correct,
          reward: result.reward,
          question: result.question,
          playerState: serializePlayerState(session),
        });

        if (spawnedLoot.length > 0) {
          socket.emit("loot:spawn", {
            items: spawnedLoot.map((loot) => ({
              lootId: loot.lootId,
              itemId: loot.id,
              name: loot.name,
              quantity: loot.quantity,
              x: loot.x,
              y: loot.y,
            })),
          });
        }
      },
    );

    socket.on("loot:pickup", (payload: { lootId: string }) => {
      const session = sessions.get(playerId);
      const loot = groundLoot.get(payload.lootId);
      if (!session || !loot || loot.ownerId !== playerId) {
        return;
      }

      addInventoryItem(session, loot);
      groundLoot.delete(payload.lootId);

      socket.emit("loot:picked", { lootId: payload.lootId });
      socket.emit("player:state", serializePlayerState(session));
    });

    socket.on("inventory:consume", (payload: { itemId: string }) => {
      const session = sessions.get(playerId);
      if (!session) return;

      const entry = session.inventory.find((item) => item.id === payload.itemId);
      const itemData = ITEMS[payload.itemId];
      if (!entry || !itemData || (itemData.type !== ItemType.CONSUMABLE && itemData.type !== ItemType.SCROLL)) {
        return;
      }

      removeInventoryItem(session, payload.itemId, 1);
      session.hp = Math.min(getDerivedMaxHp(session), session.hp + (itemData.stats.hp ?? 0));
      session.mp = Math.min(getDerivedMaxMp(session), session.mp + (itemData.stats.mp ?? 0));
      socket.emit("player:state", serializePlayerState(session));
    });

    socket.on("inventory:equip", (payload: { itemId: string }) => {
      const session = sessions.get(playerId);
      if (!session) return;

      const index = session.inventory.findIndex((item) => item.id === payload.itemId);
      if (index === -1) return;

      const slot = getEquipSlot(payload.itemId, session.equipment);
      if (!slot) return;

      const [item] = session.inventory.splice(index, 1);
      const previous = session.equipment[slot];
      session.equipment[slot] = item;
      if (previous) {
        session.inventory.push(previous);
      }

      session.hp = Math.min(getDerivedMaxHp(session), session.hp);
      session.mp = Math.min(getDerivedMaxMp(session), session.mp);
      socket.emit("player:state", serializePlayerState(session));
    });

    socket.on("inventory:unequip", (payload: { slot: EquipmentSlot }) => {
      const session = sessions.get(playerId);
      if (!session) return;

      const equipped = session.equipment[payload.slot];
      if (!equipped) return;

      delete session.equipment[payload.slot];
      addInventoryItem(session, equipped);
      session.hp = Math.min(getDerivedMaxHp(session), session.hp);
      session.mp = Math.min(getDerivedMaxMp(session), session.mp);
      socket.emit("player:state", serializePlayerState(session));
    });

    socket.on("shop:buy", (payload: { shopId: string; itemId: string }) => {
      const session = sessions.get(playerId);
      const shop = NPCS[payload.shopId];
      const item = ITEMS[payload.itemId];
      const entry = shop?.shopInventory?.find((value) => value.itemId === payload.itemId);
      const price = entry?.price ?? item?.price ?? 0;
      if (!session || !shop || !entry || !item || session.gold < price) {
        return;
      }

      session.gold -= price;
      addInventoryItem(session, toSessionItem(item.id, entry?.quantity ?? 1));
      socket.emit("player:state", serializePlayerState(session));
    });

    socket.on("shop:sell", (payload: { shopId: string; itemId: string }) => {
      const session = sessions.get(playerId);
      const shop = NPCS[payload.shopId];
      const item = ITEMS[payload.itemId];
      const price = Math.max(1, Math.floor((item?.price ?? 0) * 0.5));
      if (!session || !shop || !item) {
        return;
      }

      const removed = removeInventoryItem(session, payload.itemId, 1);
      if (!removed) {
        return;
      }

      session.gold += price;
      socket.emit("player:state", serializePlayerState(session));
    });

    socket.on("chat:send", (payload: { message: string }) => {
      io.to(currentMapId).emit("chat:message", {
        id: crypto.randomUUID(),
        author: playerName,
        channel: "normal",
        message: payload.message,
        timestamp: Date.now(),
      });
    });

    socket.on("disconnect", async () => {
      const session = sessions.get(playerId);
      if (session) {
        await savePlayer(playerId, {
          name: session.name,
          className: session.className,
          mapId: session.mapId,
          gold: session.gold,
          exp: session.exp,
          level: session.level,
          hp: session.hp,
          maxHp: session.maxHp,
          mp: session.mp,
          maxMp: session.maxMp,
          inventory: session.inventory,
          equipment: session.equipment as Record<string, unknown>,
          quests: session.quests,
          quizCorrectStreak: session.quizCorrectStreak,
          updatedAt: Date.now(),
        });
        sessions.delete(playerId);
      }

      rooms.leave(currentMapId, playerId);

      Array.from(groundLoot.entries()).forEach(([lootId, loot]) => {
        if (loot.ownerId === playerId) {
          groundLoot.delete(lootId);
        }
      });

      socket.to(currentMapId).emit("player:left", { id: playerId });
    });
  });

  // Auto-save all sessions every 60 seconds
  setInterval(() => {
    sessions.forEach((session, id) => {
      savePlayer(id, {
        name: session.name,
        className: session.className,
        mapId: session.mapId,
        gold: session.gold,
        exp: session.exp,
        level: session.level,
        hp: session.hp,
        maxHp: session.maxHp,
        mp: session.mp,
        maxMp: session.maxMp,
        inventory: session.inventory,
        equipment: session.equipment as Record<string, unknown>,
        quests: session.quests,
        quizCorrectStreak: session.quizCorrectStreak,
        updatedAt: Date.now(),
      });
    });
  }, 60_000);

  return io;
}

function toSessionItem(itemId: string, quantity: number): SessionInventoryItem {
  const item = ITEMS[itemId];

  return {
    id: itemId,
    name: item?.name ?? itemId,
    quantity,
    rarity: item?.rarity ?? "common",
    type: item?.type ?? "material",
  };
}

function addInventoryItem(session: SessionPlayer, item: SessionInventoryItem) {
  const existing = session.inventory.find((entry) => entry.id === item.id);
  if (existing) {
    existing.quantity += item.quantity;
    return;
  }

  session.inventory.push({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    rarity: item.rarity,
    type: item.type,
  });
}

function removeInventoryItem(session: SessionPlayer, itemId: string, quantity: number) {
  const existing = session.inventory.find((entry) => entry.id === itemId);
  if (!existing || existing.quantity < quantity) {
    return false;
  }

  existing.quantity -= quantity;
  if (existing.quantity <= 0) {
    session.inventory = session.inventory.filter((entry) => entry.id !== itemId);
  }

  return true;
}

function getCombatProfile(session: SessionPlayer) {
  const weapon = session.equipment.weapon ? ITEMS[session.equipment.weapon.id] : null;

  if (weapon?.subtype === WeaponSubType.STAFF) {
    return {
      str: 2,
      dex: 1,
      int: 8 + (weapon.stats.maxAttack ?? 2) + (weapon.stats.spellPower ?? 0),
    };
  }

  if (weapon?.subtype === WeaponSubType.BOW) {
    return {
      str: 3,
      dex: 6 + (weapon.stats.maxAttack ?? 2) + (weapon.stats.rangedDamage ?? 0),
      int: 1,
    };
  }

  return {
    str: 6 + (weapon?.stats.maxAttack ?? 2),
    dex: 2,
    int: 1,
  };
}

function getAttackCooldown(session: SessionPlayer) {
  const weapon = session.equipment.weapon ? ITEMS[session.equipment.weapon.id] : null;

  if (weapon?.subtype === WeaponSubType.BOW) {
    return 1600;
  }

  if (weapon?.subtype === WeaponSubType.STAFF) {
    return 1800;
  }

  return 1400;
}

function getEquipSlot(itemId: string, equipment: SessionEquipment): EquipmentSlot | null {
  const item = ITEMS[itemId];
  if (!item) return null;
  if (item.type === ItemType.WEAPON) return "weapon";
  if (item.subtype === ArmorSubType.ARMOR) return "armor";
  if (item.subtype === ArmorSubType.HELMET) return "helmet";
  if (item.subtype === ArmorSubType.SHIELD) return "shield";
  if (item.subtype === ArmorSubType.CLOAK) return "cloak";
  if (item.subtype === ArmorSubType.BOOTS) return "boots";
  if (item.subtype === ArmorSubType.GLOVES) return "gloves";
  if (item.subtype === ArmorSubType.RING) return equipment.ring1 ? "ring2" : "ring1";
  if (item.subtype === ArmorSubType.AMULET) return "amulet";
  if (item.subtype === ArmorSubType.BELT) return "belt";
  return null;
}

function getDerivedMaxHp(session: SessionPlayer) {
  const hpBonus = Object.values(session.equipment).reduce((sum, item) => {
    return sum + (item ? (ITEMS[item.id]?.stats.hp ?? 0) : 0);
  }, 0);

  return session.maxHp + hpBonus;
}

function getDerivedMaxMp(session: SessionPlayer) {
  const mpBonus = Object.values(session.equipment).reduce((sum, item) => {
    return sum + (item ? (ITEMS[item.id]?.stats.mp ?? 0) : 0);
  }, 0);

  return session.maxMp + mpBonus;
}

function getDerivedAc(session: SessionPlayer) {
  const acBonus = Object.values(session.equipment).reduce((sum, item) => {
    return sum + (item ? (ITEMS[item.id]?.stats.ac ?? 0) : 0);
  }, 0);

  return 10 + acBonus;
}

function serializePlayerState(session: SessionPlayer) {
  return {
    gold: session.gold,
    exp: session.exp,
    level: session.level,
    hp: session.hp,
    maxHp: getDerivedMaxHp(session),
    mp: session.mp,
    maxMp: getDerivedMaxMp(session),
    inventory: session.inventory,
    equipment: session.equipment,
    quests: session.quests,
    mapId: session.mapId,
  };
}

function applyExpReward(session: SessionPlayer, expReward: number) {
  session.exp += expReward;

  while (session.exp >= getExpToNext(session.level)) {
    session.exp -= getExpToNext(session.level);
    session.level += 1;
    session.maxHp += 6;
    session.maxMp += 3;
  }

  session.hp = getDerivedMaxHp(session);
  session.mp = getDerivedMaxMp(session);
}

function progressTalkQuests(session: SessionPlayer, npcId: string) {
  QUESTS.forEach((questData) => {
    const objective = questData.objectives[0];
    const progress = session.quests.find((entry) => entry.questId === questData.id);
    if (!objective || !progress || progress.status !== "in_progress") {
      if (progress && progress.status === "ready_to_turn_in" && questData.npc === npcId) {
        progress.status = "claimable";
      }
      return;
    }

    if (objective.type === "talk" && objective.target === npcId) {
      const goal = objective.count ?? 1;
      progress.progress = goal;
      progress.status = "claimable";
    }
  });
}

function progressKillQuests(session: SessionPlayer, monster: MonsterState) {
  QUESTS.forEach((questData) => {
    const objective = questData.objectives[0];
    const progress = session.quests.find((entry) => entry.questId === questData.id);
    if (!objective || !progress || progress.status !== "in_progress" || objective.type !== "kill") {
      return;
    }

    const target = objective.target;
    const matches = target === "any" || target === monster.id || monster.id.startsWith(`${target ?? ""}-`);
    if (!matches) {
      return;
    }

    const goal = objective.count ?? 1;
    progress.progress = Math.min(goal, progress.progress + 1);
    if (progress.progress >= goal) {
      progress.status = "ready_to_turn_in";
    }
  });
}

function syncQuizStreakQuests(session: SessionPlayer) {
  QUESTS.forEach((questData) => {
    const objective = questData.objectives[0];
    const progress = session.quests.find((entry) => entry.questId === questData.id);
    if (!objective || !progress || progress.status !== "in_progress" || objective.type !== "quiz_streak") {
      return;
    }

    const goal = objective.count ?? 1;
    progress.progress = Math.min(goal, session.quizCorrectStreak);
    progress.status = session.quizCorrectStreak >= goal ? "ready_to_turn_in" : "in_progress";
  });
}

function progressTravelQuests(session: SessionPlayer, mapId: string) {
  QUESTS.forEach((questData) => {
    const objective = questData.objectives[0];
    const progress = session.quests.find((entry) => entry.questId === questData.id);
    if (!objective || !progress || progress.status !== "in_progress") {
      return;
    }

    const isTravelObjective = objective.type === "travel" || objective.type === "reach";
    if (!isTravelObjective || objective.target !== mapId) {
      return;
    }

    progress.progress = objective.count ?? 1;
    progress.status = "ready_to_turn_in";
  });
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function getExpToNext(level: number) {
  return 100 + (level - 1) * 50;
}

function getDistance(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}

function normalizeClassName(value?: string) {
  const normalized = (value ?? "Guardian").trim().toLowerCase();

  if (normalized.includes("ranger") || normalized.includes("레인저")) return "Ranger";
  if (normalized.includes("arcan") || normalized.includes("아르카")) return "Arcanist";
  if (normalized.includes("sovereign") || normalized.includes("군주")) return "Sovereign";
  return "Guardian";
}

function isInsideMonsterSafeZone(mapId: string, x: number, y: number) {
  if (mapId !== "speakingIsland") {
    return false;
  }

  return x >= 220 && x <= 980 && y >= 180 && y <= 610;
}
