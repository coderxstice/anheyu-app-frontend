"use client";

import { useState } from "react";
import type { EquipmentItem } from "./types";

interface EquipmentCardProps {
  item: EquipmentItem;
}

export function EquipmentCard({ item }: EquipmentCardProps) {
  const [imgError, setImgError] = useState(false);

  const Wrapper = item.link ? "a" : "div";
  const wrapperProps = item.link ? { href: item.link, target: "_blank" as const, rel: "noopener noreferrer" } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group flex gap-4 rounded-xl border border-(--style-border-color) bg-(--anzhiyu-card-bg) p-4 transition-all duration-300 hover:shadow-(--anzhiyu-shadow-border) hover:border-(--anzhiyu-theme-op)"
    >
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-(--anzhiyu-card-bg-grey)">
        {item.image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-2xl text-(--anzhiyu-secondtext)">{item.name.charAt(0) || "?"}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="truncate text-sm font-semibold text-(--anzhiyu-fontcolor)">{item.name}</h3>
          {item.specification && (
            <span className="shrink-0 text-xs text-(--anzhiyu-secondtext)">{item.specification}</span>
          )}
        </div>
        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-(--anzhiyu-secondtext)">{item.description}</p>
        )}
      </div>
    </Wrapper>
  );
}
