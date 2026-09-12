"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export interface AuthState {
  session: any;
  status: "loading" | "authenticated" | "unauthenticated";
  isDemo: boolean;
  isGuestMode: boolean;
  isSimulatedNewUser: boolean;
  isLocalhost: boolean;
  guestUser: any;
  loginModalOpen: boolean;
  setLoginModalOpen: (v: boolean) => void;
  initGuestSession: (redirectToOnboarding?: boolean) => Promise<void>;
  handleEnterBeta: () => void;
  handleExitBeta: () => Promise<void>;
  /**
   * Détermine si le profil actuellement affiché peut être édité par l'utilisateur.
   */
  canEditProfile: (playerData: any) => boolean;
}

export function useAuth(searchParams: any): AuthState {
  const { data: realSession, status: realStatus } = useSession();
  const router = useRouter();
  const isSimulatedNewUser = searchParams?.get("simulate") === "true";

  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [guestUser, setGuestUser] = useState<any>(null);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [isLocalhost, setIsLocalhost] = useState<boolean>(false);

  // Placeholder setters used by initGuestSession — they will be called
  // externally via the settings hook that syncs from session data.
  const pendingSettingsRef = { current: null as any };

  const initGuestSession = useCallback(
    async (redirectToOnboarding = false) => {
      try {
        const res = await fetch("/api/auth/guest-session", { method: "POST" });
        const data = await res.json();
        if (data.success && data.user) {
          sessionStorage.setItem("spycam_guest_mode", "true");
          sessionStorage.setItem("spycam_guest_id", data.guestId);
          setGuestUser(data.user);
          setIsGuestMode(true);

          if (redirectToOnboarding || !data.user.onboardingDone) {
            router.push("/onboarding");
          }
        }
      } catch (e) {
        console.error("Erreur init guest session:", e);
      }
    },
    [router]
  );

  useEffect(() => {
    if (realStatus === "loading") return;

    if (realSession?.user) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("spycam_guest_mode");
        sessionStorage.removeItem("spycam_guest_id");
      }
      setIsGuestMode(false);
      setGuestUser(null);
      return;
    }
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("spycam_guest_mode") === "true"
    ) {
      initGuestSession(false);
    }
  }, [realSession, realStatus, initGuestSession]);

  const handleEnterBeta = useCallback(() => {
    initGuestSession(true);
  }, [initGuestSession]);

  const handleExitBeta = useCallback(async () => {
    const guestId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("spycam_guest_id")
        : null;
    if (guestId) {
      try {
        await fetch(`/api/auth/guest-session?guestId=${guestId}`, {
          method: "DELETE",
        });
      } catch {}
    }
    sessionStorage.removeItem("spycam_guest_mode");
    sessionStorage.removeItem("spycam_guest_id");
    setIsGuestMode(false);
    setGuestUser(null);
  }, []);

  // Nettoyage automatique du compte Neon quand tous les onglets sont fermés
  useEffect(() => {
    if (!isGuestMode) return;

    const tabKey = "spycam_demo_active_tabs";
    const currentTabs =
      parseInt(localStorage.getItem(tabKey) || "0", 10) + 1;
    localStorage.setItem(tabKey, currentTabs.toString());

    const handleBeforeUnload = () => {
      const tabs = Math.max(
        0,
        parseInt(localStorage.getItem(tabKey) || "1", 10) - 1
      );
      localStorage.setItem(tabKey, tabs.toString());

      if (tabs === 0) {
        const gId = sessionStorage.getItem("spycam_guest_id");
        if (gId) {
          navigator.sendBeacon(`/api/auth/guest-session?guestId=${gId}`);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isGuestMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLocalhost(
        window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname.endsWith(".local")
      );
    }
  }, []);

  const simulatedSession = useMemo(
    () => ({
      user: {
        name: "test",
        email: "test@spycam.com",
        onboardingDone: true,
        riotId: null,
        riotPuuid: null,
      },
    }),
    []
  );

  const guestSession = useMemo(
    () => ({
      user: guestUser || {
        id: "temp-guest-id",
        name: "Shadow",
        email: "guest@temp.spycam.gg",
        onboardingDone: true,
        riotId: "Shadow#BETA",
        riotPuuid: "debug-beta-guest-puuid",
        theme: "dark",
        language: "fr",
        firstName: "Invité",
      },
    }),
    [guestUser]
  );

  const isDemo = isSimulatedNewUser || isGuestMode;
  const session = isSimulatedNewUser
    ? simulatedSession
    : isGuestMode
    ? guestSession
    : realSession;
  const status = isDemo ? ("authenticated" as const) : realStatus;

  const canEditProfile = useCallback(
    (playerData: any) => {
      if (isGuestMode) return true;
      if (isSimulatedNewUser) return false;
      if (!playerData?.player) return false;

      // 1. Autorisation directe retournée par l'API serveur
      if (playerData.player.canEdit === true || playerData.player.isOwner === true) {
        return true;
      }

      // 2. Correspondance immuable par PUUID
      const sessionUser = session?.user as any;
      if (sessionUser?.riotPuuid && playerData.player.puuid) {
        if (sessionUser.riotPuuid === playerData.player.puuid) return true;
      }

      // 3. Comptes administrateurs ou développeurs
      if (playerData.player.puuid?.startsWith("debug-")) return true;
      if (
        sessionUser?.email === "laffont.romain64@gmail.com" &&
        playerData.player.gameName === "Gr4phØ"
      ) {
        return true;
      }
      if (
        sessionUser?.email === "spycam_riot_temp@gmail.com" &&
        playerData.player.gameName?.toLowerCase() === "riot_test"
      ) {
        return true;
      }
      if (
        sessionUser?.email === "romain.lft64@gmail.com" &&
        (playerData.player.gameName?.toLowerCase() === "senpaii" ||
          playerData.player.gameName?.toLowerCase() ===
            sessionUser?.riotGameName?.toLowerCase()?.split("#")[0])
      ) {
        return true;
      }

      // 4. Correspondance par Riot ID complet
      if (sessionUser?.riotGameName && playerData.player.gameName && playerData.player.tagLine) {
        const fullProfileName = `${playerData.player.gameName}#${playerData.player.tagLine}`.toLowerCase();
        if (sessionUser.riotGameName.toLowerCase() === fullProfileName) {
          return true;
        }
      }

      return false;
    },
    [isGuestMode, isSimulatedNewUser, session]
  );

  return {
    session,
    status,
    isDemo,
    isGuestMode,
    isSimulatedNewUser,
    isLocalhost,
    guestUser,
    loginModalOpen,
    setLoginModalOpen,
    initGuestSession,
    handleEnterBeta,
    handleExitBeta,
    canEditProfile,
  };
}
