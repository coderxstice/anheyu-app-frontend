<template>
  <div v-loading="siteConfigStore.loading" class="settings-page">
    <SettingsLayout
      :has-changes="hasChanges"
      :loading="saving"
      @save="handleSave"
      @reset-current="handleResetCurrent"
      @reset-all="handleResetAll"
    >
      <template #default="{ activeComponent }">
        <el-form :model="form" label-position="top" class="setting-form">
          <!-- 站点信息 - 基本信息 -->
          <template v-if="activeComponent === 'BaseInfoForm'">
            <div class="section-header">
              <h2>基本信息</h2>
              <p class="section-desc">
                配置站点的基本信息，包括名称、描述、URL 等
              </p>
            </div>
            <BaseInfoForm v-model="form.site" />
          </template>

          <!-- 站点信息 - Logo与图标 -->
          <template v-else-if="activeComponent === 'IconSettingsForm'">
            <div class="section-header">
              <h2>Logo 与图标</h2>
              <p class="section-desc">配置站点的 Logo、Favicon 和 PWA 图标</p>
            </div>
            <IconSettingsForm v-model="form.site" />
          </template>

          <!-- 外观配置 - 首页设置 -->
          <template v-else-if="activeComponent === 'HomePageForm'">
            <div class="section-header">
              <h2>首页设置</h2>
              <p class="section-desc">
                配置首页顶部、Banner、分类卡片、页眉页脚等
              </p>
            </div>
            <HomePageForm v-model="form.frontDesk.home" />
          </template>

          <!-- 外观配置 - 侧边栏 -->
          <template v-else-if="activeComponent === 'SidebarPageForm'">
            <div class="section-header">
              <h2>侧边栏</h2>
              <p class="section-desc">
                配置侧边栏的作者信息、标签云、天气等模块
              </p>
            </div>
            <SidebarPageForm v-model="form.frontDesk.sidebar" />
          </template>

          <!-- 外观配置 - 页面样式 -->
          <template v-else-if="activeComponent === 'PageSittingForm'">
            <div class="section-header">
              <h2>页面样式</h2>
              <p class="section-desc">
                配置外链警告、图片参数、自定义 CSS/JS 等
              </p>
            </div>
            <PageSittingForm v-model="form.page" />
          </template>

          <!-- 内容管理 - 文章配置 -->
          <template v-else-if="activeComponent === 'PostSettings'">
            <div class="section-header">
              <h2>文章配置</h2>
              <p class="section-desc">
                配置文章的默认封面、分页、代码块、打赏等
              </p>
            </div>
            <PostSettings v-model="form.post" />
          </template>

          <!-- 内容管理 - 文件处理 -->
          <template v-else-if="activeComponent === 'FileSettings'">
            <div class="section-header">
              <h2>文件处理</h2>
              <p class="section-desc">
                配置文件上传限制、缩略图生成、EXIF 提取等
              </p>
            </div>
            <FileSettings v-model="form.file" />
          </template>

          <!-- 用户与通知 - 评论系统 -->
          <template v-else-if="activeComponent === 'CommentSettingsForm'">
            <div class="section-header">
              <h2>评论系统</h2>
              <p class="section-desc">配置评论功能、敏感词过滤、通知设置等</p>
            </div>
            <CommentSettingsForm v-model="form.frontDesk.comment" />
          </template>

          <!-- 用户与通知 - 邮件服务 -->
          <template v-else-if="activeComponent === 'EmailSettingsForm'">
            <div class="section-header">
              <h2>邮件服务</h2>
              <p class="section-desc">配置 SMTP 服务器和邮件模板</p>
            </div>
            <EmailSettingsForm v-model="form.frontDesk.email" />
          </template>

          <!-- 高级功能 - 友链管理 -->
          <template v-else-if="activeComponent === 'FLinkPageSettingsForm'">
            <div class="section-header">
              <h2>友链管理</h2>
              <p class="section-desc">配置友链申请条件、通知和审核设置</p>
            </div>
            <FLinkPageSettingsForm
              ref="fLinkFormRef"
              v-model="form.frontDesk.fLink"
            />
          </template>

          <!-- 高级功能 - 关于页 -->
          <template v-else-if="activeComponent === 'AboutPageForm'">
            <div class="section-header">
              <h2>关于页</h2>
              <p class="section-desc">配置关于页的个人信息、技能、生涯等</p>
            </div>
            <AboutPageForm ref="aboutFormRef" v-model="form.frontDesk.about" />
          </template>

          <!-- 高级功能 - 装备页 -->
          <template v-else-if="activeComponent === 'EquipmentPageForm'">
            <div class="section-header">
              <h2>装备页</h2>
              <p class="section-desc">配置装备/好物展示页面</p>
            </div>
            <EquipmentPageForm v-model="form.frontDesk.equipment" />
          </template>

          <!-- 高级功能 - 评论页 -->
          <template v-else-if="activeComponent === 'RecentCommentsPageForm'">
            <div class="section-header">
              <h2>最近评论页</h2>
              <p class="section-desc">配置最近评论页面的 Banner 等</p>
            </div>
            <RecentCommentsPageForm v-model="form.frontDesk.recentComments" />
          </template>

          <!-- 高级功能 - 相册页 -->
          <template v-else-if="activeComponent === 'AlbumPageForm'">
            <div class="section-header">
              <h2>相册页</h2>
              <p class="section-desc">
                配置相册页面的 Banner、布局模式、瀑布流等
              </p>
            </div>
            <AlbumPageForm v-model="form.frontDesk.album" />
          </template>

          <!-- 高级功能 - 页面管理 -->
          <template v-else-if="activeComponent === 'PageManagement'">
            <div class="section-header">
              <h2>页面管理</h2>
              <p class="section-desc">管理自定义页面</p>
            </div>
            <PageManagement />
          </template>

          <!-- 高级功能 - 备份&导入 -->
          <template v-else-if="activeComponent === 'BackupImportForm'">
            <div class="section-header">
              <h2>备份 & 导入</h2>
              <p class="section-desc">
                管理系统配置备份，支持导出、导入和恢复配置
              </p>
            </div>
            <BackupImportForm />
          </template>
        </el-form>
      </template>
    </SettingsLayout>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, watch, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { get, set, isEqual, cloneDeep } from "lodash-es";

