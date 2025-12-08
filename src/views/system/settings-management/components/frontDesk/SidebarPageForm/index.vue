<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";
import {
  Plus,
  Delete,
  ArrowUp,
  ArrowDown,
  Edit
} from "@element-plus/icons-vue";
import type {
  SidebarPageSettingsInfo,
  JsonEditorTableColumn,
  CustomSidebarBlock
} from "../../../type";
import JsonEditorTable from "../components/JsonEditorTable.vue";
import HighlightTagSelector from "../components/HighlightTagSelector.vue";
import AnDialog from "@/components/AnDialog/index.vue";

defineOptions({
  name: "SidebarPageForm"
});

const model = defineModel<SidebarPageSettingsInfo>({ required: true });

// 1. 创建 ref 用于“记忆”关闭开关前的数值
const lastValidPostCount = ref(0);
const lastValidWordCount = ref(0);

// 2. 使用 watch 监听 model 的初始加载，并存储初始有效值
watch(
  () => model.value,
  newModel => {
    // 如果初始值不是 -1，就将其存入我们的“记忆”变量中
    if (newModel.siteInfoTotalPostCount !== -1) {
      lastValidPostCount.value = newModel.siteInfoTotalPostCount;
    }
    if (newModel.siteInfoTotalWordCount !== -1) {
      lastValidWordCount.value = newModel.siteInfoTotalWordCount;
    }
  },
  { immediate: true }
);

const isTotalPostCountEnabled = computed({
  get() {
    return model.value.siteInfoTotalPostCount !== -1;
  },
  set(newValue: boolean) {
    if (newValue) {
      // 当开关打开时，恢复之前记住的数值
      model.value.siteInfoTotalPostCount = lastValidPostCount.value;
    } else {
      // 当开关关闭时，先记住当前的有效值，再设置为 -1
      if (model.value.siteInfoTotalPostCount !== -1) {
        lastValidPostCount.value = model.value.siteInfoTotalPostCount;
      }
      model.value.siteInfoTotalPostCount = -1;
    }
  }
});

const isTotalWordCountEnabled = computed({
  get() {
    return model.value.siteInfoTotalWordCount !== -1;
  },
  set(newValue: boolean) {
    if (newValue) {
      model.value.siteInfoTotalWordCount = lastValidWordCount.value;
    } else {
      if (model.value.siteInfoTotalWordCount !== -1) {
        lastValidWordCount.value = model.value.siteInfoTotalWordCount;
      }
      model.value.siteInfoTotalWordCount = -1;
    }
  }
});

const skillColumns = ref<JsonEditorTableColumn[]>([
  { prop: "name", label: "技能描述" }
]);

const skillsForTable = computed(() =>
  (model.value.authorSkills || []).map(skill => ({ name: skill }))
);

const updateSkills = (jsonString: string) => {
  try {
    const arrayData = JSON.parse(jsonString || "[]");
    const skills = arrayData.map((item: { name: string }) => item.name);

    // 确保至少有2项技能
    if (skills.length < 2) {
      console.warn("技能列表至少需要2项");
      return;
    }

    model.value.authorSkills = skills;
  } catch (e) {
    console.error("更新技能列表失败:", e);
  }
};

const socialColumns = ref<JsonEditorTableColumn[]>([
  { prop: "title", label: "标题 (如: Github)" },
  { prop: "link", label: "链接" },
  { prop: "icon", label: "图标类名" }
]);

const socialsForTable = computed(() => {
  return Object.entries(model.value.authorSocial || {}).map(
    ([title, data]) => ({
      title,
      icon: data.icon,
      link: data.link
    })
  );
});

const updateSocials = (jsonString: string) => {
  try {
    const arrayData = JSON.parse(jsonString || "[]");
    const newObject: SidebarPageSettingsInfo["authorSocial"] = {};
    for (const item of arrayData) {
      if (item.title) {
        newObject[item.title] = {
          icon: item.icon,
          link: item.link
        };
      }
    }
    model.value.authorSocial = newObject;
  } catch (e) {
    console.error("更新社交链接失败:", e);
  }
};

