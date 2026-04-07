import Link from "next/link";

import { logout } from "@/app/(auth)/login/actions";
import { hasPermission, PERMISSIONS, type SessionPayload } from "@/lib/auth/core";
import { Button } from "./ui/button";

const Header = ({ session }: { session: SessionPayload }) => {
  const canAccessAdmin = hasPermission(session, PERMISSIONS.GLOBAL);

  return (
    <header className="container mx-auto mt-4 mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild>
          <Link href="/">Home</Link>
        </Button>

        {canAccessAdmin ? (
          <Button asChild variant="outline">
            <Link href="/cms/admin">Admin</Link>
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-lg border px-3 py-2 text-sm">
          <span className="font-medium">{session.displayName}</span>
          <span className="text-muted-foreground"> ({session.username})</span>
        </div>

        <Button asChild variant="outline">
          <Link href="/login?switch=1">Trocar usuario</Link>
        </Button>

        <form action={logout}>
          <Button type="submit" variant="secondary">
            Sair
          </Button>
        </form>
      </div>
    </header>
  );
};

export default Header;
