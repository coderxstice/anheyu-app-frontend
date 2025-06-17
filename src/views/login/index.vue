<script setup lang="ts">
import {
  ref,
  reactive,
  nextTick,
  onMounted,
  onBeforeUnmount,
  computed
} from "vue";
import type { FormInstance, FormRules } from "element-plus";

import { useLayout } from "@/layout/hooks/useLayout";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { initRouter, getTopMenu } from "@/router/utils";
import MailFill from "@iconify-icons/ri/mail-fill";
import LockFill from "@iconify-icons/ri/lock-password-fill";
import ArrowLeftSLine from "@iconify-icons/ri/arrow-left-s-line";
import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { message } from "@/utils/message";
import { useUserStoreHook } from "@/store/modules/user";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useRouter } from "vue-router";

defineOptions({ name: "Login" });

const siteConfigStore = useSiteConfigStore();

const router = useRouter();

const { initStorage } = useLayout();
initStorage();
const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);

const siteIcon = computed(
  () =>
    siteConfigStore.getSiteConfig?.LOGO_HORIZONTAL_DAY ||
    "/static/img/logo-horizontal-day.png"
);
const siteDark = computed(
  () =>
    siteConfigStore.getSiteConfig?.LOGO_HORIZONTAL_NIGHT ||
    "/static/img/logo-horizontal-night.png"
);

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
  try {
    const res = await useUserStoreHook().checkEmailRegistered(email);
    if (res.code === 200) {
      return res.data.exists;
    } else {
      message("检查邮箱失败 - " + res.message, { type: "error" });
      return false;
    }
  } catch (error: any) {
    message("检查邮箱时发生错误 - " + error.message, { type: "error" });
    return false;
  }
};

// 修改 apiLogin 函数，整合你提供的登录逻辑
const apiLogin = async () => {
  const formEl = formRef.value;
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      useUserStoreHook()
        .loginByEmail({
          email: form.email,
          password: form.password
        })
        .then(res => {
          console.log(res);

          if (res.code === 200) {
            return initRouter().then(() => {
              router.push(getTopMenu(true).path).then(() => {
                message("登录成功", { type: "success" });
              });
            });
          } else {
            message("登录失败 - " + res.message, { type: "error" });
          }
        })
        .catch(err => {
          console.error("登录错误：", err);
          message(err.response.data.message || "未知错误", {
            type: "error"
          });
        });
    }
  });
};

const apiRegister = async () => {
  const formEl = formRef.value;
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      useUserStoreHook()
        .registeredUser({
          email: form.email,
          password: form.password,
          repeat_password: form.confirmPassword
        })
        .then(res => {
          console.log("注册结果：", res);

          if (res.code === 200) {
            switchStep("login-password", "prev");
            message("注册成功，请登录", { type: "success" });
          } else {
            message("注册失败 - " + res.message, { type: "error" });
          }
        });
    }
  });
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

// --- 键盘事件逻辑 ---
/** 使用公共函数，避免`removeEventListener`失效 */
const onkeypress = ({ code }: KeyboardEvent) => {
  if (["Enter", "NumpadEnter"].includes(code)) {
    switch (step.value) {
      case "check-email":
        handleNextStep();
        break;
      case "login-password":
        handleLogin();
        break;
      case "register-form":
        handleRegister();
        break;
      // "register-prompt" 页面不需要回车键触发操作
      default:
        break;
    }
  }
};

onMounted(() => {
  window.document.addEventListener("keypress", onkeypress);
});

onBeforeUnmount(() => {
  window.document.removeEventListener("keypress", onkeypress);
});
</script>

<template>
  <div class="flex items-center justify-center w-full min-h-screen">
    <div
      class="w-full max-w-sm p-8 space-y-6 bg-[--anzhiyu-card-bg] border border-gray-200 rounded-xl shadow-sm mx-4"
    >
      <div class="flex-c absolute right-5 top-3">
        <el-switch
          v-model="dataTheme"
          inline-prompt
          :active-icon="dayIcon"
          :inactive-icon="darkIcon"
          @change="dataThemeChange"
        />
      </div>
      <div class="flex justify-center w-40 h-10 mx-auto">
        <img :src="siteIcon" alt="网站logo" />
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" size="large">
        <div
          class="relative overflow-hidden transition-[height] duration-300 ease-in-out"
        >
          <transition :name="transitionName" mode="out-in">
            <div :key="step" ref="formContentRef">
              <div v-if="step === 'check-email'">
                <h2
                  class="text-xl font-semibold text-center text-[--anzhiyu-fontcolor]"
                >
                  登录你的账号
                </h2>
                <div class="mt-6">
                  <el-form-item prop="email">
                    <el-input
                      v-model="form.email"
                      placeholder="电子邮箱"
                      :prefix-icon="iconMap.mail"
                      autocomplete="username"
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
                      autocomplete="current-password"
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

              <div v-else-if="step === 'register-prompt'">
                <h2
                  class="text-xl font-semibold text-center text-[--anzhiyu-fontcolor]"
                >
                  登录你的账号
                </h2>
                <p class="mt-4 text-center text-[--anzhiyu-fontcolor]">
                  你输入的账户
                  <span class="font-medium text-[--anzhiyu-fontcolor]">{{
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
                      autocomplete="email"
                    />
                  </el-form-item>
                  <el-form-item prop="password">
                    <el-input
                      v-model="form.password"
                      type="password"
                      show-password
                      placeholder="密码"
                      :prefix-icon="iconMap.lock"
                      autocomplete="new-password"
                    />
                  </el-form-item>
                  <el-form-item prop="confirmPassword">
                    <el-input
                      v-model="form.confirmPassword"
                      type="password"
                      show-password
                      placeholder="重复密码"
                      :prefix-icon="iconMap.lock"
                      autocomplete="new-password"
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
                    <span class="text-[--anzhiyu-secondtext]">已有账号？</span>
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
