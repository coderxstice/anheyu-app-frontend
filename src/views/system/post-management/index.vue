<script setup lang="ts">
import { reactive, onMounted, toRefs } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, ElDivider } from "element-plus";
import { getArticleList, deleteArticle } from "@/api/post";
import type { Article, GetArticleListParams } from "@/api/post/type";
import {
  Search,
  Refresh,
  Plus,
  EditPen,
  Delete
} from "@element-plus/icons-vue";
import { useArticleStore } from "@/store/modules/articleStore";

const articleStore = useArticleStore();

defineOptions({
  name: "PostManagement"
});

const router = useRouter();

const state = reactive({
  loading: false,
  tableData: [] as Article[],
  pagination: {
    currentPage: 1,
    pageSize: 12,
    total: 0
  },
  searchParams: {
    query: "",
    status: ""
  } as GetArticleListParams
});

const { loading, tableData, pagination, searchParams } = toRefs(state);

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "PUBLISHED", label: "已发布", type: "success", color: "#67C23A" },
  { value: "DRAFT", label: "草稿", type: "warning", color: "#E6A23C" },
  { value: "ARCHIVED", label: "已归档", type: "info", color: "#909399" }
];

/**
 * 格式化 ISO 日期字符串为 'YYYY-MM-DD HH:mm'
 * @param isoString ISO 格式的日期字符串
 */
const formatDate = (isoString: string) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  const pad = (num: number) => num.toString().padStart(2, "0");
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
};

const fetchData = async () => {
  state.loading = true;
  try {
    const params: GetArticleListParams = {
      page: state.pagination.currentPage,
      pageSize: state.pagination.pageSize,
      query: state.searchParams.query,
      status: state.searchParams.status
    };
    const { data } = await getArticleList(params);
    state.tableData = data.list;
    state.pagination.total = data.total;
  } catch (error) {
    ElMessage.error("获取文章列表失败");
  } finally {
    state.loading = false;
  }
};

const handleSearch = () => {
  state.pagination.currentPage = 1;
  fetchData();
};

const handleReset = () => {
  state.searchParams.query = "";
  state.searchParams.status = "";
  handleSearch();
};

const handleNew = () => {
  router.push({ name: "PostEdit", params: { id: "new" } });
};

const handleEdit = (row: Article) => {
  router.push({ name: "PostEdit", params: { id: row.id } });
};