// 迁移旧数据格式到新格式
const migrateCustomSidebarBlocks = (value: any): CustomSidebarBlock[] => {
  // 如果已经是数组格式，确保每个块都有必要字段
  if (Array.isArray(value)) {
    return value.map((block: any) => ({
      title: block.title || "",
      content: block.content || "",
      showInPost: block.showInPost !== undefined ? block.showInPost : true
    }));
  }

  // 如果是字符串（旧格式），转换为数组
  if (typeof value === "string") {
    if (!value.trim()) {
      return [];
    }
    // 尝试解析为 JSON
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((block: any) => ({
          title: block.title || "",
          content: block.content || "",
          showInPost: block.showInPost !== undefined ? block.showInPost : true
        }));
      }
    } catch {
      // 解析失败，说明是旧的纯 HTML 字符串，转换为单个块
      return [
        {
          title: "",
          content: value,
          showInPost: true
        }
      ];
    }
  }

  // 其他情况返回空数组
  return [];
};

// 检查并修复 customSidebarBlocks 格式（只在需要时修改）
const ensureCustomSidebarBlocks = () => {
  const currentValue = model.value.customSidebarBlocks;

  // 如果不存在或者是非数组类型，进行迁移或初始化
  if (!currentValue || !Array.isArray(currentValue)) {
    model.value.customSidebarBlocks = migrateCustomSidebarBlocks(currentValue);
    return;
  }

  // 如果已经是数组，检查是否需要规范化字段
  // 如果所有块都正常，就不需要更新
  const allBlocksValid = currentValue.every((block: any) => {
    return (
      block &&
      typeof block === "object" &&
      typeof block.title !== "undefined" &&
      typeof block.content !== "undefined" &&
      typeof block.showInPost !== "undefined"
    );
  });

  if (!allBlocksValid) {
    model.value.customSidebarBlocks = currentValue.map((block: any) => ({
      title: block?.title || "",
      content: block?.content || "",
      showInPost: block?.showInPost !== undefined ? block.showInPost : true
    }));
  }
};

// 初始化时确保数组存在（只执行一次，避免递归）
onMounted(() => {
  nextTick(() => {
    const currentValue = model.value.customSidebarBlocks;
    // 只在数据格式不正确时才处理
    if (!currentValue || !Array.isArray(currentValue)) {
      ensureCustomSidebarBlocks();
    }
  });
});

// Dialog 相关状态
const dialogVisible = ref(false);
const dialogMode = ref<"add" | "edit">("add");
const editingBlockIndex = ref<number | null>(null);
const dialogForm = ref<CustomSidebarBlock>({
  title: "",
  content: "",
  showInPost: true
});

// 打开添加块的弹窗
const addSidebarBlock = () => {
  // 确保数组存在且是数组类型
  ensureCustomSidebarBlocks();

  const blocks = model.value.customSidebarBlocks;

  // 双重检查：确保 blocks 是数组
  if (!blocks || !Array.isArray(blocks)) {
    // 如果不是数组，重新迁移
    model.value.customSidebarBlocks = migrateCustomSidebarBlocks(blocks);
    return;
  }

  // 检查是否已达到最大数量
  if (blocks.length >= 3) {
    return;
  }

  // 打开添加弹窗
  dialogMode.value = "add";
  editingBlockIndex.value = null;
  dialogForm.value = {
    title: "",
    content: "",
    showInPost: true
  };
  dialogVisible.value = true;
};

// 打开编辑块的弹窗
const editSidebarBlock = (index: number) => {
  const blocks = model.value.customSidebarBlocks;
  if (!blocks || !Array.isArray(blocks) || !blocks[index]) {
    return;
  }

  dialogMode.value = "edit";
  editingBlockIndex.value = index;
  dialogForm.value = {
    title: blocks[index].title || "",
    content: blocks[index].content || "",
    showInPost:
      blocks[index].showInPost !== undefined ? blocks[index].showInPost : true
  };
  dialogVisible.value = true;
};

// 保存块（添加或编辑）
const saveSidebarBlock = () => {
  const blocks = model.value.customSidebarBlocks;
  if (!blocks || !Array.isArray(blocks)) {
    return;
  }

  if (dialogMode.value === "add") {
    // 添加新块
    blocks.push({ ...dialogForm.value });
  } else if (dialogMode.value === "edit" && editingBlockIndex.value !== null) {
    // 编辑现有块
    blocks[editingBlockIndex.value] = { ...dialogForm.value };
  }

  dialogVisible.value = false;
};

