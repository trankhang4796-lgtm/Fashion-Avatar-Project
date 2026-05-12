"use client";

import Link from "next/link";
import AccountMenu from "@/src/account/AccountMenu";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWardrobe } from "@/src/context/WardrobeContext";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/avatar", label: "Avatar" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/community", label: "Community" },
];

export default function Navbar() {
  const { editingOutfit, setEditingOutfit } = useWardrobe();
  const router = useRouter();
  const [pendingRoute, setPendingRoute] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (href, e) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (editingOutfit) {
      setPendingRoute(href);
    } else {
      router.push(href);
    }
  };

  return (
    <header className="w-full bg-brand-cream border-b border-border-theme">
      <div className="mx-auto flex w-full max-w-[1900px] items-center justify-between px-6 py-4 md:px-12">
        {/* Logo - Far Left */}
        <Link
          href="/"
          className="flex items-center gap-1"
        >
          {/* Icon (Stays the same in both modes) */}
          <img
            src="/logo-icon.svg"
            alt="F.AVA AI Icon"
            className="h-10 w-10 transition-transform hover:scale-105"
          />

          {/* Light Mode Text Logo */}
          <img
            src="/logo-text.svg"
            alt="F.AVA AI"
            className="hidden h-15 w-auto -mt-3 md:block dark:hidden"
          />

          {/* Dark Mode Text Logo */}
          <img
            src="/logo-text-dark.svg"
            alt="F.AVA AI"
            className="hidden h-15 w-auto -mt-3 dark:md:block"
          />
        </Link>

        {/* Center Links */}
        <nav
          className="font-jakarta hidden items-center gap-15 md:flex"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={(e) => handleNavClick(link.href, e)}
              className="text-base font-medium text-foreground transition-colors hover:text-brand-mint"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-border-theme p-2 text-foreground transition-colors hover:bg-surface-alt md:hidden"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-main-nav"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <AccountMenu />
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav
          id="mobile-main-nav"
          className="font-jakarta flex flex-col gap-1 border-t border-border-theme bg-brand-cream px-6 py-3 md:hidden"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={(e) => handleNavClick(link.href, e)}
              className="w-full rounded-lg px-3 py-3 text-left text-base font-medium text-foreground transition-colors hover:bg-surface-alt hover:text-brand-mint"
            >
              {link.label}
            </button>
          ))}
        </nav>
      )}

      {/* Navigation Guard Modal */}
      {pendingRoute && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border-theme bg-surface p-6 shadow-xl text-foreground">
            <button onClick={() => setPendingRoute(null)} className="absolute right-4 top-4 text-foreground/50 hover:text-foreground">✕</button>
            <h2 className="text-xl font-bold mb-2">Unsaved Changes</h2>
            <p className="text-sm text-foreground/70 mb-6">You are currently editing an outfit. Do you want to save or disregard your changes before leaving?</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => {
                  setEditingOutfit(null);
                  setPendingRoute(null);
                  router.push(pendingRoute);
                }} 
                className="px-4 py-2 rounded-lg border border-border-theme text-sm font-medium hover:bg-surface-alt"
              >
                Disregard
              </button>
              <button 
                onClick={() => {
                  setPendingRoute(null);
                  // Stays on dashboard to let them click the Update button
                }} 
                className="px-4 py-2 rounded-lg bg-brand-forest text-white text-sm font-medium hover:bg-brand-darkgreen"
              >
                Go Back to Save
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
