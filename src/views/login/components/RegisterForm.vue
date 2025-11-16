<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-18 14:09:50
 * @LastEditTime: 2025-10-06 23:32:31
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { ref } from "vue";
import type { ElInput } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import MailFill from "@iconify-icons/ri/mail-fill";
import LockFill from "@iconify-icons/ri/lock-password-fill";
import UserFill from "@iconify-icons/ri/user-fill";

defineProps({
  loading: Boolean,
  email: String,
  nickname: String,
  password: String,
  confirmPassword: String
});
const emit = defineEmits([
  "submit",
  "goToLogin",
  "update:email",
  "update:nickname",
  "update:password",
  "update:confirmPassword"
]);

const emailInputRef = ref<InstanceType<typeof ElInput>>();
const nicknameInputRef = ref<InstanceType<typeof ElInput>>();
const passwordInputRef = ref<InstanceType<typeof ElInput>>();
const iconMap = {
  mail: useRenderIcon(MailFill),
  user: useRenderIcon(UserFill),
  lock: useRenderIcon(LockFill)
};

const focus = (isEmailPrefilled: boolean) => {
  isEmailPrefilled
    ? nicknameInputRef.value?.focus()
    : emailInputRef.value?.focus();
};

defineExpose({ focus });
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold text-center">创建新账号</h2>
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
      <el-form-item prop="nickname">
        <el-input
          ref="nicknameInputRef"
          :model-value="nickname"
          placeholder="昵称"
          :prefix-icon="iconMap.user"
          autocomplete="nickname"
          @update:model-value="emit('update:nickname', $event)"
        />
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          ref="passwordInputRef"
          :model-value="password"
          type="password"
          show-password
          placeholder="密码"
          :prefix-icon="iconMap.lock"
          autocomplete="new-password"
          @update:model-value="emit('update:password', $event)"
        />
      </el-form-item>
      <el-form-item prop="confirmPassword">
        <el-input
          :model-value="confirmPassword"
          type="password"
          show-password
          placeholder="重复密码"
          :prefix-icon="iconMap.lock"
          autocomplete="new-password"
          @update:model-value="emit('update:confirmPassword', $event)"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          v-ripple
          class="w-full"
          type="primary"
          :loading="loading"
          @click="emit('submit')"
          >注册</el-button
        >
      </el-form-item>
      <div class="text-sm text-center">
        <span class="text-[--anzhiyu-secondtext]">已有账号？</span>
        <a
          href="#"
          class="font-medium text-blue-600 hover:text-blue-500"
          @click.prevent="emit('goToLogin')"
          >立即登录</a
        >
      </div>
    </div>
  </div>
</template>
