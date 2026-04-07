import { getContentByIdResponseSuccess, RestErrorResponse } from "@/app/types/rest"

import { requestRest } from "./http"
import type { HotsiteContent } from "./types"

function isRestErrorResponse(
  value: getContentByIdResponseSuccess | RestErrorResponse,
): value is RestErrorResponse {
  return 'mensagem' in value
}

export async function getContentById(contentId: string): Promise<HotsiteContent> {
  const data: getContentByIdResponseSuccess | RestErrorResponse = await requestRest(
    `/conteudos/${contentId}`,
    'GET'
  )

  if (!data || isRestErrorResponse(data)) {
    throw new Error('Conteudo nao encontrado')
  }

  return {
    contentId: String(data.conteudoId),
    content: data.codigoFonte,
    title: data.titulo,
    searchTerms: data.termoBusca,
    position: data.posicionamento ?? '',
    exibeTodasBuscas: data.exibeTodasBuscas,
    naoExibeBuscas: data.naoExibeBuscas,
    exibeTodosHotsites: data.exibeTodosHotsites,
    hotsiteId: data.hotsitesId,
  }
}

export async function updateContent(input: HotsiteContent): Promise<HotsiteContent> {
  const {
    contentId,
    content,
    title,
    position,
    hotsiteId,
    searchTerms,
    exibeTodasBuscas,
    naoExibeBuscas,
    exibeTodosHotsites,
  } = input

  return requestRest<HotsiteContent>(`/conteudos/${contentId}`, 'PUT', {
    titulo: title,
    ativo: true,
    posicionamento: position,
    conteudo: content,
    exibeTodasBuscas,
    naoExibeBuscas,
    exibeTodosHotsites,
    termoBusca: searchTerms,
    hotsitesId: hotsiteId,
  })
}
