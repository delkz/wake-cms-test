"use client"

import { Button } from "@/components/ui/button"
import { useEditorHtmlStore } from "@/app/lib/editor-html-store"
import { cmsApi, HotsiteContent } from "@/app/lib/cms-api"

export function SaveButton({ currentContent, type, disabled }: { currentContent: HotsiteContent | null; type: 'create' | 'update'; disabled: boolean }) {
  const html = useEditorHtmlStore((state) => state.html)


  
  async function handleSave() {
    // console.log("HTML atual do editor:", { html });

    const params = new URL(window.location.href).searchParams

    if(!currentContent){
      return;
    }

    const data = { 
      contentId: currentContent?.contentId, 
      title: currentContent.title, 
      searchTerms: currentContent.searchTerms, 
      content: html, 
      position: currentContent.position, 
      exibeTodasBuscas: currentContent.exibeTodasBuscas,
      naoExibeBuscas: currentContent.naoExibeBuscas,
      exibeTodosHotsites: currentContent.exibeTodosHotsites,
      hotsiteId: currentContent.hotsiteId 
    }

    // console.log({
    //   data
    // })
    if(type === 'create') {
      try{
        const response = await cmsApi.createContent({...data,active: currentContent.active ?? false});
        window.location.href = `/cms/content/edit/${response}`
        return;
      // alert(response)
      }catch(e){
        console.error("Erro ao criar conteúdo:", e);
        const msg = JSON.parse(e instanceof Error ? e.message : '{}')?.mensagem || "Ocorreu um erro desconhecido."
        alert("Ocorreu um erro ao criar o conteúdo. "+ msg)
        return;
      }
     

    }

    const response = await cmsApi.updateContent(data);
    console.log("Resposta da API:", { response })

    alert(response)
  }

  return (
    <Button variant={"default"} className="bg-green-500 hover:bg-green-500" type="button" onClick={handleSave} disabled={disabled}>
      Salvar
    </Button>
  )
}