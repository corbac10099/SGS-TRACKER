"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

function SsoConsumeHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      router.replace("/login");
      return;
    }

    async function completeSso() {
      try {
        const res = await signIn("credentials", {
          email,
          ssoToken: token,
          redirect: false,
        });

        if (res?.ok) {
          router.replace("/");
        } else {
          setError("Échec de la validation SSO.");
          setTimeout(() => router.replace("/login"), 2000);
        }
      } catch (err: any) {
        setError(err.message || "Erreur de connexion.");
        setTimeout(() => router.replace("/login"), 2000);
      }
    }

    completeSso();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0e13] text-white p-4 space-y-4">
      {error ? (
        <div className="text-red-400 font-bold text-sm bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-2xl">
          ⚠️ {error}
        </div>
      ) : (
        <>
          <div className="w-10 h-10 border-3 border-[var(--color-val-red)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Connexion avec votre compte SGS en cours...
          </p>
        </>
      )}
    </div>
  );
}

export default function SsoConsumePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0e13]" />}>
      <SsoConsumeHandler />
    </Suspense>
  );
}
