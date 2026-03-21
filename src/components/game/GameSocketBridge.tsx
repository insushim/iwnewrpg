"use client";

import { useEffect } from "react";
import { EventBus } from "@/components/game/EventBus";
import { useGameStore } from "@/lib/gameStore";
import { getSocket } from "@/lib/socket";

export function GameSocketBridge() {
  const player = useGameStore((state) => state.player);
  const addChat = useGameStore((state) => state.addChat);
  const setConnected = useGameStore((state) => state.setConnected);
  const setPlayer = useGameStore((state) => state.setPlayer);
  const setInventory = useGameStore((state) => state.setInventory);
  const setEquipment = useGameStore((state) => state.setEquipment);
  const setQuests = useGameStore((state) => state.setQuests);
  const setCurrentMapId = useGameStore((state) => state.setCurrentMapId);
  const setWorld = useGameStore((state) => state.setWorld);
  const upsertWorldPlayer = useGameStore((state) => state.upsertWorldPlayer);
  const removeWorldPlayer = useGameStore((state) => state.removeWorldPlayer);
  const upsertMonster = useGameStore((state) => state.upsertMonster);
  const addDroppedLoot = useGameStore((state) => state.addDroppedLoot);
  const removeDroppedLoot = useGameStore((state) => state.removeDroppedLoot);
  const openDeath = useGameStore((state) => state.openDeath);
  const tickTransform = useGameStore((state) => state.tickTransform);
  const setRankings = useGameStore((state) => state.setRankings);
  const checkMilestoneRewards = useGameStore(
    (state) => state.checkMilestoneRewards,
  );

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setConnected(true);
      EventBus.emit("socket_connected", { connected: true });
      socket.emit("player:connect", {
        id: socket.id,
        name: player.name,
        mapId: "speakingIsland",
        className: player.className,
      });
    };

    const onDisconnect = () => {
      setConnected(false);
      EventBus.emit("socket_connected", { connected: false });
    };

    const onConnectError = () => {
      // Set to offline mode
      setConnected(false);
      EventBus.emit("socket_connected", { connected: false });

      // Add a helpful system message
      addChat({
        id: crypto.randomUUID(),
        channel: "system",
        author: "시스템",
        message:
          "서버에 연결할 수 없습니다. 오프라인 모드로 게임을 계속하세요!",
        timestamp: Date.now(),
      });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("world:init", (payload) => {
      setWorld(payload);
      EventBus.emit("world_init", payload);
    });
    socket.on(
      "player:state",
      (payload: {
        name?: string;
        className?: string;
        gold: number;
        exp: number;
        level: number;
        hp: number;
        maxHp: number;
        mp: number;
        maxMp: number;
        inventory: import("@/lib/gameStore").InventoryItem[];
        equipment: import("@/lib/gameStore").EquipmentState;
        quests: import("@/lib/gameStore").QuestProgress[];
        mapId: string;
      }) => {
        const currentLevel = useGameStore.getState().player.level;
        const newLevel = payload.level;

        setPlayer({
          ...(payload.name ? { name: payload.name } : {}),
          ...(payload.className ? { className: payload.className } : {}),
          gold: payload.gold,
          exp: payload.exp,
          level: payload.level,
          expToNext: 100 + (payload.level - 1) * 50,
          hp: payload.hp,
          maxHp: payload.maxHp,
          mp: payload.mp,
          maxMp: payload.maxMp,
        });
        setInventory(payload.inventory);
        setEquipment(payload.equipment);
        setQuests(payload.quests);
        setCurrentMapId(payload.mapId);

        // Check for milestone rewards if level increased
        if (newLevel > currentLevel) {
          checkMilestoneRewards(newLevel);
        }
      },
    );
    socket.on("player:joined", (payload: { id: string; name: string }) => {
      const nextPlayer = {
        id: payload.id,
        name: payload.name,
        mapId: "speakingIsland",
        x: 400,
        y: 300,
      };
      upsertWorldPlayer(nextPlayer);
      EventBus.emit("player_joined", payload);
    });
    socket.on(
      "player:moved",
      (payload: {
        id: string;
        name: string;
        mapId: string;
        x: number;
        y: number;
      }) => {
        upsertWorldPlayer(payload);
        EventBus.emit("player_moved", payload);
      },
    );
    socket.on("player:left", (payload: { id: string }) => {
      removeWorldPlayer(payload.id);
      EventBus.emit("player_left", payload);
    });
    socket.on(
      "monster:updated",
      (payload: {
        id: string;
        mapId: string;
        name: string;
        level: number;
        hp: number;
        maxHp: number;
        x: number;
        y: number;
      }) => {
        upsertMonster(payload);
        EventBus.emit("monster_updated", payload);
      },
    );
    socket.on(
      "quiz:open",
      (payload: {
        monsterId: string;
        question: import("@/types/quiz").QuizQuestion;
        choices: string[];
        monsterLevel: number;
        streak: number;
      }) => {
        EventBus.emit("quiz_trigger", {
          monsterId: payload.monsterId,
          question: payload.question,
          choices: payload.choices,
          streak: payload.streak,
          monsterLevel: payload.monsterLevel,
        });
      },
    );
    socket.on(
      "quiz:result",
      (payload: {
        correct: boolean;
        reward: import("@/types/quiz").QuizReward;
        question: import("@/types/quiz").QuizQuestion;
        playerState: {
          gold: number;
          exp: number;
          level: number;
          hp: number;
          maxHp: number;
          mp: number;
          maxMp: number;
          inventory: import("@/lib/gameStore").InventoryItem[];
          equipment: import("@/lib/gameStore").EquipmentState;
          quests: import("@/lib/gameStore").QuestProgress[];
        };
      }) => {
        setPlayer({
          gold: payload.playerState.gold,
          exp: payload.playerState.exp,
          level: payload.playerState.level,
          expToNext: 100 + (payload.playerState.level - 1) * 50,
          hp: payload.playerState.hp,
          maxHp: payload.playerState.maxHp,
          mp: payload.playerState.mp,
          maxMp: payload.playerState.maxMp,
        });
        setInventory(payload.playerState.inventory);
        setEquipment(payload.playerState.equipment);
        setQuests(payload.playerState.quests);
        EventBus.emit("quiz_result", {
          status: payload.correct ? "correct" : "wrong",
          answer: payload.question.correctAnswer,
          reward: payload.reward,
        });
      },
    );
    socket.on(
      "loot:spawn",
      (payload: {
        items: Array<{
          lootId: string;
          itemId: string;
          name: string;
          quantity: number;
          x: number;
          y: number;
        }>;
      }) => {
        addDroppedLoot(payload.items);
        EventBus.emit("loot_spawn", payload);
      },
    );
    socket.on("loot:picked", (payload: { lootId: string }) => {
      removeDroppedLoot(payload.lootId);
      EventBus.emit("loot_picked", payload);
    });
    socket.on("player:death", (payload: { expLost: number }) => {
      openDeath(payload.expLost);
      EventBus.emit("player_death", payload);
    });

    socket.on(
      "player:transformed",
      (payload: {
        transformId: string;
        form: string;
        duration: number;
        cooldown: number;
        bonuses: any;
      }) => {
        // Update transform state in store
        useGameStore.setState({
          transform: {
            active: true,
            transformId: payload.transformId,
            remaining: payload.duration,
            cooldownUntil: Date.now() + payload.cooldown * 1000,
          },
        });

        // Add chat message
        addChat({
          id: crypto.randomUUID(),
          channel: "system",
          author: "시스템",
          message: `${payload.form}으로 변신했습니다!`,
          timestamp: Date.now(),
        });

        EventBus.emit("player_transformed", {
          playerId: useGameStore.getState().selfId ?? "",
          transformId: payload.transformId,
          form: payload.form,
        });
      },
    );
    socket.on(
      "chat:message",
      (payload: {
        id: string;
        author: string;
        channel: "system" | "normal" | "party" | "clan" | "trade";
        message: string;
        timestamp: number;
      }) => {
        addChat(payload);
      },
    );

    socket.on(
      "ranking:data",
      (payload: {
        rankings: Array<{
          id: string;
          name: string;
          level: number;
          combatPower: number;
          totalKills: number;
          className: string;
        }>;
        myRank: number;
      }) => {
        setRankings(payload.rankings, payload.myRank);
        EventBus.emit("ranking_data", payload);
      },
    );

    socket.on("rare_drop", (payload: { itemName: string; rarity: string }) => {
      EventBus.emit("rare_drop", payload);
    });

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("world:init");
      socket.off("player:state");
      socket.off("player:joined");
      socket.off("player:moved");
      socket.off("player:left");
      socket.off("monster:updated");
      socket.off("quiz:open");
      socket.off("quiz:result");
      socket.off("loot:spawn");
      socket.off("loot:picked");
      socket.off("player:death");
      socket.off("player:transformed");
      socket.off("chat:message");
      socket.off("ranking:data");
      socket.off("rare_drop");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Transform timer
  useEffect(() => {
    const transformTimer = setInterval(() => {
      tickTransform();
    }, 1000);

    return () => clearInterval(transformTimer);
  }, [tickTransform]);

  return null;
}
