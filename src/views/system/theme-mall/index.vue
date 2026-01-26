<!--
 * @Description: 主题商城
 * @Author: 安知鱼
 * @Date: 2025-09-18 14:31:11
 * @LastEditTime: 2026-01-26 19:50:00
 * @LastEditors: 安知鱼
-->
<template>
  <div class="theme-mall">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">主题商城</h1>
        <p class="page-subtitle">发现精美主题，打造个性化站点</p>
      </div>
      <div class="header-actions">
        <button class="action-btn refresh-btn" @click="refreshThemes">
          <i class="anzhiyufont anzhiyu-icon-arrow-rotate-right" />
        </button>
        <button class="action-btn primary-btn" @click="showUploadDialog = true">
          <el-icon><Upload /></el-icon>
          <span>上传主题</span>
        </button>
      </div>
    </div>

    <!-- 自定义 Tab 切换 -->
    <div class="tabs-wrapper">
      <div class="tabs-nav">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'market' }"
          @click="handleTabChange('market')"
        >
          <el-icon><Shop /></el-icon>
          <span>主题商城</span>
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'installed' }"
          @click="handleTabChange('installed')"
        >
          <el-icon><FolderOpened /></el-icon>
          <span>已安装</span>
        </div>
        <div class="tab-indicator" :style="indicatorStyle" />
      </div>
    </div>

    <!-- 主题列表 -->
    <div class="theme-list">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner" />
        <span>加载中...</span>
      </div>

      <div
        v-else-if="!currentThemeList || currentThemeList.length === 0"
        class="empty-state"
      >
        <el-icon class="empty-icon"><Box /></el-icon>
        <p>
          {{
            activeTab === "installed"
              ? "暂无已安装主题"
              : searchParams.search
                ? "没有找到匹配的主题"
                : "暂无主题数据"
          }}
        </p>
        <button class="retry-btn" @click="refreshThemes">重新加载</button>
      </div>

      <div v-else class="theme-grid">
        <div
          v-for="theme in currentThemeList"
          :key="theme.id || theme.name"
          class="theme-card"
          :class="{ 'is-current': theme.is_current }"
        >
          <!-- 主题预览图 -->
          <div class="card-preview">
            <img
              v-if="theme.previewUrl"
              :src="theme.previewUrl"
              :alt="theme.name"
              class="preview-img"
              @error="handleImageError"
            />
            <div v-else class="preview-placeholder">
              <el-icon><Picture /></el-icon>
            </div>

            <!-- 标识徽章 -->
            <div class="card-badges">
              <span v-if="theme.isOfficial" class="badge official">
                <el-icon><CircleCheckFilled /></el-icon>
                官方
              </span>
              <span v-if="theme.themeType === 'pro'" class="badge pro">
                PRO
              </span>
              <span v-if="theme.deployType === 'ssr'" class="badge ssr">
                SSR
              </span>
              <span v-if="theme.is_current" class="badge current">
                使用中
              </span>
            </div>
          </div>

          <!-- 主题信息 -->
          <div class="card-body">
            <div class="card-header">
              <h3 class="theme-name">{{ theme.name }}</h3>
              <span class="theme-version">v{{ theme.version }}</span>
            </div>
            <p class="theme-author">by {{ theme.author }}</p>
            <p class="theme-desc">{{ theme.description || "暂无描述" }}</p>

            <!-- 标签 -->
            <div v-if="theme.tags?.length" class="theme-tags">
              <span
                v-for="tag in theme.tags.slice(0, 3)"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
              <span v-if="theme.tags.length > 3" class="tag more">
                +{{ theme.tags.length - 3 }}
              </span>
            </div>

            <!-- 价格（仅PRO版） -->
            <div
              v-if="theme.themeType === 'pro' && theme.price"
              class="theme-price"
            >
              <span class="price">¥{{ formatPrice(theme.price) }}</span>
            </div>

            <!-- 操作按钮 -->
            <div class="card-actions">
              <!-- 已安装主题操作 -->
              <template v-if="activeTab === 'installed'">
                <!-- SSR 主题操作 -->
                <template v-if="theme.deployType === 'ssr'">
                  <!-- SSR 运行中（当前主题） -->
                  <template v-if="theme.ssrStatus === 'running'">
                    <button class="btn current-btn" disabled>
                      <el-icon><Check /></el-icon>
                      当前主题
                    </button>
                    <span class="ssr-port-badge">
                      端口: {{ theme.ssrPort || 3000 }}
                    </span>
                  </template>
                  <!-- SSR 已安装未运行 -->
                  <template v-else>
                    <button
                      class="btn primary-btn"
                      :class="{ loading: ssrStarting[theme.name] }"
                      :disabled="ssrStarting[theme.name]"
                      @click="startSSRTheme(theme)"
                    >
                      <i
                        v-if="!ssrStarting[theme.name]"
                        class="anzhiyufont anzhiyu-icon-bolt"
                      />
                      {{
                        ssrStarting[theme.name] ? "切换中..." : "切换到此主题"
                      }}
                    </button>
                    <button
                      class="btn icon-btn danger"
                      title="卸载主题"
                      @click="uninstallSSRTheme(theme)"
                    >
                      <el-icon><Delete /></el-icon>
                    </button>
                  </template>
                </template>
                <!-- 普通主题操作 -->
                <template v-else>
                  <template v-if="theme.is_current">
                    <button class="btn current-btn" disabled>
                      <el-icon><Check /></el-icon>
                      当前主题
                    </button>
                  </template>
                  <template v-else>
                    <button
                      class="btn primary-btn"
                      :class="{ loading: switchingTheme === theme.name }"
                      :disabled="switchingTheme !== null"
                      @click="switchToTheme(theme)"
                    >
                      <i
                        v-if="switchingTheme !== theme.name"
                        class="anzhiyufont anzhiyu-icon-bolt"
                      />
                      {{
                        switchingTheme === theme.name
                          ? "切换中..."
                          : "切换到此主题"
                      }}
                    </button>
                    <button
                      class="btn icon-btn danger"
                      @click="confirmUninstallTheme(theme)"
                    >
                      <el-icon><Delete /></el-icon>
                    </button>
                  </template>
                  <!-- 配置按钮（非官方主题才显示） -->
                  <button
                    v-if="!theme.isOfficial"
                    class="btn icon-btn"
                    title="主题配置"
                    @click="openThemeConfig(theme)"
                  >
                    <el-icon><Setting /></el-icon>
                  </button>
                </template>
              </template>

              <!-- 商城主题操作 -->
              <template v-else>
                <!-- SSR 主题操作 -->
                <template v-if="theme.deployType === 'ssr'">
                  <!-- 已安装的 SSR 主题显示"已安装"状态 -->
                  <template v-if="isSSRThemeInstalled(theme.name)">
                    <button class="btn installed-btn" disabled>
                      <el-icon><CircleCheckFilled /></el-icon>
                      已安装
                    </button>
                  </template>
                  <!-- 未安装的 SSR 主题显示安装按钮 -->
                  <template v-else>
                    <button
                      class="btn ssr-btn"
                      :class="{ loading: ssrInstalling[theme.name] }"
                      :disabled="ssrInstalling[theme.name]"
                      @click="installSSRTheme(theme)"
                    >
                      <el-icon><Download /></el-icon>
                      {{ ssrInstalling[theme.name] ? "安装中..." : "安装主题" }}
                    </button>
                  </template>
                  <button class="btn icon-btn" @click="openSSRGuide(theme)">
                    <el-icon><Setting /></el-icon>
                  </button>
                  <button
                    v-if="theme.repoUrl"
                    class="btn icon-btn"
                    @click="openRepo(theme.repoUrl)"
                  >
                    <i class="anzhiyufont anzhiyu-icon-github" />
                  </button>
                </template>

                <template v-else-if="theme.themeType === 'community'">
                  <button
                    v-if="theme.downloadUrl"
                    class="btn primary-btn"
                    @click="installTheme(theme)"
                  >
                    <el-icon><Download /></el-icon>
                    安装
                  </button>
                  <button
                    v-else-if="theme.repoUrl"
                    class="btn primary-btn"
                    @click="openRepo(theme.repoUrl)"
                  >
                    <i class="anzhiyufont anzhiyu-icon-github" />
                    源码
                  </button>
                </template>
                <template v-else-if="theme.themeType === 'pro'">
                  <!-- PRO 主题：统一显示安装按钮，点击时根据版本判断行为 -->
                  <button
                    class="btn pro-btn"
                    @click="handleInstallProTheme(theme)"
                  >
                    <el-icon><Download /></el-icon>
                    安装
                  </button>
                </template>
              </template>

              <!-- 演示按钮 -->
              <button
                v-if="theme.demoUrl"
                class="btn icon-btn"
                @click="openDemo(theme.demoUrl)"
              >
                <el-icon><View /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div
      v-if="themeData?.total && themeData.total > searchParams.limit!"
      class="pagination-wrapper"
    >
      <el-pagination
        v-model:current-page="searchParams.page"
        v-model:page-size="searchParams.limit"
        :total="themeData.total"
        :page-sizes="[12, 24, 36]"
        layout="total, prev, pager, next"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 主题配置对话框 -->
    <ThemeConfigDialog
      v-model="showConfigDialog"
      :theme-name="currentConfigTheme"
      @saved="handleConfigSaved"
    />

    <!-- 上传主题弹窗 -->
    <AnDialog
      v-model="showUploadDialog"
      title="上传主题"
      width="480px"
      :show-footer="false"
    >
      <div class="upload-content">
        <div class="upload-tips">
          <div class="tip-item">
            <el-icon><Document /></el-icon>
            <span>文件格式：ZIP 压缩包</span>
          </div>
          <div class="tip-item">
            <el-icon><Coin /></el-icon>
            <span>文件大小：不超过 50MB</span>
          </div>
          <div class="tip-item">
            <el-icon><Folder /></el-icon>
            <span>必须包含：theme.json、index.html</span>
          </div>
        </div>

        <div class="upload-area">
          <el-upload
            ref="uploadRef"
            :show-file-list="false"
            :auto-upload="false"
            :on-change="handleFileChange"
            :before-upload="beforeUpload"
            accept=".zip"
            drag
          >
            <div class="upload-dragger">
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <p class="upload-text">拖拽文件到此处或点击上传</p>
              <p class="upload-hint">支持 ZIP 格式</p>
            </div>
          </el-upload>
        </div>

        <div v-if="selectedFile" class="selected-file">
          <div class="file-info">
            <el-icon class="file-icon"><Document /></el-icon>
            <div class="file-detail">
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">{{
                formatFileSize(selectedFile.size)
              }}</span>
            </div>
          </div>
          <button class="remove-btn" @click="removeSelectedFile">
            <el-icon><Close /></el-icon>
          </button>
        </div>

        <div class="upload-actions">
          <button class="btn cancel-btn" @click="closeUploadDialog">
            取消
          </button>
          <button
            v-if="selectedFile"
            class="btn primary-btn"
            :class="{ loading: uploading }"
            :disabled="uploading"
            @click="uploadTheme"
          >
            {{ uploading ? "上传中..." : "上传主题" }}
          </button>
        </div>
      </div>
    </AnDialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Upload,
  Shop,
  FolderOpened,
  Box,
  Picture,
  CircleCheckFilled,
  Check,
  Delete,
  Download,
  View,
  Document,
  Coin,
  Folder,
  UploadFilled,
  Close,
  Setting
} from "@element-plus/icons-vue";
import AnDialog from "@/components/AnDialog/index.vue";
import ThemeConfigDialog from "./components/ThemeConfigDialog.vue";
import { themeMallApi } from "@/api/theme-mall";
import type {
  ThemeListParams,
  ThemeListData,
  Theme,
  SSRThemeInfo
} from "@/api/theme-mall/type";
import { getToken } from "@/utils/auth";
import { getVersionInfo } from "@/utils/versionManager";

