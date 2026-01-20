<!--
 * @Description: 统一人机验证组件
 * @Author: 安知鱼
 * @Date: 2026-01-20
 * @Description: 根据后台配置自动选择显示 Turnstile / 极验 / 系统图形验证码
-->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { http } from "@/utils/http";
import { baseUrlApi } from "@/utils/http/config";
import Turnstile from "@/components/Turnstile/index.vue";
import Geetest from "@/components/Geetest/index.vue";
import ImageCaptcha from "@/components/ImageCaptcha/index.vue";

// 验证码类型
type CaptchaProvider = "none" | "turnstile" | "geetest" | "image";

// 验证码配置
interface CaptchaConfig {
  provider: CaptchaProvider;
  turnstile_site_key?: string;
  geetest_captcha_id?: string;
  image_captcha_length?: number;
}

// API 响应类型
interface CaptchaConfigResponse {
  code: number;
  data: CaptchaConfig;
}

// 统一验证参数
export interface CaptchaParams {
  turnstile_token?: string;
  geetest_lot_number?: string;
  geetest_captcha_output?: string;
  geetest_pass_token?: string;
  geetest_gen_time?: string;
  image_captcha_id?: string;
  image_captcha_answer?: string;
}

const props = defineProps({
  // 外部控制重置
  reset: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["verified", "error", "configLoaded"]);

const siteConfigStore = useSiteConfigStore();

// 组件引用
const turnstileRef = ref<InstanceType<typeof Turnstile> | null>(null);
const geetestRef = ref<InstanceType<typeof Geetest> | null>(null);
const imageCaptchaRef = ref<InstanceType<typeof ImageCaptcha> | null>(null);

// 验证码配置
const captchaConfig = ref<CaptchaConfig | null>(null);
const isLoading = ref(true);

// 验证参数
const captchaParams = ref<CaptchaParams>({});

// 当前验证方式
const provider = computed(() => captchaConfig.value?.provider || "none");

// 是否启用验证
const isEnabled = computed(() => provider.value !== "none");

// 获取验证码配置
const fetchCaptchaConfig = async () => {
  try {
    // 首先尝试从 siteConfig 获取
    const siteConfig = siteConfigStore.getSiteConfig;
    if (siteConfig?.captcha?.provider) {
      captchaConfig.value = {
        provider: siteConfig.captcha.provider as CaptchaProvider,
        turnstile_site_key:
          siteConfig.turnstile?.site_key || siteConfig["turnstile.site_key"],
        geetest_captcha_id:
          siteConfig.geetest?.captcha_id || siteConfig["geetest.captcha_id"]
      };
      emit("configLoaded", captchaConfig.value);
      return;
    }

    // 兼容旧配置：检查 turnstile.enable
    const turnstileEnabled =
      siteConfig?.turnstile?.enable === true ||
      siteConfig?.turnstile?.enable === "true" ||
      siteConfig?.["turnstile.enable"] === "true";

    if (turnstileEnabled) {
      captchaConfig.value = {
        provider: "turnstile",
        turnstile_site_key:
          siteConfig?.turnstile?.site_key || siteConfig?.["turnstile.site_key"]
      };
      emit("configLoaded", captchaConfig.value);
      return;
    }

    // 从 API 获取配置
    const res = await http.get<CaptchaConfigResponse, undefined>(
      baseUrlApi("public/captcha/config")
    );
    if (res.code === 200 && res.data) {
      captchaConfig.value = res.data;
      emit("configLoaded", res.data);
    } else {
      captchaConfig.value = { provider: "none" };
    }
  } catch (error) {
    console.error("获取验证码配置失败:", error);
    captchaConfig.value = { provider: "none" };
  } finally {
    isLoading.value = false;
  }
};

// Turnstile 验证成功
const onTurnstileVerified = (token: string) => {
  captchaParams.value = { turnstile_token: token };
  emit("verified", captchaParams.value);
};

// 极验验证成功
const onGeetestVerified = (result: {
  lot_number: string;
  captcha_output: string;
  pass_token: string;
  gen_time: string;
}) => {
  captchaParams.value = {
    geetest_lot_number: result.lot_number,
    geetest_captcha_output: result.captcha_output,
    geetest_pass_token: result.pass_token,
    geetest_gen_time: result.gen_time
  };
  emit("verified", captchaParams.value);
};

// 图形验证码输入
const onImageCaptchaVerified = (data: {
  captchaId: string;
  answer: string;
}) => {
  captchaParams.value = {
    image_captcha_id: data.captchaId,
    image_captcha_answer: data.answer
  };
  emit("verified", captchaParams.value);
};

// 验证错误
const onError = () => {
  captchaParams.value = {};
  emit("error");
};

// 重置验证
const resetCaptcha = () => {
  captchaParams.value = {};
  turnstileRef.value?.reset();
  geetestRef.value?.reset();
  imageCaptchaRef.value?.reset();
};

// 获取验证参数
const getParams = (): CaptchaParams => {
  return captchaParams.value;
};

// 验证是否已完成
const isVerified = computed(() => {
  if (!isEnabled.value) return true;

  switch (provider.value) {
    case "turnstile":
      return !!captchaParams.value.turnstile_token;
    case "geetest":
      return !!(
        captchaParams.value.geetest_lot_number &&
        captchaParams.value.geetest_captcha_output
      );
    case "image":
      return !!(
        captchaParams.value.image_captcha_id &&
        captchaParams.value.image_captcha_answer
      );
    default:
      return true;
  }
});

// 监听重置属性
watch(
  () => props.reset,
  newVal => {
    if (newVal) {
      resetCaptcha();
    }
  }
);

onMounted(() => {
  fetchCaptchaConfig();
});

// 暴露方法给父组件
defineExpose({
  reset: resetCaptcha,
  getParams,
  isEnabled,
  isVerified,
  provider
});
</script>

<template>
  <div v-if="isEnabled" class="captcha-verify-wrapper">
    <div v-if="isLoading" class="captcha-loading">
      <span>正在加载验证码...</span>
    </div>

    <template v-else>
      <!-- Turnstile -->
      <Turnstile
        v-if="provider === 'turnstile'"
        ref="turnstileRef"
        :reset="props.reset"
        @verified="onTurnstileVerified"
        @error="onError"
        @expired="onError"
      />

      <!-- 极验 -->
      <Geetest
        v-else-if="provider === 'geetest'"
        ref="geetestRef"
        :captcha-id="captchaConfig?.geetest_captcha_id"
        :reset="props.reset"
        @verified="onGeetestVerified"
        @error="onError"
      />

      <!-- 系统图形验证码 -->
      <ImageCaptcha
        v-else-if="provider === 'image'"
        ref="imageCaptchaRef"
        :reset="props.reset"
        @verified="onImageCaptchaVerified"
        @error="onError"
      />
    </template>
  </div>
</template>

<style scoped>
.captcha-verify-wrapper {
  width: 100%;
  min-height: 44px;
}

.captcha-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  color: var(--anzhiyu-fontcolor);
  font-size: 14px;
  opacity: 0.7;
}
</style>
