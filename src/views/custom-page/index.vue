<template>
  <div class="custom-page-container">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    <!-- 404 错误 - 美观的 404 页面 -->
    <div v-else-if="error === '页面不存在'" class="error-404-page">
      <div class="error-box">
        <div id="error-wrap">
          <div class="error-content">
            <!-- 错误图片 -->
            <div
              class="error-img"
              :style="{
                backgroundImage:
                  'url(https://upload-bbs.miyoushe.com/upload/2025/07/28/125766904/b2642ea6a014ea8a7da64937480fed89_3971198511709008872.gif)'
              }"
            />

            <!-- 错误信息 -->
            <div class="error-info">
              <h1 class="error-title">404</h1>
              <div class="error-subtitle">
                抱歉，您访问的页面不存在或已被删除
              </div>
              <button
                v-ripple
                class="button-animated"
                @click="router.push('/')"
              >
                <i class="anzhiyufont anzhiyu-icon-rocket" />
                回到主页
              </button>
            </div>
          </div>
        </div>

        <!-- 随机文章列表 -->
        <div class="aside-list">
          <div class="aside-list-group">
            <div v-if="articlesLoading" class="loading-container">
              <el-skeleton :rows="3" animated />
            </div>
            <div
              v-for="article in randomArticles"
              v-else
              :key="article.id"
              class="aside-list-item"
              @click="goToArticle(article.id)"
            >
              <div class="thumbnail">
                <img
                  :src="article.cover_url || defaultCover"
                  :alt="article.title"
                  :onerror="`this.src='${defaultCover}'`"
                  loading="lazy"
                />
              </div>
              <div class="content">
                <div class="title" :title="article.title">
                  {{ article.title }}
                </div>
                <time
                  v-if="article.created_at"
                  :datetime="article.created_at"
                  :title="`发表于 ${formatArticleDate(article.created_at)}`"
                >
                  {{ formatArticleDate(article.created_at) }}
                </time>
              </div>
            </div>
            <div
              v-if="!articlesLoading && randomArticles.length === 0"
              class="no-data"
            >
              暂无文章
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 其他错误 - 使用原有的 el-result -->
    <div v-else-if="error" class="error-container">
      <el-result icon="error" title="页面加载失败" :sub-title="error">
        <template #extra>
          <el-button type="primary" @click="loadPage">重试</el-button>
        </template>
      </el-result>
    </div>
    <!-- 正常页面内容 -->
    <div v-else>
      <div class="page-content" v-html="pageContent" />
      <!-- 评论组件 -->
      <PostComment
        v-if="showComment"
        ref="commentRef"
        :target-path="currentPath"
        class="page-comment"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { getCustomPage } from "@/api/custom-page";
import { getPublicArticles } from "@/api/post";
import type { Article } from "@/api/post/type";
import { formatDate } from "@/utils/format";
import { useArticleStore } from "@/store/modules/articleStore";
import PostComment from "@/views/post/components/PostComment/index.vue";

const route = useRoute();
const router = useRouter();
const articleStore = useArticleStore();
const loading = ref(true);
const error = ref("");
const pageData = ref<any>(null);
const commentRef = ref<InstanceType<typeof PostComment> | null>(null);
const pageContentRef = ref<HTMLElement | null>(null);

// 404 页面相关
const randomArticles = ref<Article[]>([]);
const articlesLoading = ref(false);
// 从 store 获取默认封面图
const { defaultCover } = articleStore;

// 计算当前页面路径
const currentPath = computed(() => {
  // 如果是动态路由，从params中获取路径
  if (route.params.pathMatch) {
    return "/" + route.params.pathMatch;
  }
  return route.path;
});

// 页面内容
const pageContent = computed(() => {
  if (!pageData.value) return "";
  return pageData.value.content || "";
});

// 是否显示评论
const showComment = computed(() => {
  return pageData.value?.show_comment === true;
});

// 执行页面中的 script 标签
const executeScripts = () => {
  nextTick(() => {
    const pageContentElement = document.querySelector(
      ".page-content"
    ) as HTMLElement;
    if (!pageContentElement) return;

    // 查找所有 script 标签
    const scripts = pageContentElement.querySelectorAll("script");
    scripts.forEach(oldScript => {
      // 创建新的 script 标签
      const newScript = document.createElement("script");

      // 复制属性
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });

      // 复制内容
      newScript.textContent = oldScript.textContent;

      // 替换旧的 script 标签以触发执行
      if (oldScript.parentNode) {
        oldScript.parentNode.replaceChild(newScript, oldScript);
      }
    });
  });
};

// 获取文章列表
const fetchRandomArticles = async () => {
  articlesLoading.value = true;
  try {
    const response = await getPublicArticles({
      page: 1,
      pageSize: 6
    });
    if (response.code === 200 && response.data?.list) {
      randomArticles.value = response.data.list;
    }
  } catch (error) {
    console.error("获取文章列表失败:", error);
  } finally {
    articlesLoading.value = false;
  }
};

// 格式化日期
const formatArticleDate = (date: string) => {
  return formatDate(date);
};

// 跳转到文章
const goToArticle = (id: string) => {
  router.push(`/posts/${id}`);
};

