<!--
 * @Description: 友情链接申请面板
 * @Author: 安知鱼
 * @Date: 2025-08-19 10:19:23
 * @LastEditTime: 2025-11-08 18:27:40
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick, onMounted } from "vue";
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElAlert,
  ElMessage,
  ElRadioGroup,
  ElRadio,
  ElTag,
  ElPagination,
  ElEmpty,
  type FormInstance,
  type FormRules
} from "element-plus";
import { applyLink, getLinkApplications } from "@/api/postLink";
import type { ApplyLinkRequest, LinkItem } from "@/api/postLink/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import md5 from "blueimp-md5";

defineOptions({
  name: "ApplyLink"
});

const props = defineProps<{
  friendLinkApplyCondition: string[];
  friendLinkApplyCustomCodeHtml?: string; // 渲染后的 HTML 内容
  placeholderName?: string; // 网站名称输入框提示文字
  placeholderURL?: string; // 网站链接输入框提示文字
  placeholderLogo?: string; // 网站LOGO输入框提示文字
  placeholderDescription?: string; // 网站描述输入框提示文字
  placeholderSiteshot?: string; // 网站快照输入框提示文字
}>();

const checkedStates = ref(
  new Array(props.friendLinkApplyCondition.length).fill(false)
);

const allChecked = computed(() => {
  if (checkedStates.value.length === 0) return false;
  return checkedStates.value.every(state => state === true);
});

const formRef = ref<FormInstance>();
const loading = ref(false);
const form = reactive<ApplyLinkRequest>({
  type: "NEW",
  name: "",
  url: "",
  logo: "",
  description: "",
  siteshot: "",
  email: "",
  original_url: "",
  update_reason: ""
});
const rules = reactive<FormRules>({
  type: [{ required: true, message: "请选择申请类型", trigger: "change" }],
  name: [{ required: true, message: "请输入网站名称", trigger: "blur" }],
  url: [
    { required: true, message: "请输入网站链接", trigger: "blur" },
    { type: "url", message: "请输入有效的网址", trigger: ["blur", "change"] }
  ],
  logo: [
    {
      required: true,
      type: "url",
      message: "请输入有效的LOGO链接",
      trigger: ["blur", "change"]
    }
  ],
  description: [{ required: true, message: "请输入网站简介", trigger: "blur" }],
  siteshot: [
    {
      type: "url",
      message: "请输入有效的网站快照链接",
      trigger: ["blur", "change"]
    }
  ],
  email: [
    { required: true, message: "请输入联系邮箱", trigger: "blur" },
    {
      type: "email",
      message: "请输入有效的邮箱地址",
      trigger: ["blur", "change"]
    }
  ],
  original_url: [
    {
      type: "url",
      message: "请输入有效的原友链URL",
      trigger: ["blur", "change"]
    }
  ],
  update_reason: [
    { required: true, message: "请说明修改原因", trigger: "blur" }
  ]
});

const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(async valid => {
    if (valid) {
      loading.value = true;
      try {
        await applyLink(form);
        ElMessage.success("申请提交成功，请等待博主审核！");
        formEl.resetFields();
      } catch (error) {
        console.error("申请友链失败:", error);
        ElMessage.error("申请失败，请稍后再试或联系博主。");
      } finally {
        loading.value = false;
      }
    } else {
      ElMessage.warning("请检查表单填写是否正确！");
    }
  });
};

const formCardRef = ref<InstanceType<typeof ElCard> | null>(null);
const isInitialLoad = ref(true);

watch(allChecked, isAllChecked => {
  // 忽略初始加载时的自动滚动，只在用户主动勾选时触发
  if (isAllChecked && !isInitialLoad.value) {
    nextTick(() => {
      if (formCardRef.value?.$el) {
        const offset = 80;

        const elementPosition =
          formCardRef.value.$el.getBoundingClientRect().top +
          window.pageYOffset;

        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    });
  }

  // 首次 watch 触发后，标记初始加载完成
  if (isInitialLoad.value) {
    isInitialLoad.value = false;
  }
});

// 友链申请列表相关
const siteConfigStore = useSiteConfigStore();
const applications = ref<LinkItem[]>([]);
const applicationsLoading = ref(false);
const applicationsTotal = ref(0);
const applicationsPage = ref(1);
const applicationsPageSize = ref(20);

// 获取Gravatar头像URL
const getGravatarUrl = (email: string) => {
  if (!email) return "";
  const emailMD5 = md5(email.toLowerCase());
  const config = siteConfigStore.getSiteConfig;
  let baseUrl = config.GRAVATAR_URL + "/avatar";
  const defaultType = config.DEFAULT_GRAVATAR_TYPE || "identicon";
  baseUrl = baseUrl.replace(/\/+$/, "");
  return `${baseUrl}/${emailMD5}?d=${defaultType}&s=80`;
};

// 获取友链申请列表
const fetchApplications = async () => {
  applicationsLoading.value = true;
  try {
    const res = await getLinkApplications({
      page: applicationsPage.value,
      pageSize: applicationsPageSize.value
    });
    applications.value = res.data.list;
    applicationsTotal.value = res.data.total;
  } catch (error) {
    console.error("获取友链申请列表失败:", error);
    ElMessage.error("获取友链申请列表失败");
  } finally {
    applicationsLoading.value = false;
  }
};

// 处理分页变化
const handlePageChange = (page: number) => {
  applicationsPage.value = page;
  fetchApplications();
};

// 获取状态标签类型
const getStatusType = (
  status: string
): "success" | "warning" | "danger" | "info" => {
  const statusMap = {
    APPROVED: "success" as const,
    PENDING: "warning" as const,
    REJECTED: "danger" as const,
    INVALID: "info" as const
  };
  return statusMap[status as keyof typeof statusMap] || "info";
};

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusTextMap: Record<string, string> = {
    APPROVED: "已通过",
    PENDING: "待审核",
    REJECTED: "已拒绝",
    INVALID: "已失效"
  };
  return statusTextMap[status] || status;
};

