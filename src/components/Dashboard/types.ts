/**
 * Dashboard 组件类型定义
 */
import type { Component } from "vue";

export interface AnalysisOverviewItem {
  icon: Component | string;
  title: string;
  totalTitle: string;
  totalValue: number;
  value: number;
  format?: "number" | "percent" | "duration";
  totalFormat?: "number" | "percent" | "duration";
  change?: {
    type: "positive" | "negative" | "neutral";
    text: string;
  };
}

export interface TabOption {
  label: string;
  value: string;
}
