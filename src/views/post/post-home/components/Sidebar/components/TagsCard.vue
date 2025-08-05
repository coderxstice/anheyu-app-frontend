<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getTagList } from "@/api/post";
import { PostTag } from "@/api/post/type";

defineOptions({
  name: "TagsCard"
});

const tagList = ref<PostTag[]>([]);
const loading = ref(true);

// 获取标签数据
const fetchTags = async () => {
  loading.value = true;
  try {
    const res = await getTagList();
    if (res.code === 200 && res.data) {
      tagList.value = res.data;
    }
  } catch (error) {
    console.error("获取标签列表失败:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchTags();
});
</script>

<template>
  <div class="card-widget card-tags">
    <div class="card-content">
      <div v-if="loading" class="loading-tip">标签云加载中...</div>
      <div v-else-if="tagList.length > 0" class="card-tag-cloud">
        <router-link
          v-for="tag in tagList"
          :key="tag.id"
          :to="`/tags/${tag.name}`"
        >
          {{ tag.name }}
          <sup>{{ tag.count }}</sup>
        </router-link>
      </div>
      <div v-else class="empty-tip">暂无标签</div>
    </div>
    <div class="card-footer">
      <router-link to="/tags" class="view-all-button"> 查看全部 </router-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../card.scss";

.card-tags {
  padding: 1rem 1.2rem;
}

.card-content {
  min-height: 100px;
}

.card-tag-cloud {
  max-height: 360px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 4px;
  a {
    color: var(--anzhiyu-fontcolor);
    padding: 0 0.375rem;
    font-size: 1rem;
    border-radius: 8px;
    cursor: pointer;

    &:hover {
      background: var(--anzhiyu-lighttext);
      color: var(--anzhiyu-card-bg);
      box-shadow: var(--anzhiyu-shadow-theme);
      border-radius: 4px;
    }

    sup {
      opacity: 0.6;
      margin-left: 4px;
      font-size: 0.7em;
    }
  }
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 150px;
    background-image: linear-gradient(
      to top,
      var(--anzhiyu-card-bg),
      transparent
    );
    pointer-events: none;
  }
}

.loading-tip,
.empty-tip {
  color: var(--anzhiyu-secondtext);
  font-size: 14px;
  text-align: center;
  padding: 2rem 0;
}

.card-footer {
  margin-top: 1rem;
  text-align: center;
  border-top: 1px dashed var(--anzhiyu-gray-op);
  padding-top: 1rem;

  .view-all-button {
    display: inline-block;
    width: 100%;
    padding: 8px 0;
    border-radius: 8px;
    color: var(--anzhiyu-secondtext);
    background-color: var(--anzhiyu-card-bg);
    border: 1px solid var(--anzhiyu-gray-op);
    text-decoration: none;
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--anzhiyu-theme);
      color: var(--anzhiyu-white);
      border-color: var(--anzhiyu-theme);
      box-shadow: var(--anzhiyu-shadow-theme);
    }
  }
}
</style>
