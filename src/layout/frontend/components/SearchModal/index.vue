<template>
  <div class="SearchModal">
    <div ref="dialogRef" class="search-dialog">
      <div class="search-nav">
        <div class="search-dialog-title">搜索</div>
        <button
          class="search-close-button"
          aria-label="关闭搜索框"
          @click="closeModal"
        >
          <i class="anzhiyufont anzhiyu-icon-xmark" />
        </button>
      </div>
      <div class="search-wrap">
        <div class="search-input-container">
          <input
            ref="inputRef"
            v-model="keyword"
            class="search-input"
            type="text"
            placeholder="输入关键字，按 Enter 搜索"
            @keydown.enter.prevent="handleEnter"
          />
        </div>
        <div v-if="tipsVisible" class="search-tips">
          <span>按 Esc 关闭</span>
          <span>·</span>
          <span>按 Ctrl/⌘ + K 打开</span>
        </div>
        <div v-if="showResultPlaceholder" class="search-result-placeholder">
          暂未接入数据源，可在此渲染搜索结果
        </div>
      </div>
    </div>
    <div ref="maskRef" class="search-mask" @click="closeModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import { gsap } from "gsap";

/**
 * 使用说明：
 * - 本组件自包含打开/关闭逻辑：
 * 1) 监听文档点击带有 `.anzhiyu-icon-magnifying-glass` 的按钮来打开（不改其他文件）。
 * 2) 监听快捷键：Ctrl/⌘ + K 打开，Esc 关闭。
 * 3) 也可通过触发 window.dispatchEvent(new CustomEvent('frontend-open-search')) 打开。
 * - 动画：
 * 1) 遮罩 `.search-mask` 使用 GSAP 淡入淡出，伴随 display: block/none 切换。
 * 2) 对话框 `.search-dialog` 使用 GSAP 位移+缩放+透明度入场/退场。
 */

const maskRef = ref<HTMLDivElement | null>(null);
const dialogRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

const isOpen = ref(false);
const keyword = ref("");

// 是否展示提示与占位内容（仅作为示例，后续可替换为真实结果渲染）
const tipsVisible = ref(true);
const showResultPlaceholder = computed(() => keyword.value.trim().length > 0);

/**
 * 打开弹窗：执行遮罩与对话框入场动画，并锁定页面滚动
 */
function openModal() {
  if (isOpen.value) return;
  isOpen.value = true;

  const mask = maskRef.value;
  const dialog = dialogRef.value;
  if (!mask || !dialog) return;

  // 锁定滚动，防止背景滚动
  document.documentElement.style.overflow = "hidden";

  // 先显示元素，再做入场动画
  gsap.set(mask, { display: "block", opacity: 0, pointerEvents: "auto" });
  gsap.set(dialog, { display: "flex", opacity: 0, y: 24, scale: 0.98 });

  const tl = gsap.timeline();
  tl.to(mask, {
    duration: 0.3,
    opacity: 1,
    ease: "power2.out",
    // 使用 GPU 合成，避免透明度变化引起的抖动
    force3D: true
  })
    .fromTo(
      dialog,
      { opacity: 0, y: 24, scale: 0.98 },
      {
        duration: 0.35,
        opacity: 1,
        y: 0,
        scale: 1,
        ease: "power3.out",
        // 强制使用 3D 加速，减少末尾 rounding 导致的位移抖动
        force3D: true
      },
      "<" // 与遮罩同时进行
    )
    .add(() => {
      // 聚焦输入框
      nextTick(() => inputRef.value?.focus());
    });
}

/**
 * 关闭弹窗：执行遮罩与对话框退场动画，动画结束后隐藏并解锁滚动
 */
function closeModal() {
  if (!isOpen.value) return;
  const mask = maskRef.value;
  const dialog = dialogRef.value;
  if (!mask || !dialog) return;

  const tl = gsap.timeline({ onComplete: onClosed });
  tl.to(dialog, {
    duration: 0.25,
    opacity: 0,
    y: 16,
    scale: 0.98,
    ease: "power2.inOut",
    force3D: true
  }).to(
    mask,
    { duration: 0.3, opacity: 0, ease: "power2.inOut", force3D: true },
    "<"
  );

  function onClosed() {
    // 动画结束，隐藏元素与解锁滚动
    gsap.set(dialog, { display: "none" });
    gsap.set(mask, { display: "none" });
    document.documentElement.style.overflow = "";
    isOpen.value = false;
    // 可选：清空搜索关键词
    keyword.value = "";
  }
}

