<script setup lang="ts">
import { ref, reactive, nextTick } from "vue";
import type { FormInstance, FormRules } from "element-plus";

import MailFill from "@iconify-icons/ri/mail-fill";
import LockFill from "@iconify-icons/ri/lock-password-fill";
import ArrowLeftSLine from "@iconify-icons/ri/arrow-left-s-line";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { message } from "@/utils/message";

defineOptions({ name: "Login" });

type Step =
  | "check-email"
  | "login-password"
  | "register-prompt"
  | "register-form";

const step = ref<Step>("check-email");
const loading = ref(false);
const transitionName = ref("slide-next");

const formRef = ref<FormInstance>();
const formContentRef = ref<HTMLDivElement>();

const form = reactive({
  email: "",
  password: "",
  confirmPassword: ""
});

const rules: FormRules = {
  email: [
    { required: true, message: "请输入电子邮箱", trigger: "blur" },
    {
      type: "email",
      message: "请输入有效的电子邮箱地址",
      trigger: ["blur", "change"]
    }
  ],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  confirmPassword: [
    { required: true, message: "请再次输入密码", trigger: "blur" },
    {
      validator: (_, value, callback) => {
        value !== form.password
          ? callback(new Error("两次密码不一致"))
          : callback();
      },
      trigger: "blur"
    }
  ]
};

const iconMap = {
  mail: useRenderIcon(MailFill),
  lock: useRenderIcon(LockFill),
  back: useRenderIcon(ArrowLeftSLine)
};

// 统一切换页面并清空密码相关字段
const switchStep = (targetStep: Step, direction: "next" | "prev" = "next") => {
  transitionName.value = direction === "next" ? "slide-next" : "slide-prev";
  step.value = targetStep;
  form.password = "";
  form.confirmPassword = "";
  nextTick(() => formRef.value?.clearValidate());
};

// 表单校验 + 加载中统一处理
const handleSubmit = async (
  validateFn: () => Promise<boolean>,
  submitFn: () => Promise<void>
) => {
  const valid = await validateFn();
  if (!valid) return;
  loading.value = true;
  try {
    await submitFn();
  } catch (err: any) {
    message(err?.message || "操作失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const checkEmailExists = async (email: string): Promise<boolean> => {
  const mockEmails = ["me@anheyu.com", "anzhiyu-c@qq.com"];
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockEmails.includes(email);
};

const apiLogin = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  message("登录成功", { type: "success" });
};

const apiRegister = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  message("注册成功，已自动登录", { type: "success" });
};

// 下一步逻辑
const handleNextStep = async () => {
  await handleSubmit(
    () => formRef.value?.validateField("email"),
    async () => {
      const exists = await checkEmailExists(form.email);
      switchStep(exists ? "login-password" : "register-prompt", "next");
    }
  );
};

const handleLogin = async () => {
  await handleSubmit(() => formRef.value!.validate(), apiLogin);
};

const handleRegister = async () => {
  await handleSubmit(() => formRef.value!.validate(), apiRegister);
};


</script>

