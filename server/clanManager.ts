export type Clan = {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  members: ClanMember[];
  createdAt: number;
  level: number;
  exp: number;
  notice: string; // clan bulletin
  maxMembers: number; // starts at 15
};

export type ClanMember = {
  id: string;
  name: string;
  role: "leader" | "guardian" | "member";
  joinedAt: number;
  lastOnline: number;
};

export class ClanManager {
  private clans = new Map<string, Clan>();
  private playerClan = new Map<string, string>(); // playerId -> clanId

  create(leaderId: string, leaderName: string, clanName: string): Clan | null {
    // Check if player already has a clan
    if (this.playerClan.has(leaderId)) {
      return null;
    }

    // Check if clan name already exists
    const existingClan = Array.from(this.clans.values()).find(
      (clan) => clan.name.toLowerCase() === clanName.toLowerCase(),
    );
    if (existingClan) {
      return null;
    }

    const clanId = crypto.randomUUID();
    const now = Date.now();

    const clan: Clan = {
      id: clanId,
      name: clanName,
      leaderId,
      leaderName,
      members: [
        {
          id: leaderId,
          name: leaderName,
          role: "leader",
          joinedAt: now,
          lastOnline: now,
        },
      ],
      createdAt: now,
      level: 1,
      exp: 0,
      notice: "",
      maxMembers: 15,
    };

    this.clans.set(clanId, clan);
    this.playerClan.set(leaderId, clanId);

    return clan;
  }

  join(playerId: string, playerName: string, clanId: string): boolean {
    // Check if player already has a clan
    if (this.playerClan.has(playerId)) {
      return false;
    }

    const clan = this.clans.get(clanId);
    if (!clan || clan.members.length >= clan.maxMembers) {
      return false;
    }

    const now = Date.now();
    const newMember: ClanMember = {
      id: playerId,
      name: playerName,
      role: "member",
      joinedAt: now,
      lastOnline: now,
    };

    clan.members.push(newMember);
    this.playerClan.set(playerId, clanId);

    return true;
  }

  leave(playerId: string): boolean {
    const clanId = this.playerClan.get(playerId);
    if (!clanId) {
      return false;
    }

    const clan = this.clans.get(clanId);
    if (!clan) {
      return false;
    }

    // If leader is leaving, disband the clan
    if (clan.leaderId === playerId) {
      this.disband(playerId);
      return true;
    }

    // Remove member from clan
    clan.members = clan.members.filter((member) => member.id !== playerId);
    this.playerClan.delete(playerId);

    return true;
  }

  disband(leaderId: string): boolean {
    const clanId = this.playerClan.get(leaderId);
    if (!clanId) {
      return false;
    }

    const clan = this.clans.get(clanId);
    if (!clan || clan.leaderId !== leaderId) {
      return false;
    }

    // Remove all members from playerClan mapping
    clan.members.forEach((member) => {
      this.playerClan.delete(member.id);
    });

    // Remove clan
    this.clans.delete(clanId);

    return true;
  }

  promote(
    leaderId: string,
    memberId: string,
    role: "guardian" | "member",
  ): boolean {
    const clanId = this.playerClan.get(leaderId);
    if (!clanId) {
      return false;
    }

    const clan = this.clans.get(clanId);
    if (!clan || clan.leaderId !== leaderId) {
      return false;
    }

    const member = clan.members.find((m) => m.id === memberId);
    if (!member || member.role === "leader") {
      return false;
    }

    member.role = role;
    return true;
  }

  kick(leaderId: string, memberId: string): boolean {
    const clanId = this.playerClan.get(leaderId);
    if (!clanId) {
      return false;
    }

    const clan = this.clans.get(clanId);
    if (!clan || clan.leaderId !== leaderId) {
      return false;
    }

    const member = clan.members.find((m) => m.id === memberId);
    if (!member || member.role === "leader") {
      return false;
    }

    // Remove member from clan
    clan.members = clan.members.filter((m) => m.id !== memberId);
    this.playerClan.delete(memberId);

    return true;
  }

  getClan(playerId: string): Clan | null {
    const clanId = this.playerClan.get(playerId);
    return clanId ? this.clans.get(clanId) || null : null;
  }

  getClanById(clanId: string): Clan | null {
    return this.clans.get(clanId) || null;
  }

  setNotice(leaderId: string, notice: string): boolean {
    const clanId = this.playerClan.get(leaderId);
    if (!clanId) {
      return false;
    }

    const clan = this.clans.get(clanId);
    if (!clan || clan.leaderId !== leaderId) {
      return false;
    }

    clan.notice = notice;
    return true;
  }

  listAll(): Clan[] {
    return Array.from(this.clans.values());
  }

  updateMemberOnline(playerId: string): void {
    const clanId = this.playerClan.get(playerId);
    if (!clanId) {
      return;
    }

    const clan = this.clans.get(clanId);
    if (!clan) {
      return;
    }

    const member = clan.members.find((m) => m.id === playerId);
    if (member) {
      member.lastOnline = Date.now();
    }
  }
}
