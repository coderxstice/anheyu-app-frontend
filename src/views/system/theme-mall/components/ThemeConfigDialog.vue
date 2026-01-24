<!--
 * @Description: 主题配置对话框
 * @Author: 安知鱼
 * @Date: 2025-01-24
-->
<template>
  <el-dialog
    v-model="visible"
    :title="`${themeName} - 主题配置`"
    width="720px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    destroy-on-close
    @close="handleClose"
  >
    <div v-loading="loading" class="theme-config-content">
      <!-- 空配置状态 -->
      <el-empty
        v-if="!loading && settingGroups.length === 0"
        description="该主题暂无可配置项"
        :image-size="120"
      />

      <!-- 配置表单 -->
      <el-form
        v-else
        ref="formRef"
        :model="configValues"
        label-position="top"
        class="config-form"
      >
        <!-- 分组标签页 -->
        <el-tabs v-model="activeGroup" type="border-card" class="config-tabs">
          <el-tab-pane
            v-for="group in settingGroups"
            :key="group.group"
            :label="group.label"
            :name="group.group"
          >
            <div class="group-fields">
              <template v-for="field in group.fields" :key="field.name">
                <!-- 根据条件显示字段 -->
                <el-form-item
                  v-if="shouldShowField(field)"
                  :label="field.label"
                  :prop="field.name"
                  :required="field.required"
                  class="config-field"
                >
                  <!-- 字段描述 -->
                  <template v-if="field.description" #label>
                    <div class="field-label">
                      <span>{{ field.label }}</span>
                      <el-tooltip :content="field.description" placement="top">
                        <el-icon class="help-icon"><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </div>
                  </template>

                  <!-- 文本输入 -->
                  <el-input
                    v-if="field.type === 'text'"
                    v-model="configValues[field.name]"
                    :placeholder="field.placeholder || `请输入${field.label}`"
                    clearable
                  />

                  <!-- 多行文本 -->
                  <el-input
                    v-else-if="field.type === 'textarea'"
                    v-model="configValues[field.name]"
                    type="textarea"
                    :rows="4"
                    :placeholder="field.placeholder || `请输入${field.label}`"
                  />

                  <!-- 数字输入 -->
                  <el-input-number
                    v-else-if="field.type === 'number'"
                    v-model="configValues[field.name]"
                    :min="field.validation?.min"
                    :max="field.validation?.max"
                    :placeholder="field.placeholder"
                    controls-position="right"
                    class="number-input"
                  />

                  <!-- 下拉选择 -->
                  <el-select
                    v-else-if="field.type === 'select'"
                    v-model="configValues[field.name]"
                    :placeholder="field.placeholder || `请选择${field.label}`"
                    clearable
                    class="select-input"
                  >
                    <el-option
                      v-for="option in field.options"
                      :key="String(option.value)"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>

                  <!-- 颜色选择器 -->
                  <div v-else-if="field.type === 'color'" class="color-field">
                    <el-color-picker
                      v-model="configValues[field.name]"
                      show-alpha
                    />
                    <el-input
                      v-model="configValues[field.name]"
                      :placeholder="field.placeholder || '#000000'"
                      class="color-input"
                    />
                  </div>

                  <!-- 开关 -->
                  <el-switch
                    v-else-if="field.type === 'switch'"
                    v-model="configValues[field.name]"
                    active-text="开启"
                    inactive-text="关闭"
                  />

                  <!-- 图片上传/URL -->
                  <div v-else-if="field.type === 'image'" class="image-field">
                    <el-input
                      v-model="configValues[field.name]"
                      :placeholder="
                        field.placeholder || '输入图片URL或上传图片'
                      "
                      clearable
                    >
                      <template #append>
                        <el-button
                          :icon="Picture"
                          @click="selectImage(field.name)"
                        >
                          选择
                        </el-button>
                      </template>
                    </el-input>
                    <!-- 图片预览 -->
                    <div v-if="configValues[field.name]" class="image-preview">
                      <img
                        :src="configValues[field.name]"
                        alt="预览"
                        @error="handleImageError"
                      />
                    </div>
                  </div>

                  <!-- 代码编辑器 -->
                  <el-input
                    v-else-if="field.type === 'code'"
                    v-model="configValues[field.name]"
                    type="textarea"
                    :rows="6"
                    :placeholder="field.placeholder || '请输入代码'"
                    class="code-input"
                  />
                </el-form-item>
              </template>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="default" @click="resetToDefault"> 恢复默认 </el-button>
        <el-button
          type="primary"
          :loading="saving"
          :disabled="settingGroups.length === 0"
          @click="handleSave"
        >
          保存配置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { QuestionFilled, Picture } from "@element-plus/icons-vue";
import { themeMallApi } from "@/api/theme-mall";
import type {
  ThemeSettingGroup,
  ThemeSettingField
} from "@/api/theme-mall/type";

