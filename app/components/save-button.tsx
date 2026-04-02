"use client"

import { Button } from "@/app/components/ui/button"
import { useEditorHtmlStore } from "@/app/lib/editor-html-store"
import { cmsApi, HotsiteContent } from "../lib/cms-api"

export function SaveButton({ currentContent }: { currentContent: HotsiteContent }) {
  const html = useEditorHtmlStore((state) => state.html)


  
  async function handleSave() {
    console.log("HTML atual do editor:", { html });
    //http://localhost:3000/cms/content/edit/115?hotsiteId=203648
    const params = new URL(window.location.href).searchParams
    const hotsiteId = params.get('hotsiteId')
    if(!hotsiteId) {
      console.error("Hotsite ID não encontrado na URL")
      return
    }
    const response = await cmsApi.updateContent({ contentId: currentContent.contentId, title: currentContent.title, searchTerms: currentContent.searchTerms, content: html, position: currentContent.position, hotsiteId });
    console.log("Resposta da API:", { response })
    alert(response)
  }

  return (
    <Button type="button" onClick={handleSave} disabled={!html.trim()}>
      Salvar
    </Button>
  )
}