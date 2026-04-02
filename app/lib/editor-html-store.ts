import { create } from "zustand"

type EditorHtmlStore = {
  html: string
  setHtml: (html: string) => void
  resetHtml: (html?: string) => void
}

export const useEditorHtmlStore = create<EditorHtmlStore>((set) => ({
  html: "",
  setHtml: (html) => set({ html }),
  resetHtml: (html = "") => set({ html }),
}))