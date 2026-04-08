"use client";

import { useState } from "react";

import type { HotsiteContent } from "@/app/lib/cms-api";
import { SaveButton } from "@/components/save-button";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type ContentEditorFormProps = {
  initialContent: HotsiteContent;
  type: "create" | "update";
  canPublish: boolean;
};

function formatHotsitesId(value?: string | number[]) {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value.join(",") : String(value);
}

function parseHotsitesId(value: string) {
  return value
    .split(",")
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isInteger(id));
}

type FieldsProps = {
  title: string;
  setTitle: (value: string) => void;
  active: boolean;
  setActive: (value: boolean) => void;
  dataInicio: string;
  setDataInicio: (value: string) => void;
  dataFim: string;
  setDataFim: (value: string) => void;
  posicionamento: string;
  setPosicionamento: (value: string) => void;
  termoBusca: string;
  setTermoBusca: (value: string) => void;
  exibeTodasBuscas: boolean;
  setExibeTodasBuscas: (value: boolean) => void;
  naoExibeBuscas: boolean;
  setNaoExibeBuscas: (value: boolean) => void;
  exibeTodosHotsites: boolean;
  setExibeTodosHotsites: (value: boolean) => void;
  hotsitesId: string;
  setHotsitesId: (value: string) => void;
};

function ContentOptionsFields(props: FieldsProps) {
  const handleExibeTodasBuscasChange = (checked: boolean) => {
    props.setExibeTodasBuscas(checked);

    if (checked) {
      props.setNaoExibeBuscas(false);
    }
  };

  const handleNaoExibeBuscasChange = (checked: boolean) => {
    props.setNaoExibeBuscas(checked);

    if (checked) {
      props.setExibeTodasBuscas(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="titulo">Titulo</Label>
        <Input
          id="titulo"
          name="titulo"
          type="text"
          placeholder="Titulo do conteudo"
          value={props.title}
          onChange={(event) => props.setTitle(event.target.value)}
          required
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="ativo">Ativo</Label>
          <p className="text-sm text-muted-foreground">Controla se o conteudo fica ativo.</p>
        </div>
        <Switch id="ativo" name="ativo" checked={props.active} onCheckedChange={props.setActive} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="dataInicio">Data de inicio</Label>
          <Input
            id="dataInicio"
            name="dataInicio"
            type="date"
            value={props.dataInicio}
            onChange={(event) => props.setDataInicio(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dataFim">Data de fim</Label>
          <Input
            id="dataFim"
            name="dataFim"
            type="date"
            value={props.dataFim}
            onChange={(event) => props.setDataFim(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="posicionamento">Posicionamento</Label>
        <Select
          name="posicionamento"
          value={props.posicionamento}
          onValueChange={props.setPosicionamento}
          required
        >
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
        <Label htmlFor="termoBusca">Termo de busca</Label>
        <Input
          id="termoBusca"
          name="termoBusca"
          type="text"
          placeholder="Insira em qual termo de busca o conteudo sera exibido"
          value={props.termoBusca}
          onChange={(event) => props.setTermoBusca(event.target.value)}
        />
      </div>

      <div className="grid gap-3 rounded-lg border p-4">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="exibeTodasBuscas">Exibe em todas as buscas</Label>
          <Switch
            id="exibeTodasBuscas"
            name="exibeTodasBuscas"
            checked={props.exibeTodasBuscas}
            onCheckedChange={handleExibeTodasBuscasChange}
          />
        </div>
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="naoExibeBuscas">Nao exibe nas buscas</Label>
          <Switch
            id="naoExibeBuscas"
            name="naoExibeBuscas"
            checked={props.naoExibeBuscas}
            onCheckedChange={handleNaoExibeBuscasChange}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="exibeTodosHotsites"
            name="exibeTodosHotsites"
            checked={props.exibeTodosHotsites}
            onCheckedChange={(checked) => props.setExibeTodosHotsites(checked === true)}
          />
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
          value={props.hotsitesId}
          onChange={(event) => props.setHotsitesId(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">Informe IDs inteiros separados por virgula.</p>
      </div>
    </div>
  );
}

export default function ContentEditorForm({
  initialContent,
  type,
  canPublish,
}: ContentEditorFormProps) {
  const [title, setTitle] = useState(initialContent.title ?? "");
  const [active, setActive] = useState(initialContent.active ?? true);
  const [dataInicio, setDataInicio] = useState(initialContent.dataInicio ?? "");
  const [dataFim, setDataFim] = useState(initialContent.dataFim ?? "");
  const [posicionamento, setPosicionamento] = useState(initialContent.position || "Topo");
  const [termoBusca, setTermoBusca] = useState(String(initialContent.searchTerms ?? ""));
  const [exibeTodasBuscas, setExibeTodasBuscas] = useState(initialContent.exibeTodasBuscas ?? false);
  const [naoExibeBuscas, setNaoExibeBuscas] = useState(initialContent.naoExibeBuscas ?? true);
  const [exibeTodosHotsites, setExibeTodosHotsites] = useState(
    initialContent.exibeTodosHotsites ?? false,
  );
  const [hotsitesId, setHotsitesId] = useState(formatHotsitesId(initialContent.hotsiteId));

  const isRequiredFieldsFilled = title.trim().length > 0 && posicionamento.trim().length > 0;

  const currentContent: HotsiteContent = {
    workflowId: initialContent.workflowId,
    contentId: initialContent.contentId,
    content: initialContent.content,
    title,
    searchTerms: termoBusca,
    position: posicionamento,
    hotsiteId: parseHotsitesId(hotsitesId),
    exibeTodasBuscas,
    naoExibeBuscas,
    exibeTodosHotsites,
    active,
    dataInicio,
    dataFim,
  };

  const fields = (
    <ContentOptionsFields
      title={title}
      setTitle={setTitle}
      active={active}
      setActive={setActive}
      dataInicio={dataInicio}
      setDataInicio={setDataInicio}
      dataFim={dataFim}
      setDataFim={setDataFim}
      posicionamento={posicionamento}
      setPosicionamento={setPosicionamento}
      termoBusca={termoBusca}
      setTermoBusca={setTermoBusca}
      exibeTodasBuscas={exibeTodasBuscas}
      setExibeTodasBuscas={setExibeTodasBuscas}
      naoExibeBuscas={naoExibeBuscas}
      setNaoExibeBuscas={setNaoExibeBuscas}
      exibeTodosHotsites={exibeTodosHotsites}
      setExibeTodosHotsites={setExibeTodosHotsites}
      hotsitesId={hotsitesId}
      setHotsitesId={setHotsitesId}
    />
  );

  return (
    <div className="static space-y-4">
      {type === "update" ? (
        <details className="rounded-xl border bg-background" open>
          <summary className="cursor-pointer list-none px-4 py-3 font-medium">
            Opcoes do conteudo
          </summary>
          <div className="border-t p-4">{fields}</div>
        </details>
      ) : (
        <form className="mx-auto static rounded-xl border p-4">{fields}</form>
      )}

      <div className="grid gap-2 rounded-xl border p-4">
        <Label htmlFor="conteudo">Conteudo</Label>
        <SimpleEditor initialContent={initialContent.content} />
      </div>

      <div className="sticky bottom-2 left-0 z-50 flex w-fit justify-start rounded-lg bg-background p-4 shadow-lg">
        <SaveButton
          currentContent={currentContent}
          disabled={!isRequiredFieldsFilled}
          canPublish={canPublish}
        />
      </div>
    </div>
  );
}
