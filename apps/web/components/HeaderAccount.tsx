"use client";

import Link from "next/link";
import NotificationsBell from "./NotificationsBell";
import ThemeToggle from "./ThemeToggle";
import { useSession } from "./SessionProvider";

/**
 * The account corner of the header. Split out of Navbar so the header itself can
 * be a static component — see the note in SessionProvider for why that matters.
 *
 * The signed-out state is rendered immediately (it is the common, crawlable
 * case) and swaps to the avatar once the session lookup settles.
 */
export default function HeaderAccount() {
  const { isAuthenticated, initial, unreadCount } = useSession();

  return (
    <div className="flex items-center gap-1">
      {isAuthenticated && <NotificationsBell initialCount={unreadCount} />}
      <span>
        <ThemeToggle />
      </span>
      {isAuthenticated ? (
        <Link
          href="/settings"
          className="ml-1 flex size-11 items-center justify-center rounded-full bg-ember font-display text-sm font-bold text-on-accent transition-transform hover:scale-105 active:scale-95"
          aria-label="Your account"
        >
          {initial ?? "U"}
        </Link>
      ) : (
        <Link href="/auth/signin" className="btn-primary ml-1 !min-h-11 !px-4 text-sm">
          Sign in
        </Link>
      )}
    </div>
  );
}
