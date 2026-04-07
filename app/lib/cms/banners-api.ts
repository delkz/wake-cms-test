import { requestRest } from "./http"
import type { HotsiteBanner } from "./types"

export async function updateHotsiteBanners(
  hotsiteId: string,
  banners: HotsiteBanner[],
): Promise<HotsiteBanner[]> {
  return requestRest<HotsiteBanner[]>(`/hotsites/${hotsiteId}/banners`, 'PUT', {
    banners,
  })
}
