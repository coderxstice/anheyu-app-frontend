<!--
 * @Description: 资源库选择器组件 - 支持从最近上传选择图片或输入外链
 * @Author: 安知鱼
 * @Date: 2025-12-29 10:00:00
-->
<template>
  <AnDialog
    ref="dialogRef"
    v-model="visible"
    width="700px"
    :close-on-click-modal="true"
    :hide-header="true"
    :hide-footer="true"
  >
    <!-- Tab 切换 -->
    <div class="dialog-header">
      <AnTabs v-model="activeTab" :tabs="tabList" />
    </div>

    <!-- 最近上传标签页 -->
    <div v-show="activeTab === 'library'" class="library-content">
      <!-- 搜索和上传栏 -->
      <div class="library-toolbar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索"
          class="search-input"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <div class="toolbar-right">
          <!-- 存储策略选择 -->
          <div class="policy-selector-wrapper">
            <div
              class="policy-selector"
              :class="{ active: policyPanelVisible }"
              @click="togglePolicyPanel"
            >
              <i class="anzhiyufont anzhiyu-icon-cloud-arrow-up" />
              <span class="policy-name">{{
                currentPolicyName || "选择存储"
              }}</span>
              <i
                class="anzhiyufont anzhiyu-icon-angle-down arrow-icon"
                :class="{ rotated: policyPanelVisible }"
              />
            </div>
            <Transition
              @before-enter="onPanelBeforeEnter"
              @enter="onPanelEnter"
              @leave="onPanelLeave"
            >
              <div
                v-show="policyPanelVisible"
                ref="policyPanelRef"
                class="policy-panel"
              >
                <div class="policy-header">
                  <span>上传存储策略</span>
                  <el-button
                    type="danger"
                    text
                    size="small"
                    @click="clearAllImages"
                  >
                    <i class="anzhiyufont anzhiyu-icon-trash" />
                    清空记录
                  </el-button>
                </div>
                <div class="policy-list">
                  <div
                    v-for="policy in policies"
                    :key="policy.id"
                    class="policy-item"
                    :class="{ active: selectedPolicyId === policy.id }"
                    @click="handleSelectPolicy(policy.id)"
                  >
                    <div class="policy-info">
                      <span class="policy-item-name">{{ policy.name }}</span>
                      <span class="policy-type">{{
                        getPolicyTypeLabel(policy.type)
                      }}</span>
                    </div>
                    <i
                      v-if="selectedPolicyId === policy.id"
                      class="anzhiyufont anzhiyu-icon-check"
                    />
                  </div>
                  <div v-if="policies.length === 0" class="policy-empty">
                    暂无可用存储策略
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <el-tooltip
            content="最大支持20M，单次可上传6个文件，支持拖拽上传"
            placement="top"
          >
            <i class="anzhiyufont anzhiyu-icon-circle-question help-icon" />
          </el-tooltip>
          <el-button type="primary" text @click="triggerUpload">
            <i class="anzhiyufont anzhiyu-icon-cloud-arrow-up" />
            上传
          </el-button>
        </div>
      </div>

      <!-- 图片网格 -->
      <div
        ref="imageGridRef"
        class="image-grid"
        @dragover.prevent="handleDragOver"
        @dragleave="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <div
          v-for="image in filteredImages"
          :key="image.url"
          class="image-item"
          :class="{ selected: isSelected(image) }"
          @click="toggleSelect(image)"
        >
          <div class="image-wrapper">
            <img
              :src="image.url"
              :alt="image.name"
              loading="lazy"
              @error="handleImageError($event)"
            />
            <div v-if="isSelected(image)" class="selection-badge">
              {{ getSelectionIndex(image) }}
            </div>
            <!-- 删除按钮 -->
            <div
              class="delete-btn"
              title="删除"
              @click.stop="handleDeleteImage(image)"
            >
              <el-icon><Close /></el-icon>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredImages.length === 0" class="empty-state">
          <el-empty description="暂无图片，请先上传">
            <el-button type="primary" @click="triggerUpload"
              >上传图片</el-button
            >
          </el-empty>
        </div>
      </div>

      <!-- 拖拽上传遮罩 -->
      <div v-if="isDragging" class="drag-overlay">
        <div class="drag-hint">
          <el-icon :size="48"><Upload /></el-icon>
          <p>释放文件以上传</p>
        </div>
      </div>
    </div>

    <!-- 外链图片标签页 -->
    <div v-show="activeTab === 'external'" class="external-content">
      <div class="external-form">
        <p class="form-label">请填写图片地址：</p>
        <el-input
          v-model="externalUrl"
          type="textarea"
          :rows="4"
          placeholder="https://..."
          resize="none"
        />
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="dialog-footer">
      <el-button @click="handleCancel">取 消</el-button>
      <el-button type="primary" @click="handleConfirm">确 认</el-button>
    </div>

    <!-- 隐藏的文件上传输入框 -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      multiple
      style="display: none"
      @change="handleFileChange"
    />
  </AnDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Close } from "@element-plus/icons-vue";
import AnDialog from "@/components/AnDialog/index.vue";
import AnTabs from "@/components/AnTabs/index.vue";
import type { TabItem } from "@/components/AnTabs/index.vue";
import { uploadArticleImage } from "@/api/post";
import { getPolicyList, type StoragePolicy } from "@/api/sys-policy";
import gsap from "gsap";

// 存储的图片项接口
interface StoredImage {
  url: string;
  name: string;
  uploadedAt: number;
}

// localStorage key
const STORAGE_KEY = "resource_library_recent_images";
const POLICY_STORAGE_KEY = "resource_library_policy_id";
const MAX_STORED_IMAGES = 50;

// Tab 列表
const tabList: TabItem[] = [
  { label: "最近上传", value: "library" },
  { label: "外链图片", value: "external" }
];

// Props
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    /** 是否多选模式 */
    multiple?: boolean;
    /** 最大选择数量（多选模式下生效） */
    maxSelect?: number;
  }>(),
  {
    multiple: false,
    maxSelect: 10
  }
);

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  /** 选择完成事件，返回选中的图片URL数组 */
  confirm: [urls: string[]];
}>();

// 对话框显示控制
const visible = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

// 标签页状态
const activeTab = ref<string>("library");

// 图片库状态
const recentImages = ref<StoredImage[]>([]);
const searchKeyword = ref("");
const selectedImages = ref<StoredImage[]>([]);
const dialogRef = ref<InstanceType<typeof AnDialog> | null>(null);
const imageGridRef = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

// 外链输入
const externalUrl = ref("");

// 上传状态
const isUploading = ref(false);

// 存储策略相关
const policies = ref<StoragePolicy[]>([]);
const selectedPolicyId = ref<number | null>(null);
const policyPanelVisible = ref(false);
const policyPanelRef = ref<HTMLElement | null>(null);

// 当前选中的策略名称
const currentPolicyName = computed(() => {
  if (!selectedPolicyId.value) return "";
  const policy = policies.value.find(p => p.id === selectedPolicyId.value);
  return policy?.name || "";
});

// 当前选中的策略类型
const currentPolicyType = computed(() => {
  if (!selectedPolicyId.value) return "";
  const policy = policies.value.find(p => p.id === selectedPolicyId.value);
  return policy?.type || "";
});

// 过滤后的图片列表
const filteredImages = computed(() => {
  if (!searchKeyword.value.trim()) {
    return recentImages.value;
  }
  const keyword = searchKeyword.value.toLowerCase();
  return recentImages.value.filter(img =>
    img.name.toLowerCase().includes(keyword)
  );
});

// 监听对话框打开
watch(
  () => props.modelValue,
  async newVal => {
    if (newVal) {
      resetState();
      loadRecentImages();
      loadSavedPolicyId();
      await loadPolicies();
    }
  }
);

// 重置状态
const resetState = () => {
  selectedImages.value = [];
  searchKeyword.value = "";
  externalUrl.value = "";
  activeTab.value = "library";
};

// 从 localStorage 加载最近图片
const loadRecentImages = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const images: StoredImage[] = JSON.parse(stored);
      // 迁移旧数据：将绝对 URL 转换为相对路径
      let needsSave = false;
      const migratedImages = images.map(img => {
        const normalizedUrl = normalizeStorageUrl(img.url);
        if (normalizedUrl !== img.url) {
          needsSave = true;
          return { ...img, url: normalizedUrl };
        }
        return img;
      });
      recentImages.value = migratedImages;
      // 如果有数据需要迁移，保存更新后的数据
      if (needsSave) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedImages));
      }
    }
  } catch (error) {
    console.error("加载最近图片失败:", error);
    recentImages.value = [];
  }
};

// 加载保存的策略ID
const loadSavedPolicyId = () => {
  try {
    const savedId = localStorage.getItem(POLICY_STORAGE_KEY);
    if (savedId) {
      selectedPolicyId.value = Number(savedId);
    }
  } catch (error) {
    console.error("加载存储策略ID失败:", error);
  }
};

