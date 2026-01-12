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
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { initRouter } from "@/router/utils";
import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import { message } from "@/utils/message";
import { useUserStoreHook } from "@/store/modules/user";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

// 1. 导入所有子组件
import CheckEmailForm from "./components/CheckEmailForm.vue";
import LoginForm from "./components/LoginForm.vue";
import RegisterPrompt from "./components/RegisterPrompt.vue";
import RegisterForm from "./components/RegisterForm.vue";
import ForgotPasswordForm from "./components/ForgotPasswordForm.vue";
import ResetPasswordForm from "./components/ResetPasswordForm.vue";
import ActivatePrompt from "./components/ActivatePrompt.vue";
import Turnstile from "@/components/Turnstile/index.vue";

defineOptions({ name: "Login" });

const siteConfigStore = useSiteConfigStore();
const router = useRouter();
const route = useRoute();
const { dataTheme, dataThemeChange } = useDataThemeChange();
const { enableRegistration } = storeToRefs(siteConfigStore);

// Turnstile 相关
const turnstileRef = ref();
const turnstileToken = ref("");
const turnstileReset = ref(false);

// 判断是否启用了 Turnstile
const isTurnstileEnabled = computed(() => {
  const config = siteConfigStore.getSiteConfig;
  return config?.["turnstile.enable"] === "true";
});

// Turnstile 验证成功回调
const onTurnstileVerified = (token: string) => {
  turnstileToken.value = token;
};

// Turnstile 错误回调
const onTurnstileError = () => {
  turnstileToken.value = "";
  message("人机验证加载失败，请刷新页面重试", { type: "error" });
};

// Turnstile 过期回调
const onTurnstileExpired = () => {
  turnstileToken.value = "";
  message("人机验证已过期，请重新验证", { type: "warning" });
};

// 重置 Turnstile
const resetTurnstile = () => {
  turnstileToken.value = "";
  turnstileReset.value = true;
  nextTick(() => {
    turnstileReset.value = false;
  });
};

// 让 siteIcon 依赖于 dataTheme，实现日间/夜间 Logo 自动切换
const siteIcon = computed(() => {
  const config = siteConfigStore.getSiteConfig;
  if (!config) return "/static/img/logo-horizontal-day.png"; // 默认 Logo

  // dataTheme.value 为 true 表示暗色模式
  return dataTheme.value
    ? config.LOGO_HORIZONTAL_NIGHT || "/static/img/logo-horizontal-night.png"
    : config.LOGO_HORIZONTAL_DAY || "/static/img/logo-horizontal-day.png";
});

/**
 * 处理 el-switch 的切换事件
 * @param isDark el-switch 传来的新值，true 代表暗色，false 代表浅色
 */
const handleThemeSwitch = (isDark: boolean) => {
  // 调用核心切换函数，传入正确的主题名称
  dataThemeChange(isDark ? "dark" : "light");
};

type Step =
  | "check-email"
  | "login-password"
  | "register-prompt"
  | "register-form"
  | "forgot-password"
  | "reset-password"
  | "activate-prompt";

const step = ref<Step>("check-email");
const loading = ref(false);
const transitionName = ref("slide-next");

// 为每个子组件创建 ref
const checkEmailFormRef = ref();
const loginFormRef = ref();
const registerFormRef = ref();
const forgotPasswordFormRef = ref();
const resetPasswordFormRef = ref();

// 统一的表单状态和验证规则
const formRef = ref<FormInstance>();
const form = reactive({
  email: "",
  nickname: "",
  password: "",
  confirmPassword: "",
  resetToken: { id: "", secret: "" }
});

