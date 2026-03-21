"use client";

import { useState } from "react";
import WardrobeSidebar from "@/src/wardrobe/WardrobeSidebar";

export default function Home() {
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);

  return (
    <main className="relative flex h-screen w-full overflow-hidden bg-white text-black">
      {/* Wardrobe – left sliding sidebar */}
      <aside
        className={`h-full border-r border-gray-200 transition-all duration-300 ease-in-out ${
          isWardrobeOpen ? "w-1/2" : "w-20"
        }`}
      >
        <WardrobeSidebar
          isOpen={isWardrobeOpen}
          toggleOpen={() => setIsWardrobeOpen((prev) => !prev)}
        />
      </aside>

      {/* Center stage – blank canvas */}
      <section className="flex flex-1 items-center justify-center transition-all duration-300" />
    </main>
  );
}
