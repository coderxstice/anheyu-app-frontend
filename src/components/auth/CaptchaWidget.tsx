"use client";

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { RefreshCw } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { cn } from "@/lib/utils";
import type { CaptchaConfig } from "@/types/auth";

export interface CaptchaResult {
  turnstile_token?: string;
  geetest_lot_number?: string;
  geetest_captcha_output?: string;
  geetest_pass_token?: string;
  geetest_gen_time?: string;
  image_captcha_id?: string;
  image_captcha_answer?: string;
}

export interface CaptchaWidgetRef {
  getCaptchaParams: () => CaptchaResult;
  refresh: () => void;
  isReady: () => boolean;
}

interface CaptchaWidgetProps {
  className?: string;
}

export const CaptchaWidget = forwardRef<CaptchaWidgetRef, CaptchaWidgetProps>(function CaptchaWidget(
  { className },
  ref
) {
  const [config, setConfig] = useState<CaptchaConfig | null>(null);
  const [imageData, setImageData] = useState<{ id: string; base64: string } | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authApi.getCaptchaConfig().then(res => {
      if (!cancelled && res.code === 200 && res.data) {
        setConfig(res.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchImage = useCallback(async () => {
    setLoading(true);
    setAnswer("");
    try {
      const res = await authApi.generateImageCaptcha();
      if (res.code === 200 && res.data) {
        setImageData({ id: res.data.captcha_id, base64: res.data.image_base64 });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (config?.provider === "image") {
      fetchImage();
    }
  }, [config?.provider, fetchImage]);

  useImperativeHandle(
    ref,
    () => ({
      getCaptchaParams(): CaptchaResult {
        if (!config || config.provider === "none") return {};
        if (config.provider === "image") {
          return { image_captcha_id: imageData?.id, image_captcha_answer: answer };
        }
        return {};
      },
      refresh() {
        if (config?.provider === "image") fetchImage();
      },
      isReady() {
        if (!config || config.provider === "none") return true;
        if (config.provider === "image") return !!(imageData?.id && answer.trim());
        return true;
      },
    }),
    [config, imageData, answer, fetchImage]
  );

  if (!config || config.provider === "none") return null;

  if (config.provider === "image") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0 overflow-hidden rounded-lg border border-border bg-muted/30">
            {loading ? (
              <div className="flex h-[40px] w-[120px] items-center justify-center">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : imageData ? (
              /* eslint-disable-next-line @next/next/no-img-element -- base64 captcha, not suitable for next/image */
              <img
                src={imageData.base64}
                alt="验证码"
                className="h-[40px] w-[120px] object-contain dark:invert dark:hue-rotate-180"
                draggable={false}
              />
            ) : (
              <div className="flex h-[40px] w-[120px] items-center justify-center text-xs text-muted-foreground">
                加载失败
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={fetchImage}
            disabled={loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 cursor-pointer"
            title="刷新验证码"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          <input
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="请输入验证码"
            maxLength={config.image_captcha_length || 6}
            autoComplete="one-time-code"
            className={cn(
              "h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground",
              "placeholder:text-muted-foreground/60",
              "outline-none transition-all duration-200",
              "focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
            )}
          />
        </div>
      </div>
    );
  }

  return null;
});
