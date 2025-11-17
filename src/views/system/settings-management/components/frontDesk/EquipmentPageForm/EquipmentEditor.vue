<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-20 13:31:27
 * @LastEditTime: 2025-08-20 13:43:22
 * @LastEditors: 安知鱼
-->
<!--
 * @Description: 装备分类编辑器
 * @Author: 安知鱼
 * @Date: 2025-08-20
-->
<template>
  <div class="equipment-editor">
    <!-- 横幅配置区域 -->
    <div class="banner-config-section">
      <h4 class="section-title">
        <el-icon><Picture /></el-icon>
        横幅配置
      </h4>
      <div class="banner-config-grid">
        <el-form-item label="背景图片">
          <el-input
            :model-value="bannerConfig.background"
            placeholder="请输入横幅背景图片链接地址"
            clearable
            @update:model-value="updateBannerConfig('background', $event)"
          >
            <template #prepend>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="标题">
          <el-input
            :model-value="bannerConfig.title"
            placeholder="请输入横幅标题"
            clearable
            @update:model-value="updateBannerConfig('title', $event)"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            :model-value="bannerConfig.description"
            placeholder="请输入横幅描述"
            clearable
            @update:model-value="updateBannerConfig('description', $event)"
          />
        </el-form-item>
        <el-form-item label="提示">
          <el-input
            :model-value="bannerConfig.tip"
            placeholder="请输入横幅提示文字"
            clearable
            @update:model-value="updateBannerConfig('tip', $event)"
          />
        </el-form-item>
      </div>
    </div>

    <!-- 装备分类管理区域 -->
    <div class="categories-section">
      <div class="section-header">
        <h4 class="section-title">
          <el-icon><Collection /></el-icon>
          装备分类管理
        </h4>
        <el-button type="primary" :icon="Plus" @click="addNewCategory">
          添加分类
        </el-button>
      </div>

      <!-- 分类卡片列表 -->
      <div class="categories-list">
        <div
          v-for="(category, categoryIndex) in equipmentList"
          :key="categoryIndex"
          class="category-card"
        >
          <div class="category-header">
            <div class="category-info">
              <h5 class="category-title">
                {{ category.title || "未命名分类" }}
              </h5>
              <p class="category-description">
                {{ category.description || "暂无描述" }}
              </p>
            </div>
            <div class="category-actions">
              <el-button
                size="small"
                :icon="Edit"
                @click="editCategory(categoryIndex)"
              >
                编辑
              </el-button>
              <el-button
                size="small"
                type="danger"
                :icon="Delete"
                @click="removeCategory(categoryIndex)"
              >
                删除
              </el-button>
            </div>
          </div>

          <!-- 装备项列表 -->
          <div class="equipment-items">
            <div class="items-header">
              <span class="items-count"
                >{{ category.equipment_list?.length || 0 }} 个装备项</span
              >
              <el-button
                size="small"
                type="primary"
                :icon="Setting"
                @click="openEquipmentItemsEditor(category, categoryIndex)"
              >
                管理装备项
              </el-button>
            </div>

            <!-- 装备项预览 -->
            <div class="items-preview">
              <div
                v-for="(item, itemIndex) in category.equipment_list?.slice(
                  0,
                  3
                )"
                :key="itemIndex"
                class="item-preview"
              >
                <el-image
                  v-if="item.image"
                  :src="item.image"
                  :preview-src-list="[item.image]"
                  fit="cover"
                  class="item-image"
                />
                <div v-else class="item-image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
                <div class="item-info">
                  <div class="item-name">{{ item.name || "未命名装备" }}</div>
                  <div class="item-spec">
                    {{ item.specification || "暂无规格" }}
                  </div>
                </div>
              </div>
              <div
                v-if="(category.equipment_list?.length || 0) > 3"
                class="more-items"
              >
                +{{ (category.equipment_list?.length || 0) - 3 }} 更多
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="equipmentList.length === 0" class="empty-state">
          <el-icon class="empty-icon"><Collection /></el-icon>
          <p>暂无装备分类</p>
          <el-button type="primary" :icon="Plus" @click="addNewCategory">
            添加第一个分类
          </el-button>
        </div>
      </div>
    </div>

    <!-- 分类编辑弹窗 -->
    <el-dialog
      v-model="isCategoryEditorVisible"
      :title="editingCategoryIndex === -1 ? '添加分类' : '编辑分类'"
      width="500px"
      :append-to-body="true"
    >
      <el-form :model="editingCategory" label-width="110px">
        <el-form-item label="分类标题" required>
          <el-input
            v-model="editingCategory.title"
            placeholder="请输入分类标题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="分类描述">
          <el-input
            v-model="editingCategory.description"
            type="textarea"
            placeholder="请输入分类描述"
            maxlength="200"
            show-word-limit
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="isCategoryEditorVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">确定</el-button>
      </template>
    </el-dialog>

    <!-- 装备项编辑器弹窗 -->
    <AnDialog
      v-model="isEquipmentItemsEditorVisible"
      :title="`管理装备项 - ${currentEditingCategory?.title || ''}`"
      width="95%"
      :close-on-click-modal="false"
      hide-footer
      container-class="equipment-items-dialog"
    >
      <EquipmentItemEditor
        :equipment-items="currentEditingCategory?.equipment_list || []"
        @update:equipment-items="updateEquipmentItems"
      />
    </AnDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Plus,
  Edit,
  Delete,
  Setting,
  Picture,
  Link,
  Collection,
  Upload
} from "@element-plus/icons-vue";
import type { EquipmentCategory, EquipmentItem } from "../../../type";
import { ElMessage, ElMessageBox } from "element-plus";
import EquipmentItemEditor from "./EquipmentItemEditor.vue";
import AnDialog from "@/components/AnDialog";

