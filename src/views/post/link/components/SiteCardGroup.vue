<script setup lang="ts">
import type { LinkItem } from "@/api/postLink/type";
defineProps<{ links: LinkItem[] }>();
</script>

<template>
  <div class="site-card-group">
    <div v-for="link in links" :key="link.id" class="site-card">
      <template v-if="link.tags && link.tags.length > 0">
        <span class="link-tag" :style="{ background: link.tags[0].color }">
          {{ link.tags[0].name }}
          <i class="light" />
        </span>
      </template>

      <a
        class="img"
        target="_blank"
        :title="link.name"
        :href="link.url"
        rel="external nofollow"
      >
        <img class="flink-avatar" :src="link.siteshot" :alt="link.name" />
      </a>
      <a
        class="info"
        target="_blank"
        :title="link.name"
        :href="link.url"
        rel="external nofollow"
      >
        <div class="site-card-avatar">
          <img class="flink-avatar" :src="link.logo" :alt="link.name" />
        </div>
        <div class="site-card-text">
          <span class="title">{{ link.name }}</span>
          <span class="desc" :title="link.description">{{
            link.description
          }}</span>
        </div>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.site-card-group {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: flex-start;
  padding: 20px 0;
  margin: -8px;
  -webkit-box-pack: start;
  -webkit-box-align: stretch;
}

.site-card {
  position: relative;
  display: block;
  width: calc(14.2857% - 16px);
  height: 200px;
  margin: 8px;
  overflow: hidden;
  line-height: 1.4;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  transition: 0.3s ease-in-out;

  &:hover {
    background: var(--anzhiyu-lighttext);
    border: var(--style-border-hover);
    box-shadow: var(--anzhiyu-shadow-main);

    .link-tag {
      left: -50px;
    }

    .img {
      height: 80px;
      background: var(--anzhiyu-lighttext);

      img {
        filter: brightness(0.3);
        transform: scale(1.1);
      }
    }

    .info {
      height: 120px;
      background: var(--anzhiyu-lighttext);

      img.flink-avatar {
        width: 0;
        min-width: 0;
        height: 0;
        min-height: 0;
        opacity: 0;
      }

      .title {
        color: var(--anzhiyu-card-bg);
      }

      .desc {
        color: var(--anzhiyu-card-bg);
      }
    }

    a {
      color: var(--anzhiyu-white);
      text-decoration: none;
      background: var(--anzhiyu-main);
      border-bottom: 2px solid var(--anzhiyu-none);
      box-shadow: var(--anzhiyu-shadow-main);
    }
  }

  .link-tag {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    padding: 4px 8px;
    overflow: hidden;
    font-size: 0.75rem;
    color: var(--anzhiyu-white);
    background-color: var(--anzhiyu-blue);
    border-radius: 12px 0;
    transition: 0.3s;
  }

  a.img {
    display: flex;
    width: 100%;
    height: 120px;
    padding: 0 !important;
    overflow: hidden;
    background: rgb(246 246 246);
    border-color: initial;
    border-style: none;
    border-width: initial;
    border-radius: 0;
    border-image: initial;
    mask-image: radial-gradient(
      center center,
      rgb(255 255 255),
      rgb(0 0 0)
    );

    img {
      width: 100%;
      max-width: 100%;
      height: 100%;
      margin: 0;
      pointer-events: none;
      object-fit: cover;
      border-radius: 0;
      transition: 0.3s;
      transform: scale(1.03);
    }
  }

  a.img:hover img {
    transform: scale(1.1);
  }

  a.info {
    display: flex;
    width: 100%;
    height: 90px;
    padding: 0.625rem;
    margin: 0;
    font-weight: 700;
    color: var(--anzhiyu-fontcolor);
    text-decoration: none;
    border-color: initial;
    border-style: none;
    border-width: initial;
    border-radius: 0 0 12px 12px;
    border-image: initial;

    .site-card-avatar {
      img {
        width: 20px;
        min-width: 20px;
        height: 20px;
        min-height: 20px;
        margin: 2px 8px 0 0;
        background: var(--anzhiyu-secondbg);
        border-radius: 32px;
        transition: 0.3s ease-out;
      }
    }

    .site-card-text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;

      .title {
        overflow: hidden;
        font-weight: 600;
        text-align: left;
        -webkit-line-clamp: 1;
        line-clamp: 1;
        transition: 0.3s;
        -webkit-box-orient: vertical;
      }

      .desc {
        overflow: hidden;
        font-size: 0.875rem;
        line-height: 1.2;
        text-align: left;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        overflow-wrap: break-word;
        opacity: 0.7;
        transition: 0.3s;
        -webkit-box-orient: vertical;
      }
    }
  }

  .light {
    position: absolute;
    top: 0;
    width: 100px;
    height: 50px;
    cursor: pointer;
    background-image: linear-gradient(
      0deg,
      rgb(255 255 255 / 0%),
      rgb(255 255 255 / 50%),
      rgb(255 255 255 / 0%)
    );
    animation: 4s ease 0s infinite normal both running light_tag;
  }
}
</style>
