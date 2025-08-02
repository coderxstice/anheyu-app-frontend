<script setup lang="ts">
import { computed } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

defineOptions({
  name: "HomeTop"
});

const siteConfigStore = useSiteConfigStore();
const siteConfig = computed(() => siteConfigStore.getSiteConfig);

const homeTopConfig = computed(() => siteConfig.value?.HOME_TOP);
const creativityConfig = computed(() => siteConfig.value?.CREATIVITY);

const creativityList = computed(() => {
  if (!creativityConfig.value?.creativity_list) return [];
  const list = creativityConfig.value.creativity_list;
  return [...list, ...list];
});

const creativityPairs = computed(() => {
  const pairs = [];
  const list = creativityList.value;
  for (let i = 0; i < list.length; i += 2) {
    if (list[i + 1]) {
      pairs.push([list[i], list[i + 1]]);
    }
  }
  return pairs;
});
</script>

<template>
  <div v-if="homeTopConfig && creativityConfig" class="home-top-container">
    <div class="left-section">
      <div id="random-banner">
        <div class="banners-title">
          <div class="banners-title-big">{{ homeTopConfig.title }}</div>
          <div class="banners-title-big">{{ homeTopConfig.subTitle }}</div>
          <div class="banners-title-small">{{ homeTopConfig.siteText }}</div>
        </div>

        <div id="skills-tags-group-all">
          <div class="tags-group-wrapper">
            <div
              v-for="(pair, index) in creativityPairs"
              :key="index"
              class="tags-group-icon-pair"
            >
              <div
                class="tags-group-icon"
                :style="{ background: pair[0].color }"
              >
                <img
                  :title="pair[0].name"
                  :src="pair[0].icon"
                  :alt="pair[0].name"
                />
              </div>
              <div
                class="tags-group-icon"
                :style="{ background: pair[1].color }"
              >
                <img
                  :title="pair[1].name"
                  :src="pair[1].icon"
                  :alt="pair[1].name"
                />
              </div>
            </div>
          </div>
        </div>

        <a id="random-hover" rel="external nofollow noreferrer">
          <i class="anzhiyufont anzhiyu-icon-paper-plane" />
          <div class="bannerText">
            随便逛逛
            <i class="anzhiyufont anzhiyu-icon-arrow-right" />
          </div>
        </a>
      </div>

      <div class="category-group">
        <div
          v-for="item in homeTopConfig.category"
          :key="item.name"
          class="category-item"
        >
          <a
            class="category-button"
            :style="{ background: item.background }"
            :href="item.path"
          >
            <span class="category-button-text">{{ item.name }}</span>
            <i :class="['anzhiyufont', item.icon]" />
          </a>
        </div>
      </div>
    </div>

    <div class="right-section">
      <a
        v-if="homeTopConfig.banner"
        id="today-card"
        :href="homeTopConfig.banner.link"
        target="_blank"
        rel="noopener external nofollow noreferrer"
      >
        <div class="today-card-info">
          <div class="today-card-tips">{{ homeTopConfig.banner.tips }}</div>
          <div class="today-card-title">{{ homeTopConfig.banner.title }}</div>
        </div>
        <img
          class="today-card-cover"
          :src="homeTopConfig.banner.image"
          alt="封面"
        />
        <div class="banner-button-group">
          <div class="banner-button">
            <i class="anzhiyufont anzhiyu-icon-arrow-circle-right" />
            <span class="banner-button-text">更多推荐</span>
          </div>
        </div>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home-top-container {
  display: flex;
  gap: 1rem;
  width: 100%;
  margin: 1rem auto 0;
}
.left-section {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 340px;
}
.right-section {
  flex: 1;
  min-width: 0;
  height: 340px;
}
#random-banner {
  display: flex;
  width: 100%;
  height: 76%;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: var(--anzhiyu-shadow-border);
  flex-direction: column;
  transition: 0.3s;
  will-change: transform;
}

#random-banner:hover #random-hover {
  opacity: 1;
  padding-left: 2rem;
  background: var(--anzhiyu-theme-op-deep);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
}

#random-banner .banners-title {
  position: absolute;
  top: 2.9rem;
  left: 3rem;
  z-index: 2;
  animation: slide-in 0.6s 0.3s backwards;
  margin-bottom: 0.5rem;
}

