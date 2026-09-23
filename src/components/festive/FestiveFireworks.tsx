"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { useSiteConfigStore } from "@/store/site-config-store";
import styles from "./FestiveFireworks.module.css";

const DURATION = 6000;

export function FestiveFireworks() {
  const config = useSiteConfigStore(state => state.siteConfig?.fireworks);
  const enabled = config?.enable === true || config?.enable === "true";
  const buttonText = config?.button_text?.trim() || "节日快乐";
  const message = config?.message?.trim() || buttonText;
  const pathname = usePathname();
  const [celebration, setCelebration] = useState<{ particles: number; path: string | null } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    setCelebration(null);
  }, []);

  useEffect(() => () => stop(), [enabled, pathname, stop]);

  useEffect(() => {
    if (!celebration) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") stop(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [celebration, stop]);

  if (!enabled) return null;
  const active = celebration?.path === pathname;
  const start = () => {
    if (active) { stop(); return; }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(pointer: coarse), (max-width: 768px)").matches;
    setCelebration({ particles: reducedMotion ? 0 : mobile ? 18 : 54, path: pathname });
    timer.current = setTimeout(stop, DURATION);
  };

  return (
    <>
      <button type="button" className={styles.trigger} onClick={start} aria-pressed={active}
        aria-label={active ? "停止烟花" : buttonText}>
        {active ? "停止烟花" : buttonText}
      </button>
      {active && celebration && (
        <div className={styles.overlay}>
          <p className={styles.message} role="status">{message}</p>
          <div aria-hidden="true">
            {Array.from({ length: celebration.particles }, (_, index) => {
              const angle = ((index % 18) / 18) * Math.PI * 2;
              const group = Math.floor(index / 18);
              const style = {
                "--burst-x": `${Math.cos(angle) * 130}px`,
                "--burst-y": `${Math.sin(angle) * 130}px`,
                "--burst-delay": `${group * 0.45}s`,
                "--burst-left": `${30 + group * 20}%`,
                "--burst-top": `${35 + (group % 2) * 20}%`,
                "--burst-color": ["#e9ad45", "#e76475", "#73b8db"][index % 3],
              } as CSSProperties;
              return <i key={index} data-firework-particle className={styles.particle} style={style} />;
            })}
          </div>
        </div>
      )}
    </>
  );
}