const handleDelete = (row: Article) => {
  ElMessageBox.confirm(`确定要删除文章《${row.title}》吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      await deleteArticle(row.id);
      ElMessage.success("删除成功");
      if (state.tableData.length === 1 && state.pagination.currentPage > 1) {
        state.pagination.currentPage--;
      }
      fetchData();
    })
    .catch(() => {});
};

const handleSizeChange = (val: number) => {
  state.pagination.pageSize = val;
  fetchData();
};

const handleCurrentChange = (val: number) => {
  state.pagination.currentPage = val;
  fetchData();
};

const getStatusInfo = (status: string) => {
  return statusOptions.find(s => s.value === status);
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="post-management-container">
    <el-card shadow="never" class="control-panel">
      <el-form :model="searchParams" :inline="true" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchParams.query"
            placeholder="搜索文章标题"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchParams.status"
            placeholder="请选择文章状态"
            class="filter-select"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch"
            >搜索</el-button
          >
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="action-bar">
        <el-button v-ripple type="primary" :icon="Plus" @click="handleNew"
          >新增文章</el-button
        >
      </div>
    </el-card>

    <div class="content-area">
      <div v-if="loading" v-loading="loading" class="loading-placeholder" />

      <div v-if="!loading && tableData.length > 0" class="card-grid">
        <el-row :gutter="20">
          <el-col
            v-for="article in tableData"
            :key="article.id"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
          >
            <el-card shadow="hover" class="article-card">
              <a
                :href="`/posts/${article.id}`"
                target="_blank"
                class="card-link"
              >
                <div class="card-cover">
                  <el-image
                    v-if="article.cover_url"
                    :src="article.cover_url"
                    fit="cover"
                    class="cover-image"
                    lazy
                  >
                    <template #error>
                      <div class="image-slot"><span>封面加载失败...</span></div>
                    </template>
                  </el-image>
                  <el-image
                    v-else
                    :src="articleStore.defaultCover"
                    fit="cover"
                    class="cover-image"
                    lazy
                  >
                    <template #error>
                      <div class="image-slot"><span>封面加载失败...</span></div>
                    </template>
                  </el-image>
                  <div
                    class="status-ribbon"
                    :style="{
                      backgroundColor: getStatusInfo(article.status)?.color
                    }"
                  >
                    {{ getStatusInfo(article.status)?.label }}
                  </div>
                </div>
              </a>

              <div class="card-body">
                <a
                  :href="`/posts/${article.id}`"
                  target="_blank"
                  class="card-link"
                >
                  <h3 class="card-title">{{ article.title }}</h3>
                </a>
                <div class="card-tags">
                  <el-tooltip
                    v-for="cat in article.post_categories"
                    :key="cat.id"
                    :content="`分类: ${cat.name}`"
                    placement="top"
                  >
                    <el-tag type="info" size="small" class="tag-item">{{
                      cat.name
                    }}</el-tag>
                  </el-tooltip>
                  <el-tooltip
                    v-for="tag in article.post_tags"
                    :key="tag.id"
                    :content="`标签: ${tag.name}`"
                    placement="top"
                  >
                    <el-tag size="small" class="tag-item">{{
                      tag.name
                    }}</el-tag>
                  </el-tooltip>
                </div>
              </div>

              <div class="card-footer">
                <div class="timestamps">
                  <span>
                    <IconifyIconOnline icon="ep:calendar" />
                    {{ formatDate(article.created_at) }}
                  </span>
                  <span>
                    <IconifyIconOnline icon="ep:edit-pen" />
                    {{ formatDate(article.updated_at) }}
                  </span>
                </div>
                <div class="footer-extra">
                  <div class="stats">
                    <span>
                      <IconifyIconOnline icon="ep:view" />
                      {{ article.view_count }}
                    </span>
                    <el-divider direction="vertical" style="margin: 0" />
                    <span>
                      <IconifyIconOnline icon="icon-park-outline:text" />
                      {{ article.word_count }}
                    </span>
                    <el-divider direction="vertical" style="margin: 0" />
                    <span>
                      <IconifyIconOnline
                        icon="ant-design:field-time-outlined"
                      />
                      {{ article.reading_time }} min
                    </span>
                  </div>
                  <div class="actions">
                    <el-button
                      type="primary"
                      link
                      :icon="EditPen"
                      @click="handleEdit(article)"
                      >编辑</el-button
                    >
                    <el-button
                      type="danger"
                      link
                      :icon="Delete"
                      @click="handleDelete(article)"
                      >删除</el-button
                    >
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <el-empty
        v-if="!loading && tableData.length === 0"
        description="暂无文章"
      >
        <el-button type="primary" :icon="Plus" @click="handleNew"
          >立即新增</el-button
        >
      </el-empty>

      <el-pagination
        v-if="!loading && pagination.total > 0"
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[12, 24, 48, 96]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination-container"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.control-panel {
  margin-bottom: 20px;

  .search-form {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;

    .filter-select {
      width: 150px;
    }
  }

  .action-bar {
    margin-top: 10px;
  }
}

.content-area {
  position: relative;
  min-height: 400px;
}

.loading-placeholder {
  width: 100%;
  height: 400px;
}

.article-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100% - 20px);
  margin-bottom: 20px;
  overflow: hidden;
  border-radius: 8px;

  :deep(.el-card__body) {
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    padding: 0;
  }
}

.card-cover {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  height: 150px;

  .cover-image {
    width: 100%;
    height: 100%;
    transition: transform 0.3s ease;
  }

  .image-slot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 14px;
    color: #c0c4cc;
    background: #f5f7fa;
  }

  .card-link:hover & .cover-image {
    transform: scale(1.05);
  }
}

.status-ribbon {
  position: absolute;
  top: 10px;
  right: -30px;
  width: 120px;
  padding: 4px 0;
  font-size: 12px;
  font-weight: bold;
  color: white;
  text-align: center;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
  transform: rotate(45deg);
}

.card-body {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  padding: 16px;
}

.card-title {
  margin: 0 0 12px;
  overflow: hidden;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s;

  .card-link:hover & {
    color: var(--el-color-primary);
  }
}

.card-tags {
  min-height: 24px;
  margin-top: auto;

  .tag-item {
    margin-right: 5px;
    margin-bottom: 5px;
  }
}

.card-footer {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background-color: var(--el-bg-color-overlay);
  border-top: 1px solid var(--el-border-color-lighter);

  .timestamps {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;

    span {
      display: inline-flex;
      gap: 4px;
      align-items: center;
    }
  }

  .footer-extra {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    .stats {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 12px;
      color: var(--el-text-color-secondary);

      span {
        display: inline-flex;
        gap: 4px;
        align-items: center;
      }
    }

    .actions {
      display: flex;
      gap: 8px;

      .el-button {
        min-height: auto;
        padding: 0;
      }
    }
  }
}

.actions {
  display: flex;
}

.actions .el-button {
  min-height: auto;
  padding: 0;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.el-empty {
  margin: 80px auto;
}
</style>
