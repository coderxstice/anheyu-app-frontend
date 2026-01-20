<template>
  <div class="footer-link-editor">
    <el-alert
      title="管理页脚的多栏链接列表。每「栏」包含一个标题和多个链接。支持拖拽排序。"
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom: 16px"
    />
    <!-- 主栏目列表（支持拖拽排序） -->
    <div ref="columnListRef" class="column-list">
      <div
        v-for="(column, colIndex) in listData"
        :key="`column-${colIndex}`"
        class="column-item"
      >
        <div class="column-header">
          <div class="column-drag-handle" title="拖拽排序栏目">
            <el-icon><Rank /></el-icon>
          </div>
          <span class="column-title">第 {{ colIndex + 1 }} 栏</span>
          <el-button
            type="danger"
            :icon="Delete"
            circle
            plain
            :disabled="!canRemoveColumn"
            @click="removeColumn(colIndex)"
          />
        </div>
        <div class="column-content">
          <el-form-item label="栏目标题" required>
            <el-input v-model="column.title" placeholder="例如：服务" />
          </el-form-item>

          <!-- 链接列表（支持拖拽排序） -->
          <div class="links-section">
            <div class="links-header">
              <span class="links-title">链接列表</span>
              <span class="links-tip">拖拽左侧手柄可调整链接顺序</span>
            </div>
            <div
              :ref="el => setLinksRef(el, colIndex)"
              class="links-list"
              :data-column-index="colIndex"
            >
              <div
                v-for="(linkItem, linkIndex) in column.links"
                :key="`link-${colIndex}-${linkIndex}`"
                class="link-row"
              >
                <div class="link-drag-handle" title="拖拽排序链接">
                  <el-icon><Rank /></el-icon>
                </div>
                <div class="link-inputs">
                  <el-input
                    v-model="linkItem.title"
                    placeholder="链接标题，例如：站点地图"
                    class="link-title-input"
                  />
                  <el-input
                    v-model="linkItem.link"
                    placeholder="链接地址，例如：/sitemap"
                    class="link-url-input"
                  />
                </div>
                <el-button
                  type="danger"
                  :icon="Delete"
                  circle
                  size="small"
                  @click="removeLink(colIndex, linkIndex)"
                />
              </div>
            </div>
          </div>
          <el-button
            class="add-link-btn"
            :icon="Plus"
            @click="addLink(colIndex)"
          >
            添加链接
          </el-button>
        </div>
      </div>
    </div>

    <el-button
      type="primary"
      style="width: 100%; margin-top: 16px"
      :disabled="!canAddColumn"
      @click="addColumn"
    >
      <el-icon><Plus /></el-icon>
      <span>添加新一栏 (最多 5 栏)</span>
    </el-button>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount
} from "vue";
import { ElMessage } from "element-plus";
import { Plus, Delete, Rank } from "@element-plus/icons-vue";
import Sortable from "sortablejs";

// 为数据结构定义清晰的类型
interface LinkItem {
  title: string;
  link: string;
}
interface ColumnItem {
  title: string;
  links: LinkItem[];
}

const props = defineProps<{
  modelValue: string; // 接收 v-model 的 JSON 字符串
}>();

const emit = defineEmits(["update:modelValue"]);

const listData = ref<ColumnItem[]>([]);

// 拖拽排序相关
const columnListRef = ref<HTMLElement | null>(null);
const linksRefs = ref<Map<number, HTMLElement>>(new Map());
let columnSortable: Sortable | null = null;
const linksSortables: Map<number, Sortable> = new Map();

// 设置链接列表的 ref
const setLinksRef = (el: any, colIndex: number) => {
  if (el) {
    linksRefs.value.set(colIndex, el as HTMLElement);
  }
};

// 计算属性，用于控制按钮的禁用状态，实现限制
const canAddColumn = computed(() => listData.value.length < 5);
const canRemoveColumn = computed(() => listData.value.length > 1);

