"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/src/utils/supabase/client";
import SignOutButton from "./SignOutButton";

export default function AccountMenu() {
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("User");
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) console.error("Error getting session", error);
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          // Fetch username from profiles table
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", session.user.id)
            .single();

          if (profile?.username) {
            setUsername(profile.username);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error getting session", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSession();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setIsOpen(false);
      setLoading(false);

      if (event === "SIGNED_IN" && session?.user) {
        // Fetch username from profiles table for toast + display
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", session.user.id)
          .single();

        const name = profile?.username || "User";
        setUsername(name);
        setWelcomeMessage(`Welcome back, ${name}!`);

        // Hide the toast after 4 seconds
        setTimeout(() => {
          if (isMounted) setWelcomeMessage("");
        }, 4000);
      } else if (event === "SIGNED_OUT") {
        setUsername("User");
      }
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  if (loading) {
    return <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-200" />;
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
    <>
      <div className="flex items-center gap-4">
        {/* Username Display */}
        <span className="hidden text-sm font-medium text-slate-600 md:block">
          Hello, <span className="font-semibold text-brand-forest">{username}</span>
        </span>

        {/* Account Button & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="font-jakarta rounded-lg border border-slate-200 bg-brand-cream px-6 py-2.5 text-sm font-semibold text-brand-forest transition-colors hover:bg-brand-cream/80"
          >
            Account
          </button>

          {isOpen ? (
            <div className="absolute right-0 z-50 mt-2 flex w-48 flex-col rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/5">
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
              >
                Settings
              </Link>
              <Link
                href="/preferences"
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
              >
                Preferences
              </Link>
              <div className="my-1 h-px w-full bg-slate-100" />
              <SignOutButton />
            </div>
          ) : null}
        </div>
      </div>

      {/* Welcome Toast Notification */}
      {welcomeMessage && (
        <div className="fixed bottom-6 right-6 z-[100] flex animate-[bounce_0.5s_ease-in-out] items-center gap-3 rounded-2xl border border-brand-mint/20 bg-white p-4 shadow-xl transition-all duration-500 ease-in-out">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-mint/10 text-lg">
            👋
          </span>
          <p className="text-sm font-semibold text-slate-800">{welcomeMessage}</p>
        </div>
      )}
    </>
  );
}