defineOptions({
  name: "ThemeMall"
});

// 响应式数据
const loading = ref(false);
const themeData = ref<ThemeListData | null>(null);
const installedThemes = ref<Theme[]>([]);
const activeTab = ref("market");

// PRO 版本检测
const isProEdition = ref(false);

// 上传相关状态
const showUploadDialog = ref(false);
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const uploadRef = ref();

// 主题切换状态
const switchingTheme = ref<string | null>(null);

// 主题配置相关状态
const showConfigDialog = ref(false);
const currentConfigTheme = ref("");

// SSR 主题相关状态
const ssrThemeStatus = ref<Record<string, SSRThemeInfo>>({});
const ssrInstalling = ref<Record<string, boolean>>({});
const ssrStarting = ref<Record<string, boolean>>({});

// 已安装的 SSR 主题名称集合（用于商城 tab 判断）
const installedSSRThemeNames = ref<Set<string>>(new Set());

// 搜索参数
const searchParams = ref<ThemeListParams & { themeType: string }>({
  page: 1,
  limit: 12,
  search: "",
  tags: "",
  themeType: ""
});

// 计算Tab指示器位置
const indicatorStyle = computed(() => {
  const index = activeTab.value === "market" ? 0 : 1;
  return {
    transform: `translateX(${index * 100}%)`,
    width: "50%"
  };
});

