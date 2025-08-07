<script setup lang="ts">
import { ref, computed, onMounted, type PropType } from "vue";

interface AuthorConfig {
  description: string;
  statusImg: string;
  skills: string[];
  social: Record<string, { icon: string; link: string }>;
  userAvatar: string;
  ownerName: string;
  subTitle: string;
}

const props = defineProps({
  config: {
    type: Object as PropType<AuthorConfig>,
    required: true
  }
});

const greetings = ref<string[]>([]);
const currentGreetingIndex = ref(0);

const currentGreeting = computed(() => {
  if (greetings.value.length === 0) return "集中精力，攻克难关";
  return greetings.value[currentGreetingIndex.value];
});

const changeSayHelloText = () => {
  const totalGreetings = greetings.value.length;
  if (totalGreetings <= 1) return;
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * totalGreetings);
  } while (newIndex === currentGreetingIndex.value);
  currentGreetingIndex.value = newIndex;
};

onMounted(() => {
  if (props.config.skills && props.config.skills.length > 0) {
    greetings.value = props.config.skills;
    currentGreetingIndex.value = Math.floor(
      Math.random() * props.config.skills.length
    );
  }
});
</script>

<template>
  <div class="card-widget card-info">
    <div class="card-content">
      <div id="author-info__sayhi" @click="changeSayHelloText">
        {{ currentGreeting }}
      </div>
      <div class="author-info-avatar">
        <img class="avatar-img" :src="config.userAvatar" alt="avatar" />
        <div class="author-status">
          <img class="g-status" :src="config.statusImg" alt="status" />
        </div>
      </div>
      <div class="author-info__description" v-html="config.description" />
      <div class="author-info__bottom-group">
        <router-link class="author-info__bottom-group-left" to="/about">
          <h1 class="author-info__name">{{ config.ownerName }}</h1>
          <div class="author-info__desc">{{ config.subTitle }}</div>
        </router-link>
        <div class="card-info-social-icons">
          <a
            v-for="(social, name) in config.social"
            :key="name"
            class="social-icon"
            :href="social.link"
            rel="external nofollow noreferrer"
            target="_blank"
            :title="name"
          >
            <i class="anzhiyufont" :class="social.icon" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../card.scss";
@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
.card-info {
  padding: 0;
  &:before {
    background: linear-gradient(
      -25deg,
      var(--anzhiyu-main),
      var(--anzhiyu-main-op-deep),
      var(--anzhiyu-main),
      var(--anzhiyu-main-op-deep)
    );
    background-size: 400%;
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    content: "";
    animation: gradient 15s ease infinite;
  }
  .card-content {
    padding: 1rem 1.2rem;
    min-height: 320px;
    position: relative;
  }
  &:hover {
    .author-info-avatar,
    .author-status {
      opacity: 0;
      transform: scale(0);
    }
    .author-info__description {
      opacity: 1;
    }
  }
}
#author-info__sayhi {
  text-align: left;
  color: var(--anzhiyu-white);
  background: var(--anzhiyu-white-op);
  font-size: 12px;
  margin: auto;
  padding: 2px 8px;
  border-radius: 12px;
  width: fit-content;
  cursor: pointer;
  transition: 0.3s;
  user-select: none;
  &:hover {
    background: var(--anzhiyu-card-bg);
    color: var(--anzhiyu-fontcolor);
    transform: scale(1.15);
  }
  &:active {
    transform: scale(0.8);
    opacity: 0.8;
  }
}
.author-info-avatar {
  margin: 45px auto;
  display: flex;
  justify-content: center;
  width: 118px;
  height: 118px;
  transition: cubic-bezier(0.69, 0.39, 0, 1.21) 0.3s;
  transform-origin: bottom;
  position: relative;
  user-select: none;
  .avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
  .author-status {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 33px;
    height: 33px;
    border-radius: 50%;
    background-color: var(--anzhiyu-white);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.3s 0.2s;
    transform: scale(1);
    .g-status {
      width: 26px;
      height: 26px;
      border-radius: 0;
    }
  }
}
.author-info__description {
  position: absolute;
  top: 50px;
  width: 100%;
  left: 0;
  padding: 1rem 1.2rem;
  opacity: 0;
  transition: 0.3s;
  color: var(--anzhiyu-white);
  :deep(div) {
    line-height: 1.38;
    margin: 0.6rem 0;
    text-align: justify;
    color: rgba(255, 255, 255, 0.8);
  }
  :deep(b) {
    color: #fff;
  }
}
.author-info__bottom-group {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
  .author-info__bottom-group-left {
    text-decoration: none;
  }
  .author-info__name {
    text-align: left;
    font-weight: 700;
    color: var(--anzhiyu-white);
    font-size: 20px;
    line-height: 1;
    margin-bottom: 5px;
    margin-top: 0;
  }
  .author-info__desc {
    font-size: 12px;
    color: var(--anzhiyu-white);
    opacity: 0.6;
    line-height: 1;
  }
}
.card-info-social-icons {
  margin: 0;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  cursor: pointer;
  .social-icon {
    margin: 0 0 0 10px;
    color: var(--anzhiyu-fontcolor);
    font-size: 1.4em;
    cursor: pointer;
    display: flex;
    i {
      background: var(--anzhiyu-white-op);
      color: var(--anzhiyu-white);
      font-size: 1rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease 0s;
      padding: 8px;
      border-radius: 32px;
      &:hover {
        background: var(--anzhiyu-secondbg);
        transform: scale(1.1);
        color: var(--anzhiyu-main);
        box-shadow: none;
      }
    }
  }
}
</style>
