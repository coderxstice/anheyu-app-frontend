<!--
 * @Description: 404页面
 * @Author: 安知鱼
 * @Date: 2025-08-05 14:15:50
 * @LastEditTime: 2025-08-31 22:11:46
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { House, ArrowLeft } from "@element-plus/icons-vue";

defineOptions({
  name: "NotFound"
});

const route = useRoute();
const router = useRouter();

// 获取用户访问的路径
const fromPath = computed(() => {
  return (route.query.from as string) || "未知页面";
});

// 返回首页
const goHome = () => {
  router.push("/");
};

// 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    goHome();
  }
};
</script>

<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <div class="error-title">页面不存在</div>
      <div class="error-description">抱歉，您访问的页面不存在或已被删除</div>
      <div v-if="fromPath && fromPath !== '未知页面'" class="error-path">
        访问路径：<code>{{ fromPath }}</code>
      </div>
      <div class="error-actions">
        <el-button type="primary" size="large" @click="goHome">
          <el-icon><House /></el-icon>
          返回首页
        </el-button>
        <el-button size="large" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回上页
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color);
  padding: 2rem;
}

.not-found-content {
  text-align: center;
  max-width: 600px;
}

.error-code {
  font-size: 8rem;
  font-weight: bold;
  color: var(--el-color-primary);
  line-height: 1;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.error-title {
  font-size: 2rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 1rem;
}

.error-description {
  font-size: 1.1rem;
  color: var(--el-text-color-regular);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.error-path {
  font-size: 0.9rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);

  code {
    background: var(--el-bg-color-page);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    color: var(--el-color-danger);
  }
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;

  .el-button {
    min-width: 120px;
  }
}

@media (max-width: 768px) {
  .error-code {
    font-size: 6rem;
  }

  .error-title {
    font-size: 1.5rem;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;

    .el-button {
      width: 100%;
      max-width: 300px;
    }
  }
}
</style>
