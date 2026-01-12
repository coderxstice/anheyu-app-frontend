<!--
 * @Description: 404 页面
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2026-01-12 15:38:09
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { getPublicArticles } from "@/api/post";
import type { Article } from "@/api/post/type";
import { formatDate } from "@/utils/format";
import { useArticleStore } from "@/store/modules/articleStore";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

defineOptions({
  name: "404"
});

const router = useRouter();
const articleStore = useArticleStore();
const siteConfigStore = useSiteConfigStore();
const randomArticles = ref<Article[]>([]);
const loading = ref(false);

// 从 store 获取默认封面图
const { defaultCover } = articleStore;

// 从配置中获取 404 页面默认图片
const error404Image = computed(() => {
  return (
    siteConfigStore.siteConfig.post?.page404?.default_image ||
    "/static/img/background-effect.gif"
  );
});

// 获取文章列表
const fetchRandomArticles = async () => {
  loading.value = true;
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
    loading.value = false;
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

onMounted(() => {
  fetchRandomArticles();
});
</script>

<template>
  <div class="error-page">
    <div class="error-box">
      <div id="error-wrap">
        <div class="error-content">
          <!-- 错误图片 -->
          <div
            class="error-img"
            :style="{
              backgroundImage: `url(${error404Image})`
            }"
          />

          <!-- 错误信息 -->
          <div class="error-info">
            <h1 class="error-title">404</h1>
            <div class="error-subtitle">请尝试站内搜索寻找文章</div>
            <button v-ripple class="button-animated" @click="router.push('/')">
              <i class="anzhiyufont anzhiyu-icon-rocket" />
              回到主页
            </button>
          </div>
        </div>
      </div>

      <!-- 随机文章列表 -->
      <div class="aside-list">
        <div class="aside-list-group">
          <div v-if="loading" class="loading-container">
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
          <div v-if="!loading && randomArticles.length === 0" class="no-data">
            暂无文章
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color);

  .error-box {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;

    #error-wrap {
      margin-bottom: 2rem;
    }

    .error-content {
      display: flex;
      align-items: stretch;
      background: var(--el-bg-color-overlay);
      border-radius: 12px;
      border: var(--style-border);
      overflow: hidden;
      min-height: 400px;

      .error-img {
        flex: 1;
        min-width: 300px;
        background-size: cover;
        background-position: center;
        border-radius: 12px 0 0 12px;
      }

      .error-info {
        flex: 1;
        min-width: 280px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 2rem;

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
          padding: 0.375rem 1.8rem;
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
  .error-page {
    padding: 1rem 0.5rem;

    .error-box {
      .error-content {
        flex-direction: column;
        min-height: auto;

        .error-img {
          min-width: 100%;
          height: 250px;
          border-radius: 12px 12px 0 0;
        }

        .error-info {
          padding: 1.5rem;

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
  .error-page {
    .error-box {
      .error-content {
        .error-img {
          height: 180px;
        }

        .error-info {
          padding: 1rem;

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
