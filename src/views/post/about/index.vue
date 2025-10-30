<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { ElMessage } from "element-plus";
import type { BackendAboutPageConfig } from "@/types/about";

// 组件导入
import AuthorBox from "./components/AuthorBox.vue";
import AuthorPageContent from "./components/AuthorPageContent.vue";
import SkillsCard from "./components/SkillsCard.vue";
import CareersCard from "./components/CareersCard.vue";
import StatisticCard from "./components/StatisticCard.vue";
import MapAndInfoCard from "./components/MapAndInfoCard.vue";
import PersonalityCard from "./components/PersonalityCard.vue";
import PhotoCard from "./components/PhotoCard.vue";
import MaximCard from "./components/MaximCard.vue";
import BuffCard from "./components/BuffCard.vue";
import GameCard from "./components/GameCard.vue";
import ComicCard from "./components/ComicCard.vue";
import LikeTechCard from "./components/LikeTechCard.vue";
import MusicCard from "./components/MusicCard.vue";

defineOptions({
  name: "PostAbout"
});

const siteConfigStore = useSiteConfigStore();
const aboutConfig = ref<BackendAboutPageConfig | null>(null);
const isLoading = ref(true);
const customCodeHtml = ref<string>("");

onMounted(async () => {
  try {
    isLoading.value = true;
    const config = siteConfigStore.getSiteConfig?.about?.page;

    if (config) {
      aboutConfig.value = config;

      // 加载自定义 HTML 内容块
      if (config.custom_code_html) {
        customCodeHtml.value = config.custom_code_html;
      }
    } else {
      ElMessage.error("获取关于页面配置失败，请检查后端配置或联系管理员");
    }
  } catch (error) {
    console.error("Failed to load about config:", error);
    ElMessage.error("加载关于页面配置时发生错误，请稍后重试");
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div v-if="aboutConfig" class="about-container">
    <!-- 作者头像框 -->
    <AuthorBox
      :avatar-img="aboutConfig.avatar_img"
      :avatar-skills="{
        left: aboutConfig.avatar_skills_left,
        right: aboutConfig.avatar_skills_right
      }"
    />

    <div class="author-title">关于本站</div>

    <!-- 基础介绍内容 -->
    <AuthorPageContent
      :name="aboutConfig.name"
      :description="aboutConfig.description"
      :about-site-tips="aboutConfig.about_site_tips"
    />

    <!-- 技能和职业经历 -->
    <div class="author-content">
      <SkillsCard :skills-tips="aboutConfig.skills_tips" />
      <CareersCard :careers="aboutConfig.careers" />
    </div>

    <!-- 访问统计和地图信息 -->
    <div class="author-content">
      <StatisticCard
        :cover="aboutConfig.statistics_background"
        link="/statistics"
        text="更多统计"
      />
      <MapAndInfoCard
        :map="aboutConfig.map"
        :self-info="aboutConfig.self_info"
      />
    </div>

    <!-- 性格和照片 -->
    <div class="author-content">
      <PersonalityCard :personalities="aboutConfig.personalities" />
      <PhotoCard :photo-url="aboutConfig.personalities.photoUrl" />
    </div>

    <!-- 格言和特长 -->
    <div class="author-content">
      <MaximCard :maxim="aboutConfig.maxim" />
      <BuffCard :buff="aboutConfig.buff" />
    </div>

    <!-- 游戏和漫画 -->
    <div class="author-content">
      <GameCard :game="aboutConfig.game" />
      <ComicCard :comic="aboutConfig.comic" />
    </div>

    <!-- 技术和音乐 -->
    <div class="author-content">
      <LikeTechCard :like="aboutConfig.like" />
      <MusicCard :music="aboutConfig.music" :author-name="aboutConfig.name" />
    </div>

    <!-- 自定义内容块 -->
    <div
      v-if="customCodeHtml"
      class="custom-content-block"
      v-html="customCodeHtml"
    />
  </div>

  <div v-else class="loading-container">
    <div class="loading">加载中...</div>
  </div>
</template>

<style lang="scss">
.about-container {
  animation: slide-in 0.6s 0.2s backwards;
  max-width: 1400px;
  padding: 1.5rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media screen and (max-width: 768px) {
    padding: 1rem;
    max-width: 100%;
  }

  .author-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0.625rem 0 1.25rem 0;
    line-height: 1;

    @media screen and (max-width: 768px) {
      font-size: 2rem;
      margin: 0.5rem 0 1rem 0;
    }
  }

  .custom-content-block {
    width: 100%;
    margin-top: 0.5rem;
    animation: slide-in 0.6s 0.4s backwards;

    // 美化自定义内容的样式
    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4),
    :deep(h5),
    :deep(h6) {
      margin: 1.5rem 0 1rem 0;
      font-weight: 600;
      color: var(--anzhiyu-fontcolor);
    }

    :deep(p) {
      margin: 0.75rem 0;
      line-height: 1.8;
      color: var(--anzhiyu-fontcolor);
    }

    :deep(a) {
      color: var(--anzhiyu-main);
      text-decoration: none;
      transition: all 0.3s ease;

      &:hover {
        color: var(--anzhiyu-main-op);
        text-decoration: underline;
      }
    }

    :deep(ul),
    :deep(ol) {
      margin: 0.75rem 0;
      padding-left: 1.5rem;
    }

    :deep(li) {
      margin: 0.5rem 0;
      line-height: 1.8;
    }

    :deep(details) {
      margin: 1rem 0;
      padding: 1rem;
      background: var(--anzhiyu-card-bg);
      border-radius: 8px;
      box-shadow: var(--anzhiyu-shadow-border);

      summary {
        cursor: pointer;
        font-weight: 600;
        user-select: none;
        transition: all 0.3s ease;

        &:hover {
          color: var(--anzhiyu-main);
        }
      }

      .content {
        margin-top: 1rem;
      }
    }

    :deep(blockquote) {
      margin: 1rem 0;
      padding: 0.75rem 1rem;
      border-left: 4px solid var(--anzhiyu-main);
      background: var(--anzhiyu-secondbg);
      border-radius: 4px;
    }

    :deep(code) {
      padding: 0.2rem 0.4rem;
      background: var(--anzhiyu-secondbg);
      border-radius: 4px;
      font-family: "Consolas", "Monaco", "Courier New", monospace;
      font-size: 0.9em;
      color: var(--anzhiyu-red);
    }

    :deep(pre) {
      margin: 1rem 0;
      padding: 1rem;
      background: var(--anzhiyu-secondbg);
      border-radius: 8px;
      overflow-x: auto;

      code {
        padding: 0;
        background: transparent;
        color: var(--anzhiyu-fontcolor);
      }
    }
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;

  .loading {
    font-size: 18px;
    color: var(--anzhiyu-secondtext);
    opacity: 0.8;
  }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .author-content {
    flex-direction: column;
    gap: 1rem;

    > * {
      width: 100% !important;
      flex: none !important;
    }
  }
}
</style>