// 取消编辑
const cancelEdit = () => {
  dialogVisible.value = false;
  dialogForm.value = {
    title: "",
    content: "",
    showInPost: true
  };
  editingBlockIndex.value = null;
};

const removeSidebarBlock = (index: number) => {
  model.value.customSidebarBlocks?.splice(index, 1);
};

const moveSidebarBlock = (index: number, direction: number) => {
  const blocks = model.value.customSidebarBlocks;
  if (!blocks) return;

  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= blocks.length) return;

  const temp = blocks[index];
  blocks[index] = blocks[newIndex];
  blocks[newIndex] = temp;
};
</script>

<template>
  <div>
    <el-divider content-position="left">作者信息卡</el-divider>
    <el-form-item label="启用作者信息卡">
      <el-switch v-model="model.authorEnable" />
    </el-form-item>
    <el-form-item label="用户头像">
      <el-input
        v-model="model.userAvatar"
        placeholder="输入用户头像 URL"
        clearable
      />
    </el-form-item>
    <template v-if="model.authorEnable">
      <el-form-item label="状态图片 URL">
        <el-input
          v-model="model.authorStatusImg"
          placeholder="例如：https://..."
          clearable
        />
      </el-form-item>
      <el-form-item label="描述 (支持HTML)">
        <el-input
          v-model="model.authorDescription"
          type="textarea"
          :rows="3"
          placeholder="输入作者描述"
        />
      </el-form-item>

      <JsonEditorTable
        :model-value="JSON.stringify(skillsForTable)"
        title="技能列表"
        :columns="skillColumns"
        :new-item-template="{ name: '' }"
        :min-items="2"
        @update:model-value="updateSkills($event)"
      />

      <JsonEditorTable
        :model-value="JSON.stringify(socialsForTable)"
        title="社交链接列表"
        :columns="socialColumns"
        :new-item-template="{ title: '', link: '', icon: '' }"
        @update:model-value="updateSocials($event)"
      />
    </template>

    <el-divider content-position="left">微信二维码</el-divider>
    <el-form-item label="启用微信二维码">
      <el-switch v-model="model.wechatEnable" />
    </el-form-item>
    <template v-if="model.wechatEnable">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="正面二维码图片 URL">
            <el-input v-model="model.wechatFace" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="反面二维码图片 URL">
            <el-input v-model="model.wechatBackFace" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="微信模糊背景图片 URL">
            <el-input v-model="model.wechatBlurredBackground" clearable />
          </el-form-item>
        </el-col>
      </el-row>
    </template>

    <el-divider content-position="left">标签</el-divider>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="启用标签云">
          <el-switch v-model="model.tagsEnable" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-divider content-position="left">归档</el-divider>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="归档显示的月份个数">
          <el-input-number v-model="model.archiveDisplayMonths" :min="0" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item v-if="model.tagsEnable" label="选择高亮的标签">
      <HighlightTagSelector v-model="model.tagsHighlight" />
    </el-form-item>

    <el-divider content-position="left">网站资讯</el-divider>
    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="启用文章总数">
          <el-switch v-model="isTotalPostCountEnabled" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="启用运行时长">
          <el-switch v-model="model.siteInfoRuntimeEnable" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="启用总字数">
          <el-switch v-model="isTotalWordCountEnabled" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-divider content-position="left">目录设置</el-divider>
    <el-form-item label="目录折叠模式">
      <div style="display: flex; flex-direction: column; gap: 4px">
        <el-switch v-model="model.tocCollapseMode" />
        <div class="form-item-help">
          开启后，目录会根据当前阅读位置自动折叠/展开子标题。<br />
          例如：阅读 H2 标题时展开其下 H3 子标题，阅读 H3 时展开 H4，以此类推。
        </div>
      </div>
    </el-form-item>

    <el-divider content-position="left">自定义侧边栏</el-divider>
    <div class="custom-sidebar-blocks">
      <div class="blocks-header">
        <span class="blocks-title"
          >自定义侧边栏块（{{
            model.customSidebarBlocks?.length || 0
          }}/3）</span
        >
        <el-button
          type="primary"
          size="small"
          :disabled="(model.customSidebarBlocks?.length || 0) >= 3"
          @click="addSidebarBlock"
        >
          <el-icon><Plus /></el-icon>
          添加块
        </el-button>
      </div>
      <div class="form-item-help" style="margin-bottom: 16px">
        可添加 0-3 个自定义侧边栏块，每个块支持完整的 HTML 代码（包括
        &lt;style&gt; 和 &lt;script&gt; 标签）。<br />
        块将按顺序显示在侧边栏顶部，可用于添加广告、公告、自定义小工具等。
      </div>

      <div
        v-for="(block, index) in model.customSidebarBlocks"
        :key="index"
        class="sidebar-block-item"
      >
        <div class="block-header">
          <span class="block-number">块 {{ index + 1 }}</span>
          <div class="block-actions">
            <el-button
              type="primary"
              size="small"
              link
              @click="editSidebarBlock(index)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button
              type="primary"
              size="small"
              :disabled="index === 0"
              link
              @click="moveSidebarBlock(index, -1)"
            >
              <el-icon><ArrowUp /></el-icon>
            </el-button>
            <el-button
              type="primary"
              size="small"
              :disabled="index === model.customSidebarBlocks.length - 1"
              link
              @click="moveSidebarBlock(index, 1)"
            >
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <el-button
              type="danger"
              size="small"
              link
              @click="removeSidebarBlock(index)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="block-preview">
          <div class="block-preview-header">
            <span class="block-preview-label">在文章页显示：</span>
            <el-switch v-model="block.showInPost" size="small" />
          </div>
          <div v-if="block.title" class="block-preview-title">
            <strong>标题：</strong>{{ block.title }}
          </div>
          <div class="block-preview-content">
            <strong>内容预览：</strong>
            <!-- eslint-disable-next-line vue/html-self-closing -->
            <div
              class="content-preview"
              v-html="block.content || '（空）'"
            ></div>
          </div>
        </div>
      </div>

      <el-empty
        v-if="!model.customSidebarBlocks?.length"
        description="暂无自定义侧边栏块，点击上方按钮添加"
        :image-size="80"
      />
    </div>

    <!-- 添加/编辑块的弹窗 -->
    <AnDialog
      v-model="dialogVisible"
      :title="
        dialogMode === 'add' ? '添加自定义侧边栏块' : '编辑自定义侧边栏块'
      "
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form :model="dialogForm" label-position="top">
        <el-form-item label="在文章页显示">
          <el-switch v-model="dialogForm.showInPost" />
          <span class="form-item-inline-help"
            >开启后此块将在文章详情页显示</span
          >
        </el-form-item>
        <el-form-item label="块标题（可选）">
          <el-input
            v-model="dialogForm.title"
            placeholder="留空则不显示标题"
            clearable
          />
          <div class="form-item-help">块标题，留空则不显示标题</div>
        </el-form-item>
        <el-form-item label="块内容">
          <el-input
            v-model="dialogForm.content"
            type="textarea"
            :rows="10"
            placeholder="请填写HTML内容"
          />
          <div class="form-item-help">
            支持完整的 HTML 代码（包括 &lt;style&gt; 和 &lt;script&gt;
            标签）。<br />
            可用于添加广告、公告、自定义小工具等。
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelEdit">取消</el-button>
        <el-button type="primary" @click="saveSidebarBlock">
          {{ dialogMode === "add" ? "添加" : "保存" }}
        </el-button>
      </template>
    </AnDialog>
  </div>
