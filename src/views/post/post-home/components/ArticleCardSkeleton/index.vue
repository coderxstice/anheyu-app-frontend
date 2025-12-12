<script setup lang="ts">
defineProps({
  isDoubleColumn: {
    type: Boolean,
    default: false
  }
});
</script>

<template>
  <div
    class="article-skeleton"
    :class="{ 'double-column-item': isDoubleColumn }"
  >
    <div class="skeleton-cover">
      <div class="skeleton-shimmer" />
    </div>
    <div class="skeleton-info">
      <div class="skeleton-info-top">
        <div class="skeleton-tips">
          <span class="skeleton-tag skeleton-shimmer" />
          <span class="skeleton-tag skeleton-shimmer" />
        </div>
        <div class="skeleton-title skeleton-shimmer" />
        <div class="skeleton-title-short skeleton-shimmer" />
      </div>
      <div class="skeleton-meta">
        <div class="skeleton-tags">
          <span class="skeleton-meta-tag skeleton-shimmer" />
          <span class="skeleton-meta-tag skeleton-shimmer" />
        </div>
        <span class="skeleton-date skeleton-shimmer" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.article-skeleton {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  margin: 1rem 0;
  overflow: hidden;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;

  &.double-column-item {
    flex-direction: column;
    width: calc(50% - 0.3125rem);
    height: auto;
    margin: 0;

    .skeleton-cover {
      width: 100%;
      height: 225px;
      border-radius: 8px 8px 0 0;
    }

    .skeleton-info {
      width: 100%;
      padding: 18px 32px;
    }
  }
}

.skeleton-cover {
  position: relative;
  flex-shrink: 0;
  width: 45%;
  min-height: 180px;
  overflow: hidden;
  background: var(--anzhiyu-secondbg);
  border-radius: 12px 0 0 12px;
}

.skeleton-info {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  width: 55%;
  min-width: 0;
  padding: 2rem;
}

.skeleton-info-top {
  flex: 1;
}

.skeleton-tips {
  display: flex;
  gap: 8px;
  height: 20px;
  margin-bottom: 0.5rem;
}

.skeleton-tag {
  width: 50px;
  height: 16px;
  border-radius: 4px;
}

.skeleton-title {
  width: 100%;
  height: 24px;
  margin-bottom: 0.5rem;
  border-radius: 4px;
}

.skeleton-title-short {
  width: 60%;
  height: 24px;
  margin-bottom: 1rem;
  border-radius: 4px;
}

.skeleton-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.skeleton-tags {
  display: flex;
  gap: 8px;
}

.skeleton-meta-tag {
  width: 60px;
  height: 18px;
  border-radius: 4px;
}

.skeleton-date {
  width: 80px;
  height: 18px;
  border-radius: 4px;
}

.skeleton-shimmer {
  position: relative;
  overflow: hidden;
  background: var(--anzhiyu-secondbg);

  &::after {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.15),
      transparent
    );
    animation: shimmer 1.5s infinite;
    content: "";
    transform: translateX(-100%);
  }
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (width <= 768px) {
  .article-skeleton,
  .article-skeleton.double-column-item {
    flex-direction: column;
    width: 100%;
    height: auto;

    .skeleton-cover,
    .skeleton-info {
      width: 100%;
    }

    .skeleton-cover {
      height: 200px;
      border-radius: 12px 12px 0 0;
    }

    .skeleton-info {
      padding: 1rem;
    }
  }
}
</style>