// 当前显示的主题列表
const currentThemeList = computed(() => {
  if (activeTab.value === "installed") {
    return installedThemes.value;
  }
  return themeData.value?.list || [];
});

// 检查 SSR 主题是否已安装
const isSSRThemeInstalled = (themeName: string): boolean => {
  return installedSSRThemeNames.value.has(themeName);
};

// 统一的主题排序函数
// 排序规则：1. 当前使用中的主题 2. 官方主题 3. 其他主题
const sortThemeList = (themes: Theme[]): Theme[] => {
  return [...themes].sort((a, b) => {
    // 1. 当前使用中的主题排最前面
    const aIsCurrent =
      a.is_current || (a.deployType === "ssr" && a.ssrStatus === "running");
    const bIsCurrent =
      b.is_current || (b.deployType === "ssr" && b.ssrStatus === "running");
    if (aIsCurrent && !bIsCurrent) return -1;
    if (!aIsCurrent && bIsCurrent) return 1;

    // 2. 官方主题排在前面
    if (a.isOfficial && !b.isOfficial) return -1;
    if (!a.isOfficial && b.isOfficial) return 1;

    // 3. 相同类型保持原始顺序
    return 0;
  });
};

// 获取主题列表
const loadThemes = async () => {
  loading.value = true;
  try {
    const params = { ...searchParams.value };
    Object.keys(params).forEach(key => {
      const value = params[key as keyof ThemeListParams];
      if (value === "") {
        delete params[key as keyof ThemeListParams];
      }
    });

    // 并行获取商城主题和已安装的 SSR 主题列表
    const [response, ssrResponse] = await Promise.all([
      themeMallApi.getThemes(params),
      themeMallApi.getInstalledSSRThemes().catch(err => {
        console.warn("获取已安装 SSR 主题列表失败:", err);
        return { code: 500, data: [] };
      })
    ]);

    // 更新已安装的 SSR 主题名称集合
    if (ssrResponse.code === 200 && ssrResponse.data) {
      installedSSRThemeNames.value = new Set(
        ssrResponse.data.map((ssr: SSRThemeInfo) => ssr.name)
      );
      console.log(
        "已安装的 SSR 主题:",
        Array.from(installedSSRThemeNames.value)
      );
    } else {
      console.warn("SSR 主题列表为空或获取失败，code:", ssrResponse.code);
    }

    if (response.code === 200 && response.data) {
      const list = response.data.list || [];
      // 排序规则：1. 当前使用的主题 2. 官方主题 3. 其他主题
      const sortedList = sortThemeList(list);

      themeData.value = {
        ...response.data,
        list: sortedList
      };
    } else {
      throw new Error(response.message || "获取主题列表失败");
    }
  } catch (error: any) {
    console.error("加载主题失败:", error);
    ElMessage.error(error.message || "加载主题失败，请稍后重试");
    themeData.value = null;
  } finally {
    loading.value = false;
  }
};