</template>

<style lang="scss" scoped>
.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--anzhiyu-secondtext);

  code {
    background-color: var(--anzhiyu-card-bg-grey);
    color: var(--anzhiyu-theme);
    padding: 2px 6px;
    border-radius: 3px;
    transition: all 0.3s ease;

    // 暗色模式优化
    @media (prefers-color-scheme: dark) {
      background-color: rgba(0, 0, 0, 0.2);
    }

    html.dark {
      background-color: rgba(0, 0, 0, 0.2);
    }
  }
}

.form-item-inline-help {
  margin-left: 12px;
  font-size: 12px;
  color: var(--anzhiyu-secondtext);
}

// 自定义侧边栏块样式
.custom-sidebar-blocks {
  .blocks-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    .blocks-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--anzhiyu-fontcolor);
    }
  }

  .sidebar-block-item {
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    background-color: var(--anzhiyu-card-bg);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--anzhiyu-theme);
    }

    .block-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px dashed var(--el-border-color);

      .block-number {
        font-size: 14px;
        font-weight: 600;
        color: var(--anzhiyu-theme);
      }

      .block-actions {
        display: flex;
        gap: 4px;
      }
    }

    .block-preview {
      .block-preview-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;

        .block-preview-label {
          font-size: 14px;
          color: var(--anzhiyu-fontcolor);
        }
      }

      .block-preview-title {
        margin-bottom: 12px;
        padding: 8px 12px;
        background-color: var(--anzhiyu-card-bg-grey);
        border-radius: 4px;
        font-size: 14px;
        color: var(--anzhiyu-fontcolor);

        strong {
          color: var(--anzhiyu-theme);
          margin-right: 8px;
        }
      }

      .block-preview-content {
        font-size: 14px;
        color: var(--anzhiyu-fontcolor);

        strong {
          color: var(--anzhiyu-theme);
          margin-right: 8px;
        }

        .content-preview {
          margin-top: 8px;
          padding: 12px;
          background-color: var(--anzhiyu-card-bg-grey);
          border-radius: 4px;
          max-height: 200px;
          overflow-y: auto;
          word-break: break-all;
          font-size: 12px;
          line-height: 1.5;

          :deep(*) {
            max-width: 100%;
          }

          :deep(img) {
            max-width: 100%;
            height: auto;
          }
        }
      }
    }
  }
}

