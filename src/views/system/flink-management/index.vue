<template>
  <div class="flink-management">
    <!-- 1. 顶部操作与筛选栏 -->
    <el-card shadow="never" class="header-card">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <div class="filter-row">
          <el-form-item label="关键词">
            <el-input
              v-model="queryParams.name"
              placeholder="搜索网站名称或描述"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="queryParams.status"
              placeholder="全部状态"
              clearable
              style="width: 120px"
              @change="handleQuery"
            >
              <el-option label="待审核" value="PENDING" />
              <el-option label="已通过" value="APPROVED" />
              <el-option label="已拒绝" value="REJECTED" />
            </el-select>
          </el-form-item>
          <el-form-item class="search-buttons">
            <el-button type="primary" :icon="Search" @click="handleQuery">
              搜索
            </el-button>
            <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </div>
        <div class="action-row">
          <el-button type="primary" :icon="Setting" @click="handleManage">
            <span class="button-text">管理分类标签</span>
          </el-button>
          <el-button type="warning" :icon="Upload" @click="handleImport">
            <span class="button-text">批量导入</span>
          </el-button>
          <el-button type="info" :icon="Monitor" @click="handleHealthCheck">
            <span class="button-text">健康检查</span>
          </el-button>
          <el-button type="success" :icon="Plus" @click="handleCreate">
            <span class="button-text">新建友链</span>
          </el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 2. 友链卡片列表 -->
    <div v-loading="loading" class="link-list">
      <el-row v-if="linkList.length > 0" :gutter="20">
        <el-col
          v-for="link in linkList"
          :key="link.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card class="link-card" shadow="hover">
            <div class="card-header">
              <el-avatar :size="50" :src="link.logo" @error="() => true">
                <img
                  src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png"
                />
              </el-avatar>
              <div class="site-info">
                <p class="site-name">{{ link.name }}</p>
                <el-link
                  :href="link.url"
                  target="_blank"
                  type="primary"
                  :underline="false"
                  class="site-url"
                >
                  {{ link.url }}
                </el-link>
              </div>
            </div>
            <p class="description">{{ link.description || "暂无描述" }}</p>

            <div v-if="link.category || link.tag" class="meta-info">
              <el-tag
                v-if="link.category && link.category.style"
                size="small"
                class="mr-2"
                :type="link.category.style === 'card' ? 'primary' : 'success'"
              >
                样式: {{ link.category.style === "card" ? "卡片" : "列表" }}
              </el-tag>
              <el-tag v-if="link.category" size="small" type="info">{{
                link.category.name
              }}</el-tag>
              <el-tag
                v-if="link.tag"
                size="small"
                :color="link.tag.color"
                class="tag-item"
                :style="{
                  color: 'white !important',
                  background: link.tag.color
                }"
                >{{ link.tag.name }}</el-tag
              >
            </div>

            <el-divider />

            <div class="card-footer">
              <el-tag :type="statusMap[link.status].type" effect="light">
                {{ statusMap[link.status].text }}
              </el-tag>
              <div class="actions">
                <!-- 待审核的特殊操作 -->
                <template v-if="link.status === 'PENDING'">
                  <el-button
                    type="success"
                    size="small"
                    plain
                    @click="handleReview(link.id, 'APPROVED')"
                  >
                    通过
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    plain
                    @click="handleReview(link.id, 'REJECTED')"
                  >
                    拒绝
                  </el-button>
                </template>
                <!-- 通用操作 -->
                <el-button
                  link
                  type="primary"
                  :icon="Edit"
                  @click="handleEdit(link)"
                />
                <el-popconfirm
                  title="确定要删除这个友链吗？"
                  @confirm="handleDelete(link.id)"
                >
                  <template #reference>
                    <el-button link type="danger" :icon="Delete" />
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-empty v-else description="暂无友链数据，快去新建一个吧！" />
    </div>

    <!-- 3. 分页 -->
    <el-pagination
      v-if="total > 0"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :page-sizes="[12, 24, 36, 48]"
      :total="total"
      background
      :layout="paginationLayout"
      :small="isMobile"
      @size-change="getLinkList"
      @current-change="getLinkList"
    />

    <!-- 4. 新建/编辑抽屉 -->
    <LinkDrawer
      v-model="drawer.visible"
      :is-edit-mode="drawer.isEdit"
      :data="drawer.data"
      @success="getLinkList"
    />

    <!-- 5. 分类和标签管理器 -->
    <CategoryTagManager v-model="manager.visible" @refresh="getLinkList" />

    <!-- 6. 批量导入对话框 -->
    <ImportDialog v-model="importDialog.visible" @success="getLinkList" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed, onUnmounted } from "vue";
