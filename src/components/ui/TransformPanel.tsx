"use client";

import { useGameStore } from "@/lib/gameStore";
import { TRANSFORMS } from "@/game/data/transforms";

export function TransformPanel() {
  const { player, transform, activateTransform, cancelTransform } =
    useGameStore();

  const availableTransforms = TRANSFORMS.filter(
    (t) => player.level >= t.requiredLevel,
  );

  const isOnCooldown = (transformId: string) => {
    return Date.now() < transform.cooldownUntil;
  };

  return (
    <div className="fixed top-20 right-4 w-80 bg-black/90 border border-gray-600 rounded-lg p-4 text-white">
      <h3 className="text-lg font-bold mb-3">변신 시스템</h3>

      {/* Current Transform Status */}
      {transform.active && transform.transformId && (
        <div className="mb-4 p-3 bg-blue-900/50 rounded border border-blue-600">
          <h4 className="font-semibold">현재 변신:</h4>
          <p className="text-sm">
            {TRANSFORMS.find((t) => t.id === transform.transformId)?.form}
          </p>
          <p className="text-xs text-gray-300">
            남은 시간: {transform.remaining}초
          </p>
          <button
            onClick={cancelTransform}
            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            변신 해제
          </button>
        </div>
      )}

      {/* Available Transforms */}
      <div className="space-y-2">
        {availableTransforms.map((tf) => {
          const onCooldown = isOnCooldown(tf.id);
          const canActivate = !transform.active && !onCooldown;

          return (
            <div
              key={tf.id}
              className="p-3 bg-gray-800 rounded border border-gray-600"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold">{tf.form}</h4>
                  <p className="text-xs text-gray-400">
                    Lv.{tf.requiredLevel} 필요
                  </p>
                </div>
                <button
                  onClick={() => activateTransform(tf.id)}
                  disabled={!canActivate}
                  className={`px-3 py-1 rounded text-sm ${
                    canActivate
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-600 cursor-not-allowed"
                  }`}
                >
                  {onCooldown ? "재사용 대기" : "변신"}
                </button>
              </div>

              {/* Bonuses */}
              <div className="text-xs text-green-400">
                {tf.bonuses.attackSpeedPercent && (
                  <span className="mr-2">
                    공속 +{tf.bonuses.attackSpeedPercent}%
                  </span>
                )}
                {tf.bonuses.ac && (
                  <span className="mr-2">AC {tf.bonuses.ac}</span>
                )}
                {tf.bonuses.critRate && (
                  <span className="mr-2">치명타 +{tf.bonuses.critRate}%</span>
                )}
                {tf.bonuses.moveSpeedPercent && (
                  <span className="mr-2">
                    이속 {tf.bonuses.moveSpeedPercent > 0 ? "+" : ""}
                    {tf.bonuses.moveSpeedPercent}%
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-400 mt-1">
                지속: {tf.duration}초 | 재사용: {tf.cooldown}초
              </div>
            </div>
          );
        })}
      </div>

      {availableTransforms.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-4">
          사용 가능한 변신이 없습니다.
          <br />
          레벨을 올려서 새로운 변신을 잠금 해제하세요!
        </p>
      )}
    </div>
  );
}
