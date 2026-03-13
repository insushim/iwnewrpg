type PlayerPresence = {
  id: string;
  name: string;
  mapId: string;
  x: number;
  y: number;
};

export class RoomManager {
  private rooms = new Map<string, Map<string, PlayerPresence>>();

  join(mapId: string, player: PlayerPresence) {
    const room = this.rooms.get(mapId) ?? new Map<string, PlayerPresence>();
    room.set(player.id, player);
    this.rooms.set(mapId, room);
    return Array.from(room.values());
  }

  leave(mapId: string, playerId: string) {
    const room = this.rooms.get(mapId);
    if (!room) {
      return [];
    }

    room.delete(playerId);
    if (room.size === 0) {
      this.rooms.delete(mapId);
      return [];
    }

    return Array.from(room.values());
  }

  move(mapId: string, playerId: string, x: number, y: number) {
    const room = this.rooms.get(mapId);
    if (!room) {
      return null;
    }

    const current = room.get(playerId);
    if (!current) {
      return null;
    }

    const next = { ...current, x, y };
    room.set(playerId, next);
    return next;
  }

  list(mapId: string) {
    return Array.from(this.rooms.get(mapId)?.values() ?? []);
  }
}

export type { PlayerPresence };
