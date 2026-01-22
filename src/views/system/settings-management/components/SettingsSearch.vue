<template>
  <div class="settings-search">
    <el-popover
      :visible="showResults"
      placement="bottom-start"
      :width="400"
      :show-arrow="false"
      popper-class="settings-search-popover"
    >
      <template #reference>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索设置..."
          :prefix-icon="Search"
          clearable
          class="search-input"
          @focus="handleFocus"
          @blur="handleBlur"
          @input="handleSearch"
        />
      </template>

      <div v-if="searchResults.length > 0" class="search-results">
        <div
          v-for="result in searchResults"
          :key="result.key"
          class="search-result-item"
          @mousedown.prevent="handleResultClick(result)"
        >
          <div class="result-category">{{ result.categoryLabel }}</div>
          <div class="result-label">{{ result.label }}</div>
          <div v-if="result.keywords" class="result-keywords">
            {{ result.keywords.slice(0, 3).join(" · ") }}
          </div>
        </div>
      </div>

      <div v-else-if="searchKeyword" class="search-empty">
        <el-empty description="未找到相关设置" :image-size="60" />
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Search } from "@element-plus/icons-vue";
import {
  settingsMenuConfig,
  type SettingsMenuChild
} from "../settings.descriptor";

interface SearchResult {
  key: string;
  label: string;
  categoryLabel: string;
  keywords?: string[];
}

const emit = defineEmits<{
  (e: "navigate", key: string): void;
}>();

const searchKeyword = ref("");
const isFocused = ref(false);

// 构建搜索索引
const searchIndex = computed<SearchResult[]>(() => {
  const results: SearchResult[] = [];

  settingsMenuConfig.forEach(category => {
    category.children?.forEach(child => {
      results.push({
        key: child.key,
        label: child.label,
        categoryLabel: category.label,
        keywords: child.keywords
      });
    });
  });

  return results;
});

// 搜索结果
const searchResults = computed<SearchResult[]>(() => {
  if (!searchKeyword.value.trim()) return [];

  const keyword = searchKeyword.value.toLowerCase();

  return searchIndex.value.filter(item => {
    // 匹配标签
    if (item.label.toLowerCase().includes(keyword)) return true;
    // 匹配分类
    if (item.categoryLabel.toLowerCase().includes(keyword)) return true;
    // 匹配关键词
    if (item.keywords?.some(k => k.toLowerCase().includes(keyword))) {
      return true;
    }
    return false;
  });
});

const showResults = computed(
  () => isFocused.value && searchKeyword.value.trim().length > 0
);

const handleFocus = () => {
  isFocused.value = true;
};

const handleBlur = () => {
  // 延迟关闭，以便处理点击事件
  setTimeout(() => {
    isFocused.value = false;
  }, 200);
};

const handleSearch = () => {
  // 搜索逻辑已通过 computed 自动处理
};

const handleResultClick = (result: SearchResult) => {
  emit("navigate", result.key);
  searchKeyword.value = "";
  isFocused.value = false;
};
</script>

<style scoped lang="scss">
.settings-search {
  width: 280px;
  flex-shrink: 1;
  min-width: 120px;
}

.search-input {
  :deep(.el-input__wrapper) {
    border-radius: 8px;
    background: var(--el-fill-color-light);
    box-shadow: none;
    transition: all 0.2s;

    &:hover,
    &:focus-within {
      background: var(--el-bg-color);
      box-shadow: 0 0 0 1px var(--el-border-color);
    }
  }
}

.search-results {
  max-height: 360px;
  overflow-y: auto;
}

.search-result-item {
  padding: 12px 16px;
  cursor: pointer;
  border-radius: 8px;
  margin: 4px;
  transition: background 0.2s;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.result-category {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.result-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.result-keywords {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.search-empty {
  padding: 20px;
}

// ==================== 平板端适配 ====================
@media (max-width: 1024px) {
  .settings-search {
    width: 200px;
  }
}

// ==================== 移动端适配 ====================
@media (max-width: 768px) {
  .settings-search {
    width: 160px;
    min-width: 100px;
  }

  .search-input {
    :deep(.el-input__inner) {
      font-size: 13px;

      &::placeholder {
        font-size: 13px;
      }
    }
  }
}

// ==================== 小屏移动端适配 ====================
@media (max-width: 480px) {
  .settings-search {
    flex: 1;
    width: auto;
    min-width: 0;
  }

  .search-input {
    :deep(.el-input__wrapper) {
      padding: 0 8px;
    }

    :deep(.el-input__inner) {
      font-size: 14px;
    }
  }
}
</style>

<style lang="scss">
.settings-search-popover {
  padding: 8px !important;
  border-radius: 12px !important;
}

// 移动端弹出层宽度适配
@media (max-width: 768px) {
  .settings-search-popover {
    max-width: calc(100vw - 32px) !important;
  }
}
</style>
