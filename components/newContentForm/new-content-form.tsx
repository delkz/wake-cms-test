'use client'

import ContentEditorForm from "@/components/content-editor-form";

const NewContentForm = ({ initialHotsiteId = "" }: { initialHotsiteId?: string }) => {
    return (
        <ContentEditorForm
            type="create"
            initialContent={{
                contentId: "",
                content: "",
                title: "",
                searchTerms: "",
                position: "Topo",
                hotsiteId: initialHotsiteId,
                exibeTodasBuscas: false,
                naoExibeBuscas: true,
                exibeTodosHotsites: false,
                active: true,
                dataInicio: new Date().toISOString().split("T")[0],
                dataFim: "",
            }}
        />
    )
}

export default NewContentForm