// Props
const props = defineProps<{
  modelValue: boolean;
  themeName: string;
}>();

// Emits
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "saved"): void;
}>();

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const loading = ref(false);
const saving = ref(false);
const settingGroups = ref<ThemeSettingGroup[]>([]);
const configValues = ref<Record<string, any>>({});
const defaultValues = ref<Record<string, any>>({});
const activeGroup = ref("");
const formRef = ref();

// 监听对话框打开
watch(
  () => props.modelValue,
  async newVal => {
    if (newVal && props.themeName) {
      await loadThemeConfig();
    }
  }
);

// 加载主题配置
const loadThemeConfig = async () => {
  loading.value = true;
  try {
    // 并行获取配置定义和用户配置
    const [settingsRes, configRes] = await Promise.all([
      themeMallApi.getThemeSettings(props.themeName),
      themeMallApi.getUserThemeConfig(props.themeName)
    ]);

    if (settingsRes.code === 200) {
      settingGroups.value = settingsRes.data || [];

      // 设置默认激活的分组
      if (settingGroups.value.length > 0) {
        activeGroup.value = settingGroups.value[0].group;
      }

      // 提取默认值
      defaultValues.value = {};
      for (const group of settingGroups.value) {
        for (const field of group.fields) {
          if (field.default !== undefined) {
            defaultValues.value[field.name] = field.default;
          }
        }
      }
    }

    if (configRes.code === 200) {
      // 合并默认值和用户配置
      configValues.value = {
        ...defaultValues.value,
        ...(configRes.data || {})
      };
    } else {
      configValues.value = { ...defaultValues.value };
    }
  } catch (error: any) {
    console.error("加载主题配置失败:", error);
    ElMessage.error(error.message || "加载主题配置失败");
  } finally {
    loading.value = false;
  }
};

// 判断字段是否应该显示
const shouldShowField = (field: ThemeSettingField): boolean => {
  if (!field.condition) {
    return true;
  }

  const { field: depField, operator, value } = field.condition;
  const currentValue = configValues.value[depField];

  switch (operator) {
    case "eq":
      return currentValue === value;
    case "neq":
      return currentValue !== value;
    case "contains":
      return String(currentValue).includes(String(value));
    case "gt":
      return Number(currentValue) > Number(value);
    case "lt":
      return Number(currentValue) < Number(value);
    default:
      return true;
  }
};

// 保存配置
const handleSave = async () => {
  saving.value = true;
  try {
    const response = await themeMallApi.saveUserThemeConfig({
      theme_name: props.themeName,
      config: configValues.value
    });

    if (response.code === 200) {
      ElMessage.success("配置保存成功");
      emit("saved");
      handleClose();
    } else {
      throw new Error(response.message || "保存失败");
    }
  } catch (error: any) {
    console.error("保存主题配置失败:", error);
    ElMessage.error(error.message || "保存主题配置失败");
  } finally {
    saving.value = false;
  }
};

// 恢复默认值
const resetToDefault = async () => {
  try {
    await ElMessageBox.confirm("确定要恢复所有配置为默认值吗？", "恢复默认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    configValues.value = { ...defaultValues.value };
    ElMessage.success("已恢复默认配置");
  } catch {
    // 用户取消
  }
};

// 关闭对话框
const handleClose = () => {
  visible.value = false;
  settingGroups.value = [];
  configValues.value = {};
  activeGroup.value = "";
};

// 选择图片（这里可以集成文件管理器）
const selectImage = (fieldName: string) => {
  ElMessage.info("图片选择功能可以集成文件管理器");
};

// 图片加载错误处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
};
</script>

<style scoped lang="scss">
.theme-config-content {
  min-height: 300px;
  max-height: 60vh;
  overflow-y: auto;
}

.config-form {
  .config-tabs {
    :deep(.el-tabs__header) {
      background: var(--el-bg-color);
    }

    :deep(.el-tabs__content) {
      padding: 20px;
    }
  }

  .group-fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .config-field {
    margin-bottom: 0;

    .field-label {
      display: flex;
      align-items: center;
      gap: 6px;

      .help-icon {
        color: var(--el-text-color-secondary);
        font-size: 14px;
        cursor: help;
      }
    }
  }

  .number-input {
    width: 200px;
  }

  .select-input {
    width: 100%;
  }

  .color-field {
    display: flex;
    align-items: center;
    gap: 12px;

    .color-input {
      flex: 1;
      max-width: 200px;
    }
  }

  .image-field {
    .image-preview {
      margin-top: 12px;
      max-width: 200px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--el-border-color);

      img {
        width: 100%;
        height: auto;
        display: block;
      }
    }
  }

  .code-input {
    :deep(.el-textarea__inner) {
      font-family: "Fira Code", "Monaco", monospace;
      font-size: 13px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
