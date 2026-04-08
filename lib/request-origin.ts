import type { NextRequest } from "next/server";

function getHeaderOrigin(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isSameOriginRequest(request: NextRequest) {
  const currentOrigin = request.nextUrl.origin;
  const origin = getHeaderOrigin(request.headers.get("origin"));

  if (origin) {
    return origin === currentOrigin;
  }

  const referer = getHeaderOrigin(request.headers.get("referer"));

  if (referer) {
    return referer === currentOrigin;
  }

  return false;
}