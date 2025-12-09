<template>
  <div class="creativity-editor">
    <el-divider content-position="left">技能/创造力配置</el-divider>

    <el-form-item label="模块标题">
      <el-input
        :model-value="localValue.title || ''"
        placeholder="例如：技能"
        clearable
        @update:model-value="updateField('title', $event)"
      />
    </el-form-item>

    <el-form-item label="模块副标题">
      <el-input
        :model-value="localValue.subtitle || ''"
        placeholder="例如：开启创造力"
        clearable
        @update:model-value="updateField('subtitle', $event)"
      />
    </el-form-item>

    <div class="skill-list-container">
      <div class="list-header">
        <div class="header-left">
          <h4>技能列表</h4>
          <el-tag
            v-if="localValue.creativity_list?.length"
            type="info"
            size="small"
          >
            {{ localValue.creativity_list.length }} 个技能
          </el-tag>
        </div>
        <div class="header-actions">
          <el-button-group>
            <el-button
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              size="small"
              @click="viewMode = 'grid'"
            >
              <el-icon><Grid /></el-icon>
              网格
            </el-button>
            <el-button
              :type="viewMode === 'list' ? 'primary' : 'default'"
              size="small"
              @click="viewMode = 'list'"
            >
              <el-icon><List /></el-icon>
              列表
            </el-button>
          </el-button-group>
          <el-button type="primary" size="small" @click="addSkill">
            <el-icon><Plus /></el-icon>
            添加技能
          </el-button>
        </div>
      </div>

      <!-- 网格视图 -->
      <div
        v-if="localValue.creativity_list?.length && viewMode === 'grid'"
        class="skill-grid"
      >
        <transition-group
          name="skill-grid"
          tag="div"
          class="skill-grid-container"
        >
          <div
            v-for="(skill, index) in localValue.creativity_list"
            :key="`skill-${index}`"
            class="skill-grid-item"
            @click="editingIndex = index"
          >
            <div class="skill-grid-content">
              <div
                class="skill-icon-preview"
                :style="{ backgroundColor: skill.color || '#fff' }"
              >
                <img
                  v-if="
                    skill.icon &&
                    (skill.icon.startsWith('http') ||
                      skill.icon.startsWith('https') ||
                      skill.icon.startsWith('data:'))
                  "
                  :src="skill.icon"
                  :alt="skill.name"
                  class="skill-icon-img"
                />
                <IconifyIconOnline
                  v-else-if="skill.icon && skill.icon.includes(':')"
                  :icon="skill.icon"
                  width="36"
                  height="36"
                  class="skill-icon-iconify"
                />
                <i
                  v-else-if="skill.icon"
                  :class="skill.icon"
                  class="skill-icon-font"
                />
                <el-icon v-else class="skill-icon-placeholder"><Box /></el-icon>
              </div>
              <div class="skill-info">
                <span class="skill-name">{{ skill.name || "未命名" }}</span>
              </div>
              <div class="skill-grid-actions">
                <el-button
                  type="primary"
                  size="small"
                  circle
                  @click.stop="editingIndex = index"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  circle
                  @click.stop="removeSkill(index)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </transition-group>
      </div>

      <!-- 列表视图 -->
      <div
        v-else-if="localValue.creativity_list?.length && viewMode === 'list'"
        class="skill-list"
      >
        <el-table
          :data="localValue.creativity_list"
          stripe
          :style="{ width: '100%' }"
        >
          <el-table-column label="图标" width="80" align="center">
            <template #default="{ row }">
              <div
                class="skill-table-icon"
                :style="{ backgroundColor: row.color || '#fff' }"
              >
                <img
                  v-if="
                    row.icon &&
                    (row.icon.startsWith('http') ||
                      row.icon.startsWith('https') ||
                      row.icon.startsWith('data:'))
                  "
                  :src="row.icon"
                  :alt="row.name"
                  class="skill-icon-img"
                />
                <IconifyIconOnline
                  v-else-if="row.icon && row.icon.includes(':')"
                  :icon="row.icon"
                  width="24"
                  height="24"
                  class="skill-icon-iconify"
                />
                <i
                  v-else-if="row.icon"
                  :class="row.icon"
                  class="skill-icon-font"
                />
                <el-icon v-else class="skill-icon-placeholder"><Box /></el-icon>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="技能名称" prop="name" min-width="150">
            <template #default="{ row }">
              {{ row.name || "未命名" }}
            </template>
          </el-table-column>
          <el-table-column label="背景颜色" prop="color" width="120">
            <template #default="{ row }">
              <el-tag
                :style="{ backgroundColor: row.color || '#fff', color: '#333' }"
              >
                {{ row.color || "默认" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="图标类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">
                {{
                  row.icon?.startsWith("http") || row.icon?.startsWith("data:")
                    ? "图片"
                    : row.icon
                      ? "图标"
                      : "无"
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ $index }">
              <el-button
                type="primary"
                size="small"
                @click="editingIndex = $index"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="removeSkill($index)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-empty v-else description="暂无技能项" :image-size="80">
        <el-button type="primary" size="small" @click="addSkill">
          <el-icon><Plus /></el-icon>
          添加第一个技能
        </el-button>
      </el-empty>
    </div>

    <!-- 编辑弹窗 -->
    <AnDialog
      v-model="editDialogVisible"
      :title="editingIndex === -1 ? '添加技能' : '编辑技能'"
      width="500px"
      :show-footer="true"
      :confirm-text="editingIndex === -1 ? '添加' : '保存'"
      cancel-text="取消"
      @confirm="saveEditingSkill"
      @close="closeEditDialog"
    >
      <el-form v-if="editingSkill" label-width="100px">
        <el-form-item label="技能名称" required>
          <el-input
            v-model="editingSkill.name"
            placeholder="例如：Vue.js"
            clearable
          />
        </el-form-item>

        <el-form-item label="背景颜色">
          <el-row :gutter="10" align="middle">
            <el-col :span="16">
              <el-input
                v-model="editingSkill.color"
                placeholder="例如：#42b883 或 transparent"
              />
            </el-col>
            <el-col :span="8">
              <el-color-picker
                v-model="editingSkill.color"
                show-alpha
                :predefine="predefineColors"
              />
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="图标设置">
          <IconSelector v-model="editingSkill.icon" :exclude-anzhiyu="true" />
        </el-form-item>

        <!-- 预览 -->
        <el-form-item label="效果预览">
          <div class="skill-preview-box creativity-editor-preview">
            <div
              class="skill-preview-item"
              :style="{ backgroundColor: editingSkill.color || '#fff' }"
            >
              <img
                v-if="
                  editingSkill.icon &&
                  (editingSkill.icon.startsWith('http') ||
                    editingSkill.icon.startsWith('https') ||
                    editingSkill.icon.startsWith('data:'))
                "
                :src="editingSkill.icon"
                :alt="editingSkill.name"
                class="skill-icon-img"
              />
              <IconifyIconOnline
                v-else-if="editingSkill.icon && editingSkill.icon.includes(':')"
                :icon="editingSkill.icon"
                width="36"
                height="36"
                class="skill-icon-iconify"
              />
              <i
                v-else-if="editingSkill.icon"
                :class="editingSkill.icon"
                class="skill-icon-font"
              />
              <el-icon v-else class="skill-icon-placeholder"><Box /></el-icon>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </AnDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  Plus,
  Delete,
  QuestionFilled,
  Edit,
  Grid,
  List,
  Box
} from "@element-plus/icons-vue";
import type { CreativityInfo, CreativityItem } from "../../../type";
import { ElMessageBox, ElMessage } from "element-plus";
import AnDialog from "@/components/AnDialog";
import IconSelector from "../components/IconSelector.vue";
import { IconifyIconOnline } from "@/components/ReIcon";

const props = defineProps<{
  modelValue?: CreativityInfo;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: CreativityInfo];
}>();

// 视图模式
const viewMode = ref<"grid" | "list">("grid");

// 编辑相关
const editDialogVisible = ref(false);
const editingIndex = ref(-2); // 使用 -2 作为初始值，-1 表示新增，>= 0 表示编辑
const editingSkill = ref<CreativityItem | null>(null);

// 预定义颜色
const predefineColors = [
  "#ff4500",
  "#ff8c00",
  "#ffd700",
  "#90ee90",
  "#00ced1",
  "#1e90ff",
  "#c71585",
  "#42b883",
  "var(--anzhiyu-theme)",
  "var(--anzhiyu-green)",
  "var(--anzhiyu-yellow)",
  "var(--anzhiyu-red)",
  "#909399",
  "#fff",
  "transparent"
];

// 监听编辑索引变化
watch(editingIndex, newVal => {
  if (newVal >= 0) {
    const skill = localValue.value.creativity_list[newVal];
    editingSkill.value = { ...skill };
    editDialogVisible.value = true;
  } else if (newVal === -1) {
    editingSkill.value = {
      name: "",
      color: "",
      icon: ""
    };
    editDialogVisible.value = true;
  }
});

// 创建本地值的计算属性，确保始终有默认值
const localValue = computed<CreativityInfo>(() => {
  return {
    title: props.modelValue?.title || "",
    subtitle: props.modelValue?.subtitle || "",
    creativity_list: props.modelValue?.creativity_list || []
  };
});

// 更新字段
const updateField = (
  field: keyof Omit<CreativityInfo, "creativity_list">,
  value: string
) => {
  emit("update:modelValue", {
    title: localValue.value.title || "",
    subtitle: localValue.value.subtitle || "",
    creativity_list: localValue.value.creativity_list || [],
    [field]: value
  });
};

// 添加技能
const addSkill = () => {
  editingIndex.value = -1;
};

// 删除技能
const removeSkill = (index: number) => {
  const currentList = localValue.value.creativity_list || [];
  ElMessageBox.confirm(
    `确定要删除技能"${currentList[index]?.name || "未命名"}"吗？`,
    "确认删除",
    {
      type: "warning"
    }
  )
    .then(() => {
      const newList = currentList.filter((_, i) => i !== index);
      emit("update:modelValue", {
        title: localValue.value.title || "",
        subtitle: localValue.value.subtitle || "",
        creativity_list: newList
      });
      ElMessage.success("删除成功");
    })
    .catch(() => {});
};

// 关闭编辑对话框
const closeEditDialog = () => {
  editingIndex.value = -2;
  editingSkill.value = null;
};

// 保存编辑的技能
const saveEditingSkill = () => {
  if (!editingSkill.value) return;

  if (!editingSkill.value.name) {
    ElMessage.warning("请输入技能名称");
    return;
  }

  const currentList = [...(localValue.value.creativity_list || [])];

  if (editingIndex.value === -1) {
    // 添加新技能
    currentList.push(editingSkill.value);
  } else {
    // 更新现有技能
    currentList[editingIndex.value] = editingSkill.value;
  }

  emit("update:modelValue", {
    title: localValue.value.title || "",
    subtitle: localValue.value.subtitle || "",
    creativity_list: currentList
  });

  ElMessage.success(editingIndex.value === -1 ? "添加成功" : "保存成功");
  editDialogVisible.value = false;
  closeEditDialog();
};
</script>

<style scoped lang="scss">
.creativity-editor {
  margin-top: 24px;

  .skill-list-container {
    background: var(--anzhiyu-card-bg);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 20px;
    margin-top: 16px;

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--anzhiyu-fontcolor);
        }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
    }

    // 网格视图样式
    .skill-grid {
      .skill-grid-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
      }

      .skill-grid-item {
        background: var(--anzhiyu-secondbg);
        border: 2px solid var(--el-border-color-lighter);
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;

        &:hover {
          transform: translateY(-2px);
          border-color: var(--anzhiyu-theme);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);

          .skill-grid-actions {
            opacity: 1;
          }
        }

        .skill-grid-content {
          text-align: center;
        }

        .skill-icon-preview {
          width: 80px;
          height: 80px;
          margin: 0 auto 16px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .skill-icon-img {
          max-width: 48px;
          max-height: 48px;
          object-fit: contain;
        }

        .skill-icon-iconify {
          color: var(--anzhiyu-fontcolor);
        }

        .skill-icon-font {
          font-size: 36px;
          color: var(--anzhiyu-fontcolor);
        }

        .skill-icon-placeholder {
          font-size: 32px;
          color: var(--anzhiyu-secondtext);
        }

        .skill-info {
          margin-bottom: 12px;
        }

        .skill-name {
          font-size: 16px;
          font-weight: 500;
          color: var(--anzhiyu-fontcolor);
        }

        .skill-grid-actions {
          display: flex;
          justify-content: center;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
      }
    }

    // 列表视图样式
    .skill-list {
      .skill-table-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        .skill-icon-iconify {
          color: var(--anzhiyu-fontcolor);
        }
      }
    }
  }

  // 编辑弹窗预览样式
  .skill-preview-box {
    display: flex;
    justify-content: center;
    padding: 20px;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;

    .skill-preview-item {
      width: 80px;
      height: 80px;
      margin: 0 auto;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      overflow: hidden;

      .skill-icon-img {
        width: 48px;
        height: 48px;
        object-fit: contain;
      }

      .skill-icon-iconify {
        color: var(--anzhiyu-fontcolor);
      }

      .skill-icon-font {
        font-size: 36px;
        color: var(--anzhiyu-fontcolor);
      }

      .skill-icon-placeholder {
        font-size: 32px;
        color: var(--anzhiyu-secondtext);
      }
    }
  }

  .icon-help {
    color: var(--anzhiyu-blue);
    cursor: help;

    &:hover {
      color: var(--anzhiyu-theme);
    }
  }
}

