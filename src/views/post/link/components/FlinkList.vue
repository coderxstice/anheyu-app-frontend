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
        <span class="link-tag" :style="{ backgroundColor: link.tags[0].color }">
          {{ link.tags[0].name }}
          <i class="light" />
        </span>
      </template>

      <a
        class="cf-friends-link"
        :href="link.url"
        rel="external nofollow"
        :title="link.name"
        target="_blank"
      >
        <img class="flink-avatar" :src="link.logo" :alt="link.name" />
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
  padding: 0px;
  margin: 0.625rem -6px 1.25rem;
  overflow: hidden;
  text-align: center;
}

.flink-list-item {
  position: relative;
  width: calc(20% - 12px);
  box-shadow: var(--anzhiyu-shadow-border);
  display: flex;
  margin: 6px;
  transition: 0.3s ease-in-out;
  border-radius: 12px;
  border: var(--style-border-always);
  background: var(--anzhiyu-card-bg);
  height: 90px;
  line-height: 17px;
  transform: translateZ(0px);
  overflow: hidden;
  float: left;

  &:hover {
    transform: scale(1.02);
    box-shadow: var(--anzhiyu-shadow-main);
    background: var(--anzhiyu-lighttext);
    border: var(--style-border-hover);

    .link-tag {
      left: -70px;
    }
    .cf-friends-link {
      .flink-avatar {
        width: 0px;
        height: 0px;
        opacity: 0;
        min-width: 0px;
        min-height: 0px;
        transition: 0.6s;
        margin: 5px;
      }
      .flink-item-info {
        min-width: calc(100% - 20px);
        .flink-item-name {
          color: var(--anzhiyu-card-bg);
        }
        .flink-item-desc {
          width: 100%;
          overflow: hidden;
          color: var(--anzhiyu-card-bg);
        }
      }
    }
  }

  .link-tag {
    position: absolute;
    top: 0px;
    left: 0px;
    background-color: var(--anzhiyu-blue);
    box-shadow: var(--anzhiyu-shadow-blue);
    color: var(--anzhiyu-white);
    z-index: 1;
    font-size: 0.6rem;
    padding: 4px 8px;
    border-radius: 12px 0px;
    transition: 0.3s;
    overflow: hidden;
  }

  .cf-friends-link {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    border-width: initial;
    border-style: none;
    border-color: initial;
    border-image: initial;
    color: var(--anzhiyu-fontcolor);
    text-decoration: none;
    font-weight: 700;
    padding: 0px 4px;
    border-radius: 4px 4px 0px 0px;

    .flink-avatar {
      min-width: 60px;
      min-height: 60px;
      border-radius: 32px;
      margin: 15px 20px 15px 15px;
      transition: 0.3s;
      background: var(--anzhiyu-background);
      float: left;
      width: 60px;
      height: 60px;
      object-fit: cover;
    }

    .flink-item-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: calc(100% - 90px);
      height: fit-content;
      .flink-item-name {
        text-align: left;
        font-size: 19px;
        line-height: 20px;
        max-width: calc(100% - 12px);
        text-overflow: ellipsis;
        padding: 0px 10px 0px 0px;
        overflow: hidden;
        white-space: nowrap;
        display: block;
        font-weight: 700;
        color: var(--anzhiyu-fontcolor);
      }
      .flink-item-desc {
        color: var(--anzhiyu-fontcolor);
        text-align: left;
        height: 40px;
        text-overflow: ellipsis;
        opacity: 0.7;
        -webkit-box-orient: vertical;
        line-clamp: 2;
        -webkit-line-clamp: 2;
        white-space: normal;
        padding: 5px 10px 16px 0px;
        overflow: hidden;
        font-size: 0.93rem;
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
