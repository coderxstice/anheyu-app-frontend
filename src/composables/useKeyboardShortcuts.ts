import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { storeToRefs } from "pinia";
import { useUiStore } from "@/store/modules/uiStore";
import { useSnackbar } from "@/composables/useSnackbar";
import { useAppStore } from "@/store/modules/app";
import { useArticleStore } from "@/store/modules/articleStore";

export interface Shortcut {
  keys: string[];
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const { dataThemeChange } = useDataThemeChange();
  const uiStore = useUiStore();
  const appStore = useAppStore();
  const articleStore = useArticleStore();
  const { isShortcutsEnabled, useCustomContextMenu } = storeToRefs(uiStore);
  const { toggleShortcuts, toggleContextMenuMode } = uiStore;
  const { showSnackbar } = useSnackbar();
  const showShortcutsPanel = ref(false);
  const isShiftPressed = ref(false);
  const pressedKeys = ref<Set<string>>(new Set());

  // 快捷键定义
  const shortcuts: Shortcut[] = [
    {
      keys: ["Shift", "K"],
      description: "开启/关闭快捷键功能",
      action: () => {
        const wasEnabled = isShortcutsEnabled.value;
        toggleShortcuts();
        showSnackbar(
          `快捷键功能已${wasEnabled ? "关闭" : "开启"}`,
          false,
          2000
        );
        showShortcutsPanel.value = false;
        isShiftPressed.value = false;
        pressedKeys.value.clear();
      }
    },
    {
      keys: ["Shift", "A"],
      description: "打开/关闭中控台",
      action: () => {
        appStore.toggleConsole();
        showShortcutsPanel.value = false;
        isShiftPressed.value = false;
        pressedKeys.value.clear();
      }
    },
    {
      keys: ["Shift", "D"],
      description: "深色/浅色显示模式",
      action: () => {
        const currentTheme =
          document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        dataThemeChange(newTheme);
        showShortcutsPanel.value = false;
        isShiftPressed.value = false;
        pressedKeys.value.clear();
      }
    },
    {
      keys: ["Shift", "S"],
      description: "站内搜索",
      action: () => {
        window.dispatchEvent(new CustomEvent("frontend-open-search"));
        showShortcutsPanel.value = false;
        isShiftPressed.value = false;
        pressedKeys.value.clear();
      }
    },
    {
      keys: ["Shift", "R"],
      description: "随机访问",
      action: () => {
        articleStore.navigateToRandomArticle();
        showShortcutsPanel.value = false;
        isShiftPressed.value = false;
        pressedKeys.value.clear();
      }
    },
    {
      keys: ["Shift", "H"],
      description: "返回首页",
      action: () => {
        router.push("/");
        showShortcutsPanel.value = false;
        isShiftPressed.value = false;
        pressedKeys.value.clear();
      }
    },
    {
      keys: ["Shift", "L"],
      description: "友链页面",
      action: () => {
        router.push("/link");
        showShortcutsPanel.value = false;
        isShiftPressed.value = false;
        pressedKeys.value.clear();
      }
    },
    {
      keys: ["Shift", "P"],
      description: "关于本站",
      action: () => {
        router.push("/about");
        showShortcutsPanel.value = false;
        isShiftPressed.value = false;
        pressedKeys.value.clear();
      }
    },
    {
      keys: ["Shift", "I"],
      description: "原版/本站右键菜单",
      action: () => {
        toggleContextMenuMode();
        showSnackbar(
          `已切换为${useCustomContextMenu.value ? "本站" : "浏览器原生"}右键菜单`,
          false,
          2000
        );
        showShortcutsPanel.value = false;
        isShiftPressed.value = false;
        pressedKeys.value.clear();
      }
    }
  ];

  // 处理键盘按下事件
  const handleKeyDown = (event: KeyboardEvent) => {
    // 忽略在输入框中的按键
    if (isInputElement(event.target as HTMLElement)) {
      return;
    }

    const key = event.key;

    // 检查是否按下 Shift 键
    if (key === "Shift") {
      isShiftPressed.value = true;
      pressedKeys.value.add("Shift");
      // 只有在快捷键功能启用时才显示面板
      if (isShortcutsEnabled.value) {
        showShortcutsPanel.value = true;
      }
      return;
    }

    // 如果 Shift 键已按下，检查其他按键组合
    if (isShiftPressed.value && key) {
      const pressedKey = key.toUpperCase();
      pressedKeys.value.add(pressedKey);

      // 特殊处理总开关快捷键 Shift+K
      if (pressedKey === "K") {
        event.preventDefault();
        const shortcut = shortcuts.find(
          s => s.keys.includes("Shift") && s.keys.includes("K")
        );
        if (shortcut) {
          shortcut.action();
        }
        return;
      }

      // 其他快捷键需要功能开启
      if (!isShortcutsEnabled.value) {
        return;
      }

      // 查找匹配的快捷键
      const shortcut = shortcuts.find(
        s => s.keys.includes("Shift") && s.keys.includes(pressedKey)
      );

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    }
  };

  // 处理键盘释放事件
  const handleKeyUp = (event: KeyboardEvent) => {
    const key = event.key;

    // 防止 key 为 undefined 的情况（特殊输入法或浏览器事件）
    if (!key) return;

    if (key === "Shift") {
      isShiftPressed.value = false;
      pressedKeys.value.delete("Shift");

      // 延迟隐藏面板，给用户时间看到快捷键提示
      setTimeout(() => {
        if (!isShiftPressed.value && pressedKeys.value.size === 0) {
          showShortcutsPanel.value = false;
        }
      }, 300);
    } else {
      pressedKeys.value.delete(key.toUpperCase());

      // 如果没有按键被按下，隐藏面板
      if (pressedKeys.value.size === 0) {
        setTimeout(() => {
          if (pressedKeys.value.size === 0) {
            showShortcutsPanel.value = false;
          }
        }, 100);
      }
    }
  };

  // 检查是否为输入元素
  const isInputElement = (element: HTMLElement | null): boolean => {
    if (!element) return false;

    const inputTags = ["INPUT", "TEXTAREA", "SELECT"];
    const contentEditable = element.getAttribute("contenteditable") === "true";

    return (
      inputTags.includes(element.tagName) ||
      contentEditable ||
      !!element.closest("input, textarea, select, [contenteditable='true']")
    );
  };

  // 处理点击外部关闭面板
  const handleClickOutside = (event: Event) => {
    const target = event.target as HTMLElement;
    if (
      !target.closest(".shortcut-guide-wrapper") &&
      !target.closest(".keyboard-shortcuts-trigger")
    ) {
      showShortcutsPanel.value = false;
      isShiftPressed.value = false;
      pressedKeys.value.clear();
    }
  };

  // 手动显示/隐藏快捷键面板
  const toggleShortcutsPanel = () => {
    showShortcutsPanel.value = !showShortcutsPanel.value;
    if (!showShortcutsPanel.value) {
      isShiftPressed.value = false;
      pressedKeys.value.clear();
    }
  };

  // 强制关闭快捷键面板
  const closeShortcutsPanel = () => {
    showShortcutsPanel.value = false;
    isShiftPressed.value = false;
    pressedKeys.value.clear();
  };

  onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("click", handleClickOutside);

    // 添加页面失去焦点时关闭面板
    window.addEventListener("blur", closeShortcutsPanel);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    document.removeEventListener("click", handleClickOutside);
    window.removeEventListener("blur", closeShortcutsPanel);
  });

  return {
    showShortcutsPanel,
    isShiftPressed,
    shortcuts,
    pressedKeys,
    toggleShortcutsPanel,
    closeShortcutsPanel
  };
}
