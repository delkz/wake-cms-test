"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { submitBannerForReview } from "@/app/cms/banner/actions";
import {
  type BannerApiResponse,
  type BannerDiasExibicao,
  getBannersPositions,
  type UploadBannerOptions,
} from "@/app/lib/cms/banners-api";
import type { Hotsite, HotsiteBanner } from "@/app/lib/cms/types";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

type BannerEditorFormProps = {
  hotsite?: Hotsite;
  mode: "create" | "update";
  canPublish: boolean;
  initialBanner?: HotsiteBanner;
  initialBannerDetails?: BannerApiResponse;
};

type ImagePayload = {
  base64: string;
  formato: string;
  nome: string;
  altura: number;
  largura: number;
};

type BannerPositionOption = {
  posicionamentoId: number;
  descricao: string;
};

type DetalhePayload = Omit<UploadBannerOptions["detalhe"], "imagemBanner"> & {
  imagemBanner?: UploadBannerOptions["detalhe"]["imagemBanner"];
};

type FormFieldErrors = {
  bannerName?: boolean;
  dataInicio?: boolean;
  dataFim?: boolean;
  positionId?: boolean;
  urlBanner?: boolean;
  urlClique?: boolean;
  bannerUrl?: boolean;
  title?: boolean;
  titleAlternativo?: boolean;
  textoAlternativo?: boolean;
  termosBusca?: boolean;
  ordemExibicao?: boolean;
  hotsitesIds?: boolean;
  parceirosIds?: boolean;
  selectedFile?: boolean;
};

function parseIdsList(value: string) {
  return value
    .split(",")
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
}

function normalizeDateInput(value?: string) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function normalizeImageFormat(rawFormat: string) {
  const normalized = rawFormat.trim().toLowerCase();
  return normalized || "png";
}

function getFormatFromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,/i);
  const mimeType = match?.[1]?.toLowerCase();

  if (!mimeType) {
    return null;
  }

  const [, subtype = ""] = mimeType.split("/");
  return normalizeImageFormat(subtype);
}

function getFileFormat(file: File, dataUrl: string) {
  const dataUrlFormat = getFormatFromDataUrl(dataUrl);

  if (dataUrlFormat) {
    return dataUrlFormat;
  }

  const [, mimeSubtype = ""] = file.type.split("/");

  if (mimeSubtype) {
    return normalizeImageFormat(mimeSubtype);
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return normalizeImageFormat(extension);
}

function createPreviewDataUrl(base64: string, format?: string) {
  const normalizedBase64 = base64.trim();

  if (!normalizedBase64) {
    return "";
  }

  if (normalizedBase64.startsWith("data:")) {
    return normalizedBase64;
  }

  const normalizedFormat = (format || "png").trim().toLowerCase();
  const mimeSubtype = normalizedFormat === "jpg" ? "jpeg" : normalizedFormat;

  return `data:image/${mimeSubtype};base64,${normalizedBase64}`;
}

function createDefaultDiasExibicao(): BannerDiasExibicao {
  return {
    todosDias: true,
    domingo: true,
    segunda: true,
    terca: true,
    quarta: true,
    quinta: true,
    sexta: true,
    sabado: true,
  };
}

async function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Nao foi possivel ler a imagem."));
        return;
      }

      resolve(result);
    };

    reader.onerror = () => {
      reject(new Error("Falha ao processar o arquivo de imagem."));
    };

    reader.readAsDataURL(file);
  });
}

async function readImageDimensions(dataUrl: string) {
  return new Promise<{ largura: number; altura: number }>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        largura: image.naturalWidth,
        altura: image.naturalHeight,
      });
    };

    image.onerror = () => {
      reject(new Error("Nao foi possivel obter as dimensoes da imagem."));
    };

    image.src = dataUrl;
  });
}

async function buildImagePayload(file: File): Promise<ImagePayload> {
  const dataUrl = await readImageAsDataUrl(file);
  const rawBase64 = dataUrl.split(",")[1]?.replace(/\s+/g, "");

  if (!rawBase64) {
    throw new Error("Imagem invalida para upload.");
  }

  const formato = getFileFormat(file, dataUrl);
  const allowedFormats = new Set(["png", "jpg", "jpeg"]);

  if (!allowedFormats.has(formato)) {
    throw new Error("Formato de imagem nao suportado. Use apenas PNG, JPG ou JPEG.");
  }

  const formatoParaApi = file.type.split("/")[1]?.toLowerCase().replace("jpeg", "jpg") ?? formato.toLowerCase();
  const nomeParaApi = file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "-");
  const { largura, altura } = await readImageDimensions(dataUrl);

  return {
    base64: rawBase64,
    formato: formatoParaApi,
    nome: nomeParaApi,
    altura,
    largura,
  };
}

