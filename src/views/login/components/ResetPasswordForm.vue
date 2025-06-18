<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-18 14:10:12
 * @LastEditTime: 2025-06-18 14:10:17
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { ref } from "vue";
import type { ElInput } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import LockFill from "@iconify-icons/ri/lock-password-fill";

defineProps({ loading: Boolean, password: String, confirmPassword: String });
const emit = defineEmits([
  "submit",
  "goToLogin",
  "update:password",
  "update:confirmPassword"
]);

const passwordInputRef = ref<InstanceType<typeof ElInput>>();
const iconMap = { lock: useRenderIcon(LockFill) };

defineExpose({ focus: () => passwordInputRef.value?.focus() });
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold text-center text-gray-800">重设密码</h2>
    <div class="mt-6">
      <el-form-item prop="password">
        <el-input
          ref="passwordInputRef"
          :model-value="password"
          type="password"
          show-password
          placeholder="新密码"
          :prefix-icon="iconMap.lock"
          @update:model-value="emit('update:password', $event)"
        />
      </el-form-item>
      <el-form-item prop="confirmPassword">
        <el-input
          :model-value="confirmPassword"
          type="password"
          show-password
          placeholder="重复新密码"
          :prefix-icon="iconMap.lock"
          @update:model-value="emit('update:confirmPassword', $event)"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          class="w-full"
          type="primary"
          :loading="loading"
          @click="emit('submit')"
          >重设密码</el-button
        >
      </el-form-item>
      <div class="mt-6 text-sm text-center">
        <span class="text-gray-600">已有账号？</span>
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
