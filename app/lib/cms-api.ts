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
  getHotsiteById,
  listHotsites,
  removeHotsite,
  updateHotsiteContents,
} from "./cms/hotsites-api"
import type {
  Hotsite,
  HotsiteBanner,
  HotsiteContent,
} from "./cms/types"
import { replaceHotsiteUrlBinding } from "./cms/url-bindings-api"

export type { Hotsite, HotsiteBanner, HotsiteContent } from "./cms/types"

export const cmsApi = {
  listHotsites,
  getHotsiteById,
  updateContent,
  createContent,
  getContentById,
  createHotsite,
  removeHotsite,
  updateHotsiteContents,
  updateHotsiteBanners,
  replaceHotsiteUrlBinding,
}