export default function BannerEditorForm({
  hotsite,
  mode,
  canPublish,
  initialBanner,
  initialBannerDetails,
}: BannerEditorFormProps) {
  const [positions, setPositions] = useState<BannerPositionOption[]>([]);
  const [positionId, setPositionId] = useState("");

  const [bannerName, setBannerName] = useState(initialBannerDetails?.nome ?? initialBanner?.bannerName ?? "");
  const [dataInicio, setDataInicio] = useState(normalizeDateInput(initialBannerDetails?.dataInicio || new Date().toISOString()));
  const [dataFim, setDataFim] = useState(normalizeDateInput(initialBannerDetails?.dataFim));
  const [ativo, setAtivo] = useState(initialBannerDetails?.ativo ?? true);

  const [urlBanner, setUrlBanner] = useState(initialBannerDetails?.detalhe.urlBanner ?? "");
  const [urlClique, setUrlClique] = useState(initialBannerDetails?.detalhe.urlClique ?? "");
  const [bannerUrl, setBannerUrl] = useState(initialBannerDetails?.detalhe.urlBannerAlternativo ?? "");
  const [title, setTitle] = useState(initialBannerDetails?.detalhe.title ?? "");
  const [titleAlternativo, setTitleAlternativo] = useState(initialBannerDetails?.detalhe.titleAlternativo ?? "");
  const [textoAlternativo, setTextoAlternativo] = useState(initialBannerDetails?.detalhe.textoAlternativo ?? "");
  const [termosBusca, setTermosBusca] = useState(initialBannerDetails?.apresentacao?.termosBusca ?? "");

  const [ordemExibicao, setOrdemExibicao] = useState(String(initialBannerDetails?.detalhe.ordemExibicao ?? 1));
  const [abrirBannerNovaAba, setAbrirBannerNovaAba] = useState(
    initialBannerDetails?.detalhe.abrirBannerNovaAba ?? true,
  );

  const [diasExibicao, setDiasExibicao] = useState<BannerDiasExibicao>(
    initialBannerDetails?.detalhe.diasExibicao ?? createDefaultDiasExibicao(),
  );

  const [exibirNoSite, setExibirNoSite] = useState(initialBannerDetails?.apresentacao?.exibirNoSite ?? true);
  const [exibirEmTodasBuscas, setExibirEmTodasBuscas] = useState(
    initialBannerDetails?.apresentacao?.exibirEmTodasBuscas ?? false,
  );
  const [naoExibirEmBuscas, setNaoExibirEmBuscas] = useState(
    initialBannerDetails?.apresentacao?.naoExibirEmBuscas ?? true,
  );
  const [exibirEmTodasCategorias, setExibirEmTodasCategorias] = useState(
    initialBannerDetails?.apresentacao?.exibirEmTodasCategorias ?? false,
  );
  const [exibirEmTodosHotSites, setExibirEmTodosHotSites] = useState(
    initialBannerDetails?.apresentacao?.listaHotsites?.exibirEmTodosHotSites ?? false,
  );
  const [exibirEmTodosParceiros, setExibirEmTodosParceiros] = useState(
    initialBannerDetails?.apresentacao?.listaParceiros?.exibirEmTodosParceiros ?? false,
  );

  const [hotsitesIds, setHotsitesIds] = useState(
    initialBannerDetails?.apresentacao?.listaHotsites?.hotSites
      ?.map((item) => String(item.hotSiteId))
      .join(",") || String(hotsite?.hotsiteId ?? ""),
  );
  const [parceirosIds, setParceirosIds] = useState(
    initialBannerDetails?.apresentacao?.listaParceiros?.parceiros
      ?.map((item) => String(item.parceiroId))
      .join(",") || "",
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewFromBase64, setImagePreviewFromBase64] = useState(
    createPreviewDataUrl(
      initialBannerDetails?.detalhe.imagemBanner?.base64 ?? "",
      initialBannerDetails?.detalhe.imagemBanner?.formato,
    ),
  );
  const [pendingAction, setPendingAction] = useState<"save" | "publish" | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});

  const imagePreviewSource = useMemo(() => {
    if (imagePreviewFromBase64) {
      return imagePreviewFromBase64;
    }

    const normalizedUrl = urlBanner.trim();
    return normalizedUrl || "";
  }, [imagePreviewFromBase64, urlBanner]);

  const imagePreviewStyle = useMemo(() => {
    if (!imagePreviewSource) {
      return undefined;
    }

    const encodedSource = imagePreviewSource.replace(/'/g, "%27");

    return {
      backgroundImage: `url('${encodedSource}')`,
    };
  }, [imagePreviewSource]);

  const loadPositions = useCallback(async () => {
    try {
      const data = await getBannersPositions();
      setPositions(data);
      if (data.length > 0 && !positionId) {
        setPositionId(String(data[0].posicionamentoId));
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar os posicionamentos de banner.",
      );
    }
  }, [positionId]);

  useEffect(() => {
    void loadPositions();
  }, [loadPositions]);

  useEffect(() => {
    if (initialBannerDetails?.detalhe.posicionamentoId && !positionId) {
      setPositionId(String(initialBannerDetails.detalhe.posicionamentoId));
      return;
    }

    if (!initialBanner?.position || positions.length === 0 || positionId) {
      return;
    }

    const matchedPosition = positions.find((position) => position.descricao === initialBanner.position);

    if (matchedPosition) {
      setPositionId(String(matchedPosition.posicionamentoId));
    }
  }, [initialBanner?.position, initialBannerDetails?.detalhe.posicionamentoId, positionId, positions]);

  function validateFields() {
    const nextErrors: FormFieldErrors = {};
    const validationMessages: string[] = [];
    const hasImageSource = Boolean(selectedFile) || Boolean(imagePreviewFromBase64.trim());
    const useAllHotSites = exibirEmTodosHotSites;
    const useAllPartners = exibirEmTodosParceiros;

    if (!bannerName.trim()) {
      nextErrors.bannerName = true;
      validationMessages.push("Informe o nome do banner.");
    }
    if (!dataInicio.trim()) {
      nextErrors.dataInicio = true;
      validationMessages.push("Informe a data de inicio do banner.");
    }
    if (!positionId) {
      nextErrors.positionId = true;
      validationMessages.push("Selecione um posicionamento para o banner.");
    }
    if (!urlBanner.trim() && !hasImageSource) {
      nextErrors.urlBanner = true;
      validationMessages.push("Informe a URL principal do banner.");
    }
    if (!textoAlternativo.trim()) {
      nextErrors.textoAlternativo = true;
      validationMessages.push("Informe o texto alternativo do banner.");
    }

    const ordemExibicaoNumero = Number(ordemExibicao);
    if (!Number.isInteger(ordemExibicaoNumero) || ordemExibicaoNumero < 0) {
      nextErrors.ordemExibicao = true;
      validationMessages.push("Informe uma ordem de exibicao valida (numero inteiro maior ou igual a zero).");
    }

    const hotsitesIdsParsed = useAllHotSites ? [] : parseIdsList(hotsitesIds);
    if (!useAllHotSites && hotsitesIdsParsed.length === 0) {
      nextErrors.hotsitesIds = true;
      validationMessages.push("Informe ao menos um ID de hotsite valido.");
    }

    const parceirosIdsParsed = useAllPartners ? [] : parseIdsList(parceirosIds);

    if (!hasImageSource && !urlBanner.trim()) {
      nextErrors.selectedFile = true;
      validationMessages.push("Selecione uma imagem para o banner ou informe a URL principal.");
    }

    setFieldErrors(nextErrors);

    if (validationMessages.length > 0) {
      toast.error(validationMessages[0]);
      return null;
    }

    return {
      ordemExibicaoNumero,
      hotsitesIdsParsed,
      parceirosIdsParsed,
    };
  }

  async function submit(action: "save" | "publish") {
    const validation = validateFields();

    if (!validation) {
      return;
    }

    const { ordemExibicaoNumero, hotsitesIdsParsed, parceirosIdsParsed } = validation;
    setPendingAction(action);

    try {
      const detalhePayload: DetalhePayload = {
        posicionamentoId: Number(positionId),
        urlBanner,
        ordemExibicao: ordemExibicaoNumero,
        abrirBannerNovaAba,
        title,
        urlClique,
        urlBannerAlternativo: bannerUrl,
        titleAlternativo,
        diasExibicao,
        textoAlternativo,
      };

      if (!urlBanner.trim() && selectedFile) {
        const uploadedImage = await buildImagePayload(selectedFile);
        detalhePayload.imagemBanner = {
          nome: uploadedImage.nome.toLowerCase(),
          base64: uploadedImage.base64,
          formato: uploadedImage.formato.toLowerCase(),
        };
        detalhePayload.largura = uploadedImage.largura;
        detalhePayload.altura = uploadedImage.altura;
      }

      const listaParceirosFinal = parceirosIdsParsed.length > 0
        ? parceirosIdsParsed.map((parceiroId) => ({ parceiroId }))
        : [];

      const payload: UploadBannerOptions = {
        id: initialBannerDetails?.id,
        nome: bannerName,
        dataInicio,
        dataFim,
        ativo,
        detalhe: detalhePayload,
        apresentacao: {
          exibirNoSite,
          exibirEmTodasBuscas,
          naoExibirEmBuscas,
          termosBusca,
          listaHotsites: {
            exibirEmTodosHotSites,
            hotSites: hotsitesIdsParsed.map((hotSiteId) => ({ hotSiteId })),
          },
          exibirEmTodasCategorias,
          listaParceiros: {
            exibirEmTodosParceiros,
            parceiros: listaParceirosFinal,
          },
        },
      };

      const result = await submitBannerForReview(payload, {
        mode,
        publishDirectly: action === "publish",
      });

      if (result.mode === "published") {
        if (result.wakeBannerId) {
          window.location.href = `/cms/banner/edit/${result.wakeBannerId}`;
          return;
        }
        console.log({result})
        window.location.reload();
        return;
      }

      window.location.href = "/cms/approvals";
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nao foi possivel salvar a solicitacao de banner.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-6 rounded-xl border p-4">
      <div className="grid gap-2">
        <Label htmlFor="banner-nome">Nome do banner *</Label>
        <Input
          id="banner-nome"
          required
          className={cn(fieldErrors.bannerName && "border-destructive focus-visible:ring-destructive/40")}
          value={bannerName}
          onChange={(event) => {
            setBannerName(event.target.value);
            setFieldErrors((current) => ({ ...current, bannerName: false }));
          }}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="banner-data-inicio">Data de inicio *</Label>
          <Input
            id="banner-data-inicio"
            type="date"
            required
            className={cn(fieldErrors.dataInicio && "border-destructive focus-visible:ring-destructive/40")}
            value={dataInicio}
            onChange={(event) => {
              setDataInicio(event.target.value);
              setFieldErrors((current) => ({ ...current, dataInicio: false }));
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="banner-data-fim">Data de fim</Label>
          <Input
            id="banner-data-fim"
            type="date"
            className={cn(fieldErrors.dataFim && "border-destructive focus-visible:ring-destructive/40")}
            value={dataFim}
            onChange={(event) => {
              setDataFim(event.target.value);
              setFieldErrors((current) => ({ ...current, dataFim: false }));
            }}
          />
        </div>
        <div className="flex items-end">
          <div className="flex w-full items-center justify-between rounded-lg border p-3">
            <Label htmlFor="banner-ativo">Ativo</Label>
            <Switch id="banner-ativo" checked={ativo} onCheckedChange={setAtivo} />
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="banner-posicao">Posicionamento *</Label>
        <Select
          value={positionId}
          onValueChange={(value) => {
            setPositionId(value);
            setFieldErrors((current) => ({ ...current, positionId: false }));
          }}
        >
          <SelectTrigger
            id="banner-posicao"
            className={cn("w-[320px]", fieldErrors.positionId && "border-destructive focus:ring-destructive/40")}
          >
            <SelectValue placeholder="Selecione o posicionamento" />
          </SelectTrigger>
          <SelectContent>
            {positions.map((position) => (
              <SelectItem key={position.posicionamentoId} value={String(position.posicionamentoId)}>
                {position.descricao}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="banner-url-principal">URL principal do banner *</Label>
          <Input
            id="banner-url-principal"
            required={!selectedFile && !imagePreviewFromBase64.trim()}
            className={cn(fieldErrors.urlBanner && "border-destructive focus-visible:ring-destructive/40")}
            value={urlBanner}
            onChange={(event) => {
              const newValue = event.target.value;
              setUrlBanner(newValue);
              setFieldErrors((current) => ({ ...current, urlBanner: false }));
              if (newValue.trim()) {
                setSelectedFile(null);
                setImagePreviewFromBase64("");
              }
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="banner-url-clique">URL de clique</Label>
          <Input
            id="banner-url-clique"
            className={cn(fieldErrors.urlClique && "border-destructive focus-visible:ring-destructive/40")}
            value={urlClique}
            onChange={(event) => {
              setUrlClique(event.target.value);
              setFieldErrors((current) => ({ ...current, urlClique: false }));
            }}
          />
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="banner-url-alt">URL banner alternativo</Label>
          <Input
            id="banner-url-alt"
            className={cn(fieldErrors.bannerUrl && "border-destructive focus-visible:ring-destructive/40")}
            value={bannerUrl}
            onChange={(event) => {
              setBannerUrl(event.target.value);
              setFieldErrors((current) => ({ ...current, bannerUrl: false }));
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="banner-termos-busca">Termos de busca</Label>
          <Input
            id="banner-termos-busca"
            className={cn(fieldErrors.termosBusca && "border-destructive focus-visible:ring-destructive/40")}
            value={termosBusca}
            onChange={(event) => {
              setTermosBusca(event.target.value);
              setFieldErrors((current) => ({ ...current, termosBusca: false }));
            }}
          />
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="banner-title">Title</Label>
          <Input
            id="banner-title"
            className={cn(fieldErrors.title && "border-destructive focus-visible:ring-destructive/40")}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setFieldErrors((current) => ({ ...current, title: false }));
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="banner-title-alt">Title alternativo</Label>
          <Input
            id="banner-title-alt"
            className={cn(fieldErrors.titleAlternativo && "border-destructive focus-visible:ring-destructive/40")}
            value={titleAlternativo}
            onChange={(event) => {
              setTitleAlternativo(event.target.value);
              setFieldErrors((current) => ({ ...current, titleAlternativo: false }));
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="banner-ordem">Ordem de exibicao</Label>
          <Input
            id="banner-ordem"
            type="number"
            min={0}
            className={cn(fieldErrors.ordemExibicao && "border-destructive focus-visible:ring-destructive/40")}
            value={ordemExibicao}
            onChange={(event) => {
              setOrdemExibicao(event.target.value);
              setFieldErrors((current) => ({ ...current, ordemExibicao: false }));
            }}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="banner-alt">Texto alternativo *</Label>
        <Input
          id="banner-alt"
          required
          className={cn(fieldErrors.textoAlternativo && "border-destructive focus-visible:ring-destructive/40")}
          value={textoAlternativo}
          onChange={(event) => {
            setTextoAlternativo(event.target.value);
            setFieldErrors((current) => ({ ...current, textoAlternativo: false }));
          }}
        />
      </div>

      <div className="grid gap-3 rounded-lg border p-4">
        <h3 className="font-medium">Dias de exibicao</h3>
        <div className="grid gap-2 md:grid-cols-4">
          <div className="flex items-center justify-between rounded-md border p-2">
            <Label htmlFor="dias-todos">Todos os dias</Label>
            <Switch
              id="dias-todos"
              checked={diasExibicao.todosDias}
              onCheckedChange={(checked) => {
                setDiasExibicao({
                  todosDias: checked,
                  domingo: checked,
                  segunda: checked,
                  terca: checked,
                  quarta: checked,
                  quinta: checked,
                  sexta: checked,
                  sabado: checked,
                });
              }}
            />
          </div>
          {([
            ["domingo", "Domingo"],
            ["segunda", "Segunda"],
            ["terca", "Terca"],
            ["quarta", "Quarta"],
            ["quinta", "Quinta"],
            ["sexta", "Sexta"],
            ["sabado", "Sabado"],
          ] as Array<[keyof BannerDiasExibicao, string]>).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between rounded-md border p-2">
              <Label htmlFor={`dias-${key}`}>{label}</Label>
              <Switch
                id={`dias-${key}`}
                checked={diasExibicao[key]}
                onCheckedChange={(checked) => {
                  setDiasExibicao((current) => ({
                    ...current,
                    todosDias: false,
                    [key]: checked,
                  }));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="banner-hotsites-ids">IDs dos hotsites *</Label>
          <Input
            id="banner-hotsites-ids"
            required={!exibirEmTodosHotSites}
            className={cn(fieldErrors.hotsitesIds && "border-destructive focus-visible:ring-destructive/40")}
            value={hotsitesIds}
            onChange={(event) => {
              setHotsitesIds(event.target.value);
              setFieldErrors((current) => ({ ...current, hotsitesIds: false }));
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="banner-parceiros-ids">IDs dos parceiros</Label>
          <Input
            id="banner-parceiros-ids"
            className={cn(fieldErrors.parceirosIds && "border-destructive focus-visible:ring-destructive/40")}
            value={parceirosIds}
            onChange={(event) => {
              setParceirosIds(event.target.value);
              setFieldErrors((current) => ({ ...current, parceirosIds: false }));
            }}
          />
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="exibir-site">Exibir no site</Label>
          <Switch id="exibir-site" checked={exibirNoSite} onCheckedChange={setExibirNoSite} />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="exibir-buscas">Exibir em todas as buscas</Label>
          <Switch id="exibir-buscas" checked={exibirEmTodasBuscas} onCheckedChange={setExibirEmTodasBuscas} />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="nao-exibir-buscas">Nao exibir em buscas</Label>
          <Switch id="nao-exibir-buscas" checked={naoExibirEmBuscas} onCheckedChange={setNaoExibirEmBuscas} />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="exibir-categorias">Exibir em todas as categorias</Label>
          <Switch id="exibir-categorias" checked={exibirEmTodasCategorias} onCheckedChange={setExibirEmTodasCategorias} />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="exibir-todos-hotsites">Exibir em todos os hotsites</Label>
          <Switch id="exibir-todos-hotsites" checked={exibirEmTodosHotSites} onCheckedChange={setExibirEmTodosHotSites} />
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="exibir-todos-parceiros">Exibir em todos os parceiros</Label>
          <Switch id="exibir-todos-parceiros" checked={exibirEmTodosParceiros} onCheckedChange={setExibirEmTodosParceiros} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="banner-image">Imagem do banner</Label>
        {imagePreviewSource ? (
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="mb-2 text-xs text-muted-foreground">Preview</p>
            <div
              role="img"
              aria-label="Preview do banner"
              className="h-48 w-full rounded-md border bg-background bg-contain bg-center bg-no-repeat"
              style={imagePreviewStyle}
            />
          </div>
        ) : null}
        <Input
          id="banner-image"
          type="file"
          accept="image/*"
          className={cn(fieldErrors.selectedFile && "border-destructive focus-visible:ring-destructive/40")}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setSelectedFile(file);
            setFieldErrors((current) => ({ ...current, selectedFile: false }));

            if (!file) {
              setImagePreviewFromBase64("");
              return;
            }

            setUrlBanner("");
            setFieldErrors((current) => ({ ...current, urlBanner: false }));

            void readImageAsDataUrl(file)
              .then((dataUrl) => {
                setImagePreviewFromBase64(dataUrl);
              })
              .catch(() => {
                setImagePreviewFromBase64("");
              });
          }}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <Label htmlFor="banner-new-tab">Abrir em nova aba</Label>
        <Switch id="banner-new-tab" checked={abrirBannerNovaAba} onCheckedChange={setAbrirBannerNovaAba} />
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={() => submit("save")} disabled={pendingAction !== null}>
          {pendingAction === "save" ? "Salvando..." : "Salvar para aprovacao"}
        </Button>

        {canPublish ? (
          <ConfirmActionButton
            title="Publicar banner"
            description="Tem certeza? A publicacao do banner sera enviada para a Wake imediatamente."
            triggerLabel={pendingAction === "publish" ? "Publicando..." : "Publicar agora"}
            confirmLabel="Sim, publicar"
            successMessage="Banner publicado com sucesso."
            errorMessage="Nao foi possivel publicar o banner."
            disabled={pendingAction !== null}
            onConfirm={async () => {
              await submit("publish");
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
