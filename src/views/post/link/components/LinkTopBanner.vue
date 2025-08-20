<script setup lang="ts">
import { computed, ref } from "vue";
import { useLinkStore } from "@/store/modules/link";
import { getRandomLinks } from "@/api/postLink";

defineOptions({
  name: "LinkTopBanner"
});

const emit = defineEmits(["scrollToApply"]);

const linkStore = useLinkStore();
const isVisitingRandom = ref(false);

const linkList = computed(() => linkStore.bannerLinks);

const handleRandomVisit = async () => {
  if (isVisitingRandom.value) return;
  isVisitingRandom.value = true;
  try {
    const res = await getRandomLinks({ num: 1 });
    if (res.code === 200 && res.data && res.data.length > 0) {
      const randomLink = res.data[0];
      window.open(randomLink.url, "_blank");
    } else {
      console.error("未能获取到随机友链");
    }
  } catch (error) {
    console.error("请求随机友链失败", error);
  } finally {
    isVisitingRandom.value = false;
  }
};

const triggerScrollToApply = () => {
  emit("scrollToApply");
};

const displayLinkList = computed(() => {
  const list = linkList.value;
  const TARGET = 60;
  const n = list.length;

  if (n === 0) return [];
  return Array.from({ length: TARGET }, (_, i) => list[i % n]);
});

const pairedLinkList = computed(() => {
  const pairs = [];
  for (let i = 0; i < displayLinkList.value.length; i += 2) {
    pairs.push(displayLinkList.value.slice(i, i + 2));
  }
  return pairs;
});
</script>

<template>
  <div class="flink_top">
    <div class="banners-title">
      <div class="banners-title-small">友情链接</div>
      <div class="banners-title-big">与数百名博主无限进步</div>
    </div>
    <div class="banner-button-group">
      <button
        class="banner-button secondary"
        rel="external nofollow"
        :disabled="isVisitingRandom"
        @click="handleRandomVisit"
      >
        <i class="anzhiyufont anzhiyu-icon-paper-plane1" />
        <span class="banner-button-text"> 随机访问 </span>
      </button>
      <a
        class="banner-button"
        href="#"
        rel="external nofollow"
        @click.prevent="triggerScrollToApply"
      >
        <i class="anzhiyufont anzhiyu-icon-arrow-circle-right" />
        <span class="banner-button-text">申请友链</span>
      </a>
    </div>
    <div class="tags-group-all">
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
            <img :src="item.logo" :title="item.name" />
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

.flink_top {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
  box-shadow: var(--anzhiyu-shadow-border);
  flex-direction: column;
  will-change: transform;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  overflow: hidden;
  transition: 0.3s;
  margin-bottom: 0.5rem;
}

.banners-title {
  top: 1.875rem;
  left: 2.5rem;
  position: absolute;
  display: flex;
  flex-direction: column;
}

.banners-title-small {
  font-size: 12px;
  line-height: 1;
  color: var(--anzhiyu-secondtext);
  margin-top: 8px;
  margin-bottom: 0.625rem;
  margin-left: 2px;
}

.banners-title-big {
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(90deg, #4285f4, #9b59b6, #e91e63, #f44336);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;

  line-height: 1;
  font-weight: 700;
  margin-bottom: 8px;
  line-clamp: 1;
  overflow: hidden;
}

.banner-button-group {
  position: absolute;
  right: 2.5rem;
  top: 2.5rem;
  display: flex;

  z-index: 1;
}

.banner-button {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
  background: var(--anzhiyu-fontcolor);
  color: var(--anzhiyu-white);
  border: none;
  font-family: inherit;
  padding: 10px;

  &.secondary {
    color: var(--anzhiyu-lighttext);
    margin-right: 1rem;
    box-shadow: var(--anzhiyu-shadow-border);
    background: var(--anzhiyu-secondbg);
    border: var(--style-border-always);
    font-weight: 400;
    &:hover {
      color: var(--anzhiyu-white);
    }
  }

  &:not(:disabled):hover {
    background: var(--anzhiyu-main);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
}

.tags-group-all {
  transform: rotate(0deg);
  padding-bottom: 2.5rem;
  display: flex;
  .tags-group-wrapper {
    margin-top: 8.75rem;
    display: flex;
    animation: 120s linear 0s infinite normal none running rowleft;
  }
}

.tags-group-icon:hover .tags-group-title {
  opacity: 1;
  backdrop-filter: saturate(180%) blur(20px);
}

.tags-group-icon-pair {
  margin-left: 1.25rem;
  user-select: none;
}

.tags-group-icon {
  width: 120px;
  height: 120px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(255, 255, 255);
  font-size: 66px;
  font-weight: 700;
  box-shadow: var(--anzhiyu-shadow-blackdeep);
  border-radius: 50%;
  &:nth-child(2n) {
    margin-top: 1rem;
    transform: translate(-60px);
    &:hover {
      background: var(--anzhiyu-main-op);
      transform: translate(-60px) scale(1.05);
    }
  }

  &:hover {
    background: var(--anzhiyu-main-op);
    transform: scale(1.05);
  }

  img {
    min-width: 100%;
    min-height: 100%;
    object-fit: cover;
    border-radius: 50%;
    width: 60%;
  }

  .tags-group-title {
    font-size: 14px;
    color: var(--anzhiyu-card-bg);
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    background: var(--anzhiyu-lighttext);
    border-radius: 120px;
    transition: 0.3s;
  }
}

@media screen and (min-width: 1200px) {
  .flink_top {
    animation: slide-in 0.6s 0.2s backwards;
  }
}
</style>
