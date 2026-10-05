import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SGS-Tracker In-Game Overlay",
};

export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="overlay-window-root w-screen h-screen bg-transparent overflow-hidden select-none p-2 flex flex-col justify-start">
      <style>{`
        html, body {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        /* Masquer les popups ou toasts internes de développement Next.js sur la fenêtre d'overlay */
        nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog-overlay] {
          display: none !important;
        }
      `}</style>
      {children}
    </div>
  );
}
