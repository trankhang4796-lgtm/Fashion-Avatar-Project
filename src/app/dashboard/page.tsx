"use client";

import { useState } from "react";
import AvatarCanvas from "@/src/avatar/AvatarCanvas";
import WardrobeSidebar from "@/src/wardrobe/WardrobeSidebar";

export default function DashboardPage() {
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);

  return (
    <main className="relative flex min-h-[calc(100vh-73px)] w-full overflow-hidden">
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
      <section className="relative flex flex-1 items-center justify-center transition-all duration-300 ease-in-out">
        <AvatarCanvas />
      </section>
    </main>
  );
}

