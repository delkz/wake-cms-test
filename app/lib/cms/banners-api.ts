import { requestRest } from "./http"
import type { HotsiteBanner } from "./types"

const BANNERS_POSITIONS_STORAGE_KEY = "cms:banners:positions"

export type BannerPosition = { posicionamentoId: number, descricao: string }

export interface BannerApiResponse extends UploadBannerOptions {
  id: number,
}

export interface UploadBannerOptions {
  id?: number,
  detalhe: {
    imagemBanner?: { formato: string, nome: string, base64: string },
    posicionamentoId: number,
    urlBanner: string,
    ordemExibicao: number,
    urlClique?: string,
    title?: string,
    urlBannerAlternativo?: string,
    titleAlternativo?: string,
    textoAlternativo: string,
    altura?: number,
    largura?: number,
    abrirBannerNovaAba: boolean,
    diasExibicao: BannerDiasExibicao,
  },
  apresentacao?: {
    exibirNoSite: boolean,
    exibirEmTodasBuscas: boolean,
    naoExibirEmBuscas: boolean,
    termosBusca?: string,
    exibirEmTodasCategorias: boolean,
    listaHotsites: { exibirEmTodosHotSites: boolean, hotSites: Array<{ hotSiteId: number }> },
    listaParceiros: { exibirEmTodosParceiros: boolean, parceiros: Array<{ parceiroId: number }> },
  },
  nome: string,
  ativo: boolean,
  dataInicio: string,
  dataFim?: string,
}

export type BannerDiasExibicao = {
  todosDias: boolean,
  domingo: boolean,
  segunda: boolean,
  terca: boolean,
  quarta: boolean,
  quinta: boolean,
  sexta: boolean,
  sabado: boolean,
}
export async function updateHotsiteBanners(
  hotsiteId: string,
  banners: HotsiteBanner[],
): Promise<HotsiteBanner[]> {
  return requestRest<HotsiteBanner[]>(`/hotsites/${hotsiteId}/banners`, 'PUT', {
    banners,
  })
}

export async function getBannersPositions(): Promise<BannerPosition[]> {
  if (typeof window !== "undefined") {
    const cachedPositions = localStorage.getItem(BANNERS_POSITIONS_STORAGE_KEY)

    if (cachedPositions) {
      try {
        return JSON.parse(cachedPositions) as BannerPosition[]
      } catch {
        localStorage.removeItem(BANNERS_POSITIONS_STORAGE_KEY)
      }
    }
  }

  const positions = await requestRest<BannerPosition[]>(`/banners/posicionamentos`, "GET")

  if (typeof window !== "undefined") {
    localStorage.setItem(BANNERS_POSITIONS_STORAGE_KEY, JSON.stringify(positions))
  }

  return positions
}

export async function uploadBannerImage(body: UploadBannerOptions): Promise<{ success: boolean }> {
  return requestRest<{ success: boolean }>(`/banners`, 'POST', body);
}

export async function deleteBanner(bannerId: string): Promise<{ success: boolean }> {
  return requestRest<{ success: boolean }>(`/banners/${bannerId}`, 'DELETE');
}

export async function updateBanner(bannerId: string, body: Partial<UploadBannerOptions>): Promise<{ success: boolean }> {
  return requestRest<{ success: boolean }>(`/banners/${bannerId}`, 'PUT', body);
}

export async function getBanner(bannerId: string): Promise<BannerApiResponse> {
  return requestRest<BannerApiResponse>(`/banners/${bannerId}`, 'GET');
}