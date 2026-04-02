import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const REST_BASE_URL = process.env.WAKE_API_URL ?? ''
    const API_TOKEN = process.env.WAKE_API_TOKEN ?? ''

    // console.log('REST DEBUG:', {
    //   apiUrl: REST_BASE_URL ? '✓ Configurada' : '✗ Vazia',
    //   token: API_TOKEN ? '✓ Configurada' : '✗ Vazia',
    // })

    if (!REST_BASE_URL) {
      return NextResponse.json(
        { error: 'WAKE_API_URL não configurada' },
        { status: 500 }
      )
    }

    if (!API_TOKEN) {
      return NextResponse.json(
        { error: 'WAKE_API_TOKEN não configurada' },
        { status: 500 }
      )
    }

    const { path, method, body } = await request.json()

    if (!path) {
      return NextResponse.json(
        { error: 'path é obrigatório' },
        { status: 400 }
      )
    }

    const headers: HeadersInit = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${API_TOKEN}`,
    }

    const baseUrl = REST_BASE_URL.endsWith('/') ? REST_BASE_URL.slice(0, -1) : REST_BASE_URL
    const url = `${baseUrl}${path}`

    console.log('REST Request:', {
      url,
      method,
      body,
    })

    const response = await fetch(url, {
      method: method as string,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    // console.log('REST Response:', {
    //   status: response.status,
    //   ok: response.ok,
    // })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error },
        { status: response.status }
      )
    }

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('REST API Error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const REST_BASE_URL = process.env.WAKE_API_URL ?? ''
    const API_TOKEN = process.env.WAKE_API_TOKEN ?? ''

    // console.log('REST DEBUG:', {
    //   apiUrl: REST_BASE_URL ? '✓ Configurada' : '✗ Vazia',
    //   token: API_TOKEN ? '✓ Configurada' : '✗ Vazia',
    // })

    if (!REST_BASE_URL) {
      return NextResponse.json(
        { error: 'WAKE_API_URL não configurada' },
        { status: 500 }
      )
    }

    if (!API_TOKEN) {
      return NextResponse.json(
        { error: 'WAKE_API_TOKEN não configurada' },
        { status: 500 }
      )
    }

    const { path, method = 'PUT', body } = await request.json()

    if (!path) {
      return NextResponse.json(
        { error: 'path é obrigatório' },
        { status: 400 }
      )
    }

    const headers: HeadersInit = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${API_TOKEN}`,
    }

    const baseUrl = REST_BASE_URL.endsWith('/') ? REST_BASE_URL.slice(0, -1) : REST_BASE_URL
    const url = `${baseUrl}${path}`

    // console.log('REST Request:', {
    //   url,
    //   method,
    //   tokenLength: API_TOKEN.length,
    //   hasToken: API_TOKEN.length > 0,
    // })

    const response = await fetch(url, {
      method: method as string,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    // console.log('REST Response:', {
    //   status: response.status,
    //   ok: response.ok,
    // })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error },
        { status: response.status }
      )
    }

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('REST API Error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const REST_BASE_URL = process.env.WAKE_API_URL ?? ''
    const API_TOKEN = process.env.WAKE_API_TOKEN ?? ''

    // console.log('REST DEBUG:', {
    //   apiUrl: REST_BASE_URL ? '✓ Configurada' : '✗ Vazia',
    //   token: API_TOKEN ? '✓ Configurada' : '✗ Vazia',
    // })

    if (!REST_BASE_URL) {
      return NextResponse.json(
        { error: 'WAKE_API_URL não configurada' },
        { status: 500 }
      )
    }

    if (!API_TOKEN) {
      return NextResponse.json(
        { error: 'WAKE_API_TOKEN não configurada' },
        { status: 500 }
      )
    }

    const path = request.nextUrl.searchParams.get('path')
    const method = request.nextUrl.searchParams.get('method') ?? 'GET'

    if (!path) {
      return NextResponse.json(
        { error: 'path é obrigatório' },
        { status: 400 }
      )
    }

    const headers: HeadersInit = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${API_TOKEN}`,
    }

    const baseUrl = REST_BASE_URL.endsWith('/') ? REST_BASE_URL.slice(0, -1) : REST_BASE_URL
    const url = `${baseUrl}${path}`

    // console.log('REST Request:', {
    //   url,
    //   method,
    //   tokenLength: API_TOKEN.length,
    //   hasToken: API_TOKEN.length > 0,
    // })

    const response = await fetch(url, {
      method: method as string,
      headers,
    })

    // console.log('REST Response:', {
    //   status: response.status,
    //   ok: response.ok,
    // })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error },
        { status: response.status }
      )
    }

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('REST API Error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
}