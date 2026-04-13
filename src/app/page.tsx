"use client";

import { useState } from "react";
import WardrobeSidebar from "@/src/wardrobe/WardrobeSidebar";

export default function Home() {
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);

  return (
    <main className="relative flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
      {/* Wardrobe – left sliding sidebar */}
      <aside
        className={`h-full border-r transition-all duration-300 ease-in-out ${
          isWardrobeOpen ? "w-1/2 border-slate-200" : "w-20 border-transparent"
        }`}
      >
        <WardrobeSidebar
          isOpen={isWardrobeOpen}
          onToggle={() => setIsWardrobeOpen((prev) => !prev)}
        />
      </aside>

      {/* Center stage – blank canvas */}
      <section className="flex flex-1 items-center justify-center transition-all duration-300" />
    </main>
  );
}