// 处理存储 URL，将绝对 URL 转换为相对路径（用于本地存储策略）
const normalizeStorageUrl = (url: string): string => {
  // 检查是否是完整的URL（包含协议和域名），并且是本地 API 路径
  const urlPattern = /^https?:\/\/[^\/]+(\/api\/f\/[^?#]+)/;
  const match = url.match(urlPattern);

  if (match) {
    // 提取路径部分，这样可以通过前端代理正确访问
    return match[1];
  }

  return url;
};

// 保存图片到 localStorage
const saveImageToStorage = (url: string, name: string) => {
  // 在保存前处理 URL，将绝对 URL 转换为相对路径
  const normalizedUrl = normalizeStorageUrl(url);

  const newImage: StoredImage = {
    url: normalizedUrl,
    name,
    uploadedAt: Date.now()
  };

  // 检查是否已存在
  const existingIndex = recentImages.value.findIndex(img => img.url === url);
  if (existingIndex >= 0) {
    recentImages.value.splice(existingIndex, 1);
  }

  // 添加到开头
  recentImages.value.unshift(newImage);

  // 限制数量
  if (recentImages.value.length > MAX_STORED_IMAGES) {
    recentImages.value = recentImages.value.slice(0, MAX_STORED_IMAGES);
  }

  // 保存到 localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentImages.value));
  } catch (error) {
    console.error("保存图片到本地存储失败:", error);
  }
};

// 删除单个图片
const handleDeleteImage = (image: StoredImage) => {
  const index = recentImages.value.findIndex(img => img.url === image.url);
  if (index >= 0) {
    recentImages.value.splice(index, 1);
    // 同时从选中列表中移除
    const selectedIndex = selectedImages.value.findIndex(
      img => img.url === image.url
    );
    if (selectedIndex >= 0) {
      selectedImages.value.splice(selectedIndex, 1);
    }
    // 保存到 localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentImages.value));
      ElMessage.success("已删除");
    } catch (error) {
      console.error("删除图片失败:", error);
    }
  }
};

// 清空所有最近上传
const clearAllImages = async () => {
  try {
    await ElMessageBox.confirm("确定要清空所有最近上传的图片记录吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });
    recentImages.value = [];
    selectedImages.value = [];
    localStorage.removeItem(STORAGE_KEY);
    ElMessage.success("已清空");
  } catch {
    // 用户取消
  }
};

// 加载存储策略列表
const loadPolicies = async () => {
  try {
    const response = await getPolicyList({ page: 1, pageSize: 100 });
    if (response.data?.list) {
      policies.value = response.data.list;
      // 如果没有选择策略且有策略列表，默认选择第一个
      if (!selectedPolicyId.value && policies.value.length > 0) {
        selectedPolicyId.value = policies.value[0].id;
        savePolicyId(policies.value[0].id);
      }
    }
  } catch (error) {
    console.error("加载存储策略失败:", error);
  }
};

// 切换策略面板显示
const togglePolicyPanel = () => {
  policyPanelVisible.value = !policyPanelVisible.value;
};

// 选择存储策略
const selectPolicy = (policyId: number) => {
  selectedPolicyId.value = policyId;
  savePolicyId(policyId);
};

// 选择策略并关闭面板
const handleSelectPolicy = (policyId: number) => {
  selectPolicy(policyId);
  policyPanelVisible.value = false;
};

// 策略面板动画 - 进入前
const onPanelBeforeEnter = (el: Element) => {
  const element = el as HTMLElement;
  gsap.set(element, {
    opacity: 0,
    scaleY: 0,
    scaleX: 0.95,
    transformOrigin: "top center"
  });
};

// 策略面板动画 - 进入
const onPanelEnter = (el: Element, done: () => void) => {
  const element = el as HTMLElement;
  gsap.to(element, {
    opacity: 1,
    scaleY: 1,
    scaleX: 1,
    duration: 0.25,
    ease: "power2.out",
    onComplete: done
  });
};

// 策略面板动画 - 离开
const onPanelLeave = (el: Element, done: () => void) => {
  const element = el as HTMLElement;
  gsap.to(element, {
    opacity: 0,
    scaleY: 0,
    scaleX: 0.95,
    duration: 0.2,
    ease: "power2.in",
    onComplete: done
  });
};

// 点击外部关闭面板
const handleClickOutside = (event: MouseEvent) => {
  if (!policyPanelVisible.value) return;

  const target = event.target as HTMLElement;
  const wrapper = target.closest(".policy-selector-wrapper");
  if (!wrapper) {
    policyPanelVisible.value = false;
  }
};

// 保存策略ID到本地存储
const savePolicyId = (policyId: number) => {
  localStorage.setItem(POLICY_STORAGE_KEY, String(policyId));
};

// 获取策略类型标签
const getPolicyTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    local: "本地",
    onedrive: "OneDrive",
    tencent_cos: "腾讯云COS",
    aliyun_oss: "阿里云OSS",
    aws_s3: "AWS S3"
  };
  return typeMap[type] || type;
};

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = "/logo.svg";
};

