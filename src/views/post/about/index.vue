<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
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

// 获取板块开关配置（存储在 enable 子对象中）
const enableConfig = computed(() => {
  const config = siteConfigStore.getSiteConfig?.about?.page?.enable;
  return {
    author_box: config?.author_box !== false,
    page_content: config?.page_content !== false,
    skills: config?.skills !== false,
    careers: config?.careers !== false,
    statistic: config?.statistic !== false,
    map_and_info: config?.map_and_info !== false,
    personality: config?.personality !== false,
    photo: config?.photo !== false,
    maxim: config?.maxim !== false,
    buff: config?.buff !== false,
    game: config?.game !== false,
    comic: config?.comic !== false,
    like_tech: config?.like_tech !== false,
    music: config?.music !== false,
    custom_code: config?.custom_code !== false
  };
});

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
      v-if="enableConfig.author_box"
      :avatar-img="aboutConfig.avatar_img"
      :avatar-skills="{
        left: aboutConfig.avatar_skills_left,
        right: aboutConfig.avatar_skills_right
      }"
    />

    <div class="author-title">关于本站</div>

    <!-- 基础介绍内容 -->
    <AuthorPageContent
      v-if="enableConfig.page_content"
      :name="aboutConfig.name"
      :description="aboutConfig.description"
      :about-site-tips="aboutConfig.about_site_tips"
    />

    <!-- 技能和职业经历 -->
    <div
      v-if="enableConfig.skills || enableConfig.careers"
      class="author-content"
    >
      <SkillsCard
        v-if="enableConfig.skills"
        :skills-tips="aboutConfig.skills_tips"
      />
      <CareersCard v-if="enableConfig.careers" :careers="aboutConfig.careers" />
    </div>

    <!-- 访问统计和地图信息 -->
    <div
      v-if="enableConfig.statistic || enableConfig.map_and_info"
      class="author-content"
    >
      <StatisticCard
        v-if="enableConfig.statistic"
        :cover="aboutConfig.statistics_background"
        link="/statistics"
        text="更多统计"
      />
      <MapAndInfoCard
        v-if="enableConfig.map_and_info"
        :map="aboutConfig.map"
        :self-info="aboutConfig.self_info"
      />
    </div>

    <!-- 性格和照片 -->
    <div
      v-if="enableConfig.personality || enableConfig.photo"
      class="author-content"
    >
      <PersonalityCard
        v-if="enableConfig.personality"
        :personalities="aboutConfig.personalities"
      />
      <PhotoCard
        v-if="enableConfig.photo"
        :photo-url="aboutConfig.personalities.photoUrl"
      />
    </div>

    <!-- 格言和特长 -->
    <div v-if="enableConfig.maxim || enableConfig.buff" class="author-content">
      <MaximCard v-if="enableConfig.maxim" :maxim="aboutConfig.maxim" />
      <BuffCard v-if="enableConfig.buff" :buff="aboutConfig.buff" />
    </div>

    <!-- 游戏和漫画 -->
    <div v-if="enableConfig.game || enableConfig.comic" class="author-content">
      <GameCard v-if="enableConfig.game" :game="aboutConfig.game" />
      <ComicCard v-if="enableConfig.comic" :comic="aboutConfig.comic" />
    </div>

    <!-- 技术和音乐 -->
    <div
      v-if="enableConfig.like_tech || enableConfig.music"
      class="author-content"
    >
      <LikeTechCard v-if="enableConfig.like_tech" :like="aboutConfig.like" />
      <MusicCard
        v-if="enableConfig.music"
        :music="aboutConfig.music"
        :author-name="aboutConfig.name"
      />
    </div>

    <!-- 自定义内容块 -->
    <div
      v-if="customCodeHtml && enableConfig.custom_code"
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
  padding: 0.5rem;
  margin: 0 auto;
}

.author-title {
  padding-left: 0.75rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
  color: var(--anzhiyu-fontcolor);
}

.author-content {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  margin-bottom: 0.5rem;

  @media screen and (width <= 768px) {
    flex-direction: column;
  }
}

.custom-content-block {
  padding: 1rem;
  margin-top: 0.5rem;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;

  // 继承 markdown 样式
  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin-top: 1em;
    margin-bottom: 0.5em;
    font-weight: 600;
    color: var(--anzhiyu-fontcolor);
  }

  :deep(p) {
    margin-bottom: 1em;
    line-height: 1.7;
    color: var(--anzhiyu-secondtext);
  }

  :deep(a) {
    color: var(--anzhiyu-theme);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 1.5em;
    margin-bottom: 1em;
  }

  :deep(li) {
    margin-bottom: 0.5em;
    color: var(--anzhiyu-secondtext);
  }

  :deep(code) {
    padding: 0.2em 0.4em;
    font-family:
      SFMono-Regular,
      Consolas,
      Liberation Mono,
      Menlo,
      monospace;
    font-size: 0.9em;
    background: var(--anzhiyu-card-bg-grey);
    border-radius: 4px;
  }

  :deep(pre) {
    padding: 1em;
    margin-bottom: 1em;
    overflow-x: auto;
    background: var(--anzhiyu-card-bg-grey);
    border-radius: 8px;

    code {
      padding: 0;
      background: transparent;
    }
  }

  :deep(blockquote) {
    padding: 0.5em 1em;
    margin: 1em 0;
    color: var(--anzhiyu-secondtext);
    border-left: 4px solid var(--anzhiyu-theme);
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }

  :deep(hr) {
    margin: 1.5em 0;
    border: none;
    border-top: 1px solid var(--anzhiyu-card-border);
  }

  :deep(table) {
    width: 100%;
    margin-bottom: 1em;
    border-collapse: collapse;

    th,
    td {
      padding: 0.5em;
      border: 1px solid var(--anzhiyu-card-border);
    }

    th {
      font-weight: 600;
      background: var(--anzhiyu-card-bg-grey);
    }
  }

  // 支持折叠块样式
  :deep(.folding-tag) {
    margin: 1em 0;
    border: var(--style-border);
    border-radius: 8px;

    summary {
      padding: 0.75em 1em;
      font-weight: 500;
      cursor: pointer;
      background: var(--anzhiyu-card-bg-grey);
      border-radius: 8px 8px 0 0;

      &:hover {
        background: var(--anzhiyu-main-op-light);
      }
    }

    &[open] summary {
      border-bottom: var(--style-border);
      border-radius: 8px 8px 0 0;
    }

    .content {
      padding: 1em;
    }
  }
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;

  .loading {
    font-size: 1.2rem;
    color: var(--anzhiyu-secondtext);
  }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
