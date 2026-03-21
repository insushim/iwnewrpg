"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EventBus } from "@/components/game/EventBus";
import { useGameStore } from "@/lib/gameStore";

interface JoystickState {
  isActive: boolean;
  centerX: number;
  centerY: number;
  currentX: number;
  currentY: number;
  dx: number;
  dy: number;
}

export function MobileControls() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [joystick, setJoystick] = useState<JoystickState>({
    isActive: false,
    centerX: 0,
    centerY: 0,
    currentX: 0,
    currentY: 0,
    dx: 0,
    dy: 0,
  });

  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const moveIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const consumeItem = useGameStore((state) => state.consumeItem);
  const inventory = useGameStore((state) => state.inventory);

  // Check if device supports touch
  useEffect(() => {
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);
  }, []);

  // Stop movement when joystick is released
  const stopMovement = useCallback(() => {
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = undefined;
    }
    EventBus.emit("mobile_stop", {});
  }, []);

  // Start movement based on joystick direction
  const startMovement = useCallback(
    (dx: number, dy: number) => {
      stopMovement();

      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        return;
      }

      // Send initial move event
      EventBus.emit("mobile_move", { dx, dy });

      // Continue sending move events while joystick is active
      moveIntervalRef.current = setInterval(() => {
        EventBus.emit("mobile_move", { dx, dy });
      }, 100); // Send movement every 100ms
    },
    [stopMovement],
  );

  // Handle joystick touch events
  const handleJoystickStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!joystickRef.current) return;

      const rect = joystickRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      setJoystick((prev) => ({
        ...prev,
        isActive: true,
        centerX,
        centerY,
        currentX: centerX,
        currentY: centerY,
        dx: 0,
        dy: 0,
      }));
    },
    [],
  );

  const handleJoystickMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!joystick.isActive) return;

      const maxDistance = 40; // Maximum joystick radius
      const deltaX = clientX - joystick.centerX;
      const deltaY = clientY - joystick.centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      let newX = clientX;
      let newY = clientY;

      if (distance > maxDistance) {
        const angle = Math.atan2(deltaY, deltaX);
        newX = joystick.centerX + Math.cos(angle) * maxDistance;
        newY = joystick.centerY + Math.sin(angle) * maxDistance;
      }

      const normalizedDx = (newX - joystick.centerX) / maxDistance;
      const normalizedDy = (newY - joystick.centerY) / maxDistance;

      setJoystick((prev) => ({
        ...prev,
        currentX: newX,
        currentY: newY,
        dx: normalizedDx,
        dy: normalizedDy,
      }));

      startMovement(normalizedDx, normalizedDy);
    },
    [joystick.isActive, joystick.centerX, joystick.centerY, startMovement],
  );

  const handleJoystickEnd = useCallback(() => {
    if (!joystick.isActive) return;

    setJoystick((prev) => ({
      ...prev,
      isActive: false,
      currentX: prev.centerX,
      currentY: prev.centerY,
      dx: 0,
      dy: 0,
    }));

    stopMovement();
  }, [joystick.isActive, stopMovement]);

  // Mouse events for joystick
  const onJoystickMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleJoystickStart(e.clientX, e.clientY);

      const handleMouseMove = (e: MouseEvent) => {
        handleJoystickMove(e.clientX, e.clientY);
      };

      const handleMouseUp = () => {
        handleJoystickEnd();
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleJoystickStart, handleJoystickMove, handleJoystickEnd],
  );

  // Touch events for joystick
  const onJoystickTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        handleJoystickStart(touch.clientX, touch.clientY);
      }
    },
    [handleJoystickStart],
  );

  const onJoystickTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        handleJoystickMove(touch.clientX, touch.clientY);
      }
    },
    [handleJoystickMove],
  );

  const onJoystickTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      handleJoystickEnd();
    },
    [handleJoystickEnd],
  );

  // Action button handlers
  const handleAttack = useCallback(() => {
    EventBus.emit("mobile_attack", {});
  }, []);

  const handleUsePotion = useCallback(() => {
    const redPotion = inventory?.find((it) => it.id === "red_potion");
    if (redPotion && redPotion.quantity > 0) {
      consumeItem("red_potion");
    }
  }, [inventory, consumeItem]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMovement();
    };
  }, [stopMovement]);

  // Only render on touch devices
  if (!isTouchDevice) {
    return null;
  }

  const knobStyle = {
    transform: `translate(${joystick.currentX - joystick.centerX}px, ${joystick.currentY - joystick.centerY}px)`,
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50">
      {/* Virtual Joystick - Bottom Left */}
      <div className="absolute bottom-24 left-4 md:bottom-32">
        <div
          ref={joystickRef}
          className="relative h-24 w-24 rounded-full border-2 border-white/20 bg-black/40 backdrop-blur-sm"
          onMouseDown={onJoystickMouseDown}
          onTouchStart={onJoystickTouchStart}
          onTouchMove={onJoystickTouchMove}
          onTouchEnd={onJoystickTouchEnd}
          style={{ touchAction: "none" }}
        >
          {/* Joystick Knob */}
          <div
            ref={knobRef}
            className={`absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 transition-colors duration-200 ${
              joystick.isActive
                ? "bg-blue-400/80 shadow-lg shadow-blue-400/30"
                : "bg-white/60"
            }`}
            style={knobStyle}
          />
          {/* Direction indicators */}
          <div className="absolute inset-2 rounded-full border border-white/10" />
          <div className="absolute left-1/2 top-1 h-2 w-px -translate-x-1/2 bg-white/30" />
          <div className="absolute bottom-1 left-1/2 h-2 w-px -translate-x-1/2 bg-white/30" />
          <div className="absolute left-1 top-1/2 h-px w-2 -translate-y-1/2 bg-white/30" />
          <div className="absolute right-1 top-1/2 h-px w-2 -translate-y-1/2 bg-white/30" />
        </div>
        <div className="mt-1 text-center text-xs text-white/60">
          {joystick.isActive ? "이동 중" : "이동"}
        </div>
      </div>

      {/* Action Buttons - Bottom Right */}
      <div className="absolute bottom-24 right-4 flex flex-col gap-3 md:bottom-32">
        {/* Attack Button */}
        <button
          onTouchStart={handleAttack}
          onClick={handleAttack}
          className="h-16 w-16 rounded-full border-2 border-red-400/60 bg-red-600/40 text-white backdrop-blur-sm transition-all duration-200 active:scale-95 active:bg-red-500/60"
          style={{ touchAction: "manipulation" }}
        >
          <div className="text-lg font-bold">⚔️</div>
        </button>

        {/* Potion Button */}
        <button
          onTouchStart={handleUsePotion}
          onClick={handleUsePotion}
          className="h-14 w-14 rounded-full border-2 border-green-400/60 bg-green-600/40 text-white backdrop-blur-sm transition-all duration-200 active:scale-95 active:bg-green-500/60"
          style={{ touchAction: "manipulation" }}
        >
          <div className="text-sm font-bold">🧪</div>
        </button>
      </div>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === "development" && joystick.isActive && (
        <div className="absolute left-4 top-4 rounded bg-black/60 p-2 text-xs text-white">
          <div>dx: {joystick.dx.toFixed(2)}</div>
          <div>dy: {joystick.dy.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}
