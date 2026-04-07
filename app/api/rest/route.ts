import { NextRequest, NextResponse } from "next/server";

import { inferPermissionFromRestRequest } from "@/lib/auth/authorization";
import { decodeSessionToken, hasPermission, SESSION_COOKIE_NAME } from "@/lib/auth/core";

function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return decodeSessionToken(token);
}

function ensureAuthorized(request: NextRequest, method: string, path: string) {
  const session = getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const requiredPermission = inferPermissionFromRestRequest(method, path);

  if (requiredPermission && !hasPermission(session, requiredPermission)) {
    return NextResponse.json(
      { error: "Sem permissao para executar esta acao" },
      { status: 403 },
    );
  }

  return null;
}

function getRestConfig() {
  const baseUrl = (process.env.WAKE_API_URL ?? "").trim();
  const apiToken = (process.env.WAKE_API_TOKEN ?? "").trim();

  if (!baseUrl) {
    return {
      error: NextResponse.json({ error: "WAKE_API_URL nao configurada" }, { status: 500 }),
    };
  }

  if (!apiToken) {
    return {
      error: NextResponse.json({ error: "WAKE_API_TOKEN nao configurada" }, { status: 500 }),
    };
  }

  return {
    baseUrl: baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl,
    apiToken,
    error: null,
  };
}

async function forwardRequest({
  apiToken,
  baseUrl,
  path,
  method,
  body,
}: {
  apiToken: string;
  baseUrl: string;
  path: string;
  method: string;
  body?: unknown;
}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${apiToken}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: response.status });
  }

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function PUT(request: NextRequest) {
  try {
    const config = getRestConfig();
    if (config.error) {
      return config.error;
    }

    const { path, method, body } = await request.json();

    if (!path) {
      return NextResponse.json({ error: "path e obrigatorio" }, { status: 400 });
    }

    const authorizationError = ensureAuthorized(request, String(method), String(path));
    if (authorizationError) {
      return authorizationError;
    }

    return forwardRequest({
      apiToken: config.apiToken,
      baseUrl: config.baseUrl,
      path: String(path),
      method: String(method),
      body,
    });
  } catch (error) {
    console.error("REST API Error:", error);
    return NextResponse.json({ error: "Erro ao processar requisicao" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = getRestConfig();
    if (config.error) {
      return config.error;
    }

    const { path, method = "PUT", body } = await request.json();

    if (!path) {
      return NextResponse.json({ error: "path e obrigatorio" }, { status: 400 });
    }

    const authorizationError = ensureAuthorized(request, String(method), String(path));
    if (authorizationError) {
      return authorizationError;
    }

    return forwardRequest({
      apiToken: config.apiToken,
      baseUrl: config.baseUrl,
      path: String(path),
      method: String(method),
      body,
    });
  } catch (error) {
    console.error("REST API Error:", error);
    return NextResponse.json({ error: "Erro ao processar requisicao" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const config = getRestConfig();
    if (config.error) {
      return config.error;
    }

    const path = request.nextUrl.searchParams.get("path");
    const method = request.nextUrl.searchParams.get("method") ?? "GET";

    if (!path) {
      return NextResponse.json({ error: "path e obrigatorio" }, { status: 400 });
    }

    const authorizationError = ensureAuthorized(request, method, path);
    if (authorizationError) {
      return authorizationError;
    }

    return forwardRequest({
      apiToken: config.apiToken,
      baseUrl: config.baseUrl,
      path,
      method,
    });
  } catch (error) {
    console.error("REST API Error:", error);
    return NextResponse.json({ error: "Erro ao processar requisicao" }, { status: 500 });
  }
}
