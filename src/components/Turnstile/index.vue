<!--
 * @Description: Cloudflare Turnstile 人机验证组件
 * @Author: 安知鱼
 * @Date: 2026-01-12
-->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { storeToRefs } from "pinia";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

const props = defineProps({
  // 外部控制重置
  reset: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["verified", "error", "expired"]);

const siteConfigStore = useSiteConfigStore();
const { dataTheme } = useDataThemeChange();

// 从站点配置获取 Turnstile 配置
const turnstileConfig = computed(() => {
  const config = siteConfigStore.getSiteConfig;
  return {
    enabled: config?.["turnstile.enable"] === "true",
    siteKey: config?.["turnstile.site_key"] || ""
  };
});

// 组件内部状态
const widgetId = ref<string | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const isLoading = ref(true);
const token = ref<string>("");

// 主题映射
const turnstileTheme = computed(() => (dataTheme.value ? "dark" : "light"));

// 加载 Turnstile 脚本
const loadTurnstileScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 检查脚本是否已加载
    if (window.turnstile) {
      resolve();
      return;
    }

    // 检查脚本标签是否已存在
    const existingScript = document.querySelector(
      'script[src*="challenges.cloudflare.com/turnstile"]'
    );
    if (existingScript) {
      // 脚本正在加载中，等待它完成
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () =>
        reject(new Error("Turnstile 脚本加载失败"))
      );
      return;
    }

    // 创建并加载脚本
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile 脚本加载失败"));
    document.head.appendChild(script);
  });
};

// 渲染 Turnstile 小部件
const renderWidget = async () => {
  if (!turnstileConfig.value.enabled || !turnstileConfig.value.siteKey) {
    isLoading.value = false;
    return;
  }

  try {
    await loadTurnstileScript();

    // 等待 turnstile 对象可用
    await new Promise<void>(resolve => {
      const checkTurnstile = () => {
        if (window.turnstile) {
          resolve();
        } else {
          setTimeout(checkTurnstile, 100);
        }
      };
      checkTurnstile();
    });

    // 如果已有 widget，先移除
    if (widgetId.value && window.turnstile) {
      try {
        window.turnstile.remove(widgetId.value);
      } catch {
        // 忽略移除错误
      }
      widgetId.value = null;
    }

    // 确保容器存在
    if (!containerRef.value) {
      return;
    }

    // 渲染新的 widget
    widgetId.value = window.turnstile.render(containerRef.value, {
      sitekey: turnstileConfig.value.siteKey,
      theme: turnstileTheme.value,
      callback: (responseToken: string) => {
        token.value = responseToken;
        emit("verified", responseToken);
      },
      "error-callback": () => {
        token.value = "";
        emit("error");
      },
      "expired-callback": () => {
        token.value = "";
        emit("expired");
      }
    });

    isLoading.value = false;
  } catch (error) {
    console.error("Turnstile 初始化失败:", error);
    isLoading.value = false;
    emit("error");
  }
};

// 重置 widget
const resetWidget = () => {
  if (widgetId.value && window.turnstile) {
    window.turnstile.reset(widgetId.value);
    token.value = "";
  }
};

// 获取当前 token
const getToken = () => token.value;

// 监听重置属性
watch(
  () => props.reset,
  newVal => {
    if (newVal) {
      resetWidget();
    }
  }
);

// 监听主题变化，重新渲染 widget
watch(turnstileTheme, () => {
  if (turnstileConfig.value.enabled) {
    renderWidget();
  }
});

// 监听配置变化
watch(
  () => turnstileConfig.value.enabled,
  newVal => {
    if (newVal) {
      renderWidget();
    }
  }
);

onMounted(() => {
  if (turnstileConfig.value.enabled) {
    renderWidget();
  } else {
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  if (widgetId.value && window.turnstile) {
    try {
      window.turnstile.remove(widgetId.value);
    } catch {
      // 忽略移除错误
    }
  }
});

// 暴露方法给父组件
defineExpose({
  reset: resetWidget,
  getToken
});
</script>

<template>
  <div v-if="turnstileConfig.enabled" class="turnstile-wrapper">
    <div v-if="isLoading" class="turnstile-loading">
      <span>正在加载人机验证...</span>
    </div>
    <div ref="containerRef" class="turnstile-container" />
  </div>
</template>

<style scoped>
.turnstile-wrapper {
  display: flex;
  justify-content: center;
  min-height: 65px;
  margin: 12px 0;
}

.turnstile-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--anzhiyu-fontcolor);
  font-size: 14px;
  opacity: 0.7;
}

.turnstile-container {
  display: flex;
  justify-content: center;
}

/* 适配暗色模式 */
:deep(.cf-turnstile) {
  margin: 0 auto;
}
</style>
