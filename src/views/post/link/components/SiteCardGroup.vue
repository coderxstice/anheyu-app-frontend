<script setup lang="ts">
import type { LinkItem } from "@/api/postLink/type";
defineProps<{ links: LinkItem[] }>();
</script>

<template>
  <div class="site-card-group">
    <div v-for="link in links" :key="link.id" class="site-card">
      <template v-if="link.tags && link.tags.length > 0">
        <span class="link-tag" :style="{ backgroundColor: link.tags[0].color }">
          {{ link.tags[0].name }}
        </span>
      </template>

      <a
        class="img"
        target="_blank"
        :title="link.name"
        :href="link.url"
        rel="external nofollow"
      >
        <img
          class="flink-avatar"
          :src="link.siteshot"
          :alt="link.name"
          onerror="this.onerror=null;this.src='/img/b_av.webp'"
        />
      </a>
      <a
        class="info"
        target="_blank"
        :title="link.name"
        :href="link.url"
        rel="external nofollow"
      >
        <div class="site-card-avatar">
          <img
            class="flink-avatar"
            :src="link.logo"
            :alt="link.name"
            onerror="this.onerror=null;this.src='/img/b_av.webp'"
          />
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.site-card {
  position: relative;
  background-color: var(--anzhiyu-card-bg);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
  border: 1px solid var(--anzhiyu-gray-op);
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  .link-tag {
    position: absolute;
    top: 10px;
    right: 10px;
    color: white;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: bold;
    z-index: 2;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  a.img {
    display: block;
    width: 100%;
    padding-top: 50%;
    position: relative;
    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
  }
  a.img:hover img {
    transform: scale(1.1);
  }
  a.info {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    text-decoration: none;
    .site-card-avatar {
      margin-right: 15px;
      img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
      }
    }
    .site-card-text {
      overflow: hidden;
      .title {
        display: block;
        color: var(--anzhiyu-fontcolor);
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .desc {
        display: block;
        color: var(--anzhiyu-second-fontcolor);
        font-size: 0.85rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 4px;
      }
    }
  }
}
</style>