const rules = reactive<FormRules>({
  email: [
    { required: true, message: "请输入电子邮箱", trigger: "blur" },
    { type: "email", message: "请输入有效的电子邮箱地址", trigger: "blur" }
  ],
  nickname: [
    { required: true, message: "请输入昵称", trigger: "blur" },
    { min: 2, max: 20, message: "昵称长度应在2到20个字符之间", trigger: "blur" }
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
});

const handleFocus = () => {
  // 通过调用子组件暴露的 focus 方法来实现聚焦
  switch (step.value) {
    case "check-email":
      checkEmailFormRef.value?.focus();
      break;
    case "login-password":
      loginFormRef.value?.focus();
      break;
    case "register-form":
      registerFormRef.value?.focus(form.email);
      break;
    case "forgot-password":
      forgotPasswordFormRef.value?.focus();
      break;
    case "reset-password":
      resetPasswordFormRef.value?.focus();
      break;
  }
};

const switchStep = (targetStep: Step, direction: "next" | "prev" = "next") => {
  transitionName.value = direction === "next" ? "slide-next" : "slide-prev";
  step.value = targetStep;
  if (targetStep !== "check-email") {
    form.password = "";
    form.confirmPassword = "";
  }
  if (targetStep !== "register-form") {
    form.nickname = "";
  }
  nextTick(() => formRef.value?.clearValidate());
};

// 表单提交总处理器
const handleSubmit = async (
  validateFn: () => Promise<boolean | undefined>,
  submitFn: (...args: any[]) => Promise<void>
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

// 所有 API 调用逻辑
const apiHandlers = {
  checkEmailExists: async (email: string) => {
    const res = await useUserStoreHook().checkEmailRegistered(email);
    return res.code === 200 && res.data.exists;
  },
  login: async () => {
    // 检查 Turnstile 验证
    if (isTurnstileEnabled.value && !turnstileToken.value) {
      message("请完成人机验证", { type: "warning" });
      return;
    }

    await useUserStoreHook().loginByEmail({
      email: form.email,
      password: form.password,
      turnstile_token: turnstileToken.value
    });

    // 登录成功后重置 Turnstile
    resetTurnstile();

    // 等待路由初始化
    await initRouter();

    // 根据用户角色决定跳转位置
    const userStore = useUserStoreHook();
    const isAdmin = userStore.roles.includes("1"); // 1 是管理员组ID

    if (isAdmin) {
      // 管理员跳转到后台首页
      await router.replace("/admin/dashboard");
    } else {
      // 普通用户跳转到前台首页
      await router.replace("/");
    }

    message("登录成功", { type: "success" });
  },
  register: async () => {
    // 检查 Turnstile 验证
    if (isTurnstileEnabled.value && !turnstileToken.value) {
      message("请完成人机验证", { type: "warning" });
      return;
    }

    try {
      const res = await useUserStoreHook().registeredUser({
        email: form.email,
        nickname: form.nickname,
        password: form.password,
        repeat_password: form.confirmPassword,
        turnstile_token: turnstileToken.value
      });

      // 注册成功后重置 Turnstile
      resetTurnstile();
      if (res.code === 200) {
        if (res.data?.activation_required) {
          switchStep("activate-prompt", "next");
          message("注册成功，请查收激活邮件", { type: "success" });
        } else {
          switchStep("login-password", "prev");
          message("注册成功，请登录", { type: "success" });
        }
      } else {
        message(res.message || "注册失败", { type: "error" });
      }
    } catch (error: any) {
      // 如果是后端返回的错误（包含 code 和 message），显示后端的错误信息
      if (error?.code && error?.message) {
        message(error.message, { type: "error" });
      } else if (error?.message) {
        // 如果是前端抛出的 Error 对象
        message(error.message, { type: "error" });
      } else {
        // 其他未知错误
        message("注册失败，请稍后重试", { type: "error" });
      }
      // 重新抛出错误，让 handleSubmit 处理 loading 状态
      throw error;
    }
  },
  sendResetEmail: async (payload: { captcha: string; captchaCode: string }) => {
    if (payload.captcha.toLowerCase() !== payload.captchaCode.toLowerCase()) {
      message("验证码不正确", { type: "error" });
      forgotPasswordFormRef.value?.refreshCaptcha();
      return;
    }
    const res = await useUserStoreHook().sendPasswordResetEmail({
      email: form.email
    });
    if (res.code === 200) {
      message(res.message, { type: "success" });
      switchStep("check-email", "prev");
    } else {
      message(res.message || "发送失败", { type: "error" });
    }
  },
  resetPassword: async () => {
    const res = await useUserStoreHook().resetPassword({
      ...form.resetToken,
      password: form.password,
      repeat_password: form.confirmPassword
    });
    if (res.code === 200) {
      message("密码重设成功，请使用新密码登录", { type: "success" });
      await router.replace("/login");
      switchStep("check-email", "prev");
    } else {
      message(res.message || "重设失败", { type: "error" });
    }
  }
};

// 事件处理器
const eventHandlers = {
  onNextStep: async () => {
    try {
      await formRef.value?.validateField("email");
      loading.value = true;
      const exists = await apiHandlers.checkEmailExists(form.email);
      if (exists) {
        switchStep("login-password", "next");
      } else {
        // 如果用户不存在
        if (enableRegistration.value) {
          // 开启注册：跳转到注册提示
          switchStep("register-prompt", "next");
        } else {
          // 关闭注册：显示错误提示
          message("该邮箱尚未注册，当前系统已关闭注册功能", { type: "error" });
        }
      }
    } catch (err: any) {
      // 验证失败，不执行任何操作
      console.log("验证失败", err);
    } finally {
      loading.value = false;
    }
  },
  onLogin: () =>
    handleSubmit(() => formRef.value!.validate(), apiHandlers.login),
  onRegister: () =>
    handleSubmit(() => formRef.value!.validate(), apiHandlers.register),
  onForgotPassword: (payload: { captcha: string; captchaCode: string }) =>
    handleSubmit(
      () => formRef.value!.validateField("email"),
      () => apiHandlers.sendResetEmail(payload)
    ),
  onResetPassword: () =>
    handleSubmit(
      () => formRef.value!.validateField(["password", "confirmPassword"]),
      apiHandlers.resetPassword
    )
};

// 键盘与生命周期
const onKeyDown = (event: KeyboardEvent) => {
  const { code } = event;
  if (!["Enter", "NumpadEnter"].includes(code)) return;

  // 阻止表单默认提交行为
  event.preventDefault();

  const handlerMap = {
    "check-email": eventHandlers.onNextStep,
    "login-password": eventHandlers.onLogin,
    "register-form": eventHandlers.onRegister,
    "forgot-password": () => forgotPasswordFormRef.value?.triggerSubmit(),
    "reset-password": eventHandlers.onResetPassword
  };
  handlerMap[step.value]?.();
};

onMounted(() => {
  // 支持 sign 和 secret 两个参数名（兼容性处理）
  const signParam = (route.query.secret || route.query.sign) as string;
  if (route.path === "/login/reset" && route.query.id && signParam) {
    form.resetToken.id = route.query.id as string;
    form.resetToken.secret = signParam;
    step.value = "reset-password";
  }
  window.document.addEventListener("keydown", onKeyDown);
  handleFocus();
});

onBeforeUnmount(() =>
  window.document.removeEventListener("keydown", onKeyDown)
);
</script>

<template>
  <div class="flex items-center justify-center w-full min-h-screen">
    <div
      class="w-full max-w-sm p-8 space-y-6 bg-[--anzhiyu-card-bg] border border-[var(--anzhiyu-border-color)] rounded-xl shadow-sm mx-4"
    >
      <div class="absolute flex-c right-5 top-3">
        <el-switch
          v-model="dataTheme"
          inline-prompt
          :active-icon="darkIcon"
          :inactive-icon="dayIcon"
          @change="handleThemeSwitch"
        />
      </div>
      <div class="flex justify-center h-10 mx-auto">
        <img :src="siteIcon" alt="网站logo" />
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" size="large">
        <!-- Turnstile 人机验证 - 在登录和注册步骤显示 -->
        <Turnstile
          v-if="step === 'login-password' || step === 'register-form'"
          ref="turnstileRef"
          :reset="turnstileReset"
          @verified="onTurnstileVerified"
          @error="onTurnstileError"
          @expired="onTurnstileExpired"
        />

        <div class="relative overflow-hidden">
          <transition
            :name="transitionName"
            mode="out-in"
            @after-enter="handleFocus"
          >
            <div :key="step">
              <CheckEmailForm
                v-if="step === 'check-email'"
                ref="checkEmailFormRef"
                v-model:email="form.email"
                :loading="loading"
                :enable-registration="enableRegistration"
                @submit="eventHandlers.onNextStep"
                @go-to-register="switchStep('register-form', 'next')"
              />

              <LoginForm
                v-else-if="step === 'login-password'"
                ref="loginFormRef"
                v-model:password="form.password"
                :loading="loading"
                :email="form.email"
                @submit="eventHandlers.onLogin"
                @go-back="switchStep('check-email', 'prev')"
                @forgot-password="switchStep('forgot-password', 'next')"
              />

              <RegisterPrompt
                v-else-if="step === 'register-prompt'"
                :email="form.email"
                @go-to-register="switchStep('register-form', 'next')"
                @go-back="switchStep('check-email', 'prev')"
              />

              <RegisterForm
                v-else-if="step === 'register-form'"
                ref="registerFormRef"
                v-model:email="form.email"
                v-model:nickname="form.nickname"
                v-model:password="form.password"
                v-model:confirmPassword="form.confirmPassword"
                :loading="loading"
                @submit="eventHandlers.onRegister"
                @go-to-login="switchStep('check-email', 'prev')"
              />

              <ActivatePrompt
                v-else-if="step === 'activate-prompt'"
                :email="form.email"
                @go-to-login="switchStep('check-email', 'prev')"
              />

              <ForgotPasswordForm
                v-else-if="step === 'forgot-password'"
                ref="forgotPasswordFormRef"
                v-model:email="form.email"
                :loading="loading"
                @submit="eventHandlers.onForgotPassword"
                @back="switchStep('check-email', 'prev')"
              />

              <ResetPasswordForm
                v-else-if="step === 'reset-password'"
                ref="resetPasswordFormRef"
                v-model:password="form.password"
                v-model:confirmPassword="form.confirmPassword"
                :loading="loading"
                @submit="eventHandlers.onResetPassword"
                @go-to-login="switchStep('check-email', 'prev')"
              />
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
  transform: translateX(30px);
}

.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
