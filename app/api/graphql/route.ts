import { NextRequest, NextResponse } from "next/server";

import { decodeSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/core";
import { isSameOriginRequest } from "@/lib/request-origin";

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Origem da requisicao invalida" }, { status: 403 });
    }

    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSessionToken(sessionToken);

    if (!session) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const graphqlBaseUrl = (process.env.WAKE_GRAPHQL_URL ?? "").trim();
    const apiToken = (process.env.WAKE_GRAPHQL_TOKEN ?? "").trim();

    if (!graphqlBaseUrl) {
      return NextResponse.json({ error: "WAKE_GRAPHQL_URL nao configurada" }, { status: 500 });
    }

    if (!apiToken) {
      return NextResponse.json({ error: "WAKE_GRAPHQL_TOKEN nao configurada" }, { status: 500 });
    }

    const { query, variables } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "query e obrigatoria" }, { status: 400 });
    }

    const response = await fetch(
      graphqlBaseUrl.endsWith("/") ? graphqlBaseUrl.slice(0, -1) : graphqlBaseUrl,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "TCS-Access-Token": apiToken,
        },
        body: JSON.stringify({ query, variables }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GraphQL API Error:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisicao GraphQL" },
      { status: 500 },
    );
  }
}