// 获取已安装主题列表（包含普通主题和 SSR 主题）
const loadInstalledThemes = async () => {
  loading.value = true;
  try {
    // 并行获取普通主题、SSR 主题和商城数据（用于获取封面图等信息）
    const [normalResponse, ssrResponse, marketResponse] = await Promise.all([
      themeMallApi.getInstalledThemes(),
      themeMallApi
        .getInstalledSSRThemes()
        .catch(() => ({ code: 200, data: [] })),
      themeMallApi
        .getThemes({})
        .catch(() => ({ code: 200, data: { list: [] } }))
    ]);

    const themes: Theme[] = [];

    // 构建商城主题映射表（用于获取封面图等信息）
    const marketThemeMap: Record<string, Theme> = {};
    if (marketResponse.code === 200 && marketResponse.data?.list) {
      marketResponse.data.list.forEach((theme: Theme) => {
        marketThemeMap[theme.name] = theme;
      });
    }

    // 添加普通已安装主题
    if (normalResponse.code === 200 && normalResponse.data) {
      themes.push(...normalResponse.data);
    }

    // 添加 SSR 已安装主题（转换为 Theme 格式，并从商城数据获取封面图）
    if (ssrResponse.code === 200 && ssrResponse.data) {
      const ssrThemes: Theme[] = ssrResponse.data.map((ssr: SSRThemeInfo) => {
        // 尝试从商城数据中获取该主题的详细信息
        const marketTheme = marketThemeMap[ssr.name];

        return {
          id: marketTheme?.id || 0,
          name: ssr.name,
          author: marketTheme?.author || "SSR Theme",
          description:
            marketTheme?.description ||
            `SSR 主题 - ${ssr.status === "running" ? `运行中 (端口 ${ssr.port})` : "已安装"}`,
          themeType: (marketTheme?.themeType || "pro") as "community" | "pro",
          deployType: "ssr" as const,
          repoUrl: marketTheme?.repoUrl || "",
          instructionUrl: marketTheme?.instructionUrl || "",
          price: marketTheme?.price || 0,
          downloadUrl: marketTheme?.downloadUrl || "",
          tags: marketTheme?.tags || ["SSR"],
          previewUrl: marketTheme?.previewUrl || "",
          demoUrl: marketTheme?.demoUrl || "",
          version: ssr.version || marketTheme?.version || "1.0.0",
          downloadCount: marketTheme?.downloadCount || 0,
          rating: marketTheme?.rating || 0,
          isOfficial: marketTheme?.isOfficial || false,
          isActive: true,
          createdAt: ssr.installedAt || "",
          updatedAt: ssr.startedAt || "",
          is_current: ssr.status === "running",
          is_installed: true,
          // SSR 主题特有字段
          ssrStatus: ssr.status,
          ssrPort: ssr.port
        };
      });
      themes.push(...ssrThemes);
    }

    // 使用统一的排序规则
    installedThemes.value = sortThemeList(themes);
  } catch (error: any) {
    console.error("加载已安装主题失败:", error);
    ElMessage.error(error.message || "加载已安装主题失败");
    installedThemes.value = [];
  } finally {
    loading.value = false;
  }
};

// 刷新主题
const refreshThemes = () => {
  if (activeTab.value === "installed") {
    loadInstalledThemes();
  } else {
    loadThemes();
  }
};

// Tab切换处理
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName;
  if (tabName === "installed") {
    loadInstalledThemes();
  } else {
    loadThemes();
  }
};

// 分页处理
const handleSizeChange = (size: number) => {
  searchParams.value.limit = size;
  searchParams.value.page = 1;
  loadThemes();
};

const handleCurrentChange = (page: number) => {
  searchParams.value.page = page;
  loadThemes();
};

// 打开演示
const openDemo = (url: string) => {
  window.open(url, "_blank");
};

// 打开 SSR 主题部署指南
const openSSRGuide = (theme: Theme) => {
  // 如果主题有指定的说明地址，使用它；否则使用默认的文档地址
  const guideUrl =
    theme.instructionUrl || "https://dev.anheyu.com/docs/ssr-theme-deploy";
  window.open(guideUrl, "_blank");
};

// ===== SSR 主题操作方法 =====

// 加载所有 SSR 主题状态
const loadSSRThemeStatus = async () => {
  try {
    const response = await themeMallApi.getInstalledSSRThemes();
    if (response.code === 200 && response.data) {
      const statusMap: Record<string, SSRThemeInfo> = {};
      response.data.forEach(info => {
        statusMap[info.name] = info;
      });
      ssrThemeStatus.value = statusMap;
    }
  } catch (error) {
    console.error("加载 SSR 主题状态失败:", error);
  }
};

// 刷新单个 SSR 主题状态
const refreshSSRThemeStatus = async (themeName: string) => {
  try {
    const response = await themeMallApi.getSSRThemeStatus(themeName);
    if (response.code === 200 && response.data) {
      ssrThemeStatus.value[themeName] = response.data;
    }
  } catch (error) {
    console.error("刷新 SSR 主题状态失败:", error);
  }
};

