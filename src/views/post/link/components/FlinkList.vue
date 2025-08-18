<script setup lang="ts">
import type { LinkItem } from "@/api/postLink/type";

defineOptions({
  name: "FlinkList"
});

defineProps<{
  links: LinkItem[];
}>();
</script>

<template>
  <div class="flink-list">
    <div v-for="link in links" :key="link.id" class="flink-list-item">
      <template v-if="link.tags && link.tags.length > 0">
        <span
          class="link-tag"
          :style="{ backgroundColor: link.tags[0].color }"
          >{{ link.tags[0].name }}</span
        >
      </template>

      <a
        class="cf-friends-link"
        :href="link.url"
        rel="external nofollow"
        :title="link.name"
        target="_blank"
      >
        <img
          class="flink-avatar"
          :src="link.logo"
          :alt="link.name"
          onerror="this.onerror=null;this.src='/img/b_av.webp'"
        />
        <div class="flink-item-info">
          <span class="flink-item-name">{{ link.name }}</span>
          <span class="flink-item-desc" :title="link.description">{{
            link.description
          }}</span>
        </div>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.flink-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}
.flink-list-item {
  position: relative;
  background-color: var(--anzhiyu-background-op);
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    background-color: var(--anzhiyu-main-op);
    transform: scale(1.02);
  }

  .link-tag {
    position: absolute;
    top: 8px;
    right: 8px;
    color: white;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: bold;
    z-index: 1;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .cf-friends-link {
    display: flex;
    align-items: center;
    padding: 10px;
    text-decoration: none;

    .flink-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      margin-right: 10px;
      object-fit: cover;
    }

    .flink-item-info {
      overflow: hidden;
      flex: 1;
      .flink-item-name {
        display: block;
        color: var(--anzhiyu-fontcolor);
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .flink-item-desc {
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