/**
 * 回车示例：此处仅演示交互，后续接入实际搜索逻辑
 */
function handleEnter() {
  // 这里可触发真实搜索逻辑
}

/**
 * 键盘事件：
 * - Esc 关闭
 * - Ctrl/⌘ + K 打开
 */
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault();
    closeModal();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openModal();
  }
}

/**
 * 文档点击事件委托：
 * - 监听带有放大镜图标 `.anzhiyu-icon-magnifying-glass` 的点击来打开弹窗
 * 这样无需改动头部组件的代码
 */
function onDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement | null;
  if (!target) return;
  // 兼容点击图标本身或其外层按钮（如 <a class="nav-button">）的情况
  const isSearchIcon = !!(
    target.closest(".anzhiyufont.anzhiyu-icon-magnifying-glass") ||
    target
      .closest("a")
      ?.querySelector(".anzhiyufont.anzhiyu-icon-magnifying-glass")
  );
  if (isSearchIcon) {
    e.preventDefault();
    openModal();
  }
}

onMounted(() => {
  // 初始化为隐藏状态
  if (maskRef.value) {
    gsap.set(maskRef.value, { display: "none", opacity: 0 });
  }
  if (dialogRef.value) {
    gsap.set(dialogRef.value, { display: "none", opacity: 0 });
  }

  // 绑定事件
  window.addEventListener("keydown", onKeydown);
  document.addEventListener("click", onDocumentClick, {
    capture: true
  });

  window.addEventListener("frontend-open-search", openModal as EventListener);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  document.removeEventListener("click", onDocumentClick, {
    capture: true
  } as any);
  window.removeEventListener(
    "frontend-open-search",
    openModal as EventListener
  );
});
</script>

<style scoped lang="scss">
.search-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  pointer-events: auto;
  transform: translateZ(0);
  background: var(--anzhiyu-maskbgdeep);
  backdrop-filter: blur(12px);
}

.search-dialog {
  position: fixed;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  padding: 0;
  width: 36rem;
  max-width: 90vw;
  background: var(--anzhiyu-card-bg);
  border-radius: 16px;
  box-shadow: var(--anzhiyu-shadow-lightblack);
  border: var(--style-border);
  transition:
    background-color 0.3s,
    box-shadow 0.3s,
    border-color 0.3s;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: 5rem auto;
  height: fit-content;
  max-height: 80dvh;
  will-change: transform, opacity;
}

.search-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  flex-shrink: 0;
}

.search-dialog-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--anzhiyu-fontcolor);
}

.search-close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: var(--anzhiyu-secondtext);
  transition: background-color 0.2s;
}

.search-close-button:hover {
  color: var(--anzhiyu-white);
  background: var(--anzhiyu-lighttext);
}

.search-close-button .anzhiyufont {
  font-size: 1.1rem;
}

.search-wrap {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0 1.5rem 1.5rem;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-icon {
  position: absolute;
  left: 1rem;
  color: var(--anzhiyu-secondtext);
  font-size: 1.1rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  font-size: 1rem;
  outline: none;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    box-shadow 0.2s;

  color: var(--search-input-color);
  padding: 0.25rem 0.7rem;
  outline: 0px;
  background: var(--anzhiyu-secondbg);
  border: var(--style-border);
  border-radius: 8px;
}

.search-input:focus {
  border-color: var(--anzhiyu-theme);
  background-color: var(--anzhiyu-card-bg);
  box-shadow: 0 0 0 3px var(--anzhiyu-theme-op);
}

.search-input::placeholder {
  color: var(--anzhiyu-secondtext);
}

.search-tips {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--anzhiyu-secondtext);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.search-result-placeholder {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 10px;
  border: 1px dashed var(--anzhiyu-gray-2);
  color: var(--anzhiyu-secondtext);
  text-align: center;
}
</style>
