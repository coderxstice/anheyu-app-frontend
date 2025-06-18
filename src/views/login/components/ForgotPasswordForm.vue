<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { ElInput } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import MailFill from "@iconify-icons/ri/mail-fill";
import ShieldKeyholeLine from "@iconify-icons/ri/shield-keyhole-line";
import ArrowLeftSLine from "@iconify-icons/ri/arrow-left-s-line";

defineProps({ loading: Boolean, email: String });
const emit = defineEmits(["submit", "back", "update:email"]);

const emailInputRef = ref<InstanceType<typeof ElInput>>();
const captchaInput = ref("");
const captchaCode = ref("");
const captchaCanvasRef = ref<HTMLCanvasElement | null>(null);
const iconMap = {
  mail: useRenderIcon(MailFill),
  captcha: useRenderIcon(ShieldKeyholeLine),
  back: useRenderIcon(ArrowLeftSLine)
};

const generateCaptcha = () => {
  /* ... */
}; // 省略具体实现，与之前相同
const drawCaptcha = () => {
  /* ... */
}; // 省略具体实现，与之前相同
const refreshCaptcha = () => {
  generateCaptcha();
  drawCaptcha();
};

const triggerSubmit = () => {
  emit("submit", {
    captcha: captchaInput.value,
    captchaCode: captchaCode.value
  });
};

defineExpose({
  focus: () => emailInputRef.value?.focus(),
  refreshCaptcha,
  triggerSubmit
});

onMounted(refreshCaptcha);
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold text-center text-gray-800">忘记密码</h2>
    <div class="mt-6">
      <el-form-item prop="email">
        <el-input
          ref="emailInputRef"
          :model-value="email"
          placeholder="请输入注册时使用的电子邮箱"
          :prefix-icon="iconMap.mail"
          @update:model-value="emit('update:email', $event)"
        />
      </el-form-item>
      <el-form-item prop="captcha">
        <div class="flex w-full space-x-2">
          <el-input
            v-model="captchaInput"
            placeholder="验证码"
            :prefix-icon="iconMap.captcha"
          />
          <canvas
            ref="captchaCanvasRef"
            class="border rounded-md cursor-pointer w-28"
            width="100"
            height="40"
            title="点击刷新"
            @click="refreshCaptcha"
          />
        </div>
      </el-form-item>
      <el-form-item>
        <el-button
          class="w-full"
          type="primary"
          :loading="loading"
          @click="triggerSubmit"
        >
          发送密码重置邮件
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
