import { NextRequest, NextResponse } from 'next/server'

const REST_BASE_URL = process.env.WAKE_API_URL ?? ''
const API_TOKEN = process.env.WAKE_API_TOKEN ?? ''

export async function POST(request: NextRequest) {
  try {
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

    const { path, method = 'GET', body } = await request.json()

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

    const response = await fetch(url, {
      method: method as string,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

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