// 引入描述符和工具函数
import { allSettingDescriptors } from "./settings.descriptor";
import {
  createInitialFormState,
  createDescriptorMap,
  parseBackendValue,
  formatValueForSave,
  validateJsonConfig
} from "./utils";

// 引入布局组件
import SettingsLayout from "./components/SettingsLayout.vue";

// 引入所有表单子组件
import BaseInfoForm from "./components/BaseInfoForm.vue";
import IconSettingsForm from "./components/IconSettingsForm.vue";
import PageSittingForm from "./components/PageSittingForm.vue";
import FileSettings from "./components/fileSetting/FileSettingsForm.vue";
import PostSettings from "./components/postSettings/index.vue";
import PageManagement from "../page-management/index.vue";

// 引入前台相关组件
import HomePageForm from "./components/frontDesk/HomePageForm/index.vue";
import SidebarPageForm from "./components/frontDesk/SidebarPageForm/index.vue";
import CommentSettingsForm from "./components/frontDesk/CommentSettingsForm/index.vue";
import EmailSettingsForm from "./components/frontDesk/EmailSettingsForm/index.vue";
import FLinkPageSettingsForm from "./components/frontDesk/FLinkPageSettingsForm/index.vue";
import EquipmentPageForm from "./components/frontDesk/EquipmentPageForm/index.vue";
import AboutPageForm from "./components/frontDesk/AboutPageForm/index.vue";
import RecentCommentsPageForm from "./components/frontDesk/RecentCommentsPageForm/index.vue";
import AlbumPageForm from "./components/frontDesk/AlbumPageForm/index.vue";
import BackupImportForm from "./components/BackupImportForm.vue";

const siteConfigStore = useSiteConfigStore();
const fLinkFormRef = ref<InstanceType<typeof FLinkPageSettingsForm>>();
const aboutFormRef = ref<InstanceType<typeof AboutPageForm>>();
const saving = ref(false);

