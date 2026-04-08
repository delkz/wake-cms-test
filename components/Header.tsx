import Link from "next/link";

import { canEditContent, canManageUsers, canPublishContent } from "@/lib/auth/authorization";
import { type AuthenticatedUser } from "@/lib/auth/core";
import HeaderBackButton from "@/components/header-back-button";
import HeaderUserMenu from "@/components/header-user-menu";

const Header = ({ session }: { session: AuthenticatedUser }) => {
  const canAccessAdmin = canManageUsers(session);
  const canAccessApprovals = canEditContent(session) || canPublishContent(session);

  return (
    <header className="container mx-auto mt-4 mb-8 rounded-md border bg-background/90 px-4 py-3 shadow-none backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold tracking-tight transition hover:bg-muted"
          >
            <span className="flex size-8 items-center justify-center rounded bg-primary text-primary-foreground">
              W
            </span>
            Wake CMS
          </Link>

          <nav className="flex flex-wrap items-center gap-1 rounded-md bg-muted/20 p-1">
            <Link
              href="/"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-background/70 hover:text-foreground"
            >
              Home
            </Link>

            {canAccessAdmin ? (
              <Link
                href="/cms/admin"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-background/70 hover:text-foreground"
              >
                Admin
              </Link>
            ) : null}

            {canAccessApprovals ? (
              <Link
                href="/cms/approvals"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-background/70 hover:text-foreground"
              >
                Aprovações
              </Link>
            ) : null}

            <div className="rounded-md px-3 py-2">
              <HeaderBackButton />
            </div>
          </nav>
        </div>

        <HeaderUserMenu session={session} />
      </div>
    </header>
  );
};

export default Header;