:deep(.el-divider) {
  margin: 40px 0 28px;

  .el-divider__text {
    background-color: var(--anzhiyu-background);
    color: var(--anzhiyu-fontcolor);
  }
}

// 暗色模式下的输入框优化
@media (prefers-color-scheme: dark) {
  :deep(.el-input__wrapper) {
    background-color: var(--anzhiyu-card-bg);
    border-color: var(--el-border-color-darker);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--anzhiyu-card-border);
    }

    &.is-focus {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--anzhiyu-theme);
      box-shadow: 0 0 0 1px var(--anzhiyu-theme) inset;
    }
  }

  :deep(.el-textarea__inner) {
    background-color: var(--anzhiyu-card-bg);
    border-color: var(--el-border-color-darker);
    color: var(--anzhiyu-fontcolor);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--anzhiyu-card-border);
    }

    &:focus {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--anzhiyu-theme);
      box-shadow: 0 0 0 1px var(--anzhiyu-theme) inset;
    }
  }

  :deep(.el-switch) {
    &.is-checked {
      .el-switch__core {
        background-color: var(--anzhiyu-theme);
      }
    }
  }

  :deep(.el-input-number) {
    .el-input__wrapper {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--el-border-color-darker);
    }
  }
}

// 手动切换暗色模式支持
html.dark {
  :deep(.el-input__wrapper) {
    background-color: var(--anzhiyu-card-bg);
    border-color: var(--el-border-color-darker);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--anzhiyu-card-border);
    }

    &.is-focus {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--anzhiyu-theme);
      box-shadow: 0 0 0 1px var(--anzhiyu-theme) inset;
    }
  }

  :deep(.el-textarea__inner) {
    background-color: var(--anzhiyu-card-bg);
    border-color: var(--el-border-color-darker);
    color: var(--anzhiyu-fontcolor);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--anzhiyu-card-border);
    }

    &:focus {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--anzhiyu-theme);
      box-shadow: 0 0 0 1px var(--anzhiyu-theme) inset;
    }
  }

  :deep(.el-switch) {
    &.is-checked {
      .el-switch__core {
        background-color: var(--anzhiyu-theme);
      }
    }
  }

  :deep(.el-input-number) {
    .el-input__wrapper {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--el-border-color-darker);
    }
  }
}
</style>