// 根据描述符创建 Map，方便查找
const descriptorMap = createDescriptorMap(allSettingDescriptors);
// 根据描述符获取所有需要从后端请求的键
const allBackendKeys = allSettingDescriptors.map(d => d.backendKey);
// 根据描述符自动生成包含所有默认值的、具有正确嵌套结构的 form 对象
const form = reactive(createInitialFormState(allSettingDescriptors));
// 保存原始数据用于比较变更
const originalFormData = ref<any>(null);

// 检测是否有未保存的更改
const hasChanges = computed(() => {
  if (!originalFormData.value) return false;

  for (const [frontendPath, desc] of descriptorMap) {
    const currentValue = get(form, frontendPath);
    const originalValue = get(originalFormData.value, frontendPath);

    if (!isEqual(currentValue, originalValue)) {
      return true;
    }
  }
  return false;
});

watch(
  () => siteConfigStore.siteConfig,
  newSettings => {
    if (!newSettings || Object.keys(newSettings).length === 0) return;

    // 通用逻辑：遍历描述符，自动填充表单
    descriptorMap.forEach((desc, frontendPath) => {
      const backendValue = get(newSettings, desc.backendKey);
      if (backendValue !== undefined) {
        const parsedValue = parseBackendValue(
          backendValue,
          desc.type,
          desc.backendKey
        );
        set(form, frontendPath, cloneDeep(parsedValue));
      }
    });

    // 保存原始数据用于比较
    originalFormData.value = cloneDeep(form);
  },
  { deep: true, immediate: true }
);

onMounted(() => {
  siteConfigStore.fetchSystemSettings(allBackendKeys);
});

const handleSave = async () => {
  // 在保存前，先同步编辑器的内容
  if (fLinkFormRef.value?.syncEditorContent) {
    await fLinkFormRef.value.syncEditorContent();
  }
  if (aboutFormRef.value?.syncEditorContent) {
    await aboutFormRef.value.syncEditorContent();
  }

  const settingsToUpdate: Record<string, any> = {};
  const originalSettings = siteConfigStore.siteConfig;
  const validationErrors: string[] = [];

  // 通用逻辑：遍历描述符，自动比较差异和验证
  descriptorMap.forEach((desc, frontendPath) => {
    const currentValue = get(form, frontendPath);
    const originalValueRaw = get(originalSettings, desc.backendKey);
    const originalValueParsed = parseBackendValue(
      originalValueRaw,
      desc.type,
      desc.backendKey
    );

    if (!isEqual(currentValue, originalValueParsed)) {
      const formattedValue = formatValueForSave(currentValue, desc.type);

      // 对JSON类型进行额外验证
      if (desc.type === "json") {
        const validation = validateJsonConfig(formattedValue, desc.backendKey);
        if (!validation.isValid) {
          validationErrors.push(`${desc.backendKey}: ${validation.error}`);
          return;
        }
      }

      settingsToUpdate[desc.backendKey] = formattedValue;
    }
  });

  // 如果有验证错误，显示错误信息并停止保存
  if (validationErrors.length > 0) {
    ElMessage.error(`配置验证失败：\n${validationErrors.join("\n")}`);
    return;
  }

  if (Object.keys(settingsToUpdate).length === 0) {
    ElMessage.info("没有检测到任何更改。");
    return;
  }

  saving.value = true;

  try {
    await siteConfigStore.saveSystemSettings(
      settingsToUpdate,
      allSettingDescriptors
    );
    // 更新原始数据
    originalFormData.value = cloneDeep(form);
  } catch (error: any) {
    console.error("保存设置时发生错误:", error);
    ElMessage.error(`保存失败: ${error.message || String(error)}`);
  } finally {
    saving.value = false;
  }
};

