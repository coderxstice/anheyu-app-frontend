<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-18 14:09:35
 * @LastEditTime: 2025-06-18 14:09:40
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ArrowLeftSLine from "@iconify-icons/ri/arrow-left-s-line";

defineProps({ email: String });
defineEmits(["goToRegister", "goBack"]);

const iconMap = { back: useRenderIcon(ArrowLeftSLine) };
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold text-center text-[--anzhiyu-fontcolor]">
      登录你的账号
    </h2>
    <p class="mt-4 text-center text-[--anzhiyu-fontcolor]">
      你输入的账户
      <span class="font-medium text-[--anzhiyu-fontcolor]">{{ email }}</span>
      不存在，是否立即注册？
    </p>
    <div class="mt-6 space-y-4">
      <el-button class="w-full" type="primary" @click="$emit('goToRegister')"
        >注册账号</el-button
      >
      <a
        href="#"
        class="flex items-center justify-center text-sm text-blue-600 hover:text-blue-500"
        @click.prevent="$emit('goBack')"
      >
        <component :is="iconMap.back" class="mr-1" /> 上一步
      </a>
    </div>
  </div>
</template>
