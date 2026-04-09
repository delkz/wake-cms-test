"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { HotsiteBanner } from "@/app/lib/cms-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type HotsiteBannerListProps = {
  banners: HotsiteBanner[];
  hotsiteId: string;
  workflowId?: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export default function HotsiteBannerList({
  banners,
  hotsiteId,
  workflowId,
  canCreate,
  canUpdate,
  canDelete,
}: HotsiteBannerListProps) {
  const [search, setSearch] = useState("");
  const [previewedBanners, setPreviewedBanners] = useState<Record<string, boolean>>({});
  const [positionFilter, setPositionFilter] = useState("all");

  const positions = useMemo(() => {
    return Array.from(
      new Set(banners.map((banner) => String(banner.position ?? "").trim()).filter(Boolean)),
    );
  }, [banners]);

  const filteredBanners = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return banners.filter((banner) => {
      const safeName = String(banner.bannerName ?? "");
      const safeUrl = String(banner.bannerUrl ?? "");
      const matchesSearch =
        !normalizedSearch ||
        safeName.toLowerCase().includes(normalizedSearch) ||
        safeUrl.toLowerCase().includes(normalizedSearch);
      const matchesPosition =
        positionFilter === "all" || String(banner.position ?? "").trim() === positionFilter;

      return matchesSearch && matchesPosition;
    });
  }, [banners, positionFilter, search]);

  function showPreview(bannerId: string) {
    setPreviewedBanners((current) => ({
      ...current,
      [bannerId]: true,
    }));
  }

  const baseQuery = workflowId
    ? `hotsiteId=${encodeURIComponent(hotsiteId)}&workflowId=${encodeURIComponent(workflowId)}`
    : `hotsiteId=${encodeURIComponent(hotsiteId)}`;

  return (
    <div>
      <div className="mt-4 mb-3 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Banners</h2>
        {canCreate ? (
          <Button type="button" variant="outline" asChild>
            <Link  href={`/cms/banner/create?${baseQuery}`}>Novo banner</Link>
          </Button>
        ) : null}
      </div>
      <div className="mb-3 flex gap-2">
        <Input
          name="buscaBanner"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar banner por nome ou URL"
        />
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-55">
            <SelectValue placeholder="Filtrar por posicao" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as posicoes</SelectItem>
            {positions.map((position) => (
              <SelectItem key={position} value={position}>
                {position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid mb-4 grid-cols-3 gap-4 max-h-[80dvh] overflow-y-auto">
        {filteredBanners.map((banner) => {
          const isPreviewVisible = previewedBanners[banner.bannerId] === true;

          return (
            <div
              key={banner.bannerId}
              className="rounded-lg border border-primary-foreground p-4 hover:border-primary flex flex-col items-start"
            >
              <h3 className="text-xl font-semibold">{banner.bannerName}</h3>
              <p className="text-sm font-light text-primary mb-3">{banner.position}</p>

              {banner.bannerUrl ? (
                isPreviewVisible ? (
                  <div className="overflow-hidden rounded-md border w-full">
                    <img
                      src={banner.bannerUrl}
                      alt={`Preview do banner ${banner.bannerName}`}
                      className="h-32 w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => showPreview(banner.bannerId)}
                    className="flex h-32 w-full items-center justify-center rounded-md border border-primary-foreground bg-primary-foreground text-sm font-medium text-foreground transition-colors"
                  >
                    Ver
                  </button>
                )
              ) : (
                <p className="text-sm text-muted-foreground">Sem preview disponivel para este banner.</p>
              )}

              <div className="mt-3 flex gap-2">
                {canUpdate ? (
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/cms/banner/edit/${banner.bannerId}?${baseQuery}`}>
                      Atualizar
                    </Link>
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled
                    title="Exclusao de banner ainda nao implementada."
                  >
                    Deletar
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
        {filteredBanners.length === 0 ? (
          <p>Nenhum banner encontrado para essa busca.</p>
        ) : null}
      </div>
    </div>
  );
}
