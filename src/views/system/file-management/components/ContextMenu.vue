<template>
  <Teleport to="body">
    <div v-if="localVisible" class="context-menu-overlay" @click="closeMenu" />

    <Transition
      name="context-menu-fade-scale"
      :css="false"
      @enter="onMenuEnter"
      @leave="onMenuLeave"
    >
      <div
        v-if="localVisible"
        ref="contextMenuRef"
        class="context-menu"
        :style="{ left: `${x}px`, top: `${y}px` }"
        @contextmenu.prevent
      >
        <ul>
          <li
            v-for="(item, index) in localItems"
            :key="index"
            class="menu-item"
            :class="{
              divider: item.divider,
              danger: item.danger
            }"
            @click.stop="onItemClick(item)"
          >
            <template v-if="!item.divider">
              <div class="flex items-center mr-2">
                <AnIconBox :color="item.color || ''">
                  <IconifyIconOffline
                    v-if="item.icon"
                    :icon="item.icon"
                    class="menu-icon"
                  />
                </AnIconBox>
              </div>
              <span>{{ item.label }}</span>
            </template>
          </li>
        </ul>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import gsap from "gsap";
import AnIconBox from "@/components/AnIconBox/index.vue";

// 图标（保持不变）
import Upload from "@iconify-icons/ep/upload";
import FolderAdd from "@iconify-icons/ep/folder-add";
import DocumentAdd from "@iconify-icons/ep/document-add";
import Refresh from "@iconify-icons/ep/refresh";
import EditPen from "@iconify-icons/ep/edit-pen";
import Delete from "@iconify-icons/ep/delete";
import Download from "@iconify-icons/ep/download";
import Share from "@iconify-icons/ep/share";
import CopyDocument from "@iconify-icons/ep/copy-document";
import Rank from "@iconify-icons/ep/rank";
import Info from "@iconify-icons/ep/info-filled";

export interface MenuItem {
  label?: string;
  icon?: object;
  action?: string;
  danger?: boolean;
  divider?: boolean;
  color?: string;
}

const props = defineProps<{
  /** 接收触发菜单的鼠标事件 */
  triggerEvent: MouseEvent | null;
  /** 接收当前已选择的文件ID集合 */
  selectedFileIds: Set<string>;
}>();

const emit = defineEmits<{
  (e: "select", action: string, context?: any): void;
  (e: "closed"): void;
  (e: "request-select-single", fileId: string): void;
  (e: "request-clear-selection"): void;
}>();

// --- 内部状态管理 ---
const contextMenuRef = ref<HTMLElement | null>(null);
const localVisible = ref(false);
const x = ref(0);
const y = ref(0);
const localItems = ref<MenuItem[]>([]);
const menuContext = ref<any>(null);

// --- 右键菜单定义 (保持不变) ---
const blankMenu: MenuItem[] = [
  { label: "上传文件", action: "upload-file", icon: Upload, color: "#1677FF" },
  {
    label: "上传目录",
    action: "upload-dir",
    icon: FolderAdd,
    color: "#62C558"
  },
  { divider: true },
  {
    label: "创建文件夹",
    action: "create-folder",
    icon: FolderAdd,
    color: "#A15FDE"
  },
  {
    label: "创建 Markdown (.md)",
    action: "create-md",
    icon: DocumentAdd,
    color: "#F6775C"
  },
  {
    label: "创建 文本 (.txt)",
    action: "create-txt",
    icon: DocumentAdd,
    color: "#5FDEB8"
  },
  { divider: true },
  { label: "刷新", action: "refresh", icon: Refresh, color: "#4F6BF6" }
];
const itemMenu: MenuItem[] = [
  { label: "重命名", action: "rename", icon: EditPen, color: "#4F6BF6" },
  { label: "移动到", action: "move", icon: Rank, color: "#62C558" },
  { label: "下载", action: "download", icon: Download, color: "#1677FF" },
  { label: "分享", action: "share", icon: Share, color: "#A15FDE" },
  { label: "复制", action: "copy", icon: CopyDocument, color: "#f6c75c" },
  { label: "详细信息", action: "info", icon: Info, color: "#b9b7b2" },
  { divider: true },
  {
    label: "删除",
    action: "delete",
    icon: Delete,
    danger: true,
    color: "#F6775C"
  }
];

// --- 菜单操作函数 ---
const openMenu = (event: MouseEvent) => {
  event.preventDefault();
  x.value = event.clientX;
  y.value = event.clientY;

  const target = event.target as HTMLElement;
  const itemElement = target.closest(
    ".deselect-safe-zone.file-item, .deselect-safe-zone.grid-item"
  );

  if (itemElement) {
    const itemId = (itemElement as HTMLElement).dataset.id;
    let finalSelectedIds = new Set(props.selectedFileIds);

    if (itemId && !props.selectedFileIds.has(itemId)) {
      // **关键修改点**: 发出事件请求父组件进行单选，而不是自己操作
      emit("request-select-single", itemId);
      // 父组件会同步更新 selectedFileIds prop，我们在这里乐观更新
      finalSelectedIds = new Set([itemId]);
    }
    localItems.value = itemMenu;
    menuContext.value = { selectedIds: [...finalSelectedIds] };
  } else {
    // 点击空白区域
    localItems.value = blankMenu;
    menuContext.value = null; // 空白区域没有上下文
  }

  localVisible.value = true;
};

const closeMenu = () => {
  if (!localVisible.value) return;
  localVisible.value = false;
  emit("closed");
};

const onItemClick = (item: MenuItem) => {
  if (item.action) {
    emit("select", item.action, menuContext.value);
  }
  closeMenu();
};

// --- 动画钩子 (保持不变) ---
const onMenuEnter = (el: Element, done: () => void) => {
  gsap.fromTo(
    el,
    { opacity: 0, scale: 0.8, transformOrigin: "top left" },
    {
      opacity: 1,
      scale: 1,
      duration: 0.25,
      ease: "back.out(1.7)",
      onComplete: done
    }
  );
};
const onMenuLeave = (el: Element, done: () => void) => {
  gsap.to(el, {
    opacity: 0,
    scale: 0.8,
    duration: 0.2,
    ease: "power2.in",
    onComplete: done
  });
};

// --- 监听 ---
watch(
  () => props.triggerEvent,
  newEvent => {
    if (newEvent) {
      openMenu(newEvent);
    } else if (!newEvent && localVisible.value) {
      closeMenu();
    }
  }
);
</script>

<style scoped lang="scss">
// 样式保持不变
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: transparent;
  z-index: 2999;
  cursor: default;
}

.context-menu {
  position: fixed;
  z-index: 3000;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  padding: 6px;
  min-width: 180px;
  opacity: 0;
  transform: scale(0.8);
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}
.menu-item:not(.divider):hover {
  background-color: var(--anzhiyu-ahoverbg);
}
.menu-icon {
  width: 1em;
  height: 1em;
}
.menu-item.danger {
  color: var(--el-color-error);
}
.menu-item.danger:hover {
  background-color: var(--el-color-error);
  color: #fff;
}
.menu-item.divider {
  height: 1px;
  padding: 0;
  margin: 6px 0;
  background-color: #e0e0e0;
  cursor: default;
}
</style>