// 初始化栏目拖拽排序
const initColumnSortable = () => {
  if (columnListRef.value && !columnSortable) {
    columnSortable = Sortable.create(columnListRef.value, {
      animation: 200,
      handle: ".column-drag-handle",
      ghostClass: "column-ghost",
      chosenClass: "column-chosen",
      dragClass: "column-drag",
      onEnd: (evt: Sortable.SortableEvent) => {
        const { oldIndex, newIndex } = evt;
        if (
          oldIndex !== undefined &&
          newIndex !== undefined &&
          oldIndex !== newIndex
        ) {
          const currentList = [...listData.value];
          const [movedItem] = currentList.splice(oldIndex, 1);
          currentList.splice(newIndex, 0, movedItem);
          listData.value = currentList;
          ElMessage.success("栏目顺序已更新");
          // 重新初始化链接的拖拽排序
          nextTick(() => {
            initAllLinksSortable();
          });
        }
      }
    });
  }
};

// 初始化单个栏目内链接的拖拽排序
const initLinksSortable = (colIndex: number) => {
  const linksEl = linksRefs.value.get(colIndex);
  if (linksEl) {
    // 先销毁旧实例
    const existingSortable = linksSortables.get(colIndex);
    if (existingSortable) {
      existingSortable.destroy();
      linksSortables.delete(colIndex);
    }

    const sortable = Sortable.create(linksEl, {
      animation: 200,
      handle: ".link-drag-handle",
      ghostClass: "link-ghost",
      chosenClass: "link-chosen",
      dragClass: "link-drag",
      onEnd: (evt: Sortable.SortableEvent) => {
        const { oldIndex, newIndex } = evt;
        const columnIndex = parseInt(
          (evt.from as HTMLElement).dataset.columnIndex || "0"
        );
        if (
          oldIndex !== undefined &&
          newIndex !== undefined &&
          oldIndex !== newIndex
        ) {
          const currentLinks = [...listData.value[columnIndex].links];
          const [movedLink] = currentLinks.splice(oldIndex, 1);
          currentLinks.splice(newIndex, 0, movedLink);
          listData.value[columnIndex].links = currentLinks;
          ElMessage.success("链接顺序已更新");
        }
      }
    });
    linksSortables.set(colIndex, sortable);
  }
};

// 初始化所有链接的拖拽排序
const initAllLinksSortable = () => {
  // 先销毁所有旧实例
  linksSortables.forEach(sortable => sortable.destroy());
  linksSortables.clear();

  // 为每个栏目初始化链接拖拽排序
  listData.value.forEach((_, index) => {
    initLinksSortable(index);
  });
};

// 销毁所有拖拽排序实例
const destroyAllSortables = () => {
  if (columnSortable) {
    columnSortable.destroy();
    columnSortable = null;
  }
  linksSortables.forEach(sortable => sortable.destroy());
  linksSortables.clear();
};

// 监听外部传入的 modelValue，并解析为内部使用的数据
watch(
  () => props.modelValue,
  newVal => {
    try {
      // 避免当内部更新触发外部更新时，再次解析，导致光标跳动
      if (newVal === JSON.stringify(listData.value, null, 2)) return;

      const parsedData = JSON.parse(newVal || "[]");
      if (Array.isArray(parsedData)) {
        listData.value = parsedData;
      } else {
        listData.value = [];
      }
    } catch (e) {
      console.error("页脚链接列表JSON解析失败:", e);
      listData.value = [];
    }
  },
  { immediate: true }
);

// 监听内部数据的变化，并通知父组件更新 v-model
watch(
  listData,
  newVal => {
    // 使用 a, b, 2 参数进行美化，方便阅读
    emit("update:modelValue", JSON.stringify(newVal, null, 2));
  },
  { deep: true }
);

// 监听数据长度变化，重新初始化拖拽排序
watch(
  () => listData.value.length,
  () => {
    nextTick(() => {
      destroyAllSortables();
      if (listData.value.length > 0) {
        initColumnSortable();
        initAllLinksSortable();
      }
    });
  }
);