// 过渡动画
.skill-grid-move {
  transition: transform 0.3s;
}

.skill-grid-enter-active,
.skill-grid-leave-active {
  transition: all 0.3s ease;
}

.skill-grid-enter-from {
  opacity: 0;
  transform: scale(0.5);
}

.skill-grid-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .creativity-editor {
    .skill-list-container {
      padding: 16px;

      .list-header {
        flex-direction: column;
        gap: 12px;

        .header-left {
          width: 100%;
        }

        .header-actions {
          width: 100%;
          justify-content: space-between;
        }
      }

      .skill-grid {
        .skill-grid-container {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }

        .skill-grid-item {
          padding: 16px;

          .skill-icon-preview {
            width: 60px;
            height: 60px;
            margin-bottom: 12px;
          }

          .skill-icon-img {
            max-width: 36px;
            max-height: 36px;
          }

          .skill-icon-iconify {
            color: var(--anzhiyu-fontcolor);
          }

          .skill-icon-font {
            font-size: 28px;
          }

          .skill-name {
            font-size: 14px;
          }
        }
      }
    }
  }
}
</style>

<!-- 非 scoped 样式，用于 Teleport 到 body 的弹窗内容 -->
<style lang="scss">
// 优化弹窗表单样式
:deep(.dialog-content) {
  .el-form {
    .el-form-item {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.creativity-editor-preview {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: var(--anzhiyu-secondbg);
  border-radius: 8px;

  .skill-preview-item {
    width: 80px;
    height: 80px;
    margin: 0 auto;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    overflow: hidden;

    .skill-icon-img {
      width: 48px;
      height: 48px;
      object-fit: contain;
    }

    .skill-icon-iconify {
      color: var(--anzhiyu-fontcolor);
    }

    .skill-icon-font {
      font-size: 36px;
      color: var(--anzhiyu-fontcolor);
    }

    .skill-icon-placeholder {
      font-size: 32px;
      color: var(--anzhiyu-secondtext);
    }
  }
}
</style>