// 获取类型文本
const getTypeText = (type?: string): string => {
  if (!type) return "新增";
  const typeTextMap: Record<string, string> = {
    NEW: "新增",
    UPDATE: "修改"
  };
  return typeTextMap[type] || type;
};

// 组件挂载时获取申请列表
onMounted(() => {
  fetchApplications();
});
</script>

<template>
  <div class="apply-link-container">
    <!-- 自定义内容区域 - 展示渲染后的 HTML -->
    <div
      v-if="friendLinkApplyCustomCodeHtml"
      shadow="never"
      class="custom-content-card"
    >
      <div
        class="custom-content-wrapper post-content"
        v-html="friendLinkApplyCustomCodeHtml"
      />
    </div>

    <el-card shadow="never" :class="{ 'mt-20': friendLinkApplyCustomCodeHtml }">
      <template #header>
        <div class="card-header">
          <span>申请条件</span>
        </div>
      </template>
      <p style="margin-top: 0">请<strong>勾选</strong>你符合的所有条件：</p>
      <div id="friendlink_checkboxs">
        <div
          v-for="(condition, index) in friendLinkApplyCondition"
          :key="index"
          style="margin-bottom: 15px"
        >
          <label :for="'checkbox-' + index">
            <input
              :id="'checkbox-' + index"
              v-model="checkedStates[index]"
              type="checkbox"
              style="margin-right: 8px"
            />
            <span v-html="condition" />
          </label>
        </div>
      </div>
    </el-card>

    <el-card ref="formCardRef" shadow="never" class="form-card">
      <template #header>
        <div class="card-header">
          <span>填写友链信息</span>
        </div>
      </template>

      <el-alert
        v-if="!allChecked"
        title="请先勾选所有申请条件"
        type="warning"
        show-icon
        :closable="false"
      />

      <el-form
        v-else
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent
      >
        <el-form-item label="申请类型" prop="type">
          <div>
            <el-radio-group v-model="form.type">
              <el-radio value="NEW">新增友链</el-radio>
              <el-radio value="UPDATE">修改友链</el-radio>
            </el-radio-group>
            <div class="form-tip">
              <small v-if="form.type === 'NEW'">申请添加新的友情链接。</small>
              <small v-else>修改已存在的友情链接信息。</small>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="网站名称" prop="name">
          <el-input
            v-model="form.name"
            :placeholder="placeholderName || '例如：安知鱼'"
          />
        </el-form-item>
        <el-form-item label="网站链接" prop="url">
          <el-input
            v-model="form.url"
            :placeholder="placeholderURL || 'https://blog.anheyu.com/'"
          />
        </el-form-item>
        <el-form-item label="网站 LOGO" prop="logo">
          <el-input
            v-model="form.logo"
            :placeholder="
              placeholderLogo ||
              'https://npm.elemecdn.com/anzhiyu-blog-static@1.0.4/img/avatar.jpg'
            "
          />
        </el-form-item>
        <el-form-item label="网站描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            :placeholder="placeholderDescription || '生活明朗，万物可爱'"
          />
        </el-form-item>
        <el-form-item label="联系邮箱" prop="email">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="your@email.com"
          />
          <div class="form-tip">
            <small>必填项，用于接收友链审核通知和后续沟通。</small>
          </div>
        </el-form-item>

        <el-form-item
          v-if="form.type === 'UPDATE'"
          label="原友链URL"
          prop="original_url"
        >
          <el-input
            v-model="form.original_url"
            placeholder="https://old-blog.example.com/"
          />
          <div class="form-tip">
            <small>请输入您原来友链的网站地址，用于定位需要修改的友链。</small>
          </div>
        </el-form-item>

        <el-form-item
          v-if="form.type === 'UPDATE'"
          label="修改原因"
          prop="update_reason"
        >
          <el-input
            v-model="form.update_reason"
            type="textarea"
            :rows="3"
            placeholder="请说明修改友链的原因，例如：网站域名更换、网站名称变更等"
          />
          <div class="form-tip">
            <small>请说明修改友链的具体原因，以便博主快速处理您的申请。</small>
          </div>
        </el-form-item>

        <el-form-item label="网站快照" prop="siteshot">
          <el-input
            v-model="form.siteshot"
            :placeholder="
              placeholderSiteshot || 'https://example.com/siteshot.png (可选)'
            "
          />
          <div class="form-tip">
            <small>网站快照是您网站的截图，用于在友链页面展示。</small>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="submit-btn"
            @click="handleSubmit(formRef)"
          >
            {{ loading ? "正在提交..." : "提交申请" }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 友链申请列表 -->
    <el-card shadow="never" class="applications-card">
      <template #header>
        <div class="card-header">
          <span>友链申请列表</span>
          <span class="header-count">（共 {{ applicationsTotal }} 条）</span>
        </div>
      </template>

      <div v-loading="applicationsLoading" class="applications-list">
        <el-empty v-if="!applications.length" description="暂无申请记录" />

        <div v-else class="application-items">
          <div
            v-for="item in applications"
            :key="item.id"
            class="application-item"
          >
            <div class="item-content">
              <div class="item-header">
                <span class="item-name">{{ item.name }}</span>
                <div class="item-tags">
                  <el-tag :type="getStatusType(item.status)" size="small">
                    {{ getStatusText(item.status) }}
                  </el-tag>
                  <el-tag v-if="item.type" type="info" size="small">
                    {{ getTypeText(item.type) }}
                  </el-tag>
                </div>
              </div>
              <div class="item-description">
                {{ item.description || "暂无描述" }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="applicationsTotal > applicationsPageSize" class="pagination">
          <el-pagination
            v-model:current-page="applicationsPage"
            :page-size="applicationsPageSize"
            :total="applicationsTotal"
            layout="prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<style lang="scss">
// 引入文章内容样式，用于渲染自定义 Markdown 内容
@use "@/style/post-content.scss";
@use "@/views/post/post-detail/components/PostContent/editor-code.scss";
</style>

<style lang="scss" scoped>
.apply-link-container {
  width: 100%;
}

.custom-content-card {
  margin-bottom: 20px;
}

.custom-content-wrapper {
  // 应用文章内容样式
  :deep(.post-content) {
    padding: 0;
  }
}

.mt-20 {
  margin-top: 20px;
}

.card-header {
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;

  .header-count {
    font-size: 14px;
    font-weight: normal;
    color: #909399;
  }
}

.form-card {
  margin-top: 20px;
}

.form-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.4;
  color: #909399;
}

// 友链申请列表样式
.applications-card {
  margin-top: 20px;
}

.applications-list {
  min-height: 200px;
}

.application-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  margin: 0.625rem -6px 1.25rem;
}

