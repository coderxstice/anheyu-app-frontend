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
              <a :href="`/p/${article.id}`" target="_blank" class="card-link">
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
                <a :href="`/p/${article.id}`" target="_blank" class="card-link">
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
                    <el-divider direction="vertical" />
                    <span>
                      <IconifyIconOnline icon="icon-park-outline:text" />
                      {{ article.word_count }}
                    </span>
                    <el-divider direction="vertical" />
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
  text-decoration: none;
  color: inherit;
  display: block;
}

.control-panel {
  margin-bottom: 20px;
  .search-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    .filter-select {
      width: 150px;
    }
  }
  .action-bar {
    margin-top: 10px;
  }
}
.content-area {
  min-height: 400px;
  position: relative;
}
.loading-placeholder {
  width: 100%;
  height: 400px;
}
.article-card {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100% - 20px);

  :deep(.el-card__body) {
    padding: 0;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }
}
.card-cover {
  position: relative;
  width: 100%;
  height: 150px;
  flex-shrink: 0;

  .cover-image {
    width: 100%;
    height: 100%;
    transition: transform 0.3s ease;
  }

  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
    color: #c0c4cc;
    font-size: 14px;
  }

  .card-link:hover & .cover-image {
    transform: scale(1.05);
  }
}
.status-ribbon {
  position: absolute;
  top: 10px;
  right: -30px;
  padding: 4px 0;
  width: 120px;
  text-align: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
  transform: rotate(45deg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
.card-body {
  padding: 16px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.card-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s;

  .card-link:hover & {
    color: var(--el-color-primary);
  }
}
.card-tags {
  margin-top: auto;
  min-height: 24px;
  .tag-item {
    margin-right: 5px;
    margin-bottom: 5px;
  }
}
.card-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color-overlay);
  flex-shrink: 0;

  .timestamps {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    width: 100%;
    justify-content: space-between;
    span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  }

  .footer-extra {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    .stats {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      span {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
    }

    .actions {
      display: flex;
      gap: 8px;
      .el-button {
        padding: 0;
        min-height: auto;
      }
    }
  }
}
.actions {
  display: flex;
}
.actions .el-button {
  padding: 0;
  min-height: auto;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.el-empty {
  margin: 80px auto;
}
</style>
