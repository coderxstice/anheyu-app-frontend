<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getTagList } from "@/api/post";

defineOptions({
  name: "TagsCard"
});

// 根据你的 API 响应结构定义类型
interface Tag {
  id: string;
  name: string;
  // 理想情况下，API应该返回count
  // count?: number;
}

const tagList = ref<Tag[]>([]);
const loading = ref(true);

// 获取标签数据
const fetchTags = async () => {
  loading.value = true;
  try {
    const res = await getTagList();
    // 请根据你实际的 BaseResponse 结构调整
    if (res.code === 200 && res.data) {
      // 假设 data 就是标签数组，如果 data 是 { list: [...] } 结构，则用 res.data.list
      tagList.value = res.data;
    }
  } catch (error) {
    console.error("获取标签列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 为标签生成一个随机的字体大小，模拟标签云效果
// 理想情况下，这个大小应该基于 tag.count
const getTagStyle = () => {
  const minSize = 14; // 最小字体大小 (px)
  const maxSize = 28; // 最大字体大小 (px)
  const randomSize = Math.random() * (maxSize - minSize) + minSize;

  // 也可以根据大小随机生成一个颜色，增加层次感
  const randomOpacity = Math.random() * 0.5 + 0.5; // 透明度在 0.5 和 1.0 之间

  return {
    fontSize: `${randomSize.toFixed(1)}px`,
    opacity: randomOpacity
  };
};

onMounted(() => {
  fetchTags();
});
</script>

<template>
  <div class="card-widget card-tags">
    <div class="card-header">
      <i class="anzhiyufont anzhiyu-icon-tags card-title-icon" />
      <span class="card-title">标签</span>
    </div>
    <div class="card-content">
      <div v-if="loading" class="loading-tip">标签云加载中...</div>
      <div v-else-if="tagList.length > 0" class="card-tag-cloud">
        <router-link
          v-for="tag in tagList"
          :key="tag.id"
          :to="`/tags/${tag.name}`"
          :style="getTagStyle()"
        >
          {{ tag.name }}
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

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: var(--anzhiyu-fontcolor);
  .card-title-icon {
    font-size: 1.2rem;
  }
}

.card-content {
  min-height: 100px;
}

.card-tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  a {
    display: inline-block;
    color: var(--anzhiyu-fontcolor);
    text-decoration: none;
    transition: all 0.3s ease;
    line-height: 1;

    &:hover {
      color: var(--anzhiyu-theme);
      transform: scale(1.1);
    }

    sup {
      opacity: 0.6;
      margin-left: 4px;
      font-size: 0.7em;
    }
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
