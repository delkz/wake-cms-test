"use client"

import { Button } from "@/app/components/ui/button"
import { useEditorHtmlStore } from "@/app/lib/editor-html-store"
import { cmsApi, HotsiteContent } from "../lib/cms-api"

export function SaveButton({ currentContent }: { currentContent: HotsiteContent }) {
  const html = useEditorHtmlStore((state) => state.html)


  
  async function handleSave() {
    console.log("HTML atual do editor:", { html });

    const params = new URL(window.location.href).searchParams

    const response = await cmsApi.updateContent({ 
      contentId: currentContent.contentId, 
      title: currentContent.title, 
      searchTerms: currentContent.searchTerms, 
      content: html, 
      position: currentContent.position, 
      exibeTodasBuscas: currentContent.exibeTodasBuscas,
      naoExibeBuscas: currentContent.naoExibeBuscas,
      exibeTodosHotsites: currentContent.exibeTodosHotsites,
      hotsiteId: currentContent.hotsiteId 
    });
    console.log("Resposta da API:", { response })
    alert(response)
  }

  return (
    <Button type="button" onClick={handleSave} disabled={!html.trim()}>
      Salvar
    </Button>
  )
}