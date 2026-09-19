import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export interface DesktopTicketData {
  ticket: string;
  status: "pending" | "authenticated";
  email?: string;
  ssoToken?: string;
  expiresAt: number;
}

// Cache rapide en mémoire (partagé au sein de la même instance de process)
const memoryStore = new Map<string, DesktopTicketData>();

const TICKET_PREFIX = "desktop_auth:";
const TICKET_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function createDesktopTicket(): Promise<string> {
  const ticket = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + TICKET_TTL_MS;

  const data: DesktopTicketData = {
    ticket,
    status: "pending",
    expiresAt,
  };

  // 1. Stocker en mémoire
  memoryStore.set(ticket, data);

  // 2. Persister en base pour compatibilité multi-instances / Vercel
  try {
    await prisma.pageVisit.create({
      data: {
        path: `${TICKET_PREFIX}${ticket}`,
        pageName: "DesktopAuthTicket",
        userAgent: JSON.stringify(data),
      },
    });
  } catch (err) {
    console.warn("[desktopAuthStore] Erreur persistence DB ticket:", err);
  }

  return ticket;
}

export async function getDesktopTicket(ticket: string): Promise<DesktopTicketData | null> {
  if (!ticket) return null;

  // 1. Vérifier le cache mémoire
  const cached = memoryStore.get(ticket);
  if (cached) {
    if (Date.now() > cached.expiresAt) {
      memoryStore.delete(ticket);
      return null;
    }
    return cached;
  }

  // 2. Vérifier la persistance DB
  try {
    const record = await prisma.pageVisit.findFirst({
      where: { path: `${TICKET_PREFIX}${ticket}` },
    });
    if (record?.userAgent) {
      const parsed: DesktopTicketData = JSON.parse(record.userAgent);
      if (Date.now() > parsed.expiresAt) {
        await prisma.pageVisit.deleteMany({ where: { path: `${TICKET_PREFIX}${ticket}` } });
        return null;
      }
      memoryStore.set(ticket, parsed);
      return parsed;
    }
  } catch (err) {
    console.warn("[desktopAuthStore] Erreur lecture DB ticket:", err);
  }

  return null;
}

export async function completeDesktopTicket(
  ticket: string,
  email: string,
  ssoToken: string
): Promise<boolean> {
  const existing = await getDesktopTicket(ticket);
  if (!existing) return false;

  const updated: DesktopTicketData = {
    ...existing,
    status: "authenticated",
    email,
    ssoToken,
  };

  memoryStore.set(ticket, updated);

  try {
    await prisma.pageVisit.updateMany({
      where: { path: `${TICKET_PREFIX}${ticket}` },
      data: { userAgent: JSON.stringify(updated) },
    });
  } catch (err) {
    console.warn("[desktopAuthStore] Erreur update DB ticket:", err);
  }

  return true;
}

export async function consumeDesktopTicket(ticket: string): Promise<DesktopTicketData | null> {
  const data = await getDesktopTicket(ticket);
  if (!data) return null;

  memoryStore.delete(ticket);

  try {
    await prisma.pageVisit.deleteMany({
      where: { path: `${TICKET_PREFIX}${ticket}` },
    });
  } catch (err) {
    console.warn("[desktopAuthStore] Erreur suppression DB ticket:", err);
  }

  return data;
}