// 加载页面数据
const loadPage = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response: any = await getCustomPage(currentPath.value);
    if (response.code === 200 && response.data) {
      pageData.value = response.data;
      // 更新页面标题
      if (pageData.value.title) {
        document.title = pageData.value.title;
      }
    } else {
      error.value = response.message || "页面加载失败";
    }
  } catch (err: any) {
    console.error("加载页面失败:", err);

    // 检查是否是404错误
    if (err.response && err.response.status === 404) {
      error.value = "页面不存在";
      document.title = "404 - 页面不存在";
      // 加载随机文章
      fetchRandomArticles();
    } else if (
      err.response &&
      err.response.data &&
      err.response.data.code === 404
    ) {
      // 后端返回的业务层404
      error.value = "页面不存在";
      document.title = "404 - 页面不存在";
      // 加载随机文章
      fetchRandomArticles();
    } else {
      error.value = err.message || "页面加载失败";
      ElMessage.error("页面加载失败");
    }
  } finally {
    loading.value = false;
  }
};

// 监听页面内容变化，执行其中的 script
watch(pageContent, () => {
  executeScripts();
});

onMounted(() => {
  loadPage();
});
</script>

<style lang="scss">
// 引入文章内容基础样式
@use "@/style/article-content-base.scss" as *;

// 应用文章内容样式到自定义页面
.custom-page-container {
  .page-content {
    // 应用所有文章内容基础样式
    @include article-content-base;
  }
}
</style>

<style scoped lang="scss">
.custom-page-container {
  max-width: 1400px;
  padding: 0 1.5rem;
  margin: 0 auto;
}

.loading-container {
  max-width: 800px;
  padding: 0 1rem;
  margin: 0 auto;
}

.error-container {
  max-width: 600px;
  padding: 2rem 1rem;
  margin: 0 auto;
}

.page-content {
  width: 100%;
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

.page-comment {
  width: 100%;
  padding: 1rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
}

// 404 错误页面样式
.error-404-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  .error-box {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;

    #error-wrap {
      margin-bottom: 2rem;
    }

    .error-content {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      background: var(--el-bg-color-overlay);
      border-radius: 12px;
      border: var(--style-border);

      .error-img {
        width: 400px;
        height: 400px;
        background-size: cover;
        background-position: center;
        border-radius: 12px;
        flex-shrink: 0;
      }

      .error-info {
        text-align: center;

        .error-title {
          font-size: 8rem;
          font-weight: 700;
          color: var(--el-color-primary);
          margin: 0 0 1rem;
          line-height: 1;
          background: linear-gradient(
            135deg,
            var(--el-color-primary),
            var(--el-color-primary-light-3)
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .error-subtitle {
          font-size: 1.25rem;
          color: var(--el-text-color-secondary);
          margin-bottom: 2rem;
        }

        .button-animated {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 2rem;
          font-size: 1rem;
          font-weight: 500;
          color: #fff;
          background: var(--el-color-primary);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: var(--el-color-primary-light-3);
          }

          &:active {
            transform: translateY(0);
          }

          i {
            font-size: 1.125rem;
          }
        }
      }
    }

    .aside-list {
      background: var(--el-bg-color-overlay);
      border-radius: 12px;
      padding: 1.5rem;
      border: var(--style-border);

      .aside-list-group {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;

        .loading-container {
          grid-column: 1 / -1;
        }

        .aside-list-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: var(--el-fill-color-lighter);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            .thumbnail img {
              transform: scale(1.1);
            }

            .title {
              color: var(--el-color-primary);
            }
          }

          .thumbnail {
            width: 100px;
            height: 100px;
            border-radius: 8px;
            overflow: hidden;
            flex-shrink: 0;
            background: var(--el-fill-color);

            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              transition: transform 0.3s ease;
            }
          }

          .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 0.5rem;
            min-width: 0;

            .title {
              font-size: 1rem;
              font-weight: 500;
              color: var(--el-text-color-primary);
              transition: color 0.3s ease;
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              line-clamp: 2;
              -webkit-box-orient: vertical;
              line-height: 1.5;
            }

            time {
              font-size: 0.875rem;
              color: var(--el-text-color-secondary);
            }
          }
        }

        .no-data {
          grid-column: 1 / -1;
          text-align: center;
          padding: 2rem;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .error-404-page {
    padding: 1rem 0;

    .error-box {
      .error-content {
        gap: 2rem;
        padding: 1.5rem;

        .error-img {
          width: 280px;
          height: 280px;
        }

        .error-info {
          .error-title {
            font-size: 5rem;
          }

          .error-subtitle {
            font-size: 1rem;
          }
        }
      }

      .aside-list {
        padding: 1rem;

        .aside-list-group {
          grid-template-columns: 1fr;
          gap: 0.75rem;

          .aside-list-item {
            padding: 0.75rem;

            .thumbnail {
              width: 80px;
              height: 80px;
            }

            .content {
              .title {
                font-size: 0.875rem;
              }

              time {
                font-size: 0.75rem;
              }
            }
          }
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .error-404-page {
    .error-box {
      .error-content {
        .error-img {
          width: 200px;
          height: 200px;
        }

        .error-info {
          .error-title {
            font-size: 4rem;
          }

          .error-subtitle {
            font-size: 0.875rem;
            margin-bottom: 1.5rem;
          }

          .button-animated {
            padding: 0.75rem 1.5rem;
            font-size: 0.875rem;
          }
        }
      }
    }
  }
}
</style>
