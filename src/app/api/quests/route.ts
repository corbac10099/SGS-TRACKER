import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DEFAULT_QUESTS = [
  { slug: "kills_5", title: "Éliminateur", description: "Réalise 5 éliminations en partie", category: "combat", targetStat: "kills", targetValue: 5, xpReward: 75, minRankTier: 0, maxRankTier: 99, minSpi: 0, maxSpi: 1000, isActive: true },
  { slug: "kills_15", title: "Machine à Frags", description: "Réalise 15 éliminations en partie", category: "combat", targetStat: "kills", targetValue: 15, xpReward: 150, minRankTier: 0, maxRankTier: 99, minSpi: 0, maxSpi: 1000, isActive: true },
  { slug: "kills_25", title: "Rampage", description: "Réalise 25 éliminations en partie", category: "combat", targetStat: "kills", targetValue: 25, xpReward: 250, minRankTier: 0, maxRankTier: 99, minSpi: 0, maxSpi: 1000, isActive: true },
  { slug: "firstblood_1", title: "Premier Sang", description: "Réalise un premier sang dans un round", category: "combat", targetStat: "firstBloods", targetValue: 1, xpReward: 60, minRankTier: 0, maxRankTier: 99, minSpi: 0, maxSpi: 1000, isActive: true },
  { slug: "headshots_10", title: "Précision Chirurgicale", description: "Mets 10 tirs dans la tête", category: "precision", targetStat: "headshots", targetValue: 10, xpReward: 120, minRankTier: 0, maxRankTier: 99, minSpi: 0, maxSpi: 1000, isActive: true },
  { slug: "wins_1", title: "Première Victoire", description: "Remporte 1 partie", category: "tactical", targetStat: "wins", targetValue: 1, xpReward: 100, minRankTier: 0, maxRankTier: 99, minSpi: 0, maxSpi: 1000, isActive: true },
  { slug: "assists_8", title: "Coéquipier Modèle", description: "Distribue 8 passes décisives", category: "social", targetStat: "assists", targetValue: 8, xpReward: 90, minRankTier: 0, maxRankTier: 99, minSpi: 0, maxSpi: 1000, isActive: true },
  { slug: "clutch_1", title: "Sang-Froid", description: "Remporte 1 situation de clutch", category: "tactical", targetStat: "clutches", targetValue: 1, xpReward: 150, minRankTier: 0, maxRankTier: 99, minSpi: 0, maxSpi: 1000, isActive: true },
];

function calculateLevelFromXp(xp: number): number {
  let level = 1;
  let xpNeeded = 0;
  while (true) {
    const levelXp = Math.floor(200 * Math.pow(1.15, level - 1));
    if (xpNeeded + levelXp > xp) break;
    xpNeeded += levelXp;
    level++;
  }
  return level;
}

