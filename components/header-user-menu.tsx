"use client";

import Link from "next/link";
import { ArrowLeftRight, ChevronDown, LogOut, UserRound } from "lucide-react";

import { logout } from "@/app/(auth)/login/actions";
import { type SessionPayload } from "@/lib/auth/core";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/tiptap-ui-primitive/dropdown-menu";

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

type HeaderUserMenuProps = {
  session: SessionPayload;
};

export default function HeaderUserMenu({ session }: HeaderUserMenuProps) {
  const initials = getInitials(session.displayName || session.username);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-auto rounded-md border-transparent px-3 py-2 shadow-none hover:bg-muted/50"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
            {initials || "U"}
          </span>
          <span className="hidden min-w-0 flex-col items-start sm:flex">
            <span className="truncate text-sm font-semibold leading-none">{session.displayName}</span>
            <span className="truncate text-xs text-muted-foreground">
              @{session.username} · {session.role}
            </span>
          </span>
          <ChevronDown className="ml-1 size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-72 rounded-md border-0 bg-background p-2 shadow-none">
        <DropdownMenuLabel className="px-2 py-1.5">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold leading-none">{session.displayName}</p>
            <p className="text-xs text-muted-foreground">@{session.username}</p>
            <p className="text-xs text-muted-foreground">Perfil: {session.role}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/cms/me" className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm">
            <UserRound className="size-4" />
            Meu usuario
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/login?switch=1"
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm"
          >
            <ArrowLeftRight className="size-4" />
            Trocar usuario
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logout} className="w-full">
          <DropdownMenuItem asChild>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive outline-none"
            >
              <LogOut className="size-4" />
              Sair
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
