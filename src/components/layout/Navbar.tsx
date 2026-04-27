"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User, Menu, X, Settings } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-base font-semibold tracking-tight">Constellation</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <Link
              href="/constellations"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Explore
            </Link>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-2">
          {session ? (
            <>
              <Link
                href={`/profile/${session.user.id}`}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-foreground" />
                </div>
                {session.user.name}
              </Link>
              <Link
                href="/settings"
                className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-primary px-5 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden p-2 text-muted-foreground hover:text-foreground"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-border bg-background px-4 py-3 space-y-1">
          <Link
            href="/constellations"
            onClick={() => setMenuOpen(false)}
            className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Explore
          </Link>
          {session ? (
            <>
              <Link
                href={`/profile/${session.user.id}`}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Settings
              </Link>
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="block w-full text-left rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
