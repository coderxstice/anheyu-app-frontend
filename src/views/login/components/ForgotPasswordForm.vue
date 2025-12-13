<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { ElInput } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import MailFill from "@iconify-icons/ri/mail-fill";
import ShieldKeyholeLine from "@iconify-icons/ri/shield-keyhole-line";
import ArrowLeftSLine from "@iconify-icons/ri/arrow-left-s-line";

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
// 验证码输入框的值
const captchaInput = ref("");
// 生成的验证码值
const captchaCode = ref("");
// 验证码 canvas 元素的引用
const captchaCanvasRef = ref<HTMLCanvasElement | null>(null);

// 使用 ReIcon 钩子渲染图标
const iconMap = {
  mail: useRenderIcon(MailFill),
  captcha: useRenderIcon(ShieldKeyholeLine),
  back: useRenderIcon(ArrowLeftSLine)
};

/**
 * 生成随机的四位验证码
 */
const generateCaptcha = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 验证码字符集
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  captchaCode.value = result; // 更新验证码值
};

/**
 * 在 canvas 上绘制验证码
 */
const drawCaptcha = () => {
  const canvas = captchaCanvasRef.value;
  if (!canvas) return; // 如果 canvas 元素不存在，则返回
  const ctx = canvas.getContext("2d");
  if (!ctx) return; // 如果无法获取 2D 上下文，则返回

  ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除画布
  ctx.fillStyle = "#f3f4f6"; // 设置背景色
  ctx.fillRect(0, 0, canvas.width, canvas.height); // 填充背景
  ctx.font = "bold 28px Arial"; // 设置字体
  ctx.fillStyle = "#333"; // 设置字体颜色
  ctx.textBaseline = "middle"; // 设置文本基线
  ctx.textAlign = "center"; // 设置文本对齐方式

  // 逐个绘制验证码字符
  for (let i = 0; i < captchaCode.value.length; i++) {
    const char = captchaCode.value[i];
    // 计算字符位置
    const x = (canvas.width / (captchaCode.value.length + 1)) * (i + 1);
    const y = canvas.height / 2;
    // 随机旋转角度
    const angle = Math.random() * 0.5 - 0.25;
    ctx.translate(x, y); // 移动画布原点
    ctx.rotate(angle); // 旋转画布
    ctx.fillText(char, 0, 0); // 绘制字符
    ctx.rotate(-angle); // 恢复画布旋转
    ctx.translate(-x, -y); // 恢复画布原点
  }
};

/**
 * 刷新验证码，重新生成并绘制
 */
const refreshCaptcha = () => {
  generateCaptcha(); // 生成新验证码
  drawCaptcha(); // 绘制新验证码
};

/**
 * 触发提交事件，并传递验证码数据给父组件
 */
const triggerSubmit = () => {
  // 确保在触发 submit 事件时传递正确的载荷
  emit("submit", {
    captcha: captchaInput.value, // 用户输入的验证码
    captchaCode: captchaCode.value // 生成的正确验证码
  });
};

// 定义暴露给父组件的方法，以便父组件可以调用
defineExpose({
  focus: () => emailInputRef.value?.focus(), // 聚焦邮箱输入框
  refreshCaptcha, // 刷新验证码
  triggerSubmit // 触发提交
});

// 组件挂载后立即刷新验证码
onMounted(refreshCaptcha);
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

      <el-form-item class="mt-4">
        <div class="flex w-full space-x-2">
          <el-input
            v-model="captchaInput"
            placeholder="验证码"
            :prefix-icon="iconMap.captcha"
            class="flex-1"
            maxlength="4"
          />
          <canvas
            ref="captchaCanvasRef"
            width="100"
            height="40"
            class="rounded cursor-pointer"
            @click="refreshCaptcha"
          />
        </div>
      </el-form-item>

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
