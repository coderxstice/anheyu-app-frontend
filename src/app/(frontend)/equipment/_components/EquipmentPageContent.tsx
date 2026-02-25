"use client";

import { useMemo } from "react";
import { useSiteConfigStore } from "@/store/site-config-store";
import { Spinner } from "@/components/ui";
import { BannerCard } from "@/components/common/BannerCard";
import { EquipmentCard } from "./EquipmentCard";
import type { EquipmentCategory } from "./types";

function parseEquipmentList(raw: unknown): EquipmentCategory[] {
  if (!raw) return [];
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(data)) return [];
    return data
      .map((category: Record<string, unknown>) => ({
        title: String(category.title ?? category.name ?? ""),
        description: String(category.description ?? ""),
        equipment_list: (Array.isArray(category.equipment_list)
          ? category.equipment_list
          : Array.isArray(category.items)
          ? category.items
          : []
        ).map((item: Record<string, unknown>) => ({
          name: String(item.name ?? ""),
          image: String(item.image ?? ""),
          link: String(item.link ?? ""),
          description: String(item.description ?? ""),
          specification: String(item.specification ?? ""),
        })),
      }))
      .filter((c: EquipmentCategory) => c.title || c.equipment_list.length > 0);
  } catch {
    return [];
  }
}

export function EquipmentPageContent() {
  const siteConfig = useSiteConfigStore(state => state.siteConfig);
  const isLoaded = useSiteConfigStore(state => state.isLoaded);

  const bannerConfig = siteConfig?.equipment?.banner;

  const categories = useMemo(() => parseEquipmentList(siteConfig?.equipment?.list), [siteConfig?.equipment?.list]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <BannerCard
        tips={bannerConfig?.title || "我的装备"}
        title={bannerConfig?.description || "Equipment"}
        description={bannerConfig?.tip}
        backgroundImage={bannerConfig?.background}
        height={300}
      />

      {categories.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center py-16 text-center">
          <p className="text-(--anzhiyu-secondtext)">暂无装备数据</p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {categories.map((category, idx) => (
            <section key={`${category.title}-${idx}`}>
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-(--anzhiyu-fontcolor)">{category.title}</h2>
                {category.description && (
                  <p className="mt-1 text-sm text-(--anzhiyu-secondtext)">{category.description}</p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.equipment_list.map((item, itemIdx) => (
                  <EquipmentCard key={`${item.name}-${itemIdx}`} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