// 安装 SSR 主题
const installSSRTheme = async (theme: Theme) => {
  if (!theme.downloadUrl) {
    ElMessage.error("该主题没有提供下载链接");
    return;
  }

  // PRO 主题需要检查版本
  if (theme.themeType === "pro" && !isProEdition.value) {
    ElMessageBox.alert(
      "PRO 主题仅限 PRO 版本用户使用。请升级到 PRO 版本后再安装此主题。",
      "无法安装 PRO 主题",
      {
        confirmButtonText: "我知道了",
        type: "warning"
      }
    );
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要安装 SSR 主题 "${theme.name}" 吗？\n\n注意：SSR 主题安装后需要手动启动。`,
      "安装确认",
      {
        confirmButtonText: "确认安装",
        cancelButtonText: "取消",
        type: "info"
      }
    );

    ssrInstalling.value[theme.name] = true;

    // 从 downloadUrl 中提取真正的主题名称
    const themeName = extractThemeNameFromUrl(theme.downloadUrl) || theme.name;

    const response = await themeMallApi.installSSRTheme({
      themeName: themeName,
      downloadUrl: theme.downloadUrl
    });

    if (response.code === 200) {
      ElMessage.success("SSR 主题安装成功！");
      // 更新已安装的 SSR 主题名称集合
      installedSSRThemeNames.value.add(themeName);
      await refreshSSRThemeStatus(themeName);
    } else {
      throw new Error(response.message || "安装失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("安装 SSR 主题失败:", error);
      ElMessage.error(error.message || "安装 SSR 主题失败");
    }
  } finally {
    ssrInstalling.value[theme.name] = false;
  }
};

// 卸载 SSR 主题
const uninstallSSRTheme = async (theme: Theme) => {
  try {
    await ElMessageBox.confirm(
      `确定要卸载 SSR 主题 "${theme.name}" 吗？此操作不可撤销。`,
      "卸载确认",
      {
        confirmButtonText: "确认卸载",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    const themeName =
      extractThemeNameFromUrl(theme.downloadUrl || "") || theme.name;

    // 如果主题正在运行，先停止它
    if (
      ssrThemeStatus.value[themeName]?.status === "running" ||
      theme.ssrStatus === "running"
    ) {
      try {
        await themeMallApi.stopSSRTheme(themeName);
      } catch (err) {
        console.warn(`停止主题 ${themeName} 失败:`, err);
      }
    }

    const response = await themeMallApi.uninstallSSRTheme(themeName);

    if (response.code === 200) {
      ElMessage.success("SSR 主题卸载成功！");
      delete ssrThemeStatus.value[themeName];
      // 从已安装的 SSR 主题名称集合中移除
      installedSSRThemeNames.value.delete(themeName);
      // 刷新已安装主题列表
      if (activeTab.value === "installed") {
        await loadInstalledThemes();
      }
    } else {
      throw new Error(response.message || "卸载失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("卸载 SSR 主题失败:", error);
      ElMessage.error(error.message || "卸载 SSR 主题失败");
    }
  }
};

// 启动/切换 SSR 主题
const startSSRTheme = async (theme: Theme) => {
  try {
    const themeName =
      extractThemeNameFromUrl(theme.downloadUrl || "") || theme.name;
    ssrStarting.value[theme.name] = true;

    // 先检查是否有其他正在运行的 SSR 主题，如果有则先停止
    const runningThemes = Object.entries(ssrThemeStatus.value).filter(
      ([name, info]) => info.status === "running" && name !== themeName
    );

    if (runningThemes.length > 0) {
      // 停止其他运行中的 SSR 主题
      for (const [name] of runningThemes) {
        try {
          await themeMallApi.stopSSRTheme(name);
        } catch (err) {
          console.warn(`停止主题 ${name} 失败:`, err);
        }
      }
    }

    const response = await themeMallApi.startSSRTheme(themeName);

    if (response.code === 200) {
      ElMessage.success(`主题已切换，正在清理缓存...`);

      // 清理缓存
      await clearThemeCache();

      // 刷新页面以应用新主题
      setTimeout(() => {
        window.location.href = window.location.pathname + "?_t=" + Date.now();
      }, 1500);
    } else {
      throw new Error(response.message || "切换失败");
    }
  } catch (error: any) {
    console.error("切换 SSR 主题失败:", error);
    ElMessage.error(error.message || "切换 SSR 主题失败");
  } finally {
    ssrStarting.value[theme.name] = false;
  }
};

// 打开仓库
const openRepo = (url: string) => {
  window.open(url, "_blank");
};

// 从 downloadUrl 中提取主题名称（格式：theme-xxx-v1.0.0.zip 或 theme-xxx-v1.0.0.tar.gz 或 theme-xxx-1.0.0.tgz）
const extractThemeNameFromUrl = (downloadUrl: string): string => {
  // 获取文件名
  const fileName = downloadUrl.split("/").pop() || "";
  // 移除扩展名（支持 .zip、.tar.gz 和 .tgz）
  const nameWithoutExt = fileName
    .replace(/\.tar\.gz$/i, "")
    .replace(/\.tgz$/i, "")
    .replace(/\.zip$/i, "");
  // 移除版本号后缀（-v1.0.0 或 -1.0.0 格式）
  const themeName = nameWithoutExt.replace(/-v?\d+(\.\d+)*$/, "");
  return themeName;
};

// 安装主题
const installTheme = async (theme: Theme) => {
  if (!theme.downloadUrl) {
    ElMessage.error("该主题没有提供下载链接");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要安装主题 "${theme.name}" 吗？`,
      "安装确认",
      {
        confirmButtonText: "确认安装",
        cancelButtonText: "取消",
        type: "info"
      }
    );

    // 从 downloadUrl 中提取真正的主题名称，如果提取失败则使用显示名
    const themeName = extractThemeNameFromUrl(theme.downloadUrl) || theme.name;

    const response = await themeMallApi.installTheme({
      theme_name: themeName,
      download_url: theme.downloadUrl,
      theme_market_id: theme.id
    });

    if (response.code === 200) {
      ElMessage.success("主题安装成功！");
      loadInstalledThemes();
    } else {
      throw new Error(response.message || "安装失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("安装主题失败:", error);
      ElMessage.error(error.message || "安装主题失败");
    }
  }
};

// 处理安装 PRO 主题（根据版本判断行为）
const handleInstallProTheme = async (theme: Theme) => {
  // 检查是否为 PRO 版本
  if (!isProEdition.value) {
    // 社区版用户点击安装 PRO 主题，显示提示弹窗
    ElMessageBox.alert(
      "PRO 主题仅限 PRO 版本用户使用。请升级到 PRO 版本后再安装此主题。",
      "无法安装 PRO 主题",
      {
        confirmButtonText: "我知道了",
        type: "warning"
      }
    );
    return;
  }

  // PRO 版本用户，检查是否有下载链接
  if (!theme.downloadUrl) {
    ElMessage.error("该主题暂无可用的下载链接，请稍后再试");
    return;
  }

  // PRO 版本用户，直接安装
  await installTheme(theme);
};

