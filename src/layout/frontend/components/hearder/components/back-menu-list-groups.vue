<script setup lang="ts">
defineOptions({
  name: "BackMenuListGroups"
});

const props = defineProps<{
  navConfig: {
    enable: boolean;
    menu: Array<{
      title: string;
      items: Array<{
        name: string;
        link: string;
        icon: string;
      }>;
    }>;
  };
}>();
</script>

<template>
  <div v-if="navConfig?.menu.length > 0" class="back-home-button">
    <i class="anzhiyufont anzhiyu-icon-grip-vertical" />
    <div class="back-menu-list-groups">
      <div
        v-for="group in navConfig.menu"
        :key="group.title"
        class="back-menu-list-group"
      >
        <div class="back-menu-list-title">{{ group.title }}</div>
        <div class="back-menu-list">
          <a
            v-for="item in group.items"
            :key="item.name"
            class="back-menu-item"
            :href="item.link"
            :title="item.name"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              class="back-menu-item-icon"
              :src="item.icon"
              :alt="item.name"
            />
            <span class="back-menu-item-text">{{ item.name }}</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.back-home-button {
  position: relative;
  display: flex;
  width: 35px;
  height: 35px;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;

  > i {
    font-size: 1.2rem;
  }

  &:hover {
    background: var(--anzhiyu-main);
    color: var(--anzhiyu-white);
    box-shadow: var(--anzhiyu-shadow-main);

    .back-menu-list-groups {
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
    }
  }
}

.back-menu-list-groups {
  position: absolute;
  top: 55px;
  left: 0;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  background-color: var(--anzhiyu-maskbgdeep);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);
  backdrop-filter: blur(20px);
  opacity: 0;
  pointer-events: none;
  transform: scale(0.8);
  transform-origin: top left;
  transition: 0.2s;
  z-index: 10;
}

.back-menu-list-group {
  display: flex;
  flex-direction: column;

  &:hover .back-menu-list-title {
    color: var(--anzhiyu-main);
  }
}

.back-menu-list-title {
  margin: 8px 0 4px 12px;
  font-size: 12px;
  color: var(--anzhiyu-secondtext);
  transition: 0.3s;
}

.back-menu-list {
  display: flex;
  flex-wrap: wrap;
  width: 340px;
  margin-bottom: 8px;
  &:before {
    position: absolute;
    top: -24px;
    left: 0;
    width: 100%;
    height: 25px;
    content: "";
    transition: 0s;
  }
}

.back-menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 162px;
  margin: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  transition: 0.2s;

  &:hover {
    background-color: var(--anzhiyu-main);

    .back-menu-item-text {
      color: var(--anzhiyu-white);
    }
  }
}

.back-menu-item-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--anzhiyu-secondbg);
}

.back-menu-item-text {
  font-size: var(--global-font-size);
  color: var(--anzhiyu-fontcolor);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  transition: 0.2s;
}
@media (max-width: 768px) {
  .back-home-button {
    display: none;
  }
}
</style>
