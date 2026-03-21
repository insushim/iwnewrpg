"use client";

import { useEffect, useState } from "react";
import { EventBus } from "@/components/game/EventBus";

interface ComboData {
  comboCount: number;
  multiplier: number;
}

export function ComboAlert() {
  const [comboData, setComboData] = useState<ComboData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = EventBus.on("combo_kill", (payload) => {
      // Only show for combos of 3+
      if (payload.comboCount >= 3) {
        setComboData(payload);
        setIsVisible(true);

        // Hide after 2 seconds
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => setComboData(null), 500);
        }, 2000);
      }
    });

    return unsubscribe;
  }, []);

  if (!comboData) return null;

  const getComboLevel = (count: number) => {
    if (count >= 20) return "LEGENDARY";
    if (count >= 10) return "EPIC";
    if (count >= 5) return "RARE";
    return "COMBO";
  };

  const getComboColor = (count: number) => {
    if (count >= 20) return "from-red-500 to-orange-600";
    if (count >= 10) return "from-purple-500 to-pink-600";
    if (count >= 5) return "from-blue-500 to-cyan-600";
    return "from-yellow-500 to-orange-500";
  };

  return (
    <div
      className={`fixed left-1/2 top-1/3 z-40 pointer-events-none transition-all duration-500 transform -translate-x-1/2 ${
        isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"
      }`}
    >
      {/* Screen flash effect for big combos */}
      {comboData.comboCount >= 10 && (
        <div
          className={`fixed inset-0 transition-opacity duration-300 ${
            isVisible ? "opacity-30" : "opacity-0"
          }`}
          style={{
            background: `radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)`,
          }}
        />
      )}

      <div
        className={`relative bg-gradient-to-r ${getComboColor(comboData.comboCount)} rounded-2xl p-6 border-4 border-yellow-300 shadow-2xl`}
      >
        {/* Glow effect */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${getComboColor(comboData.comboCount)} blur-xl opacity-60`}
          style={{ transform: "scale(1.1)" }}
        />

        {/* Content */}
        <div className="relative text-center text-white">
          <div className="text-lg font-bold mb-1">
            {getComboLevel(comboData.comboCount)} COMBO!
          </div>
          <div className="text-4xl font-extrabold text-yellow-100 mb-2">
            {comboData.comboCount}x
          </div>
          <div className="text-xl font-semibold">
            {comboData.multiplier.toFixed(1)}배 보너스!
          </div>

          {/* Animated underline */}
          <div className="mt-3 h-1 bg-white/50 rounded overflow-hidden">
            <div
              className="h-full bg-yellow-300 rounded transition-all duration-2000"
              style={{
                width: isVisible ? "100%" : "0%",
              }}
            />
          </div>
        </div>

        {/* Sparkle effects */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 1}s`,
              animationDuration: `${0.8 + Math.random() * 0.4}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
