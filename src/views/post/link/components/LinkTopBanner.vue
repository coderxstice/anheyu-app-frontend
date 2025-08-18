<script setup lang="ts">
import { computed, ref } from "vue";
import { useLinkStore } from "@/store/modules/link";
import { getRandomLinks } from "@/api/postLink";

defineOptions({
  name: "LinkTopBanner"
});

const linkStore = useLinkStore();
const isVisitingRandom = ref(false);

// 从 Pinia store 中获取已处理好的 Banner 友链数据
const linkList = computed(() => linkStore.bannerLinks);

// 随机访问按钮点击事件
const handleRandomVisit = async () => {
  if (isVisitingRandom.value) return; // 防止重复点击
  isVisitingRandom.value = true;
  try {
    const res = await getRandomLinks({ num: 1 });
    if (res.code === 200 && res.data && res.data.length > 0) {
      const randomLink = res.data[0];
      // 在新标签页中打开链接
      window.open(randomLink.url, "_blank");
    } else {
      // 可以根据需要添加错误提示，例如使用 ElMessage
      console.error("未能获取到随机友链");
    }
  } catch (error) {
    console.error("请求随机友链失败", error);
  } finally {
    isVisitingRandom.value = false; // 恢复按钮状态
  }
};

// 为了实现无缝滚动，我们将列表复制一份
const displayLinkList = computed(() => {
  if (linkList.value.length === 0) return [];
  // 如果友链数量过少，多复制几次以填满视觉
  if (linkList.value.length < 15) {
    return [
      ...linkList.value,
      ...linkList.value,
      ...linkList.value,
      ...linkList.value
    ];
  }
  return [...linkList.value, ...linkList.value];
});

// 将友链列表两两分组，以匹配 DOM 结构
const pairedLinkList = computed(() => {
  const pairs = [];
  for (let i = 0; i < displayLinkList.value.length; i += 2) {
    pairs.push(displayLinkList.value.slice(i, i + 2));
  }
  return pairs;
});
</script>

<template>
  <div class="flink">
    <div class="banners-title">
      <div class="banners-title-small">友情链接</div>
      <div class="banners-title-big">与数百名博主无限进步</div>
    </div>
    <div class="banner-button-group">
      <button
        class="banner-button secondary w-[150px]"
        rel="external nofollow"
        :disabled="isVisitingRandom"
        @click="handleRandomVisit"
      >
        <i class="anzhiyufont anzhiyu-icon-paper-plane1" />
        <span class="banner-button-text"> 随机访问 </span>
      </button>
      <a class="banner-button" href="javascript:;" rel="external nofollow">
        <i class="anzhiyufont anzhiyu-icon-arrow-circle-right" />
        <span class="banner-button-text">申请友链</span>
      </a>
    </div>
    <div class="tags-group-all nowrapMove">
      <div class="tags-group-wrapper">
        <div
          v-for="(pair, index) in pairedLinkList"
          :key="index"
          class="tags-group-icon-pair"
        >
          <a
            v-for="item in pair"
            :key="item.id"
            class="tags-group-icon"
            :href="item.url"
            rel="external nofollow"
            target="_blank"
            :title="item.name"
          >
            <img
              :src="item.logo"
              :title="item.name"
              onerror="this.onerror=null;this.src='/img/b_av.webp'"
            />
            <span class="tags-group-title">{{ item.name }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.banner-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.anzhiyufont {
  margin-right: 8px;
  font-size: 1.2em;
}

.flink {
  position: relative;
  background: var(--anzhiyu-card-bg);
  border-radius: 12px;
  padding: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.banners-title {
  margin-bottom: 20px;
}

.banners-title-small {
  font-size: 1.2rem;
  color: var(--anzhiyu-fontcolor);
  margin-bottom: 8px;
}

.banners-title-big {
  font-size: 2.5rem;
  font-weight: bold;
  background: linear-gradient(90deg, #4285f4, #9b59b6, #e91e63, #f44336);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.banner-button-group {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.banner-button {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
  background: var(--anzhiyu-main);
  color: var(--anzhiyu-white);
  border: none;
  font-family: inherit;

  &.secondary {
    background: var(--anzhiyu-card-bg);
    color: var(--anzhiyu-fontcolor);
    border: 1px solid var(--anzhiyu-gray-op);
  }

  &:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
}

.tags-group-all {
  width: 100%;
  overflow: hidden;
  -webkit-mask: linear-gradient(
    90deg,
    transparent,
    #fff 20%,
    #fff 80%,
    transparent
  );
  mask: linear-gradient(90deg, transparent, #fff 20%, #fff 80%, transparent);
}

.tags-group-wrapper {
  display: flex;
  width: max-content;
  animation: scroll 60s linear infinite;
}

@keyframes scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

.nowrapMove:hover .tags-group-wrapper {
  animation-play-state: paused;
}

.tags-group-icon-pair {
  display: flex;
  flex-direction: column;
  margin: 0 10px;
}

.tags-group-icon {
  display: flex;
  align-items: center;
  background: var(--anzhiyu-background-op);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  width: 180px;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    background: var(--anzhiyu-main-op);
    transform: scale(1.05);
  }

  img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 10px;
    object-fit: cover;
  }

  .tags-group-title {
    color: var(--anzhiyu-fontcolor);
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
