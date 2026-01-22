<template>
  <div class="settings-layout">
    <!-- 顶部工具栏 -->
    <div class="settings-header">
      <div class="header-left">
        <!-- 移动端菜单按钮 -->
        <el-button
          class="mobile-menu-btn"
          :icon="Menu"
          @click="showMobileSidebar = true"
        />
        <h1 class="settings-title">系统设置</h1>
      </div>
      <div class="header-right">
        <SettingsSearch @navigate="handleNavigate" />
        <div class="header-actions">
          <el-tooltip
            content="重置当前页面的配置为上次保存的状态"
            placement="bottom"
          >
            <el-button
              :icon="RefreshLeft"
              :disabled="!hasChanges"
              @click="$emit('resetCurrent', activeComponent)"
            >
              <span class="btn-text">重置选区</span>
            </el-button>
          </el-tooltip>
          <el-tooltip
            content="重置所有页面的配置为上次保存的状态"
            placement="bottom"
          >
            <el-button
              :icon="Refresh"
              :disabled="!hasChanges"
              @click="$emit('resetAll')"
            >
              <span class="btn-text">重置全部</span>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- 主体内容区 -->
    <div class="settings-body">
      <!-- 左侧导航 - 桌面端 -->
      <SettingsSidebar
        class="desktop-sidebar"
        :active-key="activeKey"
        @select="handleSelect"
      />

      <!-- 右侧内容区 -->
      <div ref="contentRef" class="settings-content">
        <div class="content-wrapper">
          <slot :active-key="activeKey" :active-component="activeComponent" />
        </div>
      </div>
    </div>

    <!-- 移动端侧边栏抽屉 -->
    <el-drawer
      v-model="showMobileSidebar"
      direction="ltr"
      :size="280"
      :show-close="false"
      class="mobile-sidebar-drawer"
    >
      <template #header>
        <div class="drawer-header">
          <span class="drawer-title">设置导航</span>
          <el-button :icon="Close" text @click="showMobileSidebar = false" />
        </div>
      </template>
      <SettingsSidebar :active-key="activeKey" @select="handleMobileSelect" />
    </el-drawer>

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
import { RefreshLeft, Refresh, Menu, Close } from "@element-plus/icons-vue";
import SettingsSidebar from "./SettingsSidebar.vue";
import SettingsSearch from "./SettingsSearch.vue";
import FloatingSaveButton from "./FloatingSaveButton.vue";
import { settingsMenuConfig } from "../settings.descriptor";

// 移动端侧边栏状态
const showMobileSidebar = ref(false);

const props = defineProps<{
  hasChanges: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "save"): void;
  (e: "resetCurrent", component: string): void;
  (e: "resetAll"): void;
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

// localStorage key 用于持久化保存菜单状态
const SETTINGS_MENU_KEY = "settings-active-menu-key";

// 保存菜单状态到 localStorage
const saveMenuKey = (key: string) => {
  try {
    localStorage.setItem(SETTINGS_MENU_KEY, key);
  } catch {
    // ignore localStorage errors
  }
};

// 从 localStorage 获取保存的菜单状态
const getSavedMenuKey = (): string | null => {
  try {
    return localStorage.getItem(SETTINGS_MENU_KEY);
  } catch {
    return null;
  }
};

// 验证 key 是否有效（存在于菜单配置中）
const isValidMenuKey = (key: string): boolean => {
  for (const category of settingsMenuConfig) {
    const found = category.children?.find(child => child.key === key);
    if (found) return true;
  }
  return false;
};

// 默认选中第一个菜单项
const getDefaultKey = () => {
  const firstCategory = settingsMenuConfig[0];
  return firstCategory?.children?.[0]?.key || "site-basic";
};

// 获取初始 activeKey：优先 URL 参数 > localStorage > 默认值
const getInitialKey = (): string => {
  // 1. 优先使用 URL 参数
  const urlTab = route.query.tab as string;
  if (urlTab && isValidMenuKey(urlTab)) {
    return urlTab;
  }
  // 2. 其次使用 localStorage 保存的值
  const savedKey = getSavedMenuKey();
  if (savedKey && isValidMenuKey(savedKey)) {
    return savedKey;
  }
  // 3. 最后使用默认值
  return getDefaultKey();
};

const activeKey = ref(getInitialKey());

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
  // 保存到 localStorage
  saveMenuKey(key);
  // 更新 URL query 参数
  router.replace({ query: { ...route.query, tab: key } });
  emit("change", key);
  // 滚动到顶部
  scrollToTop();
};

// 处理移动端菜单选择
const handleMobileSelect = (key: string) => {
  handleSelect(key);
  // 关闭移动端侧边栏
  showMobileSidebar.value = false;
};

// 处理搜索导航
const handleNavigate = (key: string) => {
  handleSelect(key);
  // 如果移动端侧边栏打开，也要关闭
  showMobileSidebar.value = false;
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

// 移动端菜单按钮 - 默认隐藏
.mobile-menu-btn {
  display: none;
}

.settings-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
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

// 移动端抽屉头部
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

// ==================== 平板端适配 (768px - 1024px) ====================
@media (max-width: 1024px) {
  .settings-header {
    padding: 12px 16px;
    gap: 12px;
  }

  .header-actions {
    .btn-text {
      display: none;
    }
  }

  .settings-content {
    padding: 16px;
  }

  .content-wrapper {
    padding: 20px 24px;
  }
}

// ==================== 移动端适配 (< 768px) ====================
@media (max-width: 768px) {
  .settings-header {
    padding: 12px 16px;
    gap: 12px;
  }

  .header-left {
    gap: 8px;
    flex-shrink: 0;
  }

  // 显示移动端菜单按钮
  .mobile-menu-btn {
    display: flex;
    flex-shrink: 0;
  }

  .settings-title {
    font-size: 16px;
  }

  .header-right {
    gap: 8px;
  }

  // 隐藏桌面端侧边栏
  .desktop-sidebar {
    display: none;
  }

  .settings-content {
    padding: 12px;
  }

  .content-wrapper {
    padding: 16px;
    border-radius: 8px;
  }
}

// ==================== 小屏移动端适配 (< 480px) ====================
@media (max-width: 480px) {
  .settings-header {
    padding: 10px 12px;
    gap: 8px;
  }

  // 小屏幕隐藏标题文字
  .settings-title {
    display: none;
  }

  .header-right {
    gap: 6px;
  }

  .settings-content {
    padding: 8px;
  }

  .content-wrapper {
    padding: 12px;
  }
}
</style>

<!-- 移动端侧边栏抽屉样式 -->
<style lang="scss">
.mobile-sidebar-drawer {
  .el-drawer__header {
    padding: 16px;
    margin-bottom: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .el-drawer__body {
    padding: 0;
    overflow: hidden;
  }

  // 重置侧边栏在抽屉中的样式
  .settings-sidebar {
    width: 100%;
    min-width: 100%;
    border-right: none;
  }
}
</style>
