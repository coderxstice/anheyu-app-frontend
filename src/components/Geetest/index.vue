<!--
 * @Description: 极验 GeeTest 4.0 人机验证组件
 * @Author: 安知鱼
 * @Date: 2026-01-20
-->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

// GeeTest 4.0 验证结果类型
interface GeetestResult {
  lot_number: string;
  captcha_output: string;
  pass_token: string;
  gen_time: string;
}

// GeeTest 4.0 实例类型
interface GeetestInstance {
  appendTo: (selector: string | HTMLElement) => GeetestInstance;
  getValidate: () => GeetestResult | false;
  reset: () => void;
  showCaptcha: () => void;
  onReady: (callback: () => void) => GeetestInstance;
  onSuccess: (callback: () => void) => GeetestInstance;
  onError: (callback: () => void) => GeetestInstance;
  onClose: (callback: () => void) => GeetestInstance;
  destroy: () => void;
}

// 声明全局 initGeetest4 函数
declare global {
  interface Window {
    initGeetest4: (
      config: {
        captchaId: string;
        product?: "float" | "bind" | "popup";
        language?: string;
      },
      callback: (captchaObj: GeetestInstance) => void
    ) => void;
  }
}

const props = defineProps({
  // 验证码 ID（从后端配置获取）
  captchaId: {
    type: String,
    default: ""
  },
  // 外部控制重置
  reset: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["verified", "error", "expired"]);

const siteConfigStore = useSiteConfigStore();

// 从站点配置或 props 获取 captchaId
const geetestCaptchaId = computed(() => {
  if (props.captchaId) return props.captchaId;
  const config = siteConfigStore.getSiteConfig;
  return config?.geetest?.captcha_id || config?.["geetest.captcha_id"] || "";
});

// 组件内部状态
const captchaInstance = ref<GeetestInstance | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const isLoading = ref(true);
const isReady = ref(false);
const result = ref<GeetestResult | null>(null);

// 加载 GeeTest 脚本
const loadGeetestScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 检查是否已加载
    if (window.initGeetest4) {
      resolve();
      return;
    }

    // 检查脚本标签是否已存在
    const existingScript = document.querySelector(
      'script[src*="static.geetest.com"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () =>
        reject(new Error("极验脚本加载失败"))
      );
      return;
    }

    // 创建并加载脚本
    const script = document.createElement("script");
    script.src = "https://static.geetest.com/v4/gt4.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("极验脚本加载失败"));
    document.head.appendChild(script);
  });
};

// 初始化极验
const initGeetest = async () => {
  if (!geetestCaptchaId.value) {
    isLoading.value = false;
    return;
  }

  try {
    await loadGeetestScript();

    // 等待 initGeetest4 可用
    await new Promise<void>(resolve => {
      const check = () => {
        if (window.initGeetest4) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });

    // 销毁旧实例
    if (captchaInstance.value) {
      try {
        captchaInstance.value.destroy();
      } catch {
        // 忽略
      }
      captchaInstance.value = null;
    }

    // 初始化新实例
    window.initGeetest4(
      {
        captchaId: geetestCaptchaId.value,
        product: "float"
      },
      (captchaObj: GeetestInstance) => {
        captchaInstance.value = captchaObj;

        captchaObj
          .onReady(() => {
            isReady.value = true;
            isLoading.value = false;
          })
          .onSuccess(() => {
            const validateResult = captchaObj.getValidate();
            if (validateResult) {
              result.value = validateResult;
              emit("verified", validateResult);
            }
          })
          .onError(() => {
            result.value = null;
            emit("error");
          })
          .onClose(() => {
            // 用户关闭验证码弹窗
          });

        // 渲染到容器
        if (containerRef.value) {
          captchaObj.appendTo(containerRef.value);
        }
      }
    );
  } catch (error) {
    console.error("极验初始化失败:", error);
    isLoading.value = false;
    emit("error");
  }
};

// 重置验证
const resetCaptcha = () => {
  if (captchaInstance.value) {
    captchaInstance.value.reset();
    result.value = null;
  }
};

// 获取验证结果
const getResult = () => result.value;

// 监听重置属性
watch(
  () => props.reset,
  newVal => {
    if (newVal) {
      resetCaptcha();
    }
  }
);

// 监听 captchaId 变化
watch(
  () => geetestCaptchaId.value,
  newVal => {
    if (newVal) {
      initGeetest();
    }
  }
);

onMounted(() => {
  if (geetestCaptchaId.value) {
    initGeetest();
  } else {
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  if (captchaInstance.value) {
    try {
      captchaInstance.value.destroy();
    } catch {
      // 忽略
    }
  }
});

// 暴露方法给父组件
defineExpose({
  reset: resetCaptcha,
  getResult
});
</script>

<template>
  <div v-if="geetestCaptchaId" class="geetest-wrapper">
    <div v-if="isLoading" class="geetest-loading">
      <span>正在加载人机验证...</span>
    </div>
    <div ref="containerRef" class="geetest-container" />
  </div>
</template>

<style scoped>
.geetest-wrapper {
  display: flex;
  justify-content: center;
  min-height: 44px;
  margin: 12px 0;
}

.geetest-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--anzhiyu-fontcolor);
  font-size: 14px;
  opacity: 0.7;
}

.geetest-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

/* 适配极验样式 */
:deep(.geetest_holder) {
  width: 100% !important;
  max-width: 100% !important;
}

:deep(.geetest_btn) {
  border-radius: 8px !important;
}
</style>