const props = defineProps<{
  equipmentList: EquipmentCategory[];
  bannerConfig: {
    background: string;
    title: string;
    description: string;
    tip: string;
  };
}>();

const emit = defineEmits<{
  "update:equipment-list": [value: EquipmentCategory[]];
  "update:banner-config": [value: typeof props.bannerConfig];
}>();

// 分类编辑器状态
const isCategoryEditorVisible = ref(false);
const editingCategoryIndex = ref(-1);
const editingCategory = ref<EquipmentCategory>({
  title: "",
  description: "",
  equipment_list: []
});

// 装备项编辑器状态
const isEquipmentItemsEditorVisible = ref(false);
const currentEditingCategory = ref<EquipmentCategory | null>(null);
const currentEditingCategoryIndex = ref(-1);

// 新装备项状态
const isAddingNewItem = ref(false);
const newEquipmentItem = ref<EquipmentItem>({
  name: "",
  specification: "",
  description: "",
  image: "",
  link: ""
});

// 添加新分类
const addNewCategory = () => {
  editingCategoryIndex.value = -1;
  editingCategory.value = {
    title: "",
    description: "",
    equipment_list: []
  };
  isCategoryEditorVisible.value = true;
};

// 编辑分类
const editCategory = (index: number) => {
  editingCategoryIndex.value = index;
  editingCategory.value = { ...props.equipmentList[index] };
  isCategoryEditorVisible.value = true;
};

// 保存分类
const saveCategory = () => {
  if (!editingCategory.value.title.trim()) {
    ElMessage.warning("分类标题不能为空");
    return;
  }

  const newList = [...props.equipmentList];
  if (editingCategoryIndex.value === -1) {
    // 添加新分类
    newList.push({ ...editingCategory.value });
  } else {
    // 编辑现有分类
    newList[editingCategoryIndex.value] = { ...editingCategory.value };
  }

  emit("update:equipment-list", newList);
  isCategoryEditorVisible.value = false;
};

