<!--
 * @Description: 技能卡片组件
 * @Author: 安知鱼
 * @Date: 2025-01-27
-->
<script setup lang="ts">
import { computed } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

interface Props {
  skillsTips: {
    tips: string;
    title: string;
  };
}

defineProps<Props>();

const siteConfigStore = useSiteConfigStore();
const creativity =
  siteConfigStore.getSiteConfig?.CREATIVITY?.creativity_list || [];

// 计算技能图标对，用于旋转展示
const creativityPairs = computed(() => {
  if (!creativity || creativity.length === 0) return [];
  const list = [...creativity, ...creativity]; // 复制一份用于无缝循环
  const pairs = [];
  for (let i = 0; i < list.length; i += 2) {
    if (list[i + 1]) {
      pairs.push([list[i], list[i + 1]]);
    }
  }
  return pairs;
});
</script>

<template>
  <div class="author-content-item skills">
    <div class="card-content">
      <div class="author-content-item-tips">{{ skillsTips.tips }}</div>
      <span class="author-content-item-title">{{ skillsTips.title }}</span>
      <div class="skills-style-group">
        <!-- 旋转的技能标签组 -->
        <div id="skills-tags-group-all" class="skills-tags-group">
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
                  class="no-lightbox"
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
                  class="no-lightbox"
                  :title="pair[1].name"
                  :src="pair[1].icon"
                  :alt="pair[1].name"
                />
              </div>
            </div>
          </div>
        </div>
        <!-- 详细技能列表 -->
        <div class="skills-list">
          <div
            v-for="(item, index) in creativity"
            :key="index"
            class="skill-info"
          >
            <div class="skill-icon" :style="{ background: item.color }">
              <img
                class="no-lightbox"
                :title="item.name"
                :src="item.icon"
                :alt="item.name"
              />
            </div>
            <div class="skill-name">
              <span>{{ item.name }}</span>
            </div>
          </div>
          <div class="skill-info">
            <span>等等...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.skills {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-direction: column;
  width: 50%;
  min-height: 450px;

  .skill-icon {
    width: 32px;
    height: 32px;
    border-radius: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;

    img {
      width: 18px;
      height: 18px;
      margin: 0 auto !important;
    }
  }

  .skills-list {
    display: flex;
    opacity: 0;
    transition: 0.3s;
    position: absolute;
    width: 100%;
    top: 0;
    left: 0;
    flex-wrap: wrap;
    flex-direction: row;
    margin-top: 10px;
  }

  .skill-info {
    display: flex;
    align-items: center;
    margin-right: 10px;
    margin-top: 10px;
    background: var(--anzhiyu-background);
    border-radius: 40px;
    padding: 4px 12px 4px 8px;
    border: var(--style-border);
    box-shadow: var(--anzhiyu-shadow-border);
  }

  .skills-style-group {
    position: relative;
  }

  .skills-tags-group {
    .skills-tag {
      display: inline-block;
      padding: 4px 12px;
      background: var(--anzhiyu-background);
      border-radius: 40px;
      border: var(--style-border);
      box-shadow: var(--anzhiyu-shadow-border);
      margin-top: 10px;
    }
  }

  // 参考 HomeTop 的旋转技能标签样式
  #skills-tags-group-all {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin-top: 4.5rem;
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

  #skills-tags-group-all
    .tags-group-icon-pair
    .tags-group-icon:nth-child(even) {
    margin-top: 1rem;
    transform: translateX(-60px);
  }

  &:hover {
    .skills-style-group {
      #skills-tags-group-all {
        opacity: 0;
      }

      .skills-list {
        opacity: 1;
      }
    }
  }
}

// 添加旋转动画
@keyframes rowup {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
</style>