// 清理主题相关缓存
const clearThemeCache = async () => {
  // 1. 清理 localStorage 中的主题相关缓存
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes("theme") || key.includes("Theme"))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));

  // 2. 清理 sessionStorage 中的主题相关缓存
  const sessionKeysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes("theme") || key.includes("Theme"))) {
      sessionKeysToRemove.push(key);
    }
  }
  sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

  // 3. 清理 Service Worker 缓存（如果有）
  if ("caches" in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      console.log("[主题切换] Service Worker 缓存已清理");
    } catch (err) {
      console.warn("[主题切换] 清理 Service Worker 缓存失败:", err);
    }
  }

  // 4. 注销所有 Service Worker
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      console.log("[主题切换] Service Worker 已注销");
    } catch (err) {
      console.warn("[主题切换] 注销 Service Worker 失败:", err);
    }
  }

  console.log("[主题切换] 缓存清理完成");
};

// 启用主题
const switchToTheme = async (theme: Theme) => {
  try {
    await ElMessageBox.confirm(
      `确定要启用主题 "${theme.name}" 吗？启用后页面将自动刷新。`,
      "启用确认",
      {
        confirmButtonText: "确认启用",
        cancelButtonText: "取消",
        type: "info"
      }
    );

    switchingTheme.value = theme.name;

    const response = await themeMallApi.switchTheme({
      theme_name: theme.name
    });

    if (response.code === 200) {
      ElMessage.success("主题启用成功，正在清理缓存...");

      // 清理缓存
      await clearThemeCache();

      setTimeout(() => {
        // 使用强制刷新，跳过浏览器缓存
        window.location.href = window.location.pathname + "?_t=" + Date.now();
      }, 1500);
    } else {
      throw new Error(response.message || "启用失败");
    }
  } catch (error: any) {
    switchingTheme.value = null;
    if (error !== "cancel") {
      console.error("启用主题失败:", error);
      ElMessage.error(error.message || "启用主题失败");
    }
  }
};

// 确认卸载主题
const confirmUninstallTheme = async (theme: Theme) => {
  try {
    await ElMessageBox.confirm(
      `确定要卸载主题 "${theme.name}" 吗？此操作不可撤销。`,
      "卸载确认",
      {
        confirmButtonText: "确认卸载",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    const response = await themeMallApi.uninstallTheme({
      theme_name: theme.name
    });

    if (response.code === 200) {
      ElMessage.success("主题卸载成功！");
      loadInstalledThemes();
    } else {
      throw new Error(response.message || "卸载失败");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("卸载主题失败:", error);
      ElMessage.error(error.message || "卸载主题失败");
    }
  }
};

// 打开主题配置对话框
const openThemeConfig = (theme: Theme) => {
  currentConfigTheme.value = theme.name;
  showConfigDialog.value = true;
};

// 配置保存成功处理
const handleConfigSaved = () => {
  ElMessage.success("主题配置已保存，刷新页面后生效");
};

// 图片错误处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
  const placeholder = img.parentElement?.querySelector(".preview-placeholder");
  if (placeholder) {
    (placeholder as HTMLElement).style.display = "flex";
  }
};

// 格式化价格
const formatPrice = (priceInCents: number | undefined | null) => {
  if (priceInCents == null || isNaN(Number(priceInCents))) {
    return "0.00";
  }
  return (Number(priceInCents) / 100).toFixed(2);
};

// 上传相关方法
const handleFileChange = (file: any) => {
  selectedFile.value = file.raw;
};

const beforeUpload = (file: File) => {
  const isZip =
    file.type === "application/zip" || file.name.toLowerCase().endsWith(".zip");
  if (!isZip) {
    ElMessage.error("只能上传ZIP格式的文件");
    return false;
  }

  const isLt50M = file.size / 1024 / 1024 < 50;
  if (!isLt50M) {
    ElMessage.error("文件大小不能超过50MB");
    return false;
  }

  return false;
};

const removeSelectedFile = () => {
  selectedFile.value = null;
  uploadRef.value?.clearFiles();
};

const uploadTheme = async () => {
  if (!selectedFile.value) {
    ElMessage.error("请先选择文件");
    return;
  }

  uploading.value = true;
  try {
    ElMessage.info("正在验证主题...");
    const validateResponse = await themeMallApi.validateTheme(
      selectedFile.value
    );

    if (validateResponse.code !== 200) {
      throw new Error(validateResponse.message || "验证失败");
    }

    if (!validateResponse.data.is_valid) {
      const errorMsg =
        validateResponse.data.errors?.join(", ") || "主题验证失败";
      throw new Error(errorMsg);
    }

    if (validateResponse.data.existing_theme) {
      const existingTheme = validateResponse.data.existing_theme;
      const newVersion = validateResponse.data.metadata?.version;
      const existingVersion =
        existingTheme.installed_version || existingTheme.version;

      const compareVersions = (v1: string, v2: string): number => {
        const parts1 = v1.split(".").map(Number);
        const parts2 = v2.split(".").map(Number);

        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
          const part1 = parts1[i] || 0;
          const part2 = parts2[i] || 0;

          if (part1 > part2) return 1;
          if (part1 < part2) return -1;
        }
        return 0;
      };

      const versionComparison = compareVersions(
        newVersion || "0.0.0",
        existingVersion || "0.0.0"
      );

      if (versionComparison > 0) {
        try {
          await ElMessageBox.confirm(
            `检测到已安装主题 "${existingTheme.name}" 的新版本。\n\n` +
              `当前版本：${existingVersion}\n` +
              `新版本：${newVersion}\n\n` +
              `是否要更新到新版本？`,
            "主题版本更新",
            {
              confirmButtonText: "确认更新",
              cancelButtonText: "取消",
              type: "info"
            }
          );
          await performThemeUpload(true);
        } catch (error) {
          if (error === "cancel") {
            ElMessage.info("取消更新");
            return;
          }
          throw error;
        }
      } else if (versionComparison === 0) {
        try {
          await ElMessageBox.confirm(
            `主题 "${existingTheme.name}" (版本 ${existingVersion}) 已安装。\n\n是否重新安装？`,
            "重新安装主题",
            {
              confirmButtonText: "重新安装",
              cancelButtonText: "取消",
              type: "warning"
            }
          );
          await performThemeUpload(true);
        } catch (error) {
          if (error === "cancel") {
            ElMessage.info("取消安装");
            return;
          }
          throw error;
        }
      } else {
        ElMessage.warning(
          `当前上传版本 (${newVersion}) 低于已安装版本 (${existingVersion})`
        );
        return;
      }
    } else {
      await performThemeUpload(false);
    }
  } catch (error: any) {
    console.error("上传主题失败:", error);
    ElMessage.error(error.message || "上传主题失败");
  } finally {
    uploading.value = false;
  }
};

