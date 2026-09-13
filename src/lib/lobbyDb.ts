// Neon PostgreSQL Database Store for LFG Lobbies, Chat Messages & Voice Transcripts

import { prisma } from './prisma';
import { LobbyItem, LobbyMember, VoiceMember, ChatMessage, VoiceTranscriptLog } from '@/app/api/lobbies/route';

/**
 * Format a database Lobby record into a LobbyItem
 */
export function formatDbLobby(record: any, messages: any[] = [], transcripts: any[] = []): LobbyItem {
  let members: LobbyMember[] = [];
  try {
    members = typeof record.membersData === 'string' ? JSON.parse(record.membersData) : record.membersData || [];
  } catch {
    members = [];
  }

  let voiceMembers: VoiceMember[] = [];
  try {
    voiceMembers = typeof record.voiceMembersData === 'string' ? JSON.parse(record.voiceMembersData) : record.voiceMembersData || [];
  } catch {
    voiceMembers = [];
  }

  let roleNeeded: string[] = ['Tous Rôles'];
  try {
    roleNeeded = typeof record.roleNeeded === 'string' ? JSON.parse(record.roleNeeded) : record.roleNeeded || ['Tous Rôles'];
  } catch {
    roleNeeded = ['Tous Rôles'];
  }

  const chat: ChatMessage[] = messages
    .filter((m: any) => m.senderName !== 'Système' && m.senderTag !== 'SPYCAM')
    .map((m: any) => ({
      id: m.id,
      senderName: m.senderName,
      senderTag: m.senderTag,
      senderAvatar: m.senderAvatar,
      content: m.content,
      timestamp: new Date(m.createdAt).getTime(),
      isToxic: m.isToxic,
    }));

  const voiceTranscripts: VoiceTranscriptLog[] = transcripts.map((t: any) => ({
    id: t.id,
    senderName: t.senderName,
    senderTag: t.senderTag,
    content: t.content,
    timestamp: new Date(t.createdAt).getTime(),
    isToxic: t.isToxic,
  }));

  return {
    id: record.id,
    leaderName: record.leaderName,
    leaderTag: record.leaderTag,
    leaderRank: record.leaderRank,
    leaderRankUrl: record.leaderRankUrl || '',
    leaderRankTier: record.leaderRankTier || 12,
    isLeaderPrivate: !!record.isLeaderPrivate,
    leaderAvatar: record.leaderAvatar || '',
    members,
    voiceMembers,
    voiceTranscripts,
    mode: record.mode || 'Compétitif',
    roleNeeded,
    micRequired: (record.micRequired as any) || 'yes',
    maxSlots: record.maxSlots || 5,
    currentSlots: record.currentSlots || members.length,
    note: record.note || '',
    createdAt: new Date(record.createdAt).getTime(),
    expiresAt: new Date(record.expiresAt).getTime(),
    region: record.region || 'EU / Paris',
    lobbyLevel: record.lobbyLevel || 'Or',
    lobbyLevelTier: record.lobbyLevelTier || 12,
    chat,
  };
}

/**
 * Fetch all active lobbies from Neon DB
 */
export async function getLobbiesFromNeon(): Promise<LobbyItem[]> {
  try {
    const records = await (prisma as any).lobby.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60 * 60 * 24), // Active in last 24h
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
        transcripts: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = records.map((r: any) => formatDbLobby(r, r.messages || [], r.transcripts || []));

    // Filtrer les salons valides ayant au moins un membre
    const activeLobbies: LobbyItem[] = [];
    for (const item of formatted) {
      if (!item.members || item.members.length === 0) {
        // Nettoyage en arrière-plan du salon vide
        deleteLobbyFromNeon(item.id, 'empty').catch(() => {});
      } else {
        activeLobbies.push(item);
      }
    }

    return activeLobbies;
  } catch (err) {
    console.warn('[NeonDB] Error fetching lobbies from Neon, using memory store fallback:', err);
    return (global._spycam_lobbies || []).filter((l) => l.members && l.members.length > 0);
  }
}

/**
 * Create a new Lobby in Neon DB
 */
export async function createLobbyInNeon(lobby: LobbyItem): Promise<LobbyItem> {
  try {
    const created = await (prisma as any).lobby.create({
      data: {
        id: lobby.id,
        leaderName: lobby.leaderName,
        leaderTag: lobby.leaderTag,
        leaderRank: lobby.leaderRank,
        leaderRankUrl: lobby.leaderRankUrl,
        leaderRankTier: lobby.leaderRankTier,
        isLeaderPrivate: lobby.isLeaderPrivate,
        leaderAvatar: lobby.leaderAvatar,
        mode: lobby.mode,
        roleNeeded: JSON.stringify(lobby.roleNeeded),
        micRequired: lobby.micRequired,
        maxSlots: lobby.maxSlots,
        currentSlots: lobby.currentSlots,
        note: lobby.note,
        region: lobby.region,
        lobbyLevel: lobby.lobbyLevel,
        lobbyLevelTier: lobby.lobbyLevelTier,
        membersData: JSON.stringify(lobby.members),
        voiceMembersData: JSON.stringify(lobby.voiceMembers || []),
        createdAt: new Date(lobby.createdAt),
        expiresAt: new Date(lobby.expiresAt || Date.now() + 1000 * 60 * 60 * 24 * 7),
        messages: {
          create: lobby.chat.map((c) => ({
            id: c.id,
            senderName: c.senderName,
            senderTag: c.senderTag,
            content: c.content,
            isToxic: !!c.isToxic,
            createdAt: new Date(c.timestamp),
          })),
        },
      },
      include: {
        messages: true,
      },
    });

    return formatDbLobby(created, created.messages || []);
  } catch (err) {
    console.warn('[NeonDB] Error creating lobby in Neon:', err);
    return lobby;
  }
}

