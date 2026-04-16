"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/src/utils/supabase/client";
import SignOutButton from "./SignOutButton";

export default function AccountMenu() {
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error("Error getting session", error);
        if (!isMounted) return;
        setUser(data.session?.user ?? null);
      } catch (err) {
        console.error("Error getting session", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsOpen(false);
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  if (loading) {
    return <div className="h-10 w-32 rounded-lg bg-slate-200 animate-pulse" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="font-jakarta rounded-lg bg-brand-mint px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-forest"
      >
        Login / Sign Up
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="font-jakarta rounded-lg bg-brand-cream px-6 py-2.5 text-sm font-semibold text-brand-forest transition-colors hover:bg-brand-cream/80 border border-slate-200"
      >
        Account
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black/5 flex flex-col py-2 z-50">
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Settings
          </Link>
          <Link
            href="/preferences"
            onClick={() => setIsOpen(false)}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Preferences
          </Link>
          <div className="my-1 h-px w-full bg-slate-100" />
          <SignOutButton />
        </div>
      ) : null}
    </div>
  );
}