// 组件名到 frontendPath 前缀的映射
const componentToPathPrefix: Record<string, string[]> = {
  BaseInfoForm: ["site."],
  IconSettingsForm: ["site."],
  HomePageForm: ["frontDesk.home."],
  SidebarPageForm: ["frontDesk.sidebar."],
  PageSittingForm: ["page."],
  PostSettings: ["post."],
  FileSettings: ["file."],
  CommentSettingsForm: ["frontDesk.comment."],
  EmailSettingsForm: ["frontDesk.email."],
  FLinkPageSettingsForm: ["frontDesk.fLink."],
  AboutPageForm: ["frontDesk.about."],
  EquipmentPageForm: ["frontDesk.equipment."],
  RecentCommentsPageForm: ["frontDesk.recentComments."],
  AlbumPageForm: ["frontDesk.album."]
};

// 重置选区 - 重置当前 tab 的配置
const handleResetCurrent = (activeComponent: string) => {
  const prefixes = componentToPathPrefix[activeComponent];
  if (!prefixes || prefixes.length === 0) {
    ElMessage.warning("当前页面不支持重置操作");
    return;
  }

  if (!originalFormData.value) {
    ElMessage.warning("没有可重置的数据");
    return;
  }

  // 先检查当前页面是否有变更
  let changedCount = 0;
  descriptorMap.forEach((desc, frontendPath) => {
    const belongsToComponent = prefixes.some(prefix =>
      frontendPath.startsWith(prefix)
    );
    if (belongsToComponent) {
      const currentValue = get(form, frontendPath);
      const originalValue = get(originalFormData.value, frontendPath);
      if (!isEqual(currentValue, originalValue)) {
        changedCount++;
      }
    }
  });

  if (changedCount === 0) {
    ElMessage.info("当前页面没有需要重置的更改");
    return;
  }

  ElMessageBox.confirm(
    `确定要重置当前页面的 ${changedCount} 项配置更改吗？`,
    "重置选区确认",
    {
      confirmButtonText: "确定重置",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      let resetCount = 0;
      descriptorMap.forEach((desc, frontendPath) => {
        const belongsToComponent = prefixes.some(prefix =>
          frontendPath.startsWith(prefix)
        );
        if (belongsToComponent) {
          const currentValue = get(form, frontendPath);
          const originalValue = get(originalFormData.value, frontendPath);
          // 只重置有变更的配置
          if (
            !isEqual(currentValue, originalValue) &&
            originalValue !== undefined
          ) {
            set(form, frontendPath, cloneDeep(originalValue));
            resetCount++;
          }
        }
      });

      ElMessage.success(`已重置 ${resetCount} 项配置`);
    })
    .catch(() => {
      // 用户取消
    });
};

// 重置全部 - 重置所有配置
const handleResetAll = () => {
  if (!originalFormData.value) {
    ElMessage.warning("没有可重置的数据");
    return;
  }

  // 先统计变更数量
  let changedCount = 0;
  descriptorMap.forEach((desc, frontendPath) => {
    const currentValue = get(form, frontendPath);
    const originalValue = get(originalFormData.value, frontendPath);
    if (!isEqual(currentValue, originalValue)) {
      changedCount++;
    }
  });

  if (changedCount === 0) {
    ElMessage.info("没有需要重置的更改");
    return;
  }

  ElMessageBox.confirm(
    `确定要重置所有 ${changedCount} 项配置更改吗？`,
    "重置全部确认",
    {
      confirmButtonText: "确定重置",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      let resetCount = 0;
      descriptorMap.forEach((desc, frontendPath) => {
        const currentValue = get(form, frontendPath);
        const originalValue = get(originalFormData.value, frontendPath);
        // 只重置有变更的配置
        if (
          !isEqual(currentValue, originalValue) &&
          originalValue !== undefined
        ) {
          set(form, frontendPath, cloneDeep(originalValue));
          resetCount++;
        }
      });

      ElMessage.success(`已重置 ${resetCount} 项配置`);
    })
    .catch(() => {
      // 用户取消
    });
};
</script>

<style scoped lang="scss">
.settings-page {
  height: 100%;
  overflow: hidden;
  margin: 0;
}

.setting-form {
  width: 100%;
}

.section-header {
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .section-desc {
    margin: 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}
</style>