import {
  Search,
  Refresh,
  Plus,
  Edit,
  Delete,
  Setting,
  Upload,
  Monitor
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, ElLoading } from "element-plus";
import {
  getAdminLinkList,
  deleteLink,
  reviewLink,
  checkLinksHealth
} from "@/api/postLink";
import type {
  LinkItem,
  GetAdminLinksParams,
  LinkStatus
} from "@/api/postLink/type";
import LinkDrawer from "./components/LinkDrawer.vue";
import CategoryTagManager from "./components/CategoryTagManager.vue";
import ImportDialog from "./components/ImportDialog.vue";

defineOptions({
  name: "FlinkManagement"
});

const loading = ref(true);
const linkList = ref<LinkItem[]>([]);
const total = ref(0);

// 移动端检测
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < 768);

// 分页布局（移动端简化）
const paginationLayout = computed(() => {
  if (windowWidth.value < 576) {
    return "prev, pager, next";
  } else if (windowWidth.value < 768) {
    return "total, prev, pager, next";
  }
  return "total, sizes, prev, pager, next, jumper";
});

const queryParams = ref<GetAdminLinksParams>({
  page: 1,
  pageSize: 12,
  name: "",
  status: undefined
});

const pagination = reactive({
  page: 1,
  pageSize: 12
});

const statusMap: Record<
  LinkStatus,
  { text: string; type: "success" | "warning" | "danger" | "info" }
> = {
  APPROVED: { text: "已通过", type: "success" },
  PENDING: { text: "待审核", type: "warning" },
  REJECTED: { text: "已拒绝", type: "danger" },
  INVALID: { text: "已失效", type: "info" }
};

const getLinkList = async () => {
  loading.value = true;
  try {
    const params = {
      ...queryParams.value,
      page: pagination.page,
      pageSize: pagination.pageSize
    };
    const res = await getAdminLinkList(params);
    if (res.code === 200) {
      linkList.value = res.data.list;
      total.value = res.data.total;
    }
  } catch (error) {
    console.error("获取友链列表失败", error);
    ElMessage.error("获取友链列表失败");
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  pagination.page = 1;
  getLinkList();
};

const resetQuery = () => {
  queryParams.value.name = "";
  queryParams.value.status = undefined;
  handleQuery();
};

const handleDelete = async (id: number) => {
  try {
    await deleteLink(id);
    ElMessage.success("删除成功");
    getLinkList();
  } catch (error) {
    console.error("删除失败", error);
  }
};

const handleReview = async (id: number, status: "APPROVED" | "REJECTED") => {
  try {
    // 如果是审核通过，可能需要输入网站快照
    let siteshot: string | undefined;
    if (status === "APPROVED") {
      // 使用 ElMessageBox 提示用户输入网站快照
      const { value } = await ElMessageBox.prompt(
        "请输入网站快照链接（可选）：",
        "审核通过",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          inputPlaceholder: "https://example.com/siteshot.png",
          inputPattern: /^$|^https?:\/\/.+/, // 允许空值或有效的URL
          inputErrorMessage: "请输入有效的网站快照链接"
        }
      );
      siteshot = value || undefined;
    }

    await reviewLink(id, { status, siteshot });
    ElMessage.success("审核操作成功");
    getLinkList();
  } catch (error) {
    if (error !== "cancel") {
      console.error("审核失败", error);
      ElMessage.error("审核失败");
    }
  }
};

const drawer = reactive({
  visible: false,
  isEdit: false,
  data: null as LinkItem | null
});

const manager = reactive({
  visible: false
});

const importDialog = reactive({
  visible: false
});

const handleCreate = () => {
  drawer.isEdit = false;
  drawer.data = null;
  drawer.visible = true;
};

const handleEdit = (row: LinkItem) => {
  drawer.isEdit = true;
  drawer.data = row;
  drawer.visible = true;
};

const handleManage = () => {
  manager.visible = true;
};

const handleImport = () => {
  importDialog.visible = true;
};