onMounted(() => {
  nextTick(() => {
    if (listData.value.length > 0) {
      initColumnSortable();
      initAllLinksSortable();
    }
  });
});

onBeforeUnmount(() => {
  destroyAllSortables();
});

// --- 操作方法 ---
const addColumn = () => {
  if (!canAddColumn.value) {
    ElMessage.warning("最多只能添加 5 个栏目。");
    return;
  }
  listData.value.push({ title: "", links: [{ title: "", link: "" }] });
  // 为新栏目初始化链接拖拽排序
  nextTick(() => {
    initLinksSortable(listData.value.length - 1);
  });
};

const removeColumn = (index: number) => {
  if (!canRemoveColumn.value) {
    ElMessage.warning("至少需要保留 1 个栏目。");
    return;
  }
  // 销毁对应的链接拖拽排序实例
  const sortable = linksSortables.get(index);
  if (sortable) {
    sortable.destroy();
    linksSortables.delete(index);
  }
  listData.value.splice(index, 1);
};

const addLink = (columnIndex: number) => {
  listData.value[columnIndex].links.push({ title: "", link: "" });
};

const removeLink = (columnIndex: number, linkIndex: number) => {
  listData.value[columnIndex].links.splice(linkIndex, 1);
};
</script>

<style scoped lang="scss">
.footer-link-editor {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.column-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.column-item {
  background-color: var(--anzhiyu-background);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--anzhiyu-theme-op);
    box-shadow: var(--anzhiyu-shadow-border);
  }
}

.column-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background-color: var(--anzhiyu-secondbg);
  border-bottom: 1px solid var(--el-border-color-light);
}

.column-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--anzhiyu-secondtext);
  cursor: grab;
  background: var(--anzhiyu-card-bg);
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    color: var(--anzhiyu-theme);
    background: var(--anzhiyu-theme-op);
  }

  &:active {
    cursor: grabbing;
  }
}

.column-title {
  flex: 1;
  font-size: 14px;
  font-weight: bold;
}

.column-content {
  padding: 16px;
}

.links-section {
  margin-top: 12px;
}

.links-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.links-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--anzhiyu-fontcolor);
}

.links-tip {
  font-size: 12px;
  color: var(--anzhiyu-secondtext);
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--anzhiyu-secondbg);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    border-color: var(--anzhiyu-theme-op);
    background: var(--anzhiyu-card-bg);

    .link-drag-handle {
      opacity: 1;
    }
  }
}

.link-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--anzhiyu-secondtext);
  cursor: grab;
  border-radius: 4px;
  opacity: 0.6;
  transition: all 0.2s;

  &:hover {
    color: var(--anzhiyu-theme);
    background: var(--anzhiyu-theme-op);
    opacity: 1;
  }

  &:active {
    cursor: grabbing;
  }

  .el-icon {
    font-size: 14px;
  }
}

.link-inputs {
  flex: 1;
  display: flex;
  gap: 8px;
}

.link-title-input {
  flex: 1;
}

.link-url-input {
  flex: 1.5;
}

.add-link-btn {
  width: 100%;
  margin-top: 12px;
  border-style: dashed;
}

/* 栏目拖拽排序样式 */
.column-ghost {
  opacity: 0.5;
  background: var(--anzhiyu-theme-op) !important;
  border-color: var(--anzhiyu-theme) !important;
  border-style: dashed !important;
}

.column-chosen {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15) !important;
  transform: scale(1.01);
}

.column-drag {
  opacity: 0.9;
  background: var(--anzhiyu-card-bg) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
}

/* 链接拖拽排序样式 */
.link-ghost {
  opacity: 0.5;
  background: var(--anzhiyu-theme-op) !important;
  border-color: var(--anzhiyu-theme) !important;
  border-style: dashed !important;
}

.link-chosen {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12) !important;
}

.link-drag {
  opacity: 0.9;
  background: var(--anzhiyu-card-bg) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .link-inputs {
    flex-direction: column;
    gap: 6px;
  }

  .link-title-input,
  .link-url-input {
    flex: 1;
  }

  .links-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
