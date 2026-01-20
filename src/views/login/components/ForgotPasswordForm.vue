<script setup lang="ts">
import { ref, computed } from "vue";
import type { ElInput } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import MailFill from "@iconify-icons/ri/mail-fill";
import ArrowLeftSLine from "@iconify-icons/ri/arrow-left-s-line";
import CaptchaVerify from "@/components/CaptchaVerify/index.vue";
import type { CaptchaParams } from "@/components/CaptchaVerify/index.vue";

defineProps({
  loading: Boolean, // 加载状态，用于控制按钮的 loading 效果
  email: String // 邮箱地址，通过 v-model 双向绑定
});

// 定义组件可以触发的事件
const emit = defineEmits([
  "submit", // 提交事件，用于触发父组件的发送重置邮件逻辑
  "back", // 返回事件，用于返回上一步
  "update:email" // v-model 绑定 email 的更新事件
]);

// 模板引用，用于获取邮箱输入框的实例，以便聚焦
const emailInputRef = ref<InstanceType<typeof ElInput>>();

// 人机验证相关
const captchaRef = ref<InstanceType<typeof CaptchaVerify>>();
const captchaParams = ref<CaptchaParams>({});

// 使用 ReIcon 钩子渲染图标
const iconMap = {
  mail: useRenderIcon(MailFill),
  back: useRenderIcon(ArrowLeftSLine)
};

// 判断是否启用了人机验证
const isCaptchaEnabled = computed(() => {
  return captchaRef.value?.isEnabled ?? false;
});

// 人机验证成功回调
const onCaptchaVerified = (params: CaptchaParams) => {
  captchaParams.value = params;
};

// 人机验证错误回调
const onCaptchaError = () => {
  captchaParams.value = {};
};

/**
 * 触发提交事件，并传递验证码数据给父组件
 */
const triggerSubmit = () => {
  emit("submit", {
    captchaParams: captchaParams.value,
    isCaptchaEnabled: isCaptchaEnabled.value,
    isVerified: captchaRef.value?.isVerified ?? true
  });
};

/**
 * 重置验证码
 */
const resetCaptcha = () => {
  captchaParams.value = {};
  captchaRef.value?.reset();
};

// 定义暴露给父组件的方法，以便父组件可以调用
defineExpose({
  focus: () => emailInputRef.value?.focus(), // 聚焦邮箱输入框
  refreshCaptcha: resetCaptcha, // 刷新验证码（兼容旧接口）
  triggerSubmit, // 触发提交
  getCaptchaParams: () => captchaParams.value
});
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold text-center text-[--anzhiyu-fontcolor]">
      忘记密码
    </h2>
    <p class="mt-2 text-sm text-center text-gray-500">
      请输入您的注册邮箱地址，我们将发送重置链接。
    </p>
    <div class="mt-6">
      <el-form-item prop="email">
        <el-input
          ref="emailInputRef"
          :model-value="email"
          placeholder="电子邮箱"
          :prefix-icon="iconMap.mail"
          autocomplete="email"
          @update:model-value="emit('update:email', $event)"
        />
      </el-form-item>

      <!-- 人机验证 -->
      <CaptchaVerify
        ref="captchaRef"
        @verified="onCaptchaVerified"
        @error="onCaptchaError"
      />

      <el-form-item class="mt-4">
        <el-button
          v-ripple
          class="w-full"
          type="primary"
          :loading="loading"
          @click="triggerSubmit"
        >
          发送重置邮件
        </el-button>
      </el-form-item>
      <div class="mt-4">
        <a
          href="#"
          class="flex items-center justify-center text-sm text-blue-600 hover:text-blue-500"
          @click.prevent="emit('back')"
        >
          <component :is="iconMap.back" class="mr-1" /> 返回登录
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 定义组件的局部样式 */
</style>
