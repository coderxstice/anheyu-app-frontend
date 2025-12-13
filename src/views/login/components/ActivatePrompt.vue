<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-19 01:35:46
 * @LastEditTime: 2025-06-19 01:37:40
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import MailSendLine from "@iconify-icons/ri/mail-send-line";
import ArrowLeftSLine from "@iconify-icons/ri/arrow-left-s-line";

defineProps({
  email: String
});
const emit = defineEmits(["goToLogin"]);

const icon = useRenderIcon(MailSendLine);
const backIcon = useRenderIcon(ArrowLeftSLine);
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold text-center text-[--anzhiyu-fontcolor]">
      最后一步
    </h2>
    <div class="flex flex-col items-center my-8 text-center">
      <component :is="icon" class="text-6xl text-gray-400" />
      <p class="mt-4 text-sm text-gray-600">
        一封激活邮件已经发送至您的邮箱
        <strong v-if="email" class="text-blue-600">{{ email }}</strong>
        <br />
        请访问邮件中的链接以继续完成注册。
      </p>
    </div>
    <div class="mt-6">
      <a
        href="#"
        class="flex items-center justify-center text-sm text-blue-600 hover:text-blue-500"
        @click.prevent="emit('goToLogin')"
      >
        <component :is="backIcon" class="mr-1" />
        返回登录
      </a>
    </div>
  </div>
</template>