const handleHealthCheck = async () => {
  try {
    await ElMessageBox.confirm(
      "此操作将检查所有已审核通过的友链是否可访问，无法访问的友链将被标记为失联状态。是否继续？",
      "友链健康检查",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    const loadingInstance = ElLoading.service({
      lock: true,
      text: "正在检查友链健康状态，请稍候...",
      background: "rgba(0, 0, 0, 0.7)"
    });

    try {
      const res = await checkLinksHealth();
      loadingInstance.close();

      if (res.code === 200) {
        const { total, healthy, unhealthy } = res.data;
        ElMessage.success(
          `健康检查完成！共检查 ${total} 个友链，健康 ${healthy} 个，失联 ${unhealthy} 个`
        );
        getLinkList();
      } else {
        ElMessage.error("健康检查失败：" + res.message);
      }
    } catch (error) {
      loadingInstance.close();
      console.error("健康检查失败", error);
      ElMessage.error("健康检查失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("操作取消或出错", error);
    }
  }
};

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  getLinkList();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style lang="scss" scoped>
.flink-management {
  padding: 20px;

  @media screen and (width <= 768px) {
    padding: 0;
    margin: 1rem;
  }
}

.header-card {
  margin-bottom: 20px;

  @media screen and (width <= 768px) {
    margin-bottom: 16px;

    :deep(.el-card__body) {
      padding: 16px;
    }
  }

  .filter-form {
    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    .filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 16px;

      @media screen and (width <= 768px) {
        flex-direction: column;
        gap: 0;
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid #ebeef5;

        .el-form-item {
          width: 100%;
          margin-right: 0 !important;
          margin-bottom: 16px;

          &:last-child {
            margin-bottom: 0;
          }

          :deep(.el-form-item__label) {
            font-weight: 500;
            font-size: 14px;
          }

          :deep(.el-form-item__content) {
            width: 100%;

            .el-input,
            .el-select {
              width: 100% !important;
            }
          }
        }

        .search-buttons {
          margin-top: 4px;

          :deep(.el-form-item__content) {
            display: flex;
            gap: 12px;

            .el-button {
              flex: 1;
              height: 40px;
            }
          }
        }
      }
    }

    .action-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;

      @media screen and (width <= 768px) {
        flex-direction: column;
        gap: 12px;

        .el-button {
          width: 100%;
          height: 44px;
          margin-left: 0 !important;
          font-size: 15px;
          font-weight: 500;

          :deep(.el-icon) {
            font-size: 18px;
          }
        }
      }

      @media screen and (width <= 480px) {
        .el-button {
          height: 42px;

          :deep(.el-icon) {
            font-size: 20px;
          }
        }
      }
    }
  }
}

.link-list {
  min-height: 400px;

  :deep(.el-row) {
    @media screen and (width <= 768px) {
      margin-left: 0 !important;
      margin-right: 0 !important;

      .el-col {
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
    }
  }
}

.link-card {
  margin-bottom: 20px;

  @media screen and (width <= 768px) {
    margin-bottom: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;

    @media screen and (width <= 768px) {
      margin-bottom: 12px;
    }
  }

  .site-info {
    margin-left: 15px;
    overflow: hidden;
    flex: 1;

    @media screen and (width <= 768px) {
      margin-left: 12px;
    }
  }

  .site-name {
    margin: 0;
    overflow: hidden;
    font-size: 16px;
    font-weight: bold;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media screen and (width <= 768px) {
      font-size: 15px;
    }
  }

  .site-url {
    display: block;
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 2px;
  }

  .description {
    display: -webkit-box;
    min-height: 40px;
    margin: 0 0 10px;
    overflow: hidden;
    font-size: 14px;
    color: #606266;
    line-height: 1.6;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;

    @media screen and (width <= 768px) {
      font-size: 13px;
      min-height: 38px;
      margin-bottom: 8px;
    }
  }

  .meta-info {
    margin-bottom: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    @media screen and (width <= 768px) {
      margin-bottom: 8px;
      gap: 8px;
    }

    .el-tag {
      @media screen and (width <= 768px) {
        font-size: 12px;
        height: 24px;
        padding: 0 8px;
        line-height: 22px;
      }
    }

    .tag-item {
      margin-left: 0;
      color: white !important;
      border: none !important;
      border-radius: 12px 0;
      box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
    }
  }

  .el-divider {
    margin: 12px 0;

    @media screen and (width <= 768px) {
      margin: 10px 0;
    }
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;

    @media screen and (width <= 768px) {
      gap: 10px;
    }

    .el-tag {
      flex-shrink: 0;
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 4px;

    @media screen and (width <= 768px) {
      gap: 8px;

      .el-button {
        &:not(.el-button--small) {
          padding: 8px 12px;
          font-size: 14px;
        }

        &.el-button--small {
          min-width: 64px;
        }
      }
    }
  }
}

.el-pagination {
  justify-content: flex-end;
  margin-top: 20px;

  @media screen and (width <= 768px) {
    justify-content: center;
    margin-top: 16px;
  }
}
</style>