const performThemeUpload = async (forceUpdate: boolean = false) => {
  const uploadResponse = await themeMallApi.uploadTheme(
    selectedFile.value!,
    forceUpdate
  );

  if (uploadResponse.code === 200) {
    ElMessage.success(forceUpdate ? "主题更新成功" : "主题上传成功");
    closeUploadDialog();
    activeTab.value = "installed";
    loadInstalledThemes();
  } else {
    throw new Error(uploadResponse.message || "上传失败");
  }
};

const closeUploadDialog = () => {
  showUploadDialog.value = false;
  selectedFile.value = null;
  uploadRef.value?.clearFiles();
};

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return size + " B";
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + " KB";
  }
  return (size / 1024 / 1024).toFixed(2) + " MB";
};

const checkLoginStatus = () => {
  const tokenData = getToken();
  if (!tokenData || !tokenData.accessToken) {
    return false;
  }
  if (tokenData.expires && Date.now() > tokenData.expires * 1000) {
    return false;
  }
  return true;
};

// 检测是否为 PRO 版本
const checkProEdition = async () => {
  try {
    const versionInfo = await getVersionInfo();
    // 如果能获取到版本信息且 name 为 anheyu-pro，则为 PRO 版本
    isProEdition.value =
      versionInfo.name === "anheyu-pro" && !!versionInfo.version;
    console.log("PRO 版本检测:", isProEdition.value, versionInfo);
  } catch (error) {
    console.error("检测 PRO 版本失败:", error);
    isProEdition.value = false;
  }
};

onMounted(async () => {
  checkLoginStatus();
  await checkProEdition();
  loadThemes();
  // 加载 SSR 主题状态
  loadSSRThemeStatus();
});
</script>

<style scoped lang="scss">
.theme-mall {
  max-width: 1400px;
  padding: 0 16px;
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 12px;

  .header-left {
    .page-title {
      margin: 0 0 2px;
      font-size: 20px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .page-subtitle {
      margin: 0;
      font-size: 13px;
      color: var(--anzhiyu-secondtext);
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

/* 通用按钮样式 */
.action-btn {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--anzhiyu-fontcolor);
  cursor: pointer;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 8px;
  transition: all 0.2s ease;

  .el-icon {
    font-size: 14px;
  }

  i {
    font-size: 14px;
  }

  &:hover {
    background: var(--anzhiyu-secondbg);
  }

  &.primary-btn {
    color: var(--anzhiyu-white);
    background: var(--anzhiyu-main);
    border-color: var(--anzhiyu-main);

    &:hover {
      filter: brightness(1.05);
    }
  }

  &.refresh-btn {
    width: 34px;
    padding: 7px;

    &:hover i {
      transform: rotate(180deg);
    }

    i {
      transition: transform 0.3s ease;
    }
  }
}

/* Tab 切换 */
.tabs-wrapper {
  margin-bottom: 16px;

  .tabs-nav {
    position: relative;
    display: inline-flex;
    padding: 3px;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;

    .tab-item {
      position: relative;
      z-index: 1;
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
      color: var(--anzhiyu-secondtext);
      cursor: pointer;
      transition: color 0.3s ease;

      .el-icon {
        font-size: 14px;
      }

      &:hover {
        color: var(--anzhiyu-fontcolor);
      }

      &.active {
        color: var(--anzhiyu-main);
      }
    }

    .tab-indicator {
      position: absolute;
      top: 3px;
      bottom: 3px;
      left: 3px;
      background: var(--anzhiyu-card-bg);
      border-radius: 6px;
      box-shadow: var(--anzhiyu-shadow-border);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }
}

/* 主题列表 */
.theme-list {
  min-height: 300px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--anzhiyu-secondtext);

  .loading-spinner {
    width: 28px;
    height: 28px;
    border: 2px solid var(--anzhiyu-secondbg);
    border-top-color: var(--anzhiyu-main);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--anzhiyu-secondtext);

  .empty-icon {
    font-size: 48px;
    opacity: 0.3;
  }

  p {
    margin: 0;
    font-size: 14px;
  }

  .retry-btn {
    padding: 6px 16px;
    font-size: 13px;
    color: var(--anzhiyu-main);
    cursor: pointer;
    background: transparent;
    border: 1px solid var(--anzhiyu-main);
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-main);
    }
  }
}

/* 主题网格 */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.theme-card {
  overflow: hidden;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--anzhiyu-main);
  }

  &.is-current {
    border-color: var(--anzhiyu-green);
    box-shadow: 0 0 0 2px var(--anzhiyu-green-op);
  }
}

.card-preview {
  position: relative;
  height: 140px;
  overflow: hidden;
  background: var(--anzhiyu-secondbg);

  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .preview-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--anzhiyu-secondtext);

    .el-icon {
      font-size: 36px;
      opacity: 0.3;
    }
  }
}

