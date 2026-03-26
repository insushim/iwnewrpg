import type { Server as HttpServer } from "node:http";
import { ITEMS } from "@/game/data/items";
import { NPCS } from "@/game/data/npcs";
import { MAPS } from "@/game/data/maps";
import { QUESTS } from "@/game/data/quests";
import { TRANSFORMS } from "@/game/data/transforms";
import { ArmorSubType, ItemType, WeaponSubType } from "@/types/item";
import { Server } from "socket.io";
import { CombatHandler } from "./combatHandler";
import { MonsterManager, type MonsterState } from "./monsterManager";
import { QuizHandler } from "./quizHandler";
import { RoomManager } from "./roomManager";
import { ClanManager } from "./clanManager";
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
type QuestStatus =
  | "available"
  | "in_progress"
  | "ready_to_turn_in"
  | "claimable"
  | "completed";

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
  alignment: number;
  pkCount: number;
  totalKills: number;
  combatPower: number;
};

type GroundLoot = SessionInventoryItem & {
  lootId: string;
  ownerId: string;
  x: number;
  y: number;
};

function createStarterState(payload: ConnectPayload): SessionPlayer {
  const className = normalizeClassName(payload.className);
  const starterInventory = [
    toSessionItem("red_potion", 10),
    toSessionItem("teleport_scroll", 3),
  ];
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
    alignment: 0,
    pkCount: 0,
    totalKills: 0,
    combatPower: 100, // Base combat power
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
  const clans = new ClanManager();
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
        .filter(
          (
            entry,
          ): entry is {
            presence: ReturnType<RoomManager["list"]>[number];
            session: SessionPlayer;
          } => Boolean(entry.session),
        );

      const currentTarget = monster.targetId
        ? playersInMap.find((entry) => entry.presence.id === monster.targetId)
        : null;

      let activeTarget = currentTarget;

      if (!activeTarget) {
        activeTarget =
          playersInMap
            .map((entry) => ({
              ...entry,
              distance: getDistance(
                monster.x,
                monster.y,
                entry.presence.x,
                entry.presence.y,
              ),
            }))
            .filter((entry) => entry.distance <= monster.aggroRange)
            .sort((a, b) => a.distance - b.distance)[0] ?? null;

        if (activeTarget) {
          monsters.setTarget(monster.id, activeTarget.presence.id);
        }
      }

      if (!activeTarget) {
        if (
          getDistance(monster.x, monster.y, monster.homeX, monster.homeY) > 4 &&
          !monster.wanderTimer
        ) {
          const returned = monsters.returnHome(monster.id);
          if (returned) {
            io.to(monster.mapId).emit("monster:updated", returned);
          }
        } else {
          // 배회 (wander) — 타겟 없을 때 스폰 근처 돌아다님
          const wandered = monsters.wander(monster.id, now);
          if (wandered) {
            io.to(monster.mapId).emit("monster:updated", wandered);
          }
        }
        return;
      }

      const distanceToTarget = getDistance(
        monster.x,
        monster.y,
        activeTarget.presence.x,
        activeTarget.presence.y,
      );
      const distanceFromHome = getDistance(
        monster.homeX,
        monster.homeY,
        activeTarget.presence.x,
        activeTarget.presence.y,
      );

      if (
        activeTarget.session.hp <= 0 ||
        distanceFromHome > monster.chaseRange ||
        isInsideMonsterSafeZone(
          monster.mapId,
          activeTarget.presence.x,
          activeTarget.presence.y,
        )
      ) {
        const returned = monsters.returnHome(monster.id);
        if (returned) {
          io.to(monster.mapId).emit("monster:updated", returned);
        }
        return;
      }

      if (distanceToTarget > monster.attackRange) {
        const moved = monsters.moveTowards(
          monster.id,
          activeTarget.presence.x,
          activeTarget.presence.y,
        );
        if (moved) {
          io.to(monster.mapId).emit("monster:updated", moved);
        }
        return;
      }

      if (now - monster.lastAttackAt < 1200) {
        return;
      }

      monsters.markAttack(monster.id, now);
      const incomingDamage = Math.max(
        1,
        monster.atk - Math.floor(getDerivedAc(activeTarget.session) / 3),
      );
      activeTarget.session.hp = Math.max(
        0,
        activeTarget.session.hp - incomingDamage,
      );

      if (activeTarget.session.hp === 0) {
        const expLost = Math.floor(
          getExpToNext(activeTarget.session.level) * 0.1,
        );
        activeTarget.session.exp = Math.max(
          0,
          activeTarget.session.exp - expLost,
        );
        activeTarget.session.hp = getDerivedMaxHp(activeTarget.session);
        activeTarget.session.mp = getDerivedMaxMp(activeTarget.session);
        activeTarget.session.mapId = "speakingIsland";
        io.to(activeTarget.presence.id).emit("player:death", {
          expLost,
          respawnMapId: "speakingIsland",
        });
        const returned = monsters.returnHome(monster.id);
        if (returned) {
          io.to(monster.mapId).emit("monster:updated", returned);
        }
      }

      io.to(activeTarget.presence.id).emit(
        "player:state",
        serializePlayerState(activeTarget.session),
      );
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
            alignment: saved.alignment ?? 0,
            pkCount: saved.pkCount ?? 0,
          };
          currentMapId = saved.mapId;
        } else {
          session = createStarterState(payload);
        }
      }
      sessions.set(playerId, session);
      // 저장된 이름이 있으면 우선 사용 (클라이언트 기본값 "견습 모험가" 방지)
      playerName = session.name || playerName;

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
      socket
        .to(currentMapId)
        .emit("player:joined", { id: playerId, name: playerName });

      // Update clan member online status
      clans.updateMemberOnline(playerId);

      // Send current clan info to player
      const currentClan = clans.getClan(playerId);
      if (currentClan) {
        socket.emit("clan:current", currentClan);
      }
    });

    socket.on("player:move", (payload: { x: number; y: number }) => {
      const player = rooms.move(currentMapId, playerId, payload.x, payload.y);
      if (player) {
        socket.to(currentMapId).emit("player:moved", player);
      }
    });

    socket.on("player:transform", (payload: { transformId: string }) => {
      const session = sessions.get(playerId);
      if (!session) {
        return;
      }

      const transform = TRANSFORMS.find((t) => t.id === payload.transformId);
      if (!transform) {
        return;
      }

      // Check level requirement
      if (session.level < transform.requiredLevel) {
        socket.emit("system:message", {
          channel: "system",
          author: "시스템",
          message: `${transform.form} 변신은 레벨 ${transform.requiredLevel} 이상부터 사용 가능합니다.`,
        });
        return;
      }

      // Apply transformation
      socket.emit("player:transformed", {
        transformId: transform.id,
        form: transform.form,
        duration: transform.duration,
        cooldown: transform.cooldown,
        bonuses: transform.bonuses,
      });

      // Broadcast to other players
      socket.to(currentMapId).emit("player:transformed", {
        playerId,
        transformId: transform.id,
        form: transform.form,
        bonuses: transform.bonuses,
      });
    });

    socket.on("map:travel", (payload: { to: string }) => {
      const session = sessions.get(playerId);
      if (!session) {
        return;
      }

      const currentMap = MAPS[currentMapId];
      const connection = currentMap?.connections.find(
        (entry) => entry.to === payload.to,
      );
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
      socket
        .to(currentMapId)
        .emit("player:joined", { id: playerId, name: playerName });
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

      const quest = session.quests.find(
        (entry) => entry.questId === payload.questId,
      );
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

      const progress = session.quests.find(
        (entry) => entry.questId === payload.questId,
      );
      const quest = QUESTS.find((entry) => entry.id === payload.questId);
      if (!progress || !quest || progress.status !== "claimable") {
        return;
      }

      session.gold += quest.rewards.gold;
      applyExpReward(session, quest.rewards.exp);
      quest.rewards.items.forEach((itemId) =>
        addInventoryItem(session, toSessionItem(itemId, 1)),
      );
      progress.status = "completed";

      socket.emit("player:state", serializePlayerState(session));
    });

    socket.on("combat:attack", (payload: { monsterId: string }) => {
      const session = sessions.get(playerId);
      if (!session) {
        return;
      }

      const weapon = session.equipment.weapon
        ? ITEMS[session.equipment.weapon.id]
        : null;
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

      const result = combat.attack(
        payload.monsterId,
        getCombatProfile(session),
      );
      if (!result) {
        if (usesBow) {
          socket.emit("player:state", serializePlayerState(session));
        }
        return;
      }

      io.to(currentMapId).emit("monster:updated", result.monster);

      // Emit combat result for visual feedback
      if (result.missed) {
        socket.emit("combat:miss", { monsterId: payload.monsterId });
      } else if (result.isCrit) {
        socket.emit("combat:crit", {
          monsterId: payload.monsterId,
          damage: result.damage,
        });
      } else {
        socket.emit("combat:hit", {
          monsterId: payload.monsterId,
          damage: result.damage,
        });
      }

      if (!result.defeated) {
        if (usesBow) {
          socket.emit("player:state", serializePlayerState(session));
        }
        return;
      }

      progressKillQuests(session, result.monster);
      // Alignment recovery: +1 per monster kill
      if (session.alignment < 0) {
        session.alignment = Math.min(0, session.alignment + 1);
      }

      // Track kills for ranking system
      session.totalKills = (session.totalKills || 0) + 1;

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

    socket.on("pvp:attack", (payload: { targetPlayerId: string }) => {
      const attackerSession = sessions.get(playerId);
      const targetSession = sessions.get(payload.targetPlayerId);

      if (!attackerSession || !targetSession) {
        return;
      }

      // Check if attacker is in safe zone
      if (isPlayerSafeZone(attackerSession.mapId)) {
        socket.emit("chat:message", {
          id: crypto.randomUUID(),
          author: "시스템",
          channel: "system",
          message: "안전지역에서는 PvP를 할 수 없습니다.",
          timestamp: Date.now(),
        });
        return;
      }

      // Check if target is in safe zone
      if (isPlayerSafeZone(targetSession.mapId)) {
        socket.emit("chat:message", {
          id: crypto.randomUUID(),
          author: "시스템",
          channel: "system",
          message: "상대방이 안전지역에 있습니다.",
          timestamp: Date.now(),
        });
        return;
      }

      // Check attack cooldown
      const now = Date.now();
      const attackCooldown = getAttackCooldown(attackerSession);
      if (now - attackerSession.lastAttackAt < attackCooldown) {
        return;
      }
      attackerSession.lastAttackAt = now;

      // Calculate damage using same formula as monster combat
      const attackerProfile = getCombatProfile(attackerSession);
      const attackerDamage = Math.max(
        1,
        Math.floor(
          (attackerProfile.str + attackerProfile.dex + attackerProfile.int) / 3,
        ) - Math.floor(getDerivedAc(targetSession) / 3),
      );

      const previousHp = targetSession.hp;
      targetSession.hp = Math.max(0, targetSession.hp - attackerDamage);

      // Emit damage to both players
      io.to(attackerSession.mapId).emit("pvp:damage", {
        attackerId: playerId,
        targetId: payload.targetPlayerId,
        damage: attackerDamage,
        targetHp: targetSession.hp,
      });

      if (targetSession.hp === 0) {
        // PK penalty for attacker
        attackerSession.alignment -= 200;
        attackerSession.pkCount += 1;

        // Death penalty for victim: lose 3% exp
        const expLost = Math.floor(getExpToNext(targetSession.level) * 0.03);
        targetSession.exp = Math.max(0, targetSession.exp - expLost);

        // Respawn victim in speakingIsland
        targetSession.hp = getDerivedMaxHp(targetSession);
        targetSession.mp = getDerivedMaxMp(targetSession);
        targetSession.mapId = "speakingIsland";

        io.to(payload.targetPlayerId).emit("player:death", {
          expLost,
          respawnMapId: "speakingIsland",
          killedByPlayer: playerId,
        });

        // Notify attacker of PK penalty
        socket.emit("chat:message", {
          id: crypto.randomUUID(),
          author: "시스템",
          channel: "system",
          message: `${targetSession.name}를 살해했습니다. 성향이 악화되었습니다. (${attackerSession.alignment})`,
          timestamp: Date.now(),
        });
      }

      // Update both players' states
      socket.emit("player:state", serializePlayerState(attackerSession));
      io.to(payload.targetPlayerId).emit(
        "player:state",
        serializePlayerState(targetSession),
      );
    });

    socket.on(
      "quiz:answer",
      (payload: { questionId: string; monsterId?: string; answer: string }) => {
        const session = sessions.get(playerId);
        const monster = payload.monsterId
          ? monsters.get(payload.monsterId)
          : null;
        if (!session || !monster) {
          return;
        }

        const result = quizzes.verify(
          payload.questionId,
          payload.answer,
          monster,
        );
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

          // Check for rare drops and emit alerts
          spawnedLoot.forEach((loot) => {
            if (loot.rarity && loot.rarity !== "common") {
              socket.emit("rare_drop", {
                itemName: loot.name,
                rarity: loot.rarity,
              });
            }
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

      const entry = session.inventory.find(
        (item) => item.id === payload.itemId,
      );
      const itemData = ITEMS[payload.itemId];
      if (
        !entry ||
        !itemData ||
        (itemData.type !== ItemType.CONSUMABLE &&
          itemData.type !== ItemType.SCROLL)
      ) {
        return;
      }

      removeInventoryItem(session, payload.itemId, 1);
      session.hp = Math.min(
        getDerivedMaxHp(session),
        session.hp + (itemData.stats.hp ?? 0),
      );
      session.mp = Math.min(
        getDerivedMaxMp(session),
        session.mp + (itemData.stats.mp ?? 0),
      );

      // 순간이동 주문서 - 서버 위치도 업데이트
      if (payload.itemId === "teleport_scroll") {
        const mapData = MAPS[session.mapId];
        if (mapData) {
          const mapW = (mapData.width ?? 30) * (mapData.tileSize ?? 48);
          const mapH = (mapData.height ?? 30) * (mapData.tileSize ?? 48);
          // Broadcast position will be handled by client teleport
        }
      }

      // 귀환 주문서 - 마을로 이동
      if (payload.itemId === "return_scroll") {
        session.mapId = "speakingIsland";
      }

      socket.emit("player:state", serializePlayerState(session));
    });

    socket.on("inventory:equip", (payload: { itemId: string }) => {
      const session = sessions.get(playerId);
      if (!session) return;

      const index = session.inventory.findIndex(
        (item) => item.id === payload.itemId,
      );
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
      const entry = shop?.shopInventory?.find(
        (value) => value.itemId === payload.itemId,
      );
      const price = entry?.price ?? item?.price ?? 0;
      if (!session || !shop || !entry || !item) {
        return;
      }
      if (session.gold < price) {
        socket.emit("chat:message", {
          id: crypto.randomUUID(),
          author: "시스템",
          channel: "system",
          message: `골드가 부족합니다. (필요: ${price}G / 보유: ${session.gold}G)`,
          timestamp: Date.now(),
        });
        return;
      }

      session.gold -= price;
      addInventoryItem(session, toSessionItem(item.id, entry?.quantity ?? 1));
      socket.emit("player:state", serializePlayerState(session));
      socket.emit("chat:message", {
        id: crypto.randomUUID(),
        author: "시스템",
        channel: "system",
        message: `${item.name}을(를) 구매했습니다. (-${price}G)`,
        timestamp: Date.now(),
      });
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

    socket.on(
      "player:claimDailyBonus",
      (payload: {
        gold: number;
        exp: number;
        items?: Array<{ itemId: string; qty: number }>;
        itemId?: string;
        qty?: number;
        attendanceDay?: number;
      }) => {
        const session = sessions.get(playerId);
        if (!session) return;

        session.gold += payload.gold;
        applyExpReward(session, payload.exp);

        // Support both new items array and legacy single-item format
        const itemList = payload.items ?? (payload.itemId ? [{ itemId: payload.itemId, qty: payload.qty ?? 1 }] : []);
        for (const { itemId, qty } of itemList) {
          const item = ITEMS[itemId];
          if (!item) continue;
          const existing = session.inventory.find((e) => e.id === itemId);
          if (existing) {
            existing.quantity += qty;
          } else {
            session.inventory.push({
              id: item.id,
              name: item.name,
              quantity: qty,
              rarity: item.rarity,
              type: item.type,
            });
          }
        }

        socket.emit("player:state", serializePlayerState(session));
      },
    );

    socket.on("chat:send", (payload: { message: string }) => {
      io.to(currentMapId).emit("chat:message", {
        id: crypto.randomUUID(),
        author: playerName,
        channel: "normal",
        message: payload.message,
        timestamp: Date.now(),
      });
    });

    // Clan system socket events
    socket.on("clan:create", (payload: { name: string }) => {
      const session = sessions.get(playerId);
      if (!session) return;

      if (session.gold < 15000) {
        socket.emit("chat:message", {
          id: crypto.randomUUID(),
          author: "시스템",
          channel: "system",
          message: "혈맹 창설에 필요한 골드가 부족합니다. (15,000 Gold 필요)",
          timestamp: Date.now(),
        });
        return;
      }

      if (session.level < 10) {
        socket.emit("chat:message", {
          id: crypto.randomUUID(),
          author: "시스템",
          channel: "system",
          message: "혈맹을 창설하려면 레벨 10 이상이어야 합니다.",
          timestamp: Date.now(),
        });
        return;
      }

      const clan = clans.create(playerId, playerName, payload.name);
      if (!clan) {
        socket.emit("chat:message", {
          id: crypto.randomUUID(),
          author: "시스템",
          channel: "system",
          message:
            "이미 혈맹에 소속되어 있거나 동일한 이름의 혈맹이 존재합니다.",
          timestamp: Date.now(),
        });
        return;
      }

      session.gold -= 15000;
      socket.emit("clan:created", clan);
      socket.emit("player:state", serializePlayerState(session));
    });

    socket.on("clan:join", (payload: { clanId: string }) => {
      const joined = clans.join(playerId, playerName, payload.clanId);
      if (joined) {
        const clan = clans.getClanById(payload.clanId);
        socket.emit("clan:joined", clan);
      }
    });

    socket.on("clan:leave", () => {
      const left = clans.leave(playerId);
      if (left) {
        socket.emit("clan:left");
      }
    });

    socket.on("clan:list", () => {
      socket.emit("clan:list", clans.listAll());
    });

    socket.on("clan:chat", (payload: { message: string }) => {
      const clan = clans.getClan(playerId);
      if (clan) {
        const chatMessage = {
          id: crypto.randomUUID(),
          author: playerName,
          channel: "clan",
          message: payload.message,
          timestamp: Date.now(),
        };
        clan.members.forEach((member) => {
          io.to(member.id).emit("chat:message", chatMessage);
        });
      }
    });

    socket.on("ranking:request", () => {
      const allSessions = Array.from(sessions.values());

      // Calculate combat power for each session
      allSessions.forEach((session) => {
        // Simple combat power calculation: level * 100 + gold/10 + total kills * 5
        session.combatPower =
          session.level * 100 +
          Math.floor(session.gold / 10) +
          session.totalKills * 5;
      });

      const rankings = allSessions
        .filter((s) => s.level > 1) // Only include players who have gained at least 1 level
        .map((session) => ({
          id: session.id,
          name: session.name,
          level: session.level,
          combatPower: session.combatPower,
          totalKills: session.totalKills,
          className: session.className,
        }))
        .sort((a, b) => b.level - a.level) // Sort by level by default
        .slice(0, 20); // Top 20 only

      // Find current player's rank
      const currentSession = sessions.get(playerId);
      let myRank = 0;
      if (currentSession) {
        const sortedByLevel = allSessions.sort((a, b) => b.level - a.level);
        myRank = sortedByLevel.findIndex((s) => s.id === playerId) + 1;
      }

      socket.emit("ranking:data", {
        rankings,
        myRank,
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
          alignment: session.alignment,
          pkCount: session.pkCount,
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
        alignment: session.alignment,
        pkCount: session.pkCount,
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

function removeInventoryItem(
  session: SessionPlayer,
  itemId: string,
  quantity: number,
) {
  const existing = session.inventory.find((entry) => entry.id === itemId);
  if (!existing || existing.quantity < quantity) {
    return false;
  }

  existing.quantity -= quantity;
  if (existing.quantity <= 0) {
    session.inventory = session.inventory.filter(
      (entry) => entry.id !== itemId,
    );
  }

  return true;
}

function getCombatProfile(session: SessionPlayer) {
  const weapon = session.equipment.weapon
    ? ITEMS[session.equipment.weapon.id]
    : null;
  const lvBonus = Math.floor(session.level / 2) * 2;

  if (weapon?.subtype === WeaponSubType.STAFF) {
    return {
      str: 2,
      dex: 2,
      int:
        8 +
        (weapon.stats.maxAttack ?? 2) +
        (weapon.stats.spellPower ?? 0) +
        lvBonus,
      level: session.level,
    };
  }

  if (weapon?.subtype === WeaponSubType.BOW) {
    return {
      str: 3,
      dex:
        8 +
        (weapon.stats.maxAttack ?? 2) +
        (weapon.stats.rangedDamage ?? 0) +
        lvBonus,
      int: 2,
      level: session.level,
    };
  }

  return {
    str: 6 + (weapon?.stats.maxAttack ?? 2) + lvBonus,
    dex: 4,
    int: 2,
    level: session.level,
  };
}

function getAttackCooldown(session: SessionPlayer) {
  const weapon = session.equipment.weapon
    ? ITEMS[session.equipment.weapon.id]
    : null;

  if (weapon?.subtype === WeaponSubType.BOW) {
    return 1600;
  }

  if (weapon?.subtype === WeaponSubType.STAFF) {
    return 1800;
  }

  return 1400;
}

function getEquipSlot(
  itemId: string,
  equipment: SessionEquipment,
): EquipmentSlot | null {
  const item = ITEMS[itemId];
  if (!item) return null;
  if (item.type === ItemType.WEAPON) return "weapon";
  if (item.subtype === ArmorSubType.ARMOR) return "armor";
  if (item.subtype === ArmorSubType.HELMET) return "helmet";
  if (item.subtype === ArmorSubType.SHIELD) return "shield";
  if (item.subtype === ArmorSubType.CLOAK) return "cloak";
  if (item.subtype === ArmorSubType.BOOTS) return "boots";
  if (item.subtype === ArmorSubType.GLOVES) return "gloves";
  if (item.subtype === ArmorSubType.RING)
    return equipment.ring1 ? "ring2" : "ring1";
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
    name: session.name,
    className: session.className,
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
    alignment: session.alignment,
    pkCount: session.pkCount,
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
    const progress = session.quests.find(
      (entry) => entry.questId === questData.id,
    );
    if (!objective || !progress || progress.status !== "in_progress") {
      if (
        progress &&
        progress.status === "ready_to_turn_in" &&
        questData.npc === npcId
      ) {
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
    const progress = session.quests.find(
      (entry) => entry.questId === questData.id,
    );
    if (
      !objective ||
      !progress ||
      progress.status !== "in_progress" ||
      objective.type !== "kill"
    ) {
      return;
    }

    const target = objective.target;
    const matches =
      target === "any" ||
      target === monster.id ||
      monster.id.startsWith(`${target ?? ""}-`);
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
    const progress = session.quests.find(
      (entry) => entry.questId === questData.id,
    );
    if (
      !objective ||
      !progress ||
      progress.status !== "in_progress" ||
      objective.type !== "quiz_streak"
    ) {
      return;
    }

    const goal = objective.count ?? 1;
    progress.progress = Math.min(goal, session.quizCorrectStreak);
    progress.status =
      session.quizCorrectStreak >= goal ? "ready_to_turn_in" : "in_progress";
  });
}

function progressTravelQuests(session: SessionPlayer, mapId: string) {
  QUESTS.forEach((questData) => {
    const objective = questData.objectives[0];
    const progress = session.quests.find(
      (entry) => entry.questId === questData.id,
    );
    if (!objective || !progress || progress.status !== "in_progress") {
      return;
    }

    const isTravelObjective =
      objective.type === "travel" || objective.type === "reach";
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

  if (normalized.includes("ranger") || normalized.includes("레인저"))
    return "Ranger";
  if (normalized.includes("arcan") || normalized.includes("아르카"))
    return "Arcanist";
  if (normalized.includes("sovereign") || normalized.includes("군주"))
    return "Sovereign";
  return "Guardian";
}

function isInsideMonsterSafeZone(mapId: string, x: number, y: number) {
  if (mapId !== "speakingIsland") {
    return false;
  }

  return x >= 220 && x <= 980 && y >= 180 && y <= 610;
}

function isPlayerSafeZone(mapId: string) {
  const mapData = MAPS[mapId];
  return mapData?.safeZone === true;
}
