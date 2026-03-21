"use client";

import { useEffect, useState } from "react";
import { EventBus } from "@/components/game/EventBus";

type RareDropAlertProps = {
  itemName: string;
  rarity: string;
  onDismiss: () => void;
};

const RARITY_CONFIG = {
  uncommon: {
    color: "#22c55e",
    bgGlow: "rgba(34, 197, 94, 0.3)",
    effectSize: "small",
    duration: 2000,
    text: "언커먼",
  },
  rare: {
    color: "#3b82f6",
    bgGlow: "rgba(59, 130, 246, 0.4)",
    effectSize: "medium",
    duration: 2500,
    text: "레어",
  },
  epic: {
    color: "#a855f7",
    bgGlow: "rgba(168, 85, 247, 0.5)",
    effectSize: "large",
    duration: 3000,
    text: "에픽",
  },
  legendary: {
    color: "#f59e0b",
    bgGlow: "rgba(245, 158, 11, 0.6)",
    effectSize: "huge",
    duration: 3500,
    text: "레전더리",
  },
  mythic: {
    color: "#ef4444",
    bgGlow: "rgba(239, 68, 68, 0.7)",
    effectSize: "massive",
    duration: 4000,
    text: "미식",
  },
};

function RareDropAlertItem({
  itemName,
  rarity,
  onDismiss,
}: RareDropAlertProps) {
  const config =
    RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG] || RARITY_CONFIG.rare;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // Wait for fade out animation
    }, config.duration);

    return () => clearTimeout(timer);
  }, [config.duration, onDismiss]);

  const getTextSize = () => {
    switch (config.effectSize) {
      case "small":
        return "text-xl";
      case "medium":
        return "text-2xl";
      case "large":
        return "text-3xl";
      case "huge":
        return "text-4xl";
      case "massive":
        return "text-5xl";
      default:
        return "text-2xl";
    }
  };

  const getScreenEffect = () => {
    const intensity =
      config.effectSize === "massive"
        ? 0.8
        : config.effectSize === "huge"
          ? 0.6
          : 0.4;
    return `radial-gradient(circle at center, ${config.bgGlow} 0%, transparent 70%)`;
  };

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background: visible ? getScreenEffect() : "transparent",
      }}
    >
      {/* Screen shake effect for epic+ */}
      <div
        className={`relative transition-transform duration-100 ${
          config.effectSize === "huge" || config.effectSize === "massive"
            ? "animate-pulse"
            : ""
        }`}
        style={{
          animation:
            config.effectSize === "massive"
              ? "shake 0.5s ease-in-out infinite"
              : undefined,
        }}
      >
        {/* Particle effects */}
        {config.effectSize !== "small" && (
          <div className="absolute inset-0 -m-32">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute h-2 w-2 rounded-full animate-ping"
                style={{
                  backgroundColor: config.color,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Main alert */}
        <div
          className="relative rounded-[24px] border-2 bg-black/80 px-8 py-6 text-center backdrop-blur-sm"
          style={{
            borderColor: config.color,
            boxShadow: `0 0 ${config.effectSize === "massive" ? "60px" : "40px"} ${config.color}40`,
          }}
        >
          <div
            className={`font-bold uppercase tracking-wider ${getTextSize()}`}
            style={{ color: config.color }}
          >
            {config.text} 아이템 획득!
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {itemName}
          </div>

          {/* Lightning effect for mythic */}
          {config.effectSize === "massive" && (
            <div className="absolute inset-0 -m-8 overflow-hidden rounded-[32px]">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  background: `conic-gradient(from 0deg at 50% 50%, ${config.color} 0deg, transparent 60deg, ${config.color} 120deg, transparent 180deg, ${config.color} 240deg, transparent 300deg, ${config.color} 360deg)`,
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-2px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(2px);
          }
        }
      `}</style>
    </div>
  );
}

export function RareDropAlert() {
  const [alerts, setAlerts] = useState<
    Array<{ id: string; itemName: string; rarity: string }>
  >([]);

  useEffect(() => {
    const unsubscribe = EventBus.on("rare_drop", (payload) => {
      const newAlert = {
        id: crypto.randomUUID(),
        itemName: payload.itemName,
        rarity: payload.rarity,
      };
      setAlerts((prev) => [...prev, newAlert]);
    });

    return unsubscribe;
  }, []);

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <>
      {alerts.map((alert) => (
        <RareDropAlertItem
          key={alert.id}
          itemName={alert.itemName}
          rarity={alert.rarity}
          onDismiss={() => dismissAlert(alert.id)}
        />
      ))}
    </>
  );
}
