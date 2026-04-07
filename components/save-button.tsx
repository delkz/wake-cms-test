"use client"

import { cmsApi, HotsiteContent } from "@/app/lib/cms-api"
import { useEditorHtmlStore } from "@/app/lib/editor-html-store"
import { Button } from "@/components/ui/button"

export function SaveButton({
  currentContent,
  type,
  disabled,
}: {
  currentContent: HotsiteContent | null
  type: "create" | "update"
  disabled: boolean
}) {
  const html = useEditorHtmlStore((state) => state.html)

  async function handleSave() {
    if (!currentContent) {
      return
    }

    const data = {
      contentId: currentContent.contentId,
      title: currentContent.title,
      searchTerms: currentContent.searchTerms,
      content: html,
      position: currentContent.position,
      active: currentContent.active,
      dataInicio: currentContent.dataInicio,
      dataFim: currentContent.dataFim,
      exibeTodasBuscas: currentContent.exibeTodasBuscas,
      naoExibeBuscas: currentContent.naoExibeBuscas,
      exibeTodosHotsites: currentContent.exibeTodosHotsites,
      hotsiteId: currentContent.hotsiteId,
    }

    if (type === "create") {
      try {
        const response = await cmsApi.createContent(data)
        window.location.href = `/cms/content/edit/${response}`
        return
      } catch (e) {
        console.error("Erro ao criar conteudo:", e)
        const msg =
          JSON.parse(e instanceof Error ? e.message : "{}")?.mensagem ||
          "Ocorreu um erro desconhecido."
        alert(`Ocorreu um erro ao criar o conteudo. ${msg}`)
        return
      }
    }

    const response = await cmsApi.updateContent(data)
    console.log("Resposta da API:", { response })
    alert("Conteudo atualizado com sucesso.")
  }

  return (
    <Button
      variant={"default"}
      className="bg-green-500 hover:bg-green-500"
      type="button"
      onClick={handleSave}
      disabled={disabled}
    >
      Salvar
    </Button>
  )
}