// 判断图片是否被选中
const isSelected = (image: StoredImage) => {
  return selectedImages.value.some(img => img.url === image.url);
};

// 获取选中序号
const getSelectionIndex = (image: StoredImage) => {
  const index = selectedImages.value.findIndex(img => img.url === image.url);
  return index + 1;
};

// 切换图片选中状态
const toggleSelect = (image: StoredImage) => {
  const index = selectedImages.value.findIndex(img => img.url === image.url);

  if (index >= 0) {
    // 已选中，取消选中
    selectedImages.value.splice(index, 1);
  } else {
    // 未选中
    if (props.multiple) {
      // 多选模式
      if (selectedImages.value.length >= props.maxSelect) {
        ElMessage.warning(`最多只能选择${props.maxSelect}张图片`);
        return;
      }
      selectedImages.value.push(image);
    } else {
      // 单选模式
      selectedImages.value = [image];
    }
  }
};

// 触发文件上传
const triggerUpload = () => {
  fileInputRef.value?.click();
};

// 处理文件选择
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files || files.length === 0) return;

  if (files.length > 6) {
    ElMessage.warning("单次最多上传6个文件");
    target.value = "";
    return;
  }

  // 过滤图片文件
  const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
  if (imageFiles.length === 0) {
    ElMessage.warning("请选择图片文件");
    target.value = "";
    return;
  }

  target.value = "";
  // 直接上传
  await doUploadFiles(imageFiles);
};

// 执行上传文件
const doUploadFiles = async (files: File[]) => {
  if (files.length === 0) return;

  isUploading.value = true;
  const MAX_SIZE = 20 * 1024 * 1024; // 20MB

  for (const file of files) {
    if (file.size > MAX_SIZE) {
      ElMessage.warning(`${file.name} 超过20M限制，已跳过`);
      continue;
    }

    try {
      const loadingMsg = ElMessage.info({
        message: `正在上传 ${file.name}...`,
        duration: 0,
        showClose: true
      });

      const url = await uploadFile(file);
      loadingMsg.close();

      if (url) {
        saveImageToStorage(url, file.name);
        ElMessage.success(`${file.name} 上传成功`);
      }
    } catch (error: any) {
      console.error(`上传 ${file.name} 失败:`, error);
      ElMessage.error(`${file.name} 上传失败: ${error.message || "未知错误"}`);
    }
  }

  isUploading.value = false;
};

// 上传单个文件
const uploadFile = async (file: File): Promise<string | null> => {
  try {
    const res = await uploadArticleImage(file);
    const url = res?.data?.url;

    if (!url) {
      throw new Error("服务器未返回有效的图片URL");
    }

    return url;
  } catch (error) {
    console.error("文件上传失败:", error);
    throw error;
  }
};

// 拖拽处理
const handleDragOver = () => {
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false;

  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) return;

  const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));

  if (imageFiles.length === 0) {
    ElMessage.warning("请拖入图片文件");
    return;
  }

  if (imageFiles.length > 6) {
    ElMessage.warning("单次最多上传6个文件");
    return;
  }

  // 直接上传
  await doUploadFiles(imageFiles);
};

// 取消
const handleCancel = () => {
  emit("update:modelValue", false);
};

