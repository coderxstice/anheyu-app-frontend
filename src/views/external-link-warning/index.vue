<!--
 * @Description: 外链跳转提示页面
 * @Author: 安知鱼
 * @Date: 2025-11-18
-->
<template>
  <div class="external-link-page">
    <div class="warning-card">
      <div class="icon-wrapper">
        <i class="anzhiyu-icon-link anzhiyufont" />
      </div>

      <h2 class="title">外部链接提示</h2>

      <p class="description">您即将离开本站并访问外部链接</p>

      <div class="link-display">
        <i class="anzhiyufont anzhiyu-icon-link link-icon" />
        <span class="link-text">{{ targetUrl }}</span>
      </div>

      <div class="warning-tips">
        <i class="anzhiyufont anzhiyu-icon-warning-one tip-icon" />
        <span class="tip-text">请注意验证链接的安全性，谨防钓鱼网站</span>
      </div>

      <div v-if="countdown > 0" class="countdown-tip">
        <i class="anzhiyufont anzhiyu-icon-time" />
        <span>{{ countdown }} 秒后自动跳转</span>
      </div>

      <div class="action-buttons">
        <button class="btn btn-secondary" @click="handleCancel">
          <i class="anzhiyufont anzhiyu-icon-left" />
          返回
        </button>
        <button class="btn btn-primary" @click="handleContinue">
          继续访问
          <i class="anzhiyufont anzhiyu-icon-right" />
        </button>
      </div>

      <div class="remember-option">
        <label class="checkbox-label">
          <input
            v-model="rememberChoice"
            type="checkbox"
            class="checkbox-input"
          />
          <span class="checkbox-text">本次会话不再提示</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const targetUrl = ref("");
const countdown = ref(5);
const rememberChoice = ref(false);
let countdownTimer: number | null = null;

onMounted(() => {
  const url = route.query.url as string;
  if (url) {
    targetUrl.value = decodeURIComponent(url);
    startCountdown();
  } else {
    router.push("/");
  }
});

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});

const startCountdown = () => {
  countdownTimer = window.setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
      handleContinue();
    }
  }, 1000);
};

const handleCancel = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push("/");
  }
};

const handleContinue = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  if (rememberChoice.value) {
    sessionStorage.setItem("skip-external-link-warning", "true");
  }
  if (targetUrl.value) {
    window.location.href = targetUrl.value;
  }
};
</script>

<style lang="scss" scoped>
.external-link-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: var(--anzhiyu-background);
}

.warning-card {
  width: 100%;
  max-width: 560px;
  padding: 2.5rem 2rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  animation: slideUp 0.4s ease-out;

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;

  .anzhiyu-icon-link {
    font-size: 48px;
    color: var(--anzhiyu-main);
  }
}

.title {
  margin: 0 0 0.75rem;
  font-size: 24px;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
  text-align: center;

  @media (max-width: 768px) {
    font-size: 20px;
  }
}

.description {
  margin: 0 0 1.5rem;
  font-size: 14px;
  color: var(--anzhiyu-secondtext);
  text-align: center;
  opacity: 0.8;
}

.link-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  background: var(--anzhiyu-secondbg);
  border-radius: 8px;
  overflow: hidden;

  .link-icon {
    flex-shrink: 0;
    font-size: 18px;
    color: var(--anzhiyu-main);
  }

  .link-text {
    flex: 1;
    font-size: 14px;
    color: var(--anzhiyu-fontcolor);
    word-break: break-all;
    line-height: 1.6;
  }
}

.warning-tips {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  background: var(--anzhiyu-yellow-op);
  border-radius: 8px;

  .tip-icon {
    flex-shrink: 0;
    font-size: 18px;
    color: var(--anzhiyu-yellow);
    margin-top: 2px;
  }

  .tip-text {
    flex: 1;
    font-size: 13px;
    color: var(--anzhiyu-fontcolor);
    line-height: 1.6;
  }
}

.countdown-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  font-size: 14px;
  color: var(--anzhiyu-white);
  background: var(--anzhiyu-main-op-deep);
  border-radius: 8px;
  animation: pulse 1s ease-in-out infinite;

  i {
    font-size: 16px;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  i {
    font-size: 14px;
  }

  &:active {
    transform: scale(0.98);
  }
}

.btn-secondary {
  background: var(--anzhiyu-secondbg);
  color: var(--anzhiyu-fontcolor);

  &:hover {
    background: var(--anzhiyu-secondbg-hover);
  }
}

.btn-primary {
  background: var(--anzhiyu-main);
  color: #fff;

  &:hover {
    background: var(--anzhiyu-main-op);
    opacity: 0.9;
  }
}

.remember-option {
  padding-top: 1.5rem;
  border-top: 1px solid var(--anzhiyu-card-border);
  text-align: center;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;

  &:hover .checkbox-text {
    color: var(--anzhiyu-main);
  }
}

.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--anzhiyu-main);
  margin: 0 !important;
  transform: none !important;
}

.checkbox-text {
  font-size: 13px;
  color: var(--anzhiyu-secondtext);
  transition: color 0.3s ease;
}
</style>
