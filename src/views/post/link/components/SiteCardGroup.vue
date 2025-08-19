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
  -webkit-box-pack: start;
  justify-content: flex-start;
  -webkit-box-align: stretch;
  align-items: stretch;
  margin: -8px;
  padding: 20px 0px;
}

.site-card {
  height: 200px;
  position: relative;
  width: calc(14.2857% - 16px);
  box-shadow: var(--anzhiyu-shadow-border);
  border: var(--style-border);
  border-radius: 12px;
  transition: 0.3s ease-in-out;
  overflow: hidden;
  background: var(--anzhiyu-card-bg);
  line-height: 1.4;
  margin: 8px;
  display: block;
  &:hover {
    box-shadow: var(--anzhiyu-shadow-main);
    border: var(--style-border-hover);
    background: var(--anzhiyu-lighttext);
    .link-tag {
      left: -50px;
    }
    .img {
      height: 80px;

      background: var(--anzhiyu-lighttext);
      img {
        transform: scale(1.1);
        filter: brightness(0.3);
      }
    }
    .info {
      height: 120px;
      background: var(--anzhiyu-lighttext);
      img.flink-avatar {
        width: 0px;
        height: 0px;
        opacity: 0;
        min-width: 0px;
        min-height: 0px;
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
      box-shadow: var(--anzhiyu-shadow-main);
      text-decoration: none;
      border-bottom: 2px solid var(--anzhiyu-none);
      background: var(--anzhiyu-main);
    }
  }
  .link-tag {
    position: absolute;
    top: 0px;
    left: 0px;
    background-color: var(--anzhiyu-blue);
    color: var(--anzhiyu-white);
    z-index: 1;
    font-size: 0.75rem;
    padding: 4px 8px;
    border-radius: 12px 0px;
    transition: 0.3s;
    overflow: hidden;
  }
  a.img {
    mask-image: -webkit-radial-gradient(
      center center,
      rgb(255, 255, 255),
      rgb(0, 0, 0)
    );
    height: 120px;
    width: 100%;
    display: flex;
    border-radius: 0px;
    border-width: initial;
    border-style: none;
    border-color: initial;
    border-image: initial;
    padding: 0px !important;
    background: rgb(246, 246, 246);
    overflow: hidden;
    img {
      transform: scale(1.03);
      max-width: 100%;
      border-radius: 0px;
      transition: 0.3s;
      margin: 0px;
      pointer-events: none;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  a.img:hover img {
    transform: scale(1.1);
  }
  a.info {
    display: flex;
    width: 100%;
    height: 90px;
    border-width: initial;
    border-style: none;
    border-color: initial;
    border-image: initial;
    padding: 0.625rem;
    margin: 0px;
    border-radius: 0px 0px 12px 12px;
    color: var(--anzhiyu-fontcolor);
    font-weight: 700;
    text-decoration: none;
    .site-card-avatar {
      img {
        width: 20px;
        height: 20px;
        min-width: 20px;
        min-height: 20px;
        border-radius: 32px;
        margin: 2px 8px 0px 0px;
        background: var(--anzhiyu-secondbg);
        transition: 0.3s ease-out;
      }
    }
    .site-card-text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      .title {
        text-align: left;
        font-weight: 600;
        -webkit-box-orient: vertical;
        line-clamp: 1;
        -webkit-line-clamp: 1;
        overflow: hidden;
        transition: 0.3s;
      }
      .desc {
        font-size: 0.875rem;
        opacity: 0.7;
        text-align: left;
        transition: 0.3s;
        overflow-wrap: break-word;
        line-height: 1.2;
        -webkit-box-orient: vertical;
        line-clamp: 2;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }
    }
  }

  .light {
    cursor: pointer;
    position: absolute;
    top: 0px;
    width: 100px;
    height: 50px;
    background-image: -webkit-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 0.5),
      rgba(255, 255, 255, 0)
    );
    animation: 4s ease 0s infinite normal both running light_tag;
  }
}
</style>
