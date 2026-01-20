<!--
 * @Description: 系统图形验证码组件
 * @Author: 安知鱼
 * @Date: 2026-01-20
-->
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";

// API 响应类型
interface ImageCaptchaResponse {
  code: number;
  message?: string;
  data: {
    captcha_id: string;
    image_base64: string;
  };
}

const props = defineProps({
  // 外部控制重置/刷新
  reset: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["verified", "error"]);

// 组件内部状态
const captchaId = ref<string>("");
const imageBase64 = ref<string>("");
const inputValue = ref<string>("");
const isLoading = ref(true);
const hasError = ref(false);

// 生成验证码
const generateCaptcha = async () => {
  isLoading.value = true;
  hasError.value = false;

  try {
    const res = await http.get<ImageCaptchaResponse, undefined>(
      baseUrlApi("public/captcha/image")
    );

    if (res.code === 200 && res.data) {
      captchaId.value = res.data.captcha_id;
      imageBase64.value = res.data.image_base64;
      inputValue.value = "";
    } else {
      throw new Error(res.message || "获取验证码失败");
    }
  } catch (error) {
    console.error("获取验证码失败:", error);
    hasError.value = true;
    emit("error");
  } finally {
    isLoading.value = false;
  }
};

// 刷新验证码
const refreshCaptcha = () => {
  generateCaptcha();
};

// 当用户输入时触发验证事件
const handleInput = () => {
  if (inputValue.value && captchaId.value) {
    emit("verified", {
      captchaId: captchaId.value,
      answer: inputValue.value
    });
  }
};

// 获取当前值
const getValue = () => ({
  captchaId: captchaId.value,
  answer: inputValue.value
});

// 重置组件
const resetCaptcha = () => {
  inputValue.value = "";
  generateCaptcha();
};

// 监听重置属性
watch(
  () => props.reset,
  newVal => {
    if (newVal) {
      resetCaptcha();
    }
  }
);

onMounted(() => {
  generateCaptcha();
});

// 暴露方法给父组件
defineExpose({
  reset: resetCaptcha,
  refresh: refreshCaptcha,
  getValue
});
</script>

<template>
  <div class="image-captcha-wrapper">
    <div class="captcha-container">
      <!-- 验证码图片 -->
      <div class="captcha-image-wrapper" @click="refreshCaptcha">
        <div v-if="isLoading" class="captcha-loading">
          <span>加载中...</span>
        </div>
        <div
          v-else-if="hasError"
          class="captcha-error"
          @click.stop="refreshCaptcha"
        >
          <span>加载失败，点击重试</span>
        </div>
        <img
          v-else
          :src="imageBase64"
          alt="验证码"
          class="captcha-image"
          title="点击刷新验证码"
        />
      </div>

      <!-- 刷新按钮 -->
      <button
        type="button"
        class="captcha-refresh-btn"
        title="刷新验证码"
        :disabled="isLoading"
        @click="refreshCaptcha"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :class="{ spinning: isLoading }"
        >
          <path
            d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
          />
        </svg>
      </button>
    </div>

    <!-- 验证码输入框 -->
    <div class="captcha-input-wrapper">
      <input
        v-model="inputValue"
        type="text"
        class="captcha-input"
        placeholder="请输入验证码"
        maxlength="10"
        autocomplete="off"
        @input="handleInput"
      />
    </div>
  </div>
</template>

<style scoped>
.image-captcha-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 12px 0;
}

.captcha-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.captcha-image-wrapper {
  flex: 1;
  height: 40px;
  min-width: 120px;
  max-width: 160px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: var(--anzhiyu-card-bg, #f5f5f5);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--anzhiyu-card-border, #e8e8e8);
  transition: border-color 0.2s;
}

.captcha-image-wrapper:hover {
  border-color: var(--anzhiyu-theme);
}

.captcha-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.captcha-loading,
.captcha-error {
  font-size: 12px;
  color: var(--anzhiyu-fontcolor);
  opacity: 0.7;
}

.captcha-error {
  color: var(--anzhiyu-red, #ff4d4f);
  cursor: pointer;
}

.captcha-refresh-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--anzhiyu-card-border, #e8e8e8);
  border-radius: 8px;
  background: var(--anzhiyu-card-bg, #f5f5f5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--anzhiyu-fontcolor);
  transition: all 0.2s;
}

.captcha-refresh-btn:hover {
  border-color: var(--anzhiyu-theme);
  color: var(--anzhiyu-theme);
}

.captcha-refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.captcha-refresh-btn svg.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.captcha-input-wrapper {
  width: 100%;
}

.captcha-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--anzhiyu-card-border, #e8e8e8);
  border-radius: 8px;
  background: var(--anzhiyu-card-bg, #fff);
  color: var(--anzhiyu-fontcolor);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.captcha-input:focus {
  border-color: var(--anzhiyu-theme);
}

.captcha-input::placeholder {
  color: var(--anzhiyu-fontcolor);
  opacity: 0.5;
}
</style>