#random-banner .banners-title .banners-title-big {
  font-size: 2.25rem;
  line-height: 1;
  font-weight: 700;
  margin-bottom: 0.5rem;
}
#random-banner .banners-title .banners-title-small {
  font-size: 12px;
  line-height: 1;
  color: var(--anzhiyu-secondtext);
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
#skills-tags-group-all {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-30deg) scale(1);
  margin-top: 7rem;
  z-index: 1;
  display: flex;
  transition: 0.3s;
}
#skills-tags-group-all .tags-group-wrapper {
  display: flex;
  flex-wrap: nowrap;
  animation: rowup 60s linear infinite;
}
#skills-tags-group-all .tags-group-icon-pair {
  margin-left: 1rem;
  flex-shrink: 0;
}

#skills-tags-group-all .tags-group-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 66px;
  font-weight: 700;
  box-shadow: var(--anzhiyu-shadow-blackdeep);
  width: 120px;
  height: 120px;
  border-radius: 30px;
}

#skills-tags-group-all .tags-group-icon img {
  width: 60px;
  height: 60px;
  object-fit: contain;
}
#skills-tags-group-all .tags-group-icon-pair .tags-group-icon:nth-child(even) {
  margin-top: 1rem;
  transform: translateX(-60px);
}
#random-hover {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  color: var(--anzhiyu-white);
  padding-left: 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.71, 0.15, 0.16, 1.15);
  font-size: 60px;
  z-index: 3;
  cursor: pointer;
}
#random-hover .bannerText {
  display: flex;
  align-items: center;
  font-size: 3.5rem;
  font-weight: bold;
}
#random-hover i {
  font-size: 4.5rem;
  margin-right: 1rem;
  line-height: 1;
}
#random-hover .bannerText > i {
  font-size: 4.5rem;
  margin-left: 1rem;
}
.category-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.category-group .category-item {
  flex: 1;
  position: relative;
  transition: all 0.8s cubic-bezier(0.65, 0.15, 0.37, 1.19);
  &:hover {
    flex: 2;
    .category-button i {
      opacity: 0.8;
      transition: 0.8s;
      transition-delay: 0.15s;
      transform: scale(1.03);
      font-size: 2.5rem;
      filter: blur(0);
    }
  }
}

.category-group .category-item .category-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.2rem;
  border-radius: 12px;
  color: white;
  text-decoration: none;
  transition: all 0.3s;
  background-size: 200% !important;
}

.category-group .category-item .category-button .category-button-text {
  font-size: 1.2rem;
  font-weight: bold;
}
.category-group .category-item .category-button i {
  font-size: 5rem;
  opacity: 0.2;
  position: absolute;
  right: 0;
  transition: 0.3s;
  width: 100px;
  text-align: center;
  filter: blur(2px);
  transform: scale(1) rotate(15deg);
}
#today-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  color: white;
  background: black;
  transition: all 0.3s;
  text-decoration: none;
  &::after {
    position: absolute;
    content: "";
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    box-shadow: 0 -109px 133px -9px #000 inset;
    z-index: 2;
  }
}

#today-card .today-card-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
  transition: transform 0.3s;
}

#today-card .today-card-info {
  z-index: 3;
  text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.5);
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  color: var(--anzhiyu-white);
  max-width: 60%;
  transition: 0.3s;
}

#today-card .today-card-info .today-card-tips {
  opacity: 0.8;
  font-size: 0.75rem;
}

#today-card .today-card-info .today-card-title {
  font-size: 1.8rem;
  font-weight: bold;
}

#today-card .banner-button-group {
  z-index: 3;
  position: absolute;
  right: 2rem;
  bottom: 2rem;
  display: flex;
  transition: 0.3s;
  i {
    font-size: 1.375rem;
  }
}

#today-card .banner-button-group .banner-button {
  gap: 0.5rem;
  cursor: pointer;
  background: var(--anzhiyu-white-op);
  border-radius: 20px;
  color: var(--anzhiyu-white);
  display: flex;
  align-items: center;
  transition: 0.3s;
  cursor: pointer;
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transform: translateZ(0);
  height: 40px;
  width: 125px;
  justify-content: center;
  &:hover {
    background: var(--anzhiyu-theme);
    color: var(--anzhiyu-white);
  }
}

@media (max-width: 992px) {
  .home-top-container {
    flex-direction: column;
  }
  #today-card {
    height: 200px;
  }
  .category-group .category-item .category-button {
    padding: 1rem;
  }
}
</style>
