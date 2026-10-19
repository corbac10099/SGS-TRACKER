import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';

// ─── Service WebSocket Local Riot Client (Sécurisé & Persistant) ────────────
// Écoute wss://127.0.0.1:{port}/ pour recevoir les événements push du client Riot.
// Gère la rotation du lockfile (changements de port/mot de passe au redémarrage),
// le filtrage strict des événements et un buffer circulaire borné.

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
  private isConnecting = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private port: string | null = null;
  private password: string | null = null;
  private lastEventTime: number | null = null;
  private eventsCount = 0;
  
  // Buffer circulaire strictement borné (50 derniers événements)
  private readonly MAX_RECENT_EVENTS = 50;
  private recentEvents: RiotEventPayload[] = [];

  constructor() {
    if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
      this.init();
    }
  }

  /**
   * Lit le lockfile écrit par RiotClientServices.exe.
   * Gère le cas où le launcher Riot n'est pas encore démarré (fichier absent).
   */
  private readFreshLockfile(): { port: string; password: string } | null {
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

      if (!fs.existsSync(lockfilePath)) {
        return null; // Launcher Riot fermé
      }

      const content = fs.readFileSync(lockfilePath, 'utf-8').trim();
      const parts = content.split(':');
      if (parts.length >= 5 && parts[2] && parts[3]) {
        return {
          port: parts[2],
          password: parts[3],
        };
      }
    } catch {
      // Ignorer silencieusement si inaccessible en cours d'écriture
    }
    return null;
  }

  public init() {
    if (this.isConnected || this.isConnecting) return;

    // Toujours relire le lockfile frais du disque (rotation de port/password)
    const lock = this.readFreshLockfile();
    if (!lock) {
      // RiotClientServices pas encore lancé : réessai périodique doux
      this.port = null;
      this.password = null;
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
        handshakeTimeout: 3500,
      });

      this.ws.on('open', () => {
        this.isConnected = true;
        this.isConnecting = false;
        // WAMP Subscribe : OnJsonApiEvent
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
        // En cas d'erreur (ex: 401 si le client a redémarré avec de nouveaux credentials), nettoyer et forcer la relecture
        this.cleanup();
        this.scheduleReconnect(3000);
      });

      this.ws.on('close', () => {
        // En cas de fermeture, réinitialiser pour forcer la rotation du lockfile
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
      if (!text) return; // Ignorer les frames heartbeat vides

      const parsed = JSON.parse(text);
      // Format WAMP Riot: [8, "OnJsonApiEvent", { uri: string, eventType: string, data: any }]
      if (Array.isArray(parsed) && parsed.length >= 3) {
        const payload = parsed[2];
        const uri = payload?.uri || '';

        // ⚠️ FILTRAGE STRICT : Ne garder que les URIs vitales pour le match et la session
        // Évite la saturation mémoire provoquée par les centaines d'events UI/Store
        const isTargetUri =
          uri.includes('core-game') ||
          uri.includes('pregame') ||
          uri.includes('/chat/v1/session') ||
          uri.includes('/chat/v1/presences') ||
          uri.includes('kill') ||
          uri.includes('scoreboard');

        if (!isTargetUri) return;

        this.lastEventTime = Date.now();
        this.eventsCount++;

        const item: RiotEventPayload = {
          uri,
          eventType: payload.eventType || 'Update',
          data: payload.data,
          timestamp: Date.now(),
        };

        // Buffer circulaire borné à MAX_RECENT_EVENTS (FIFO)
        this.recentEvents.push(item);
        if (this.recentEvents.length > this.MAX_RECENT_EVENTS) {
          this.recentEvents.shift();
        }
      }
    } catch {
      // Ignorer les frames corrompues
    }
  }

  private cleanup() {
    this.isConnected = false;
    this.isConnecting = false;
    // Forcer la rotation : effacer les anciens credentials en cache
    this.port = null;
    this.password = null;

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
    if (!this.isConnected && !this.isConnecting) {
      this.init();
    }

    return {
      connected: this.isConnected,
      port: this.port,
      lastEventTime: this.lastEventTime,
      eventsCount: this.eventsCount,
      combatEvents: [...this.recentEvents],
    };
  }
}

// Instance globale singleton attachée à globalThis
declare global {
  var __riotWsManager: RiotWebSocketManager | undefined;
}

export const riotWsManager = globalThis.__riotWsManager || (globalThis.__riotWsManager = new RiotWebSocketManager());
