// Cloudflare Turnstile 类型定义
interface TurnstileOptions {
  sitekey: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  tabindex?: number;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
  action?: string;
  cData?: string;
  appearance?: "always" | "execute" | "interaction-only";
  "response-field"?: boolean;
  "response-field-name"?: string;
  retry?: "auto" | "never";
  "retry-interval"?: number;
  language?: string;
}

interface Turnstile {
  render: (
    container: string | HTMLElement,
    options: TurnstileOptions
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
  getResponse: (widgetId?: string) => string | undefined;
  isExpired: (widgetId?: string) => boolean;
  execute: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile: Turnstile;
  }
}

export {};
