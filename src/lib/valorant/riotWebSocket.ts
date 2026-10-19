import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';

// ─── Service WebSocket Local Riot Client (Sécurisé & Persistant) ────────────
// Écoute en continu wss://127.0.0.1:{port}/ pour recevoir les événements push
// du client Valorant (kills, morts, assists, scoreboard, sessions).

export interface RiotEventPayload {
  uri: string;
  eventType: string;
  data: any;
  timestamp: number;
}

export interface RiotLiveStatsSummary {
  connected: boolean;
  port: string | null;
  lastEventTime: number | null;
  eventsCount: number;
  combatEvents: RiotEventPayload[];
}

class RiotWebSocketManager {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private port: string | null = null;
  private password: string | null = null;
  private lastEventTime: number | null = null;
  private eventsCount = 0;
  private recentCombatEvents: RiotEventPayload[] = [];
  private readonly MAX_RECENT_EVENTS = 150;

  constructor() {
    // Ne pas démarrer automatiquement lors de la génération statique Next.js
    if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
      this.init();
    }
  }

  private readLockfile(): { port: string; password: string } | null {
    try {
      const localAppData = process.env.LOCALAPPDATA;
      if (!localAppData) return null;

      const lockfilePath = path.join(
        localAppData,
        'Riot Games',
        'Riot Client',
        'Config',
        'lockfile'
      );

      if (!fs.existsSync(lockfilePath)) return null;

      const content = fs.readFileSync(lockfilePath, 'utf-8').trim();
      const parts = content.split(':');
      if (parts.length >= 5) {
        return {
          port: parts[2],
          password: parts[3],
        };
      }
    } catch {
      // Ignorer silencieusement si inaccessible
    }
    return null;
  }

  public init() {
    if (this.isConnected || this.isConnecting) return;

    const lock = this.readLockfile();
    if (!lock) {
      this.scheduleReconnect(5000);
      return;
    }

    this.port = lock.port;
    this.password = lock.password;
    this.connect();
  }

  private connect() {
    if (!this.port || !this.password) return;

    this.isConnecting = true;
    const auth = Buffer.from(`riot:${this.password}`).toString('base64');
    const wsUrl = `wss://127.0.0.1:${this.port}/`;

    try {
      this.ws = new WebSocket(wsUrl, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        rejectUnauthorized: false, // Certificat auto-signé local du Riot Client
        handshakeTimeout: 4000,
      });

      this.ws.on('open', () => {
        this.isConnected = true;
        this.isConnecting = false;
        // Protocole WAMP : Abonnement à tous les événements de l'API locale
        try {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify([5, 'OnJsonApiEvent']));
          }
        } catch (e) {
          console.warn('[RiotWS] Échec souscription WAMP:', e);
        }
      });

      this.ws.on('message', (raw: WebSocket.Data) => {
        this.handleMessage(raw);
      });

      this.ws.on('error', () => {
        // Erreur réseau locale silencieuse
        this.cleanup();
        this.scheduleReconnect(4000);
      });

      this.ws.on('close', () => {
        this.cleanup();
        this.scheduleReconnect(3000);
      });
    } catch {
      this.cleanup();
      this.scheduleReconnect(5000);
    }
  }

  private handleMessage(raw: WebSocket.Data) {
    try {
      const text = raw.toString('utf-8').trim();
      if (!text) return;

      const parsed = JSON.parse(text);
      // Format WAMP Riot: [8, "OnJsonApiEvent", { uri: string, eventType: string, data: any }]
      if (Array.isArray(parsed) && parsed.length >= 3) {
        const payload = parsed[2];
        const uri = payload?.uri || '';
        this.lastEventTime = Date.now();
        this.eventsCount++;

        // Filtrer les événements pertinents pour les performances et le gameplay
        if (
          uri.includes('chat') ||
          uri.includes('core-game') ||
          uri.includes('pregame') ||
          uri.includes('match') ||
          uri.includes('presences') ||
          uri.includes('gameplay') ||
          uri.includes('combat')
        ) {
          const item: RiotEventPayload = {
            uri,
            eventType: payload.eventType || 'Update',
            data: payload.data,
            timestamp: Date.now(),
          };

          this.recentCombatEvents.push(item);
          if (this.recentCombatEvents.length > this.MAX_RECENT_EVENTS) {
            this.recentCombatEvents.shift();
          }
        }
      }
    } catch {
      // Ignorer les frames malformées
    }
  }

  private cleanup() {
    this.isConnected = false;
    this.isConnecting = false;
    if (this.ws) {
      try {
        this.ws.removeAllListeners();
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }

  private scheduleReconnect(delayMs: number) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.init();
    }, delayMs);
  }

  public getSummary(): RiotLiveStatsSummary {
    // Si déconnecté, tenter de réveiller la connexion
    if (!this.isConnected && !this.isConnecting) {
      this.init();
    }

    return {
      connected: this.isConnected,
      port: this.port,
      lastEventTime: this.lastEventTime,
      eventsCount: this.eventsCount,
      combatEvents: [...this.recentCombatEvents],
    };
  }
}

// Instance globale singleton attachée à globalThis pour persister au fil des requêtes Next.js API
declare global {
  var __riotWsManager: RiotWebSocketManager | undefined;
}

export const riotWsManager = globalThis.__riotWsManager || (globalThis.__riotWsManager = new RiotWebSocketManager());