.application-item {
  position: relative;
  display: flex;
  align-items: center;
  width: calc(20% - 12px);
  height: 90px;
  margin: 6px;
  padding: 0 16px;
  overflow: hidden;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
}

.item-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  height: fit-content;
  gap: 4px;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item-name {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  color: var(--anzhiyu-fontcolor);
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-tags {
  display: flex;
  gap: 4px;
  flex-shrink: 0;

  :deep(.el-tag) {
    height: 20px;
    padding: 0 6px;
    font-size: 11px;
    line-height: 20px;
    border: none;
  }
}

.item-description {
  width: 100%;
  padding-right: 8px;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.4;
  color: var(--anzhiyu-fontcolor);
  text-align: left;
  text-overflow: ellipsis;
  opacity: 0.7;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

// 响应式布局
@media (max-width: 1600px) {
  .application-items {
    .application-item {
      width: calc(25% - 12px);
    }
  }
}

@media (max-width: 1200px) {
  .application-items {
    .application-item {
      width: calc(33.333% - 12px);
    }
  }
}

@media (max-width: 768px) {
  .application-items {
    margin: 0.625rem -4px 1.25rem;

    .application-item {
      width: calc(50% - 8px);
      height: 80px;
      margin: 4px;
      padding: 0 12px;

      .item-name {
        font-size: 14px;
      }

      .item-description {
        font-size: 12px;
      }

      .item-tags {
        :deep(.el-tag) {
          height: 18px;
          padding: 0 4px;
          font-size: 10px;
          line-height: 18px;
        }
      }
    }
  }
}

@media (max-width: 576px) {
  .application-items {
    .application-item {
      width: calc(100% - 8px);
    }
  }
}
</style>
