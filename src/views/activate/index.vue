<template>
  <div class="activate-container">
    <div class="activate-card">
      <div v-if="loading" class="loading-state">
        <el-icon class="loading-icon" :size="48">
          <Loading />
        </el-icon>
        <p class="loading-text">正在激活账号...</p>
      </div>

      <div v-else-if="success" class="success-state">
        <el-icon class="success-icon" :size="64" color="#67c23a">
          <CircleCheck />
        </el-icon>
        <h2 class="success-title">账号激活成功！</h2>
        <p class="success-text">您的账号已成功激活并自动登录，即将返回原页面</p>
        <el-button type="primary" size="large" @click="goToReturnUrl">
          立即返回
        </el-button>
      </div>

      <div v-else class="error-state">
        <el-icon class="error-icon" :size="64" color="#f56c6c">
          <CircleClose />
        </el-icon>
        <h2 class="error-title">激活失败</h2>
        <p class="error-text">{{ errorMessage }}</p>
        <el-button type="primary" size="large" @click="goToReturnUrl">
          返回
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { activateUser } from "@/api/user";
import { ElMessage } from "element-plus";
import { Loading, CircleCheck, CircleClose } from "@element-plus/icons-vue";
import { useUserStoreHook } from "@/store/modules/user";
import { initRouter } from "@/router/utils";
import { setToken } from "@/utils/auth";

defineOptions({
  name: "ActivateAccount"
});

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const success = ref(false);
const errorMessage = ref("");

const goToReturnUrl = () => {
  // 从localStorage获取注册时的页面URL
  const returnUrl = localStorage.getItem("activation_return_url");

  if (returnUrl) {
    // 清除已使用的URL
    localStorage.removeItem("activation_return_url");

    try {
      // 尝试解析URL，提取路径部分
      const url = new URL(returnUrl);
      const path = url.pathname + url.search + url.hash;

      // 如果是同域名，使用router导航（无刷新）
      if (url.origin === window.location.origin) {
        router.push(path);
      } else {
        // 如果是外部链接，使用window.location
        window.location.href = returnUrl;
      }
    } catch (e) {
      // 如果URL解析失败，尝试作为相对路径处理
      if (returnUrl.startsWith("/")) {
        router.push(returnUrl);
      } else {
        window.location.href = returnUrl;
      }
    }
  } else {
    // 如果没有保存的URL，跳转到首页
    router.push("/");
  }
};

const activate = async () => {
  const id = route.query.id as string;
  const sign = route.query.sign as string;

  if (!id || !sign) {
    loading.value = false;
    errorMessage.value = "激活链接无效，请检查邮件中的链接是否完整";
    return;
  }

  try {
    // 调用激活API，现在会返回登录信息
    const response = await activateUser(id, sign);

    if (response.code === 200 && response.data) {
      // 保存登录信息到 localStorage 和 store
      const userStore = useUserStoreHook();

      // 使用 setToken 保存完整的登录数据
      setToken(response.data);

      // 更新 store 中的用户信息
      userStore.SET_USER_INFO(response.data.userInfo);

      // 初始化路由（仅供管理员使用，普通用户不需要）
      await initRouter();

      success.value = true;
      ElMessage.success("账号激活成功，已自动登录！");

      // 2秒后自动跳转到原页面
      setTimeout(() => {
        goToReturnUrl();
      }, 2000);
    } else {
      throw new Error(response.message || "激活失败");
    }
  } catch (error: any) {
    success.value = false;
    errorMessage.value =
      error.response?.data?.message ||
      error.message ||
      "激活失败，请稍后重试或联系管理员";
    ElMessage.error(errorMessage.value);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  activate();
});
</script>

<style lang="scss" scoped>
.activate-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.activate-card {
  width: 100%;
  max-width: 480px;
  padding: 3rem 2rem;
  text-align: center;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.loading-state,
.success-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.loading-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 1.125rem;
  color: #606266;
  margin: 0;
}

.success-icon,
.error-icon {
  animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-title,
.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.success-text,
.error-text {
  font-size: 1rem;
  color: #606266;
  margin: 0;
  line-height: 1.6;
}

.el-button {
  margin-top: 1rem;
  min-width: 140px;
}

@media (max-width: 768px) {
  .activate-card {
    padding: 2rem 1.5rem;
  }

  .success-title,
  .error-title {
    font-size: 1.25rem;
  }

  .success-text,
  .error-text {
    font-size: 0.875rem;
  }
}
</style>
