import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { fetchRiotAccount, getDynamicRiotApiKey } from "@/lib/valorant/riotApi";
import { fetchHenrikPlayerData } from "@/lib/valorant/henrikApi";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const queryEmail = searchParams.get("email");
    const userEmail = session?.user?.email || queryEmail;

    if (!userEmail) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { accounts: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const hasPassword = !!user.password;
    const isGoogleLinked = user.googleConnected || user.accounts.some((a) => a.provider === "google");
    const isRiotLinked = user.riotConnected || !!user.riotGameName;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "") || user.riotGameName || "Joueur",
        firstName: user.firstName,
        lastName: user.lastName,
        sgsRole: user.sgsRole,
        badge: user.badge,
        riotGameName: user.riotGameName,
        riotPuuid: user.riotPuuid,
        googleEmail: user.googleEmail,
        hasPassword,
        isGoogleLinked,
        isRiotLinked,
        providers: user.accounts.map((a) => a.provider),
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const userEmail = session?.user?.email || body.email;

    if (!userEmail) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const { newEmail, name, currentPassword, newPassword } = body;
    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    // Changing password with bcrypt
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
      }

      if (user.password && currentPassword) {
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
          return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
        }
      }
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    // Changing email
    if (newEmail && newEmail.toLowerCase().trim() !== user.email) {
      const cleanNewEmail = newEmail.toLowerCase().trim();
      const existing = await prisma.user.findUnique({
        where: { email: cleanNewEmail },
      });
      if (existing) {
        return NextResponse.json({ error: "Cette adresse email est déjà utilisée" }, { status: 400 });
      }
      updateData.email = cleanNewEmail;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ACTION: Link / Unlink Providers (Google, Riot)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const userEmail = session?.user?.email || body.email;

    if (!userEmail) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const { action, data } = body;

    // ACTION: Add password for OAuth-only users
    if (action === "add-password") {
      const { newPassword } = data || {};
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      return NextResponse.json({
        success: true,
        message: "Mot de passe configuré avec succès ! Vous pouvez désormais vous connecter avec votre email.",
      });
    }

    // ACTION: Remove password (only allowed if Google or another provider is linked)
    if (action === "remove-password") {
      const isGoogleLinked =
        user.googleConnected ||
        (await prisma.account.findFirst({
          where: { userId: user.id, provider: "google" },
        }));

      if (!isGoogleLinked) {
        return NextResponse.json(
          {
            error:
              "Impossible de supprimer le mot de passe : vous devez conserver au moins un moyen de connexion actif (liez un compte Google au préalable).",
          },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { password: null },
      });
      return NextResponse.json({
        success: true,
        message: "Mot de passe supprimé. Vous vous connecterez désormais exclusivement via Google.",
      });
    }

    if (action === "link-riot") {
      const { riotGameName, riotPuuid } = data || {};
      if (!riotGameName || !riotGameName.trim()) {
        return NextResponse.json({ error: "Nom Riot ID requis (ex: Joueur#TAG)" }, { status: 400 });
      }

      let finalPuuid = riotPuuid || null;
      let finalName = riotGameName.trim();

      // Résolution automatique du PUUID officiel si non fourni
      if (!finalPuuid) {
        try {
          const parts = finalName.split("#");
          const gName = parts[0].trim();
          const gTag = (parts[1] || "EU1").trim();
          const apiKey = getDynamicRiotApiKey();
          if (apiKey && apiKey.startsWith("HDEV-")) {
            const hAcc = await fetchHenrikPlayerData(gName, gTag, "eu", apiKey);
            if (hAcc?.player?.puuid) {
              finalPuuid = hAcc.player.puuid;
              finalName = `${hAcc.player.gameName}#${hAcc.player.tagLine}`;
            }
          } else if (apiKey) {
            const rAcc = await fetchRiotAccount(gName, gTag, "eu", apiKey);
            if (rAcc?.puuid) {
              finalPuuid = rAcc.puuid;
              finalName = `${rAcc.gameName}#${rAcc.tagLine}`;
            }
          }
        } catch (resolveErr) {
          console.warn("[Link Riot PUUID Resolution Warning]:", resolveErr);
        }
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          riotGameName: finalName,
          riotPuuid: finalPuuid || user.riotPuuid,
          riotConnected: true,
        },
      });
      return NextResponse.json({
        success: true,
        message: "Compte Riot lié avec succès",
        riotGameName: finalName,
        riotPuuid: finalPuuid || user.riotPuuid,
      });
    }

    if (action === "unlink-riot") {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          riotGameName: null,
          riotPuuid: null,
          riotConnected: false,
        },
      });
      return NextResponse.json({ success: true, message: "Compte Riot délié" });
    }

    if (action === "link-google") {
      const { googleEmail } = data || {};
      await prisma.user.update({
        where: { id: user.id },
        data: {
          googleConnected: true,
          googleEmail: googleEmail || user.email,
        },
      });
      return NextResponse.json({ success: true, message: "Compte Google lié avec succès" });
    }

    if (action === "unlink-google") {
      // Vérification stricte : l'utilisateur doit avoir un mot de passe pour ne pas perdre l'accès
      if (!user.password) {
        return NextResponse.json(
          {
            error:
              "Impossible de dissocier Google : vous devez d'abord configurer un mot de passe pour conserver au moins un moyen de connexion.",
          },
          { status: 400 }
        );
      }

      // Supprimer l'association de table Account et réinitialiser les flags
      await prisma.account.deleteMany({
        where: { userId: user.id, provider: "google" },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          googleConnected: false,
          googleEmail: null,
        },
      });
      return NextResponse.json({ success: true, message: "Compte Google dissocié avec succès" });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Permanent Account Erasure (RGPD right to erasure)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const queryEmail = searchParams.get("email");
    const userEmail = session?.user?.email || queryEmail;

    if (!userEmail) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Delete user and all cascade relations
    await prisma.user.delete({
      where: { id: user.id },
    });

    return NextResponse.json({ success: true, message: "Compte et toutes les données supprimés définitivement" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}