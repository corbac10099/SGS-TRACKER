"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import LoginModal from "@/components/LoginModal";
import { sanitizeRedirectTarget } from "@/lib/redirectUtils";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const redirectedRef = useRef(false);

  // Si l'utilisateur est déjà authentifié, rediriger directement vers le tracker une seule fois
  useEffect(() => {
    if ((status === "authenticated" || (session as any)?.user) && !redirectedRef.current) {
      redirectedRef.current = true;
      const callbackParam = searchParams.get("callbackUrl");
      const target = sanitizeRedirectTarget(callbackParam);
      window.location.replace(target);
    }
  }, [status, session, searchParams]);

  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0e13] text-white">
        <div className="w-10 h-10 border-3 border-[var(--color-val-red)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Redirection vers le tracker...
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e13]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[var(--color-val-red)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e13] text-white p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-val-red)]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#58a6ff]/10 rounded-full blur-[120px] pointer-events-none" />

      <LoginModal
        isOpen={true}
        onClose={() => router.push("/")}
        defaultMode="login"
      />
    </div>
  );
}

export default function SpycamLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0e13]" />}>
      <LoginPageContent />
    </Suspense>
  );
}