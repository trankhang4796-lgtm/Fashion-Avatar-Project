"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";

import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createClient } from "@/src/utils/supabase/client";
import SignOutButton from "./SignOutButton";

export default function AccountMenu() {
  const supabase = useMemo(() => createClient(), []);

  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("User");
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!isOpen) return;
      const target = event.target as Node | null;
      if (!target) return;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isOpen]);

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
            .select("username, theme")
            .eq("id", session.user.id)
            .single();

          if (profile?.username) {
            setUsername(profile.username);
            if (profile?.theme) setTheme(profile.theme);
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      setIsOpen(false);
      setLoading(false);

      if (event === "SIGNED_IN" && session?.user) {
        // Defer the database query to release the Supabase auth lock and prevent deadlocks
        setTimeout(() => {
          const fetchProfile = async () => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("username, theme")
              .eq("id", session.user.id)
              .single();

            const name = profile?.username || "User";
            setUsername(name);
            if (profile?.theme) setTheme(profile.theme);
            setWelcomeMessage(`Welcome back, ${name}!`);

            if (toastTimeoutRef.current) {
              clearTimeout(toastTimeoutRef.current);
            }
            toastTimeoutRef.current = setTimeout(() => {
              setWelcomeMessage("");
            }, 4000);
          };
          fetchProfile();
        }, 0);
      } else if (event === "SIGNED_OUT") {
        setUsername("User");
      }
      },
    );

    return () => {
      isMounted = false;
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      subscription.unsubscribe();
    };
  }, [supabase, setTheme]);

  // Listen for manual profile updates from the Settings page
  useEffect(() => {
    const handleProfileUpdate = async () => {
      if (!user?.id) return;

      const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();

      if (profile?.username) {
        setUsername(profile.username);
      }
    };

    window.addEventListener("profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, [user?.id, supabase]);

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
        <span className="hidden text-sm font-medium text-foreground md:block">
          Hello, <span className="font-semibold text-brand-forest">{username}</span>
        </span>

        {/* Account Button & Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="font-jakarta rounded-lg border border-border-theme bg-surface px-6 py-2.5 text-sm font-semibold text-brand-forest transition-colors hover:bg-surface-alt"
          >
            Account
          </button>

          {isOpen ? (
            <div className="absolute right-0 z-50 mt-2 flex w-48 flex-col rounded-xl bg-surface border border-border-theme py-2 shadow-lg ring-1 ring-black/5 dark:ring-white/10 text-foreground">
              <div className="flex w-full items-center justify-between px-4 py-2 text-sm text-foreground">
                <span>Dark Mode</span>
                <button
                  onClick={async () => {
                    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
                    setTheme(newTheme);
                    if (user) {
                      await supabase.from("profiles").update({ theme: newTheme }).eq("id", user.id);
                    }
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    mounted && resolvedTheme === "dark" ? "bg-brand-mint" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      mounted && resolvedTheme === "dark" ? "translate-x-4" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="my-1 h-px w-full bg-border-theme" />
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-alt"
              >
                Settings
              </Link>
              <Link
                href="/settings?tab=preferences"
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-alt"
              >
                Preferences
              </Link>
              <Link
                href="/settings?tab=beta"
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-alt"
              >
                Beta features
              </Link>
              <div className="my-1 h-px w-full bg-border-theme" />
              <SignOutButton />
            </div>
          ) : null}
        </div>
      </div>

      {/* Welcome Toast Notification */}
      {welcomeMessage && (
        <div className="fixed bottom-6 right-6 z-[100] flex animate-[bounce_0.5s_ease-in-out] items-center gap-3 rounded-2xl border border-brand-mint/20 bg-surface p-4 shadow-xl transition-all duration-500 ease-in-out">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-mint/10 text-lg">
            👋
          </span>
          <p className="text-sm font-semibold text-foreground">{welcomeMessage}</p>
        </div>
      )}
    </>
  );
}

