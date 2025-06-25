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
import { ref, onMounted, onUnmounted, watch } from "vue";
import gsap from "gsap";
import { useFileStore } from "@/store/modules/fileStore";
import AnIconBox from "@/components/AnIconBox/index.vue";

// 图标
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

export interface MenuItem {
  label?: string;
  icon?: object;
  action?: string;
  danger?: boolean;
  divider?: boolean;
  color?: string; // 添加 color 属性
}

// 父组件只需要提供一个触发菜单的事件，不再需要管理 visible、x、y、items
const props = defineProps<{
  /** 接收触发菜单的鼠标事件，由父组件传入 */
  triggerEvent: MouseEvent | null;
}>();

const emit = defineEmits<{
  (e: "select", action: string, context?: any): void;
  /** 当菜单关闭时，父组件可能需要清除 triggerEvent */
  (e: "closed"): void;
}>();

// --- 内部状态管理 ---
const fileStore = useFileStore(); // 菜单需要访问文件选择状态
const contextMenuRef = ref<HTMLElement | null>(null);

const localVisible = ref(false); // 菜单自身的可见性状态
const x = ref(0); // 菜单的 X 坐标
const y = ref(0); // 菜单的 Y 坐标
const localItems = ref<MenuItem[]>([]); // 菜单项
const menuContext = ref<any>(null); // 菜单的上下文数据

// --- 右键菜单定义 ---
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
  // 阻止默认的浏览器右键菜单
  event.preventDefault();

  x.value = event.clientX;
  y.value = event.clientY;

  const target = event.target as HTMLElement;
  // 查找最近的文件项或网格项，用于判断点击上下文
  const itemElement = target.closest(
    ".deselect-safe-zone.file-item, .deselect-safe-zone.grid-item"
  );

  if (itemElement) {
    const itemId = (itemElement as HTMLElement).dataset.id;
    if (itemId && !fileStore.selectedFiles.has(itemId)) {
      // 如果点击的是文件项且未选中，则选中它
      fileStore.selectSingle(itemId);
    }
    localItems.value = itemMenu;
    menuContext.value = { selectedIds: [...fileStore.selectedFiles] };
    console.log("【ContextMenu】点击文件项，设置文件菜单。", localItems.value);
  } else {
    // 否则点击的是空白区域
    localItems.value = blankMenu;
    menuContext.value = null;
    console.log(
      "【ContextMenu】点击空白区域，设置空白菜单。",
      localItems.value
    );
  }

  localVisible.value = true; // 显示菜单
  console.log("【ContextMenu】菜单已打开。当前状态:", {
    x: x.value,
    y: y.value,
    visible: localVisible.value,
    items: localItems.value
  });
};

const closeMenu = () => {
  console.log("【ContextMenu】closeMenu 被调用，设置 visible 为 false。");
  localVisible.value = false;
  // 通知父组件菜单已关闭，父组件可以清空 triggerEvent
  emit("closed");
};

const onItemClick = (item: MenuItem) => {
  if (item.action) {
    emit("select", item.action, menuContext.value); // 传递上下文信息
  }
  closeMenu();
};

// --- GSAP 动画钩子 ---
const onMenuEnter = (el: Element, done: () => void) => {
  console.log("【ContextMenu】GSAP 动画：菜单进入");
  gsap.fromTo(
    el,
    {
      opacity: 0,
      scale: 0.8,
      transformOrigin: "top left"
    },
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
  console.log("【ContextMenu】GSAP 动画：菜单离开");
  gsap.to(el, {
    opacity: 0,
    scale: 0.8,
    duration: 0.2,
    ease: "power2.in",
    onComplete: done
  });
};

// --- 监听父组件传入的 triggerEvent ---
watch(
  () => props.triggerEvent,
  newEvent => {
    if (newEvent) {
      console.log("【ContextMenu】接收到新的触发事件:", newEvent);
      openMenu(newEvent);
    } else if (!newEvent && localVisible.value) {
      // 如果 triggerEvent 被清空，并且菜单当前是可见的，则关闭菜单
      closeMenu();
    }
  }
);

// --- 生命周期钩子 ---
onMounted(() => {
  console.log("【ContextMenu】组件已挂载。");
});

onUnmounted(() => {
  console.log("【ContextMenu】组件已卸载。");
});
</script>

<style scoped lang="scss">
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