<template>
  <div class="flex items-center justify-center w-full min-h-screen bg-gray-50">
    <div
      class="w-full max-w-sm p-8 space-y-6 bg-white border border-gray-200 rounded-xl shadow-sm"
    >
      <div class="flex justify-center">
        <img src="" />
        <span class="ml-2 text-2xl font-bold">ANZHIYU</span>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" size="large">
        <div
          class="relative overflow-hidden transition-[height] duration-300 ease-in-out"
        >
          <transition :name="transitionName" mode="out-in">
            <div :key="step" ref="formContentRef">
              <!-- 输入邮箱 -->
              <div v-if="step === 'check-email'">
                <h2 class="text-xl font-semibold text-center text-gray-800">
                  登录你的账号
                </h2>
                <div class="mt-6">
                  <el-form-item prop="email">
                    <el-input
                      v-model="form.email"
                      placeholder="电子邮箱"
                      :prefix-icon="iconMap.mail"
                      @keyup.enter="handleNextStep"
                    />
                  </el-form-item>
                  <el-form-item>
                    <el-button
                      class="w-full"
                      type="primary"
                      :loading="loading"
                      @click="handleNextStep"
                      >下一步</el-button
                    >
                  </el-form-item>
                  <div class="mt-6 text-sm text-center">
                    <span class="text-gray-600">还没有账号？</span>
                    <a
                      href="#"
                      class="font-medium text-blue-600 hover:text-blue-500"
                      @click.prevent="switchStep('register-form', 'next')"
                      >立即注册</a
                    >
                  </div>
                </div>
              </div>

              <!-- 输入密码 -->
              <div v-else-if="step === 'login-password'">
                <h2 class="text-xl font-semibold text-center text-gray-800">
                  请输入密码
                </h2>
                <p class="mt-2 text-sm text-center text-gray-500">
                  请输入账号 {{ form.email }} 的密码
                </p>
                <div class="mt-6">
                  <el-form-item prop="password">
                    <el-input
                      v-model="form.password"
                      type="password"
                      show-password
                      placeholder="密码"
                      :prefix-icon="iconMap.lock"
                      @keyup.enter="handleLogin"
                    />
                  </el-form-item>
                  <div class="text-sm text-right">
                    <a href="#" class="text-blue-600 hover:text-blue-500"
                      >忘记密码？</a
                    >
                  </div>
                  <el-form-item class="mt-4">
                    <el-button
                      class="w-full"
                      type="primary"
                      :loading="loading"
                      @click="handleLogin"
                      >登录</el-button
                    >
                  </el-form-item>
                  <div class="mt-4">
                    <a
                      href="#"
                      class="flex items-center justify-center text-sm text-blue-600 hover:text-blue-500"
                      @click.prevent="switchStep('check-email', 'prev')"
                    >
                      <component :is="iconMap.back" class="mr-1" /> 上一步
                    </a>
                  </div>
                </div>
              </div>

              <!-- 注册提示 -->
              <div v-else-if="step === 'register-prompt'">
                <h2 class="text-xl font-semibold text-center text-gray-800">
                  登录你的账号
                </h2>
                <p class="mt-4 text-center text-gray-600">
                  你输入的账户
                  <span class="font-medium text-gray-800">{{
                    form.email
                  }}</span>
                  不存在，是否立即注册？
                </p>
                <div class="mt-6 space-y-4">
                  <el-button
                    class="w-full"
                    type="primary"
                    @click="switchStep('register-form', 'next')"
                    >注册账号</el-button
                  >
                  <a
                    href="#"
                    class="flex items-center justify-center text-sm text-blue-600 hover:text-blue-500"
                    @click.prevent="switchStep('check-email', 'prev')"
                  >
                    <component :is="iconMap.back" class="mr-1" /> 上一步
                  </a>
                </div>
              </div>

              <!-- 注册表单 -->
              <div v-else-if="step === 'register-form'">
                <h2 class="text-xl font-semibold text-center text-gray-800">
                  创建新账号
                </h2>
                <div class="mt-6">
                  <el-form-item prop="email">
                    <el-input
                      v-model="form.email"
                      placeholder="电子邮箱"
                      :prefix-icon="iconMap.mail"
                    />
                  </el-form-item>
                  <el-form-item prop="password">
                    <el-input
                      v-model="form.password"
                      type="password"
                      show-password
                      placeholder="密码"
                      :prefix-icon="iconMap.lock"
                    />
                  </el-form-item>
                  <el-form-item prop="confirmPassword">
                    <el-input
                      v-model="form.confirmPassword"
                      type="password"
                      show-password
                      placeholder="重复密码"
                      :prefix-icon="iconMap.lock"
                      @keyup.enter="handleRegister"
                    />
                  </el-form-item>
                  <el-form-item>
                    <el-button
                      class="w-full"
                      type="primary"
                      :loading="loading"
                      @click="handleRegister"
                      >注册</el-button
                    >
                  </el-form-item>
                  <div class="text-sm text-center">
                    <span class="text-gray-600">已有账号？</span>
                    <a
                      href="#"
                      class="font-medium text-blue-600 hover:text-blue-500"
                      @click.prevent="switchStep('check-email', 'prev')"
                      >立即登录</a
                    >
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: all 0.3s ease-in-out;
}
.slide-next-enter-from {
  opacity: 0;
  transform: translateX(0px);
}
.slide-next-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(0px);
}
</style>
