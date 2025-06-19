<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-18 14:09:22
 * @LastEditTime: 2025-06-20 00:34:45
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { ref } from "vue";
import type { ElInput } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import MailFill from "@iconify-icons/ri/mail-fill";

defineProps({ loading: Boolean, email: String });
const emit = defineEmits(["submit", "goToRegister", "update:email"]);

const emailInputRef = ref<InstanceType<typeof ElInput>>();
const iconMap = { mail: useRenderIcon(MailFill) };

defineExpose({ focus: () => emailInputRef.value?.focus() });
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold text-center text-[--anzhiyu-fontcolor]">
      登录你的账号
    </h2>
    <div class="mt-6">
      <el-form-item prop="email">
        <el-input
          ref="emailInputRef"
          :model-value="email"
          placeholder="电子邮箱"
          :prefix-icon="iconMap.mail"
          autocomplete="username"
          @update:model-value="emit('update:email', $event)"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          v-ripple
          class="w-full overflow-hidden"
          type="primary"
          :loading="loading"
          @click="emit('submit')"
          >下一步
        </el-button>
      </el-form-item>
      <div class="mt-6 text-sm text-center">
        <span class="text-gray-600">还没有账号？</span>
        <a
          href="#"
          class="font-medium text-blue-600 hover:text-blue-500"
          @click.prevent="emit('goToRegister')"
          >立即注册</a
        >
      </div>
    </div>
  </div>
</template>