.card-badges {
  position: absolute;
  top: 8px;
  right: 8px;
  left: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .badge {
    display: inline-flex;
    gap: 3px;
    align-items: center;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 4px;

    .el-icon {
      font-size: 11px;
    }

    &.official {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-main);
    }

    &.pro {
      color: var(--anzhiyu-white);
      background: linear-gradient(135deg, #f59e0b, #f97316);
    }

    &.ssr {
      color: var(--anzhiyu-white);
      background: linear-gradient(135deg, #06b6d4, #0891b2);
    }

    &.current {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-green);
    }
  }
}

.card-body {
  padding: 14px;

  .card-header {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 2px;

    .theme-name {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    .theme-version {
      padding: 1px 6px;
      font-size: 11px;
      font-weight: 500;
      color: var(--anzhiyu-secondtext);
      background: var(--anzhiyu-secondbg);
      border-radius: 3px;
    }
  }

  .theme-author {
    margin: 0 0 8px;
    font-size: 12px;
    color: var(--anzhiyu-secondtext);
  }

  .theme-desc {
    display: -webkit-box;
    min-height: 34px;
    margin: 0 0 8px;
    overflow: hidden;
    font-size: 13px;
    line-height: 1.4;
    color: var(--anzhiyu-fontcolor);
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}

.theme-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;

  .tag {
    padding: 2px 8px;
    font-size: 11px;
    color: var(--anzhiyu-secondtext);
    background: var(--anzhiyu-secondbg);
    border-radius: 3px;

    &.more {
      color: var(--anzhiyu-main);
    }
  }
}

.theme-price {
  margin-bottom: 10px;

  .price {
    font-size: 16px;
    font-weight: 700;
    color: #f59e0b;
  }
}

.card-actions {
  display: flex;
  gap: 6px;
  padding-top: 12px;
  border-top: var(--style-border);
}

/* 按钮 */
.btn {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  transition: all 0.2s ease;

  .el-icon {
    font-size: 12px;
  }

  i {
    font-size: 12px;
  }

  &.primary-btn {
    flex: 1;
    color: var(--anzhiyu-white);
    background: var(--anzhiyu-main);

    &:hover:not(:disabled) {
      filter: brightness(1.05);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    &.loading {
      pointer-events: none;
    }
  }

  &.pro-btn {
    flex: 1;
    color: var(--anzhiyu-white);
    background: linear-gradient(135deg, #f59e0b, #f97316);

    &:hover {
      filter: brightness(1.05);
    }
  }

  &.ssr-btn {
    flex: 1;
    color: var(--anzhiyu-white);
    background: linear-gradient(135deg, #06b6d4, #0891b2);

    &:hover {
      filter: brightness(1.05);
    }
  }

  &.installed-btn {
    flex: 1;
    color: var(--anzhiyu-white);
    cursor: default;
    background: var(--anzhiyu-green);
    opacity: 0.9;

    &:disabled {
      opacity: 0.9;
    }
  }

  &.current-btn {
    flex: 1;
    color: var(--anzhiyu-white);
    cursor: default;
    background: var(--anzhiyu-green);
  }

  &.icon-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    color: var(--anzhiyu-fontcolor);
    background: var(--anzhiyu-secondbg);

    &:hover {
      background: var(--anzhiyu-main);
      color: var(--anzhiyu-white);
    }

    &.danger:hover {
      background: var(--anzhiyu-red);
    }
  }

  &.cancel-btn {
    color: var(--anzhiyu-fontcolor);
    background: var(--anzhiyu-secondbg);

    &:hover {
      background: var(--el-fill-color);
    }
  }
}

/* SSR 端口徽章 */
.ssr-port-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--anzhiyu-green);
  background: var(--anzhiyu-green-op);
  border-radius: 4px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 上传弹窗内容 */
.upload-content {
  .upload-tips {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
    margin-bottom: 16px;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;

    .tip-item {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 12px;
      color: var(--anzhiyu-secondtext);

      .el-icon {
        font-size: 14px;
        color: var(--anzhiyu-main);
      }
    }
  }

  .upload-area {
    margin-bottom: 16px;

    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      padding: 28px 16px;
      background: var(--anzhiyu-secondbg);
      border: 2px dashed var(--el-border-color);
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--anzhiyu-main);
      }
    }

    .upload-dragger {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;

      .upload-icon {
        font-size: 36px;
        color: var(--anzhiyu-main);
      }

      .upload-text {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--anzhiyu-fontcolor);
      }

      .upload-hint {
        margin: 0;
        font-size: 12px;
        color: var(--anzhiyu-secondtext);
      }
    }
  }

  .selected-file {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    margin-bottom: 16px;
    background: var(--anzhiyu-secondbg);
    border-radius: 8px;

    .file-info {
      display: flex;
      gap: 10px;
      align-items: center;

      .file-icon {
        font-size: 20px;
        color: var(--anzhiyu-main);
      }

      .file-detail {
        display: flex;
        flex-direction: column;
        gap: 1px;

        .file-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--anzhiyu-fontcolor);
        }

        .file-size {
          font-size: 11px;
          color: var(--anzhiyu-secondtext);
        }
      }
    }

    .remove-btn {
      width: 24px;
      height: 24px;
      padding: 0;
      color: var(--anzhiyu-secondtext);
      cursor: pointer;
      background: transparent;
      border: none;
      border-radius: 4px;
      transition: all 0.2s ease;

      &:hover {
        color: var(--anzhiyu-red);
        background: var(--anzhiyu-red-op);
      }
    }
  }

  .upload-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
}

/* 响应式 */
@media (width <= 768px) {
  .theme-mall {
    padding: 0 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 0;

    .header-actions {
      width: 100%;

      .action-btn.primary-btn {
        flex: 1;
      }
    }
  }

  .tabs-wrapper .tabs-nav {
    width: 100%;

    .tab-item {
      flex: 1;
      justify-content: center;
      padding: 8px 12px;
    }
  }

  .theme-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .card-preview {
    height: 120px;
  }
}
</style>