// GET : Récupère les défis quotidiens de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const guestId = request.headers.get("x-guest-id");
    const adminHeader = request.headers.get("x-admin-bypass") === "true";
    const emailHeader = request.headers.get("x-user-email");
    const sessionEmail = session?.user?.email;

    const isAdminBypass =
      adminHeader ||
      sessionEmail === "laffont.romain64@gmail.com" ||
      emailHeader === "laffont.romain64@gmail.com";

    let userId: string | null = (session?.user as any)?.id || null;

    if (!userId && guestId) {
      const guest = await prisma.user.findFirst({
        where: { id: guestId, email: { endsWith: "@temp.spycam.gg" } },
      });
      if (guest) userId = guest.id;
    }

    // Bypass pour le compte administrateur Romain Laffont
    if (!userId && isAdminBypass) {
      let adminUser = await prisma.user.findUnique({
        where: { email: "laffont.romain64@gmail.com" },
      });
      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: {
            email: "laffont.romain64@gmail.com",
            name: "Romain Laffont",
            riotGameName: "Gr4phØ",
            onboardingDone: true,
            xp: 0,
            trackerLevel: 1,
          },
        });
      }
      userId = adminUser.id;
    }

    // Clé de date du jour (rotation quotidienne UTC)
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Auto-seeding si la table Quest est vide
    const questCount = await (prisma as any).quest.count().catch(() => 0);
    if (questCount === 0) {
      await (prisma as any).quest.createMany({
        data: DEFAULT_QUESTS,
        skipDuplicates: true,
      }).catch(() => {});
    }

    if (!userId) {
      // En mode dev ou visiteur non authentifié, renvoyer des quêtes actives
      const sampleQuests = await (prisma as any).quest.findMany({
        where: { isActive: true },
        take: 4,
      });

      return NextResponse.json({
        xp: 0,
        trackerLevel: 1,
        quests: sampleQuests.map((q: any) => ({
          id: q.id,
          title: q.title,
          description: q.description,
          category: q.category,
          targetStat: q.targetStat,
          progress: 0,
          targetValue: q.targetValue,
          xpReward: q.xpReward,
          completed: false,
          claimed: false,
        })),
        dateKey: today,
      });
    }

    // Récupérer l'utilisateur pour ses infos XP/niveau
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, trackerLevel: true },
    });

    // Récupérer les défis assignés aujourd'hui
    let userQuests = await (prisma as any).userDailyQuest.findMany({
      where: { userId, dateKey: today },
      include: { quest: true },
    });

    // Si aucun défi n'est assigné, en choisir 4 parmi les quêtes actives
    if (userQuests.length === 0) {
      const availableQuests = await (prisma as any).quest.findMany({
        where: { isActive: true },
      });

      if (availableQuests.length > 0) {
        const shuffled = availableQuests.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(4, shuffled.length));

        await (prisma as any).userDailyQuest.createMany({
          data: selected.map((q: any) => ({
            userId,
            questId: q.id,
            dateKey: today,
            targetValue: q.targetValue,
            progress: 0,
            completed: false,
            claimed: false,
          })),
        });

        userQuests = await (prisma as any).userDailyQuest.findMany({
          where: { userId, dateKey: today },
          include: { quest: true },
        });
      }
    }

    const quests = userQuests.map((uq: any) => ({
      id: uq.id,
      title: uq.quest?.title || "Défi",
      description: uq.quest?.description || "",
      category: uq.quest?.category || "combat",
      targetStat: uq.quest?.targetStat || "kills",
      progress: uq.progress,
      targetValue: uq.targetValue,
      xpReward: uq.quest?.xpReward || 100,
      completed: uq.completed,
      claimed: uq.claimed,
    }));

    return NextResponse.json({
      xp: user?.xp || 0,
      trackerLevel: user?.trackerLevel || 1,
      quests,
      dateKey: today,
    });
  } catch (error) {
    console.error("[API Quests] Erreur GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST : Réclamer l'XP d'un défi complété ou synchroniser
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => ({}));
    const guestId = request.headers.get("x-guest-id") || body?.guestId;
    const adminHeader = request.headers.get("x-admin-bypass") === "true";
    const emailHeader = request.headers.get("x-user-email");
    const sessionEmail = session?.user?.email;

    const isAdminBypass =
      adminHeader ||
      body?.adminBypass === true ||
      sessionEmail === "laffont.romain64@gmail.com" ||
      emailHeader === "laffont.romain64@gmail.com";

    let userId: string | null = (session?.user as any)?.id || null;

    if (!userId && guestId) {
      const guest = await prisma.user.findFirst({
        where: { id: guestId, email: { endsWith: "@temp.spycam.gg" } },
      });
      if (guest) userId = guest.id;
    }

    if (!userId && isAdminBypass) {
      let adminUser = await prisma.user.findUnique({
        where: { email: "laffont.romain64@gmail.com" },
      });
      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: {
            email: "laffont.romain64@gmail.com",
            name: "Romain Laffont",
            riotGameName: "Gr4phØ",
            onboardingDone: true,
            xp: 0,
            trackerLevel: 1,
          },
        });
      }
      userId = adminUser.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { questId, action } = body;
    const today = new Date().toISOString().split("T")[0];

    // Synchronisation de la progression
    if (action === "sync_progress" && Array.isArray(body.quests)) {
      for (const q of body.quests) {
        if (q.id) {
          await (prisma as any).userDailyQuest.updateMany({
            where: { id: q.id, userId },
            data: {
              progress: q.progress,
              completed: q.completed,
            },
          }).catch(() => {});
        }
      }
      return NextResponse.json({ success: true });
    }

    if (action === "claim" && questId) {
      let userQuest = await (prisma as any).userDailyQuest.findUnique({
        where: { id: questId },
        include: { quest: true },
      });

      // Si le userQuest n'existe pas par ID direct (ex: ID d'un Quest modèle ou échantillon)
      if (!userQuest) {
        const questDef = await (prisma as any).quest.findFirst({
          where: { OR: [{ id: questId }, { slug: questId }] },
        });

        if (questDef) {
          userQuest = await (prisma as any).userDailyQuest.upsert({
            where: {
              userId_questId_dateKey: {
                userId,
                questId: questDef.id,
                dateKey: today,
              },
            },
            create: {
              userId,
              questId: questDef.id,
              dateKey: today,
              progress: questDef.targetValue,
              targetValue: questDef.targetValue,
              completed: true,
              claimed: false,
            },
            update: {
              completed: true,
            },
            include: { quest: true },
          });
        }
      }

      // Bypass administrateur : si pas encore marqué completed en DB, le forcer
      if (userQuest && !userQuest.completed && isAdminBypass) {
        userQuest = await (prisma as any).userDailyQuest.update({
          where: { id: userQuest.id },
          data: { completed: true, progress: userQuest.targetValue },
          include: { quest: true },
        });
      }

      // Si le défi est introuvable mais qu'on est en bypass admin
      if (!userQuest && isAdminBypass) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { xp: true, trackerLevel: true },
        });
        const reward = body?.xpReward || 100;
        const newXp = (user?.xp || 0) + reward;
        const level = calculateLevelFromXp(newXp);

        await prisma.user.update({
          where: { id: userId },
          data: { xp: newXp, trackerLevel: level },
        });

        return NextResponse.json({
          success: true,
          xp: newXp,
          trackerLevel: level,
          xpReward: reward,
        });
      }

      if (!userQuest) {
        return NextResponse.json({ error: "Défi non trouvé" }, { status: 404 });
      }
      if (!userQuest.completed) {
        return NextResponse.json({ error: "Défi pas encore complété" }, { status: 400 });
      }
      if (userQuest.claimed) {
        return NextResponse.json({ error: "XP déjà réclamée" }, { status: 400 });
      }

      // Marquer comme réclamé
      await (prisma as any).userDailyQuest.update({
        where: { id: userQuest.id },
        data: { claimed: true, completed: true },
      });

      // Ajouter l'XP et recalculer le niveau
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true, trackerLevel: true },
      });
      const reward = userQuest.quest?.xpReward || body?.xpReward || 100;
      const newXp = (user?.xp || 0) + reward;
      const level = calculateLevelFromXp(newXp);

      await prisma.user.update({
        where: { id: userId },
        data: { xp: newXp, trackerLevel: level },
      });

      return NextResponse.json({
        success: true,
        xp: newXp,
        trackerLevel: level,
        xpReward: reward,
      });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (error) {
    console.error("[API Quests] Erreur POST:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
