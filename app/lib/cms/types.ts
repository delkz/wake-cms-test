export interface Hotsite {
  workflowId?: string
  ativo: boolean
  hotsiteId: string
  banners: HotsiteBanner[]
  conteudos: HotsiteContent[]
  url: string
  nome: string
}

export interface HotsiteContent {
  workflowId?: string
  contentId: string
  content: string
  title: string
  searchTerms: string[] | string
  position: string
  hotsiteId?: string | number[]
  exibeTodasBuscas?: boolean
  naoExibeBuscas?: boolean
  exibeTodosHotsites?: boolean
  active?: boolean
  dataInicio?: string
  dataFim?: string
}

export interface HotsiteBanner {
  bannerId: string
  bannerName: string
  bannerUrl: string
  position: string
}
