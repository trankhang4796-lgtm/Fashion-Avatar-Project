"use client";

import { useState } from "react";
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
        <div className="flex aspect-[1/2] w-72 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-100 shadow-lg transition-all duration-300 md:w-96">
          <div className="text-6xl">🧍</div>
          <span className="mt-4 px-4 text-center text-sm font-medium text-slate-400">
            Avatar Module
          </span>
        </div>
      </section>
    </main>
  );
}

