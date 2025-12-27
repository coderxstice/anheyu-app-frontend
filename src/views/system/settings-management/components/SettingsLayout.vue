<template>
  <div class="settings-layout">
    <!-- 顶部工具栏 -->
    <div class="settings-header">
      <div class="header-left">
        <h1 class="settings-title">系统设置</h1>
      </div>
      <div class="header-right">
        <SettingsSearch @navigate="handleNavigate" />
        <div class="header-actions">
          <el-button :icon="Upload" @click="$emit('export')">
            导出配置
          </el-button>
          <el-button :icon="Download" @click="$emit('import')">
            导入配置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主体内容区 -->
    <div class="settings-body">
      <!-- 左侧导航 -->
      <SettingsSidebar :active-key="activeKey" @select="handleSelect" />

      <!-- 右侧内容区 -->
      <div ref="contentRef" class="settings-content">
        <div class="content-wrapper">
          <slot :active-key="activeKey" :active-component="activeComponent" />
        </div>
      </div>
    </div>

    <!-- 悬浮保存按钮 -->
    <FloatingSaveButton
      :has-changes="hasChanges"
      :loading="loading"
      @save="$emit('save')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Upload, Download } from "@element-plus/icons-vue";
import SettingsSidebar from "./SettingsSidebar.vue";
import SettingsSearch from "./SettingsSearch.vue";
import FloatingSaveButton from "./FloatingSaveButton.vue";
import { settingsMenuConfig } from "../settings.descriptor";

const props = defineProps<{
  hasChanges: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "save"): void;
  (e: "export"): void;
  (e: "import"): void;
  (e: "change", key: string): void;
}>();

const route = useRoute();
const router = useRouter();

// 内容区域 ref
const contentRef = ref<HTMLElement | null>(null);

// 滚动到顶部
const scrollToTop = () => {
  nextTick(() => {
    if (contentRef.value) {
      contentRef.value.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
};

// 默认选中第一个菜单项
const getDefaultKey = () => {
  const firstCategory = settingsMenuConfig[0];
  return firstCategory?.children?.[0]?.key || "site-basic";
};

const activeKey = ref((route.query.tab as string) || getDefaultKey());

// 获取当前选中项对应的组件名
const activeComponent = computed(() => {
  for (const category of settingsMenuConfig) {
    const found = category.children?.find(
      child => child.key === activeKey.value
    );
    if (found) return found.component;
  }
  return "BaseInfoForm";
});

// 处理菜单选择
const handleSelect = (key: string) => {
  activeKey.value = key;
  // 更新 URL query 参数
  router.replace({ query: { ...route.query, tab: key } });
  emit("change", key);
  // 滚动到顶部
  scrollToTop();
};

// 处理搜索导航
const handleNavigate = (key: string) => {
  handleSelect(key);
};

// 监听路由变化
watch(
  () => route.query.tab,
  newTab => {
    if (newTab && typeof newTab === "string") {
      activeKey.value = newTab;
    }
  }
);
</script>

<style scoped lang="scss">
.settings-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color-page);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.settings-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.settings-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--el-bg-color-page);
}

.content-wrapper {
  margin: 0 auto;
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 24px 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
</style>