/**
 * Get a single Lobby by ID with messages and voice transcripts from Neon DB
 */
export async function getLobbyByIdFromNeon(id: string): Promise<LobbyItem | null> {
  try {
    const record = await (prisma as any).lobby.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
        transcripts: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });

    if (!record) return null;
    return formatDbLobby(record, record.messages || [], record.transcripts || []);
  } catch (err) {
    console.warn('[NeonDB] Error getting lobby by id:', err);
    return (global._spycam_lobbies || []).find((l) => l.id === id) || null;
  }
}

/**
 * Update a Lobby in Neon DB (e.g. members list, voice members)
 */
export async function updateLobbyInNeon(id: string, updates: Partial<LobbyItem>): Promise<void> {
  try {
    const data: any = {};
    if (updates.members) {
      data.membersData = JSON.stringify(updates.members);
      data.currentSlots = updates.members.length;
    }
    if (updates.voiceMembers) {
      data.voiceMembersData = JSON.stringify(updates.voiceMembers);
    }
    if (updates.currentSlots !== undefined) {
      data.currentSlots = updates.currentSlots;
    }

    await (prisma as any).lobby.update({
      where: { id },
      data,
    });
  } catch (err) {
    console.warn('[NeonDB] Error updating lobby in Neon:', err);
  }
}

/**
 * Add a Chat message to Neon DB
 */
export async function addChatMessageToNeon(lobbyId: string, msg: ChatMessage): Promise<void> {
  // Avoid saving system notifications to Neon database
  if (msg.senderName === 'Système' || msg.senderTag === 'SPYCAM') {
    return;
  }
  try {
    await (prisma as any).lobbyMessage.create({
      data: {
        id: msg.id,
        lobbyId,
        senderName: msg.senderName,
        senderTag: msg.senderTag,
        senderAvatar: msg.senderAvatar,
        content: msg.content,
        isToxic: !!msg.isToxic,
        createdAt: new Date(msg.timestamp),
      },
    });
  } catch (err) {
    console.warn('[NeonDB] Error adding chat message to Neon:', err);
  }
}

/**
 * Add a Voice Transcript log to Neon DB for audit
 */
export async function addVoiceTranscriptToNeon(lobbyId: string, transcript: VoiceTranscriptLog): Promise<void> {
  try {
    await (prisma as any).lobbyVoiceTranscript.create({
      data: {
        id: transcript.id,
        lobbyId,
        senderName: transcript.senderName,
        senderTag: transcript.senderTag,
        content: transcript.content,
        isToxic: !!transcript.isToxic,
        createdAt: new Date(transcript.timestamp),
      },
    });
  } catch (err) {
    console.warn('[NeonDB] Error adding voice transcript to Neon:', err);
  }
}

/**
 * Archive a closed/empty Lobby with all its chat messages, voice transcripts, timestamps and member audit trail, then delete the active record from Neon DB
 */
export async function archiveAndCloseLobbyInNeon(id: string, reason: string = 'empty'): Promise<void> {
  try {
    const lobbyRecord = await (prisma as any).lobby.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        transcripts: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (lobbyRecord) {
      let members: any[] = [];
      try {
        members = typeof lobbyRecord.membersData === 'string' ? JSON.parse(lobbyRecord.membersData) : lobbyRecord.membersData || [];
      } catch {
        members = [];
      }

      const allRecords = [
        ...(lobbyRecord.messages || []).map((m: any) => ({
          type: 'chat',
          id: m.id,
          senderName: m.senderName,
          senderTag: m.senderTag,
          senderAvatar: m.senderAvatar,
          content: m.content,
          isToxic: !!m.isToxic,
          timestamp: new Date(m.createdAt).toISOString(),
          presentMembers: members.map((mem: any) => `${mem.gameName}#${mem.tagLine}`),
        })),
        ...(lobbyRecord.transcripts || []).map((t: any) => ({
          type: 'voice_transcript',
          id: t.id,
          senderName: t.senderName,
          senderTag: t.senderTag,
          content: t.content,
          isToxic: !!t.isToxic,
          timestamp: new Date(t.createdAt).toISOString(),
          presentMembers: members.map((mem: any) => `${mem.gameName}#${mem.tagLine}`),
        })),
      ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      await (prisma as any).lobbyArchive.create({
        data: {
          lobbyId: lobbyRecord.id,
          leaderName: lobbyRecord.leaderName,
          leaderTag: lobbyRecord.leaderTag,
          mode: lobbyRecord.mode,
          region: lobbyRecord.region || 'EU / Paris',
          lobbyLevel: lobbyRecord.lobbyLevel || 'Or',
          lobbyLevelTier: lobbyRecord.lobbyLevelTier || 12,
          totalMembers: Math.max(members.length, lobbyRecord.currentSlots || 1),
          membersList: JSON.stringify(members),
          closedReason: reason,
          createdAt: lobbyRecord.createdAt,
          closedAt: new Date(),
          messagesCount: lobbyRecord.messages?.length || 0,
          transcriptsCount: lobbyRecord.transcripts?.length || 0,
          recordsData: JSON.stringify(allRecords),
        },
      });

      // Delete active lobby record (cascade removes active messages & transcripts)
      await (prisma as any).lobby.delete({
        where: { id },
      });
    }
  } catch (err) {
    console.warn('[NeonDB] Error archiving lobby in Neon:', err);
    try {
      await (prisma as any).lobby.delete({ where: { id } });
    } catch {}
  }
}

/**
 * Delete a Lobby from Neon DB (with auto-archive)
 */
export async function deleteLobbyFromNeon(id: string, reason: string = 'empty'): Promise<void> {
  await archiveAndCloseLobbyInNeon(id, reason);
}

