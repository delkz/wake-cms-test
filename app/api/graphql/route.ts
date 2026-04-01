import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const GRAPHQL_BASE_URL = (process.env.WAKE_GRAPHQL_URL ?? '').trim()
    const API_TOKEN = (process.env.WAKE_GRAPHQL_TOKEN ?? '').trim()

    console.log('GraphQL DEBUG:', {
      graphqlUrl: GRAPHQL_BASE_URL ? '✓ Configurada' : '✗ Vazia',
      token: API_TOKEN ? '✓ Configurada' : '✗ Vazia',
      urlValue: GRAPHQL_BASE_URL,
      tokenPreview: API_TOKEN.substring(0, 10) + '***',
    })

    if (!GRAPHQL_BASE_URL) {
      return NextResponse.json(
        { error: 'WAKE_GRAPHQL_URL não configurada' },
        { status: 500 }
      )
    }

    if (!API_TOKEN) {
      return NextResponse.json(
        { error: 'WAKE_GRAPHQL_TOKEN não configurada' },
        { status: 500 }
      )
    }

    const { query, variables } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'query é obrigatória' },
        { status: 400 }
      )
    }

    const headers: HeadersInit = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      "TCS-Access-Token": API_TOKEN,
    }

    const baseUrl = GRAPHQL_BASE_URL.endsWith('/') ? GRAPHQL_BASE_URL.slice(0, -1) : GRAPHQL_BASE_URL

    console.log('GraphQL Request:', {
      url: baseUrl,
      tokenLength: API_TOKEN.length,
      hasToken: API_TOKEN.length > 0,
    })

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    })

    console.log('GraphQL Response:', {
      status: response.status,
      ok: response.ok,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('GraphQL API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        error: error.substring(0, 500), // Primeiros 500 caracteres
      })
      return NextResponse.json(
        { error },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('GraphQL API Error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição GraphQL' },
      { status: 500 }
    )
  }
}
