import {
  updateHotsiteBanners,
} from "./cms/banners-api"
import {
  getContentById,
  updateContent,
  createContent
} from "./cms/contents-api"
import {
  createHotsite,
  deleteHotsite,
  getHotsiteById,
  insertHotsite,
  listHotsites,
  removeHotsite,
  updateHotsite,
  updateHotsiteContents,
} from "./cms/hotsites-api"
import { replaceHotsiteUrlBinding } from "./cms/url-bindings-api"

export type { Hotsite, HotsiteBanner, HotsiteContent } from "./cms/types"

export const cmsApi = {
  listHotsites,
  getHotsiteById,
  updateContent,
  createContent,
  getContentById,
  createHotsite,
  insertHotsite,
  updateHotsite,
  removeHotsite,
  deleteHotsite,
  updateHotsiteContents,
  updateHotsiteBanners,
  replaceHotsiteUrlBinding,
}