// 处理 URL，将绝对 URL 转换为相对路径
// 注意：无论使用什么存储策略，系统返回的直链 URL 格式都是 {siteURL}/api/f/{publicID}/{fileName}
// 所以需要统一处理，不区分存储策略类型
const normalizeUrl = (url: string): string => {
  // 检查是否是完整的URL（包含协议和域名），并且是本站 API 路径
  const urlPattern = /^https?:\/\/[^\/]+(\/api\/f\/[^?#]+)/;
  const match = url.match(urlPattern);

  if (match) {
    // 提取路径部分，这样可以通过前端代理正确访问
    return match[1];
  }

  return url;
};

// 确认选择
const handleConfirm = () => {
  let urls: string[] = [];

  if (activeTab.value === "library") {
    // 从最近上传选择
    if (selectedImages.value.length === 0) {
      ElMessage.warning("请选择图片");
      return;
    }
    urls = selectedImages.value.map(img => normalizeUrl(img.url));
  } else {
    // 外链图片
    const trimmedUrl = externalUrl.value.trim();
    if (!trimmedUrl) {
      ElMessage.warning("请输入图片链接");
      return;
    }
    urls = [normalizeUrl(trimmedUrl)];
  }

  emit("confirm", urls);
  emit("update:modelValue", false);
};

// 生命周期
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style lang="scss" scoped>
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding-bottom: 16px;
  border-bottom: var(--style-border);
}

.library-content {
  position: relative;
  height: 450px;
  display: flex;
  flex-direction: column;
}

.library-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16px 0;
  flex-shrink: 0;

  .search-input {
    width: 200px;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;

    .policy-selector-wrapper {
      position: relative;
      width: 140px;
    }

    .policy-selector {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: var(--anzhiyu-secondbg);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 13px;
      color: var(--anzhiyu-fontcolor);
      width: 100%;

      &:hover,
      &.active {
        background: var(--anzhiyu-theme-op);
      }

      .anzhiyufont {
        font-size: 14px;
        color: var(--anzhiyu-theme);
        flex-shrink: 0;
      }

      .policy-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .arrow-icon {
        font-size: 12px;
        color: var(--anzhiyu-secondtext);
        transition: transform 0.25s ease;
        flex-shrink: 0;

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }

    .help-icon {
      font-size: 16px;
      color: var(--anzhiyu-secondtext);
      cursor: pointer;

      &:hover {
        color: var(--anzhiyu-theme);
      }
    }
  }
}

// 策略选择面板样式
.policy-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  padding: 12px;
  background: var(--anzhiyu-card-bg);
  border-radius: 12px;
  box-shadow:
    0 6px 16px -8px rgba(0, 0, 0, 0.08),
    0 9px 28px 0 rgba(0, 0, 0, 0.05),
    0 12px 48px 16px rgba(0, 0, 0, 0.03);
  border: var(--style-border);
  z-index: 100;
  transform-origin: top center;

  .policy-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
    margin-bottom: 8px;
    border-bottom: var(--style-border);
    font-size: 14px;
    font-weight: 500;
    color: var(--anzhiyu-fontcolor);

    .el-button {
      font-size: 12px;
    }
  }

  .policy-list {
    max-height: 200px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--el-border-color);
      border-radius: 2px;
    }
  }

  .policy-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    margin-bottom: 4px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--anzhiyu-secondbg);
    }

    &.active {
      background: var(--anzhiyu-theme-op);

      .policy-item-name {
        color: var(--anzhiyu-theme);
      }

      .anzhiyu-icon-check {
        color: var(--anzhiyu-theme);
      }
    }

    .policy-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .policy-item-name {
      font-size: 14px;
      color: var(--anzhiyu-fontcolor);
    }

    .policy-type {
      font-size: 12px;
      color: var(--anzhiyu-secondtext);
    }

    .anzhiyu-icon-check {
      font-size: 14px;
    }
  }

  .policy-empty {
    text-align: center;
    padding: 20px;
    color: var(--anzhiyu-secondtext);
    font-size: 13px;
  }
}

.image-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  overflow-y: auto;
  padding: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--el-border-color);
    border-radius: 3px;
  }
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  background-color: var(--anzhiyu-card-bg-grey);

  &:hover {
    border-color: var(--anzhiyu-theme-op);
    box-shadow: var(--anzhiyu-shadow-border);

    .delete-btn {
      opacity: 1;
    }
  }

  &.selected {
    border-color: var(--anzhiyu-theme);
  }

  .image-wrapper {
    width: 100%;
    height: 100%;
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 6px;
    }
  }

  .selection-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 22px;
    height: 22px;
    background-color: var(--anzhiyu-theme);
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }

  .delete-btn {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 22px;
    height: 22px;
    background-color: rgba(0, 0, 0, 0.6);
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s;
    cursor: pointer;

    &:hover {
      background-color: var(--el-color-danger);
    }
  }
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
}

.drag-overlay {
  position: absolute;
  inset: 0;
  background-color: var(--anzhiyu-theme-op);
  border: 2px dashed var(--anzhiyu-theme);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  .drag-hint {
    text-align: center;
    color: var(--anzhiyu-theme);

    p {
      margin-top: 8px;
      font-size: 16px;
    }
  }
}

.external-content {
  height: 450px;
  display: flex;
  flex-direction: column;

  .external-form {
    padding: 20px 0;

    .form-label {
      margin-bottom: 12px;
      font-size: 14px;
      color: var(--anzhiyu-fontcolor);
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: var(--style-border);
  margin-top: 16px;

  .el-button {
    min-width: 100px;
  }
}
</style>
