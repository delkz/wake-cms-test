'use client'

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SaveButton } from "@/components/save-button";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { HotsiteContent } from "@/app/lib/cms-api";

const NewContentForm = () => {
    const [titulo, setTitulo] = useState("")
    const [ativo, setAtivo] = useState(true)
    const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0])
    const [dataFim, setDataFim] = useState("")
    const [posicionamento, setPosicionamento] = useState("Topo")
    const [termoBusca, setTermoBusca] = useState("")
    const [exibeTodasBuscas, setExibeTodasBuscas] = useState(false)
    const [naoExibeBuscas, setNaoExibeBuscas] = useState(true)
    const [exibeTodosHotsites, setExibeTodosHotsites] = useState(false)
    const [hotsitesId, setHotsitesId] = useState(() => {
        if (typeof window === "undefined") {
            return ""
        }

        const params = new URL(window.location.href).searchParams
        return params.get("hotsiteId") || ""
    })

    const isRequiredFieldsFilled = titulo.trim().length > 0 && posicionamento.trim().length > 0

    const handleExibeTodasBuscasChange = (checked: boolean) => {
        setExibeTodasBuscas(checked)

        if (checked) {
            setNaoExibeBuscas(false)
        }
    }

    const handleNaoExibeBuscasChange = (checked: boolean) => {
        setNaoExibeBuscas(checked)

        if (checked) {
            setExibeTodasBuscas(false)
        }
    }

    const currentContent: HotsiteContent = {
        contentId: "",
        content: "",
        title: titulo,
        searchTerms: termoBusca,
        position: posicionamento,
        hotsiteId: hotsitesId.split(",").map(id => Number(id.trim())),
        exibeTodasBuscas,
        naoExibeBuscas,
        exibeTodosHotsites,
        active: ativo
    }

    return (
        <div className="static">
            <form action="" className="mx-auto static">
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="titulo">Título</Label>
                        <Input id="titulo" name="titulo" type="text" placeholder="Título do conteúdo" value={titulo} onChange={(event) => setTitulo(event.target.value)} required />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="ativo">Ativo</Label>
                            <p className="text-sm text-muted-foreground">Conteúdo ativo/inativo</p>
                        </div>
                        <Switch id="ativo" name="ativo" checked={ativo} onCheckedChange={setAtivo} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="dataInicio">Data de Início</Label>
                            <Input id="dataInicio" name="dataInicio" type="date" value={dataInicio} onChange={(event) => setDataInicio(event.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dataFim">Data de Fim</Label>
                            <Input id="dataFim" name="dataFim" type="date" value={dataFim} onChange={(event) => setDataFim(event.target.value)} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="posicionamento">Posicionamento</Label>
                        <Select name="posicionamento" value={posicionamento} onValueChange={setPosicionamento} required>
                            <SelectTrigger id="posicionamento">
                                <SelectValue placeholder="Selecione o posicionamento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Topo">Topo</SelectItem>
                                <SelectItem value="Centro">Centro</SelectItem>
                                <SelectItem value="Rodape">Rodape</SelectItem>
                                <SelectItem value="LateralDireita">LateralDireita</SelectItem>
                                <SelectItem value="LateralEsquerda">LateralEsquerda</SelectItem>
                                <SelectItem value="MobileTopo">MobileTopo</SelectItem>
                                <SelectItem value="MobileRodape">MobileRodape</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="termoBusca">Termo de Busca</Label>
                        <Input
                            id="termoBusca"
                            name="termoBusca"
                            type="text"
                            placeholder="Insira em qual termo de busca o conteúdo será exibido"
                            value={termoBusca}
                            onChange={(event) => setTermoBusca(event.target.value)}
                        />
                    </div>

                    <div className="grid gap-3 rounded-lg border p-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="exibeTodasBuscas">Exibe em todas as buscas</Label>
                            <Switch id="exibeTodasBuscas" name="exibeTodasBuscas" checked={exibeTodasBuscas} onCheckedChange={handleExibeTodasBuscasChange} />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="naoExibeBuscas">Não exibe nas buscas</Label>
                            <Switch id="naoExibeBuscas" name="naoExibeBuscas" checked={naoExibeBuscas} onCheckedChange={handleNaoExibeBuscasChange} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="exibeTodosHotsites" name="exibeTodosHotsites" checked={exibeTodosHotsites} onCheckedChange={(checked) => setExibeTodosHotsites(checked === true)} />
                            <Label htmlFor="exibeTodosHotsites">Exibe em todos os hotsites</Label>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="hotsitesId">Hotsites ID</Label>
                        <Input
                            id="hotsitesId"
                            name="hotsitesId"
                            type="text"
                            placeholder="Ex.: 1,2,3"
                            value={hotsitesId}
                            onChange={(event) => setHotsitesId(event.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Informe IDs inteiros separados por vírgula.</p>
                    </div>

                    
                    <div className="grid gap-2">
                        <Label htmlFor="conteudo">Conteúdo</Label>
                        <SimpleEditor initialContent="" />
                    </div>

                </div>

            </form>

            <div className="sticky bottom-2 z-50 left-0 flex justify-start w-fit mt-4 bg-background rounded-lg p-4 shadow-lg">
                <SaveButton currentContent={currentContent} type="create" disabled={!isRequiredFieldsFilled} />
            </div>

        </div>
    )
}

export default NewContentForm