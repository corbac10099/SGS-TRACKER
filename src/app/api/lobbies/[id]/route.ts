import { NextRequest, NextResponse } from 'next/server';
import { LobbyMember, ChatMessage, VoiceMember, VoiceTranscriptLog, getTierName } from '../route';
import { filterToxicText } from '@/lib/moderation';
import {
  getLobbyByIdFromNeon,
  updateLobbyInNeon,
  addChatMessageToNeon,
  addVoiceTranscriptToNeon,
  deleteLobbyFromNeon,
} from '@/lib/lobbyDb';
import { triggerPusherEvent } from '@/lib/pusherServer';

export interface WebRTCSignal {
  id: string;
  fromId: string;
  toId: string;
  type: 'offer' | 'answer' | 'ice';
  data: any;
  timestamp: number;
}

declare global {
  // eslint-disable-next-line no-var
  var _spycam_voice_signals: Record<string, WebRTCSignal[]> | undefined;
}

if (!global._spycam_voice_signals) {
  global._spycam_voice_signals = {};
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try fetching from Neon DB first
  let lobby = await getLobbyByIdFromNeon(id);
  if (!lobby && global._spycam_lobbies) {
    lobby = global._spycam_lobbies.find((l) => l.id === id) || null;
  }

  if (!lobby) {
    return NextResponse.json({ success: false, error: 'Salon introuvable ou expiré' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const forPeer = searchParams.get('forPeer');

  let signals: WebRTCSignal[] = [];
  if (forPeer && global._spycam_voice_signals && global._spycam_voice_signals[id]) {
    signals = global._spycam_voice_signals[id].filter((s) => s.toId === forPeer);
    global._spycam_voice_signals[id] = global._spycam_voice_signals[id].filter((s) => s.toId !== forPeer);
  }

  return NextResponse.json({ success: true, lobby, signals });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      try {
        const text = await req.text();
        body = text ? JSON.parse(text) : {};
      } catch {
        body = {};
      }
    }

    let lobby = await getLobbyByIdFromNeon(id);
    let memLobby: any = null;

    if (global._spycam_lobbies) {
      const idx = global._spycam_lobbies.findIndex((l) => l.id === id);
      if (idx !== -1) memLobby = global._spycam_lobbies[idx];
    }

    if (!lobby && !memLobby) {
      return NextResponse.json({ success: false, error: 'Salon introuvable' }, { status: 404 });
    }

    const currentLobby = lobby || memLobby;
    if (!global._spycam_voice_signals) global._spycam_voice_signals = {};
    if (!global._spycam_voice_signals[id]) global._spycam_voice_signals[id] = [];

    // ACTION: WebRTC Signaling
    if (body.action === 'voice-signal') {
      const { fromId, toId, type, data } = body;
      if (fromId && toId && type && data) {
        const signal: WebRTCSignal = {
          id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          fromId,
          toId,
          type,
          data,
          timestamp: Date.now(),
        };

        // Realtime Pusher broadcast
        await triggerPusherEvent(`private-lobby-${id}`, 'voice-signal', signal);
        await triggerPusherEvent(`lobby-${id}`, 'voice-signal', signal);

        global._spycam_voice_signals[id].push(signal);
        const thirtySecAgo = Date.now() - 30000;
        global._spycam_voice_signals[id] = global._spycam_voice_signals[id].filter((s) => s.timestamp > thirtySecAgo);

        return NextResponse.json({ success: true, signalId: signal.id });
      }
      return NextResponse.json({ success: false, error: 'Données de signalement incomplètes' }, { status: 400 });
    }

    // ACTION: JOIN LOBBY
    if (body.action === 'join') {
      const { gameName, tagLine, rank, rankUrl, rankTier = 12, isPrivateRank = false, roles = ['Tous Rôles'], avatarUrl } = body;

      if (!gameName || !tagLine) {
        return NextResponse.json({ success: false, error: 'Pseudo et Tag requis' }, { status: 400 });
      }

      const existing = currentLobby.members.find(
        (m: any) => m.gameName.toLowerCase() === gameName.toLowerCase() && m.tagLine.toLowerCase() === tagLine.toLowerCase()
      );

      if (existing) {
        return NextResponse.json({ success: true, lobby: currentLobby, message: 'Déjà membre du salon' });
      }

      if (currentLobby.members.length >= currentLobby.maxSlots) {
        return NextResponse.json({ success: false, error: 'Le salon est complet' }, { status: 400 });
      }

      const newMember: LobbyMember = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        gameName,
        tagLine,
        rank: isPrivateRank ? 'Privé' : rank || 'Non-classé',
        rankUrl: isPrivateRank ? '' : rankUrl || '',
        rankTier: rankTier ?? 12,
        isPrivateRank: !!isPrivateRank,
        roles: Array.isArray(roles) && roles.length > 0 ? roles : ['Tous Rôles'],
        isLeader: false,
        avatarUrl,
      };

      currentLobby.members.push(newMember);
      currentLobby.currentSlots = currentLobby.members.length;

      // Recalculate dynamic lobby average MMR & level
      const avgTier = Math.round(
        currentLobby.members.reduce((acc: number, m: any) => acc + (m.rankTier ?? 12), 0) / currentLobby.members.length
      );
      currentLobby.lobbyLevelTier = avgTier;
      currentLobby.lobbyLevel = getTierName(avgTier);

      // Update in Neon DB
      await updateLobbyInNeon(id, {
        members: currentLobby.members,
        lobbyLevel: currentLobby.lobbyLevel,
        lobbyLevelTier: avgTier,
      });

      const joinMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        senderName: 'Système',
        senderTag: 'SPYCAM',
        content: `${gameName}#${tagLine} a rejoint le salon !`,
        timestamp: Date.now(),
      };
      currentLobby.chat.push(joinMsg);

      await triggerPusherEvent(`private-lobby-${id}`, 'member-join', { member: newMember, lobby: currentLobby });
      await triggerPusherEvent(`lobby-${id}`, 'member-join', { member: newMember, lobby: currentLobby });

      return NextResponse.json({ success: true, lobby: currentLobby, member: newMember });
    }

    // ACTION: SEND MODERATED CHAT MESSAGE
    if (body.action === 'chat') {
      const { senderName, senderTag, senderAvatar, content } = body;
      if (!content || !content.trim()) {
        return NextResponse.json({ success: false, error: 'Message vide' }, { status: 400 });
      }

      const modResult = filterToxicText(content.trim());

      const msg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        senderName: senderName || 'Joueur',
        senderTag: senderTag || 'EUW',
        senderAvatar,
        content: modResult.cleanText,
        timestamp: Date.now(),
        isToxic: modResult.isToxic,
      };

      currentLobby.chat.push(msg);
      if (currentLobby.chat.length > 100) {
        currentLobby.chat = currentLobby.chat.slice(-100);
      }

      // Save to Neon DB
      await addChatMessageToNeon(id, msg);

      await triggerPusherEvent(`private-lobby-${id}`, 'chat-message', msg);
      await triggerPusherEvent(`lobby-${id}`, 'chat-message', msg);

      return NextResponse.json({ success: true, message: msg, chat: currentLobby.chat, isToxic: modResult.isToxic });
    }

    // ACTION: VOICE JOIN
    if (body.action === 'voice-join') {
      const { memberId, gameName, tagLine, avatarUrl, rank, isPrivateRank } = body;
      if (!currentLobby.voiceMembers) currentLobby.voiceMembers = [];

      const existingIndex = currentLobby.voiceMembers.findIndex(
        (v: any) => v.gameName.toLowerCase() === gameName?.toLowerCase() && v.tagLine.toLowerCase() === tagLine?.toLowerCase()
      );

      if (existingIndex === -1) {
        const newVoiceMember: VoiceMember = {
          memberId: memberId || `v_${gameName}_${tagLine}`,
          gameName: gameName || 'Joueur',
          tagLine: tagLine || 'EUW',
          avatarUrl,
          rank,
          isPrivateRank,
          isSpeaking: false,
          isMuted: false,
          joinedAt: Date.now(),
        };
        currentLobby.voiceMembers.push(newVoiceMember);

        // Update in Neon DB
        await updateLobbyInNeon(id, { voiceMembers: currentLobby.voiceMembers });

        const sysMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          senderName: 'Système',
          senderTag: 'SPYCAM',
          content: `📞 ${gameName}#${tagLine} a rejoint le canal vocal.`,
          timestamp: Date.now(),
        };
        currentLobby.chat.push(sysMsg);
      }

      await triggerPusherEvent(`private-lobby-${id}`, 'voice-member-join', { voiceMembers: currentLobby.voiceMembers });
      await triggerPusherEvent(`lobby-${id}`, 'voice-member-join', { voiceMembers: currentLobby.voiceMembers });

      return NextResponse.json({ success: true, voiceMembers: currentLobby.voiceMembers });
    }

    // ACTION: VOICE LEAVE
    if (body.action === 'voice-leave') {
      const { gameName, tagLine } = body;
      if (currentLobby.voiceMembers) {
        currentLobby.voiceMembers = currentLobby.voiceMembers.filter(
          (v: any) => !(v.gameName.toLowerCase() === gameName?.toLowerCase() && v.tagLine.toLowerCase() === tagLine?.toLowerCase())
        );

        await updateLobbyInNeon(id, { voiceMembers: currentLobby.voiceMembers });

        const leaveSys: ChatMessage = {
          id: `msg_${Date.now()}`,
          senderName: 'Système',
          senderTag: 'SPYCAM',
          content: `🔴 ${gameName}#${tagLine} a quitté le canal vocal.`,
          timestamp: Date.now(),
        };
        currentLobby.chat.push(leaveSys);

        await triggerPusherEvent(`private-lobby-${id}`, 'voice-member-leave', { gameName, tagLine, voiceMembers: currentLobby.voiceMembers });
        await triggerPusherEvent(`lobby-${id}`, 'voice-member-leave', { gameName, tagLine, voiceMembers: currentLobby.voiceMembers });
      }

      return NextResponse.json({ success: true, voiceMembers: currentLobby.voiceMembers || [] });
    }

    // ACTION: VOICE STATE
    if (body.action === 'voice-state') {
      const { gameName, tagLine, isSpeaking, isMuted } = body;
      if (currentLobby.voiceMembers) {
        const member = currentLobby.voiceMembers.find(
          (v: any) => v.gameName.toLowerCase() === gameName?.toLowerCase() && v.tagLine.toLowerCase() === tagLine?.toLowerCase()
        );
        if (member) {
          if (typeof isSpeaking === 'boolean') member.isSpeaking = isSpeaking;
          if (typeof isMuted === 'boolean') member.isMuted = isMuted;

          await triggerPusherEvent(`private-lobby-${id}`, 'voice-member-state', { gameName, tagLine, isSpeaking, isMuted });
          await triggerPusherEvent(`lobby-${id}`, 'voice-member-state', { gameName, tagLine, isSpeaking, isMuted });
        }
      }
      return NextResponse.json({ success: true, voiceMembers: currentLobby.voiceMembers || [] });
    }

    // ACTION: VOICE TRANSCRIPT AUDIT LOG
    if (body.action === 'voice-transcript') {
      const { senderName, senderTag, content } = body;
      if (content && content.trim()) {
        const mod = filterToxicText(content.trim());
        const logEntry: VoiceTranscriptLog = {
          id: `vt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          senderName: senderName || 'Joueur',
          senderTag: senderTag || 'EUW',
          content: mod.cleanText,
          timestamp: Date.now(),
          isToxic: mod.isToxic,
        };

        if (!currentLobby.voiceTranscripts) currentLobby.voiceTranscripts = [];
        currentLobby.voiceTranscripts.push(logEntry);

        if (currentLobby.voiceTranscripts.length > 150) {
          currentLobby.voiceTranscripts = currentLobby.voiceTranscripts.slice(-150);
        }

        // Save transcript to Neon DB
        await addVoiceTranscriptToNeon(id, logEntry);

        // Real-time broadcast transcript to all members in lobby
        await triggerPusherEvent(`private-lobby-${id}`, 'voice-transcript', logEntry);
        await triggerPusherEvent(`lobby-${id}`, 'voice-transcript', logEntry);
      }
      return NextResponse.json({ success: true });
    }

    // ACTION: LEAVE LOBBY
    if (body.action === 'leave') {
      const { gameName, tagLine } = body;
      currentLobby.members = currentLobby.members.filter(
        (m: any) => !(m.gameName.toLowerCase() === gameName?.toLowerCase() && m.tagLine.toLowerCase() === tagLine?.toLowerCase())
      );
      if (currentLobby.voiceMembers) {
        currentLobby.voiceMembers = currentLobby.voiceMembers.filter(
          (v: any) => !(v.gameName.toLowerCase() === gameName?.toLowerCase() && v.tagLine.toLowerCase() === tagLine?.toLowerCase())
        );
      }
      currentLobby.currentSlots = currentLobby.members.length;

      // If no members remain, auto-archive and close the lobby in Neon DB
      if (currentLobby.members.length === 0) {
        if (global._spycam_lobbies) {
          global._spycam_lobbies = global._spycam_lobbies.filter((l) => l.id !== id);
        }
        await deleteLobbyFromNeon(id, 'empty');
        await triggerPusherEvent(`private-lobby-${id}`, 'lobby-closed', { reason: 'empty' });
        await triggerPusherEvent(`lobby-${id}`, 'lobby-closed', { reason: 'empty' });
        return NextResponse.json({ success: true, removed: true, lobbyClosed: true });
      }

      // If leader left, promote the next member as leader
      if (currentLobby.leaderName.toLowerCase() === gameName?.toLowerCase() && currentLobby.leaderTag.toLowerCase() === tagLine?.toLowerCase()) {
        const nextLeader = currentLobby.members[0];
        nextLeader.isLeader = true;
        currentLobby.leaderName = nextLeader.gameName;
        currentLobby.leaderTag = nextLeader.tagLine;
        currentLobby.leaderRank = nextLeader.rank;
        currentLobby.leaderRankUrl = nextLeader.rankUrl;
        currentLobby.leaderRankTier = nextLeader.rankTier;
        currentLobby.leaderAvatar = nextLeader.avatarUrl;
      }

      // Recalculate dynamic lobby average MMR & level
      const avgTier = Math.round(
        currentLobby.members.reduce((acc: number, m: any) => acc + (m.rankTier ?? 12), 0) / currentLobby.members.length
      );
      currentLobby.lobbyLevelTier = avgTier;
      currentLobby.lobbyLevel = getTierName(avgTier);

      await updateLobbyInNeon(id, {
        members: currentLobby.members,
        voiceMembers: currentLobby.voiceMembers,
        lobbyLevel: currentLobby.lobbyLevel,
        lobbyLevelTier: avgTier,
      });

      const leaveMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        senderName: 'Système',
        senderTag: 'SPYCAM',
        content: `${gameName}#${tagLine} a quitté le salon.`,
        timestamp: Date.now(),
      };
      currentLobby.chat.push(leaveMsg);

      await triggerPusherEvent(`private-lobby-${id}`, 'member-leave', { gameName, tagLine, lobby: currentLobby });
      await triggerPusherEvent(`lobby-${id}`, 'member-leave', { gameName, tagLine, lobby: currentLobby });

      return NextResponse.json({ success: true, lobby: currentLobby });
    }

    // ACTION: HEARTBEAT & INACTIVITY CHECK
    if (body.action === 'heartbeat') {
      const { gameName, tagLine } = body;
      const now = Date.now();
      if (currentLobby.members) {
        const member = currentLobby.members.find(
          (m: any) => m.gameName?.toLowerCase() === gameName?.toLowerCase() && m.tagLine?.toLowerCase() === tagLine?.toLowerCase()
        );
        if (member) {
          (member as any).lastSeen = now;
        }
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Action non reconnue' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (global._spycam_lobbies) {
    global._spycam_lobbies = global._spycam_lobbies.filter((l) => l.id !== id);
  }
  await deleteLobbyFromNeon(id, 'leader_closed');
  await triggerPusherEvent(`private-lobby-${id}`, 'lobby-closed', { reason: 'leader_closed' });
  await triggerPusherEvent(`lobby-${id}`, 'lobby-closed', { reason: 'leader_closed' });
  return NextResponse.json({ success: true });
}