// 删除分类
const removeCategory = (index: number) => {
  ElMessageBox.confirm(
    "确定要删除这个分类吗？删除后该分类下的所有装备项也将被删除。",
    "确认删除",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(() => {
    const newList = [...props.equipmentList];
    newList.splice(index, 1);
    emit("update:equipment-list", newList);
    ElMessage.success("分类删除成功");
  });
};

// 打开装备项编辑器
const openEquipmentItemsEditor = (
  category: EquipmentCategory,
  categoryIndex: number
) => {
  currentEditingCategory.value = { ...category };
  currentEditingCategoryIndex.value = categoryIndex;
  isEquipmentItemsEditorVisible.value = true;
};

// 更新装备项列表
const updateEquipmentItems = (equipmentItems: EquipmentItem[]) => {
  if (
    currentEditingCategory.value &&
    currentEditingCategoryIndex.value !== -1
  ) {
    currentEditingCategory.value.equipment_list = equipmentItems;
    const newList = [...props.equipmentList];
    newList[currentEditingCategoryIndex.value] = {
      ...currentEditingCategory.value
    };
    emit("update:equipment-list", newList);
  }
};

// 添加新装备项
const addNewEquipmentItem = () => {
  isAddingNewItem.value = true;
  newEquipmentItem.value = {
    name: "",
    specification: "",
    description: "",
    image: "",
    link: ""
  };
};

// 确认添加装备项
const confirmAddItem = () => {
  if (!newEquipmentItem.value.name.trim()) {
    ElMessage.warning("装备名称不能为空");
    return;
  }

  if (currentEditingCategory.value) {
    currentEditingCategory.value.equipment_list.push({
      ...newEquipmentItem.value
    });
    updateEquipmentItems(currentEditingCategory.value.equipment_list);
    isAddingNewItem.value = false;
    ElMessage.success("装备项添加成功");
  }
};

// 取消添加装备项
const cancelAddItem = () => {
  isAddingNewItem.value = false;
};

// 删除装备项
const removeEquipmentItem = (index: number) => {
  if (currentEditingCategory.value) {
    currentEditingCategory.value.equipment_list.splice(index, 1);
    updateEquipmentItems(currentEditingCategory.value.equipment_list);
    ElMessage.success("装备项删除成功");
  }
};

// 更新横幅配置
const updateBannerConfig = (
  key: keyof typeof props.bannerConfig,
  value: string
) => {
  const newConfig = { ...props.bannerConfig };
  newConfig[key] = value;
  emit("update:banner-config", newConfig);
};

// 导入JSON
const importFromJson = () => {
  ElMessage.info("JSON导入功能开发中...");
};
</script>

<style scoped lang="scss">
.equipment-editor {
  .banner-config-section {
    margin-bottom: 32px;
    padding: 24px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 20px 0;
      color: #303133;
      font-size: 16px;
      font-weight: 600;
    }

    .banner-config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
  }

  .categories-section {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        color: #303133;
        font-size: 16px;
        font-weight: 600;
      }
    }

    .categories-list {
      display: flex;
      flex-direction: column;
      gap: 20px;

      .category-card {
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        overflow: hidden;
        transition: all 0.3s ease;

        &:hover {
          border-color: #409eff;
          box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
        }

        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #fafafa;
          border-bottom: 1px solid #e4e7ed;

          .category-info {
            .category-title {
              margin: 0 0 4px 0;
              color: #303133;
              font-size: 16px;
              font-weight: 600;
            }

            .category-description {
              margin: 0;
              color: #909399;
              font-size: 14px;
            }
          }

          .category-actions {
            display: flex;
            gap: 8px;
          }
        }

        .equipment-items {
          padding: 20px;

          .items-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;

            .items-count {
              color: #606266;
              font-size: 14px;
            }
          }

          .items-preview {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;

            .item-preview {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px 12px;
              background: #f8f9fa;
              border-radius: 6px;
              border: 1px solid #e4e7ed;
              min-width: 200px;

              .item-image,
              .item-image-placeholder {
                width: 40px;
                height: 40px;
                border-radius: 4px;
                overflow: hidden;
                flex-shrink: 0;
              }

              .item-image-placeholder {
                display: flex;
                align-items: center;
                justify-content: center;
                background: #e4e7ed;
                color: #909399;
              }

              .item-info {
                flex: 1;
                min-width: 0;

                .item-name {
                  color: #303133;
                  font-size: 14px;
                  font-weight: 500;
                  margin-bottom: 2px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }

                .item-spec {
                  color: #909399;
                  font-size: 12px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }
              }
            }

            .more-items {
              display: flex;
              align-items: center;
              padding: 8px 12px;
              color: #909399;
              font-size: 14px;
              background: #f8f9fa;
              border-radius: 6px;
              border: 1px solid #e4e7ed;
            }
          }
        }
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #909399;

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        p {
          margin: 0 0 20px 0;
          font-size: 16px;
        }
      }
    }
  }

  .equipment-items-dialog {
    .equipment-items-editor {
      .editor-header {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
      }

      .equipment-table {
        margin-bottom: 20px;
      }

      .new-item-form {
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e4e7ed;

        h5 {
          margin: 0 0 16px 0;
          color: #303133;
          font-size: 14px;
          font-weight: 600;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          align-items: end;

          .form-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .equipment-editor {
    .banner-config-section {
      .banner-config-grid {
        grid-template-columns: 1fr;
      }
    }

    .categories-section {
      .section-header {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }

      .categories-list {
        .category-card {
          .category-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;

            .category-actions {
              width: 100%;
              justify-content: flex-end;
            }
          }

          .equipment-items {
            .items-header {
              flex-direction: column;
              gap: 12px;
              align-items: flex-start;
            }

            .items-preview {
              .item-preview {
                min-width: 100%;
              }
            }
          }
        }
      }
    }
  }
}
</style>
