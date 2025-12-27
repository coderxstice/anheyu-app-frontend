<template>
  <div class="settings-sidebar">
    <el-menu
      :default-active="activeKey"
      :default-openeds="defaultOpeneds"
      unique-opened
      class="settings-menu"
      @select="handleSelect"
    >
      <el-sub-menu v-for="item in menuConfig" :key="item.key" :index="item.key">
        <template #title>
          <el-icon v-if="item.icon" class="menu-icon">
            <Icon :icon="item.icon" />
          </el-icon>
          <span>{{ item.label }}</span>
        </template>
        <el-menu-item
          v-for="child in item.children"
          :key="child.key"
          :index="child.key"
          :class="{ 'is-active': activeKey === child.key }"
        >
          <span class="menu-item-text">{{ child.label }}</span>
        </el-menu-item>
      </el-sub-menu>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import {
  settingsMenuConfig,
  type SettingsMenuItem
} from "../settings.descriptor";

const props = defineProps<{
  activeKey: string;
}>();

const emit = defineEmits<{
  (e: "select", key: string): void;
}>();

const menuConfig = computed<SettingsMenuItem[]>(() => settingsMenuConfig);

// 默认展开当前激活项所在的一级菜单
const defaultOpeneds = computed(() => {
  const activeItem = menuConfig.value.find(item =>
    item.children?.some(child => child.key === props.activeKey)
  );
  return activeItem
    ? [activeItem.key]
    : [menuConfig.value[0]?.key].filter(Boolean);
});

const handleSelect = (key: string) => {
  emit("select", key);
};
</script>

<style scoped lang="scss">
.settings-sidebar {
  width: 220px;
  min-width: 220px;
  height: 100%;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--anzhiyu-theme-menu-bg, var(--el-bg-color));
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 2px;
  }
}

.settings-menu {
  border-right: none;
  background: transparent;

  :deep(.el-sub-menu__title) {
    position: relative;
    height: 50px;
    line-height: 50px;
    font-weight: 500;
    color: var(
      --anzhiyu-theme-menu-text,
      var(--el-text-color-primary)
    ) !important;
    background-color: transparent !important;
    transition: color 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    &::before {
      position: absolute;
      inset: 4px 12px;
      content: "";
      background: transparent;
      border-radius: 10px;
      transition: background-color 0.15s ease;
      z-index: 0;
    }

    .menu-icon,
    span {
      position: relative;
      z-index: 1;
    }

    &:hover {
      color: var(--anzhiyu-theme-menu-title-hover, #000) !important;
    }

    &:hover::before {
      background: var(
        --anzhiyu-theme-menu-hover,
        var(--el-fill-color-light)
      ) !important;
    }

    .menu-icon {
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &:hover .menu-icon {
      transform: scale(1.2);
    }
  }

  /* 展开的父菜单标题变主题色 */
  :deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
    color: var(--anzhiyu-theme, var(--el-color-primary)) !important;

    .menu-icon {
      color: var(--anzhiyu-theme, var(--el-color-primary)) !important;
    }
  }

  :deep(.el-menu-item) {
    position: relative;
    height: 50px;
    line-height: 50px;
    padding-left: 48px !important;
    font-size: 14px;
    color: var(
      --anzhiyu-theme-menu-text,
      var(--el-text-color-regular)
    ) !important;
    background-color: transparent !important;
    transition: color 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    /* 文字层级 - 确保在背景之上 */
    .menu-item-text {
      position: relative;
      z-index: 1;
    }

    /* 始终存在的背景伪元素 */
    &::before {
      position: absolute;
      inset: 4px 12px;
      content: "";
      background: transparent;
      border-radius: 10px;
      transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 0;
    }

    /* hover 状态 */
    &:hover:not(.is-active) {
      color: var(--anzhiyu-theme-menu-title-hover, #000) !important;

      &::before {
        background: var(
          --anzhiyu-theme-menu-hover,
          var(--el-fill-color-light)
        ) !important;
      }
    }

    /* 激活状态 - 主题色背景，白色文字 */
    &.is-active {
      background-color: transparent !important;
      color: #fff !important;

      &::before {
        background: var(--anzhiyu-main, var(--el-color-primary)) !important;
      }

      /* 激活状态下 hover */
      &:hover {
        color: #fff !important;

        &::before {
          background: var(--anzhiyu-main, var(--el-color-primary)) !important;
        }
      }
    }
  }
}

.menu-icon {
  margin-right: 8px;
  font-size: 18px;
}
</style>

<!-- 深色模式适配 - 使用非 scoped 样式 -->
<style lang="scss">
html.dark {
  .settings-sidebar .settings-menu {
    .el-menu-item {
      /* 激活状态 - 深色模式使用半透明白色背景 */
      &.is-active {
        color: #fff !important;

        &::before {
          background: rgb(255 255 255 / 15%) !important;
        }

        &:hover::before {
          background: rgb(255 255 255 / 20%) !important;
        }
      }

      /* hover 状态 - 深色模式 */
      &:hover:not(.is-active) {
        color: #fff !important;

        &::before {
          background: rgb(255 255 255 / 8%) !important;
        }
      }
    }

    .el-sub-menu__title {
      &:hover {
        color: #fff !important;

        &::before {
          background: rgb(255 255 255 / 8%) !important;
        }
      }
    }

    /* 展开的父菜单标题 - 深色模式下为白色 */
    .el-sub-menu.is-opened > .el-sub-menu__title {
      color: #fff !important;

      .menu-icon {
        color: #fff !important;
      }
    }
  }
}
</style>
