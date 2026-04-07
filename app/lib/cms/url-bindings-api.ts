import { requestRest } from "./http"

export async function replaceHotsiteUrlBinding(
  url: string,
  hotsiteId: string,
): Promise<{ url: string; hotsiteId: string; updatedAt: string }> {
  return requestRest<{ url: string; hotsiteId: string; updatedAt: string }>(
    '/url-bindings',
    'PUT',
    {
      url,
      hotsiteId,
    }
  )
}
