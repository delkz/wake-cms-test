"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function HeaderBackButton() {
  const router = useRouter();

  function handleBack() {
    if (typeof window === "undefined") {
      router.push("/");
      return;
    }

    const referrer = document.referrer;

    if (!referrer) {
      router.push("/");
      return;
    }

    try {
      const referrerUrl = new URL(referrer);
      const currentOrigin = window.location.origin;

      if (referrerUrl.origin !== currentOrigin || referrerUrl.pathname === "/login") {
        router.push("/");
        return;
      }

      router.back();
    } catch {
      router.push("/");
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleBack}>
      Voltar
    </Button>
  );
}
