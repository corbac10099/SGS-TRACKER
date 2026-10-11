"use client";
import React, { useEffect } from "react";
import { SessionProvider } from "next-auth/react";

import DesktopRgpdModal from "@/components/DesktopRgpdModal";

function DynamicCosmeticsLoader() {
  useEffect(() => {
    fetch("/api/cms/cosmetics")
      .then((res) => res.json())
      .then((data) => {
        if (data.all && Array.isArray(data.all)) {
          const cssRules = data.all
            .map((item: any) => item.cssRules)
            .filter(Boolean)
            .join("\n\n");
          if (cssRules) {
            let styleTag = document.getElementById("spycam-dynamic-cosmetics");
            if (!styleTag) {
              styleTag = document.createElement("style");
              styleTag.id = "spycam-dynamic-cosmetics";
              document.head.appendChild(styleTag);
            }
            styleTag.textContent = cssRules;
          }
        }
      })
      .catch(() => {});
  }, []);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DynamicCosmeticsLoader />
      <DesktopRgpdModal />
      {children}
    </SessionProvider>
  );
}
