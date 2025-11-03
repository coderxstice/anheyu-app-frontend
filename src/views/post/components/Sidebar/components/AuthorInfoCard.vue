<script setup lang="ts">
import { ref, computed, onMounted, type PropType } from "vue";
import { ElTooltip } from "element-plus";
import { useUserStoreHook } from "@/store/modules/user";
import { storeToRefs } from "pinia";

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

const userStore = useUserStoreHook();
const { nickname, id } = storeToRefs(userStore);

const greetings = ref<string[]>([]);
const currentGreetingIndex = ref(0);
const showSkill = ref(false); // 控制是否显示技能标签

// 用户问候语（仅登录用户）
const userGreeting = computed(() => {
  // 如果没有用户昵称，返回空（不应该被调用）
  if (!nickname.value || nickname.value.trim() === "") {
    return "";
  }

  // 检查上次问候时间
  const lastGreetingTime = localStorage.getItem(`lastGreeting_${id.value}`);
  const now = Date.now();

  if (lastGreetingTime) {
    const timeDiff = now - parseInt(lastGreetingTime);
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // 如果距离上次问候超过24小时，显示"好久不见"
    if (hoursDiff > 24) {
      return `好久不见，${nickname.value}`;
    } else {
      // 24小时内，显示"欢迎再次回来"
      return `欢迎再次回来，${nickname.value}`;
    }
  } else {
    // 第一次访问，显示"欢迎光临"
    return `欢迎光临，${nickname.value}`;
  }
});

const currentGreeting = computed(() => {
  if (greetings.value.length === 0) return "集中精力，攻克难关";
  return greetings.value[currentGreetingIndex.value];
});

// 显示的内容：有昵称时默认显示问候语，无昵称直接显示技能标签
const displayGreeting = computed(() => {
  // 如果没有昵称，直接显示技能标签
  if (!nickname.value || nickname.value.trim() === "") {
    return currentGreeting.value;
  }

  // 有昵称时，根据 showSkill 状态决定显示问候语还是技能标签
  if (!showSkill.value) {
    return userGreeting.value;
  }
  return currentGreeting.value;
});

const changeSayHelloText = () => {
  if (!showSkill.value) {
    // 第一次点击，切换到显示技能
    showSkill.value = true;
    return;
  }

  // 已经在显示技能，切换到下一个技能
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

  // 更新用户的最后问候时间
  if (id.value) {
    localStorage.setItem(`lastGreeting_${id.value}`, Date.now().toString());
  }
});
</script>

<template>
  <div class="card-widget card-info">
    <div class="card-content">
      <div id="author-info__sayhi" @click="changeSayHelloText">
        {{ displayGreeting }}
      </div>
      <div class="author-info-avatar">
        <img
          class="avatar-img"
          :src="config.userAvatar"
          alt="avatar"
          width="118"
          height="118"
          loading="lazy"
        />
        <div class="author-status">
          <img
            class="g-status"
            :src="config.statusImg"
            alt="status"
            width="26"
            height="26"
            loading="lazy"
          />
        </div>
      </div>
      <div class="author-info__description" v-html="config.description" />
      <div class="author-info__bottom-group">
        <router-link class="author-info__bottom-group-left" to="/about">
          <h1 class="author-info__name">{{ config.ownerName }}</h1>
          <div class="author-info__desc">{{ config.subTitle }}</div>
        </router-link>
        <div class="card-info-social-icons">
          <el-tooltip
            v-for="(social, name) in config.social"
            :key="name"
            :content="name"
            placement="top"
            :show-arrow="false"
          >
            <a
              class="social-icon"
              :href="social.link"
              rel="external nofollow noreferrer"
              target="_blank"
            >
              <i class="anzhiyufont" :class="social.icon" />
            </a>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
  border: none;
  /* 预留固定高度，防止布局偏移 */
  contain: layout;

  &::before {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: "";
    background: linear-gradient(
      -25deg,
      var(--anzhiyu-main),
      var(--anzhiyu-main-op-deep),
      var(--anzhiyu-main),
      var(--anzhiyu-main-op-deep)
    );
    background-size: 400%;
    /* 延迟动画启动，避免初始渲染时的性能影响 */
    animation: gradient 15s ease infinite;
    will-change: background-position;
  }

  .card-content {
    position: relative;
    /* 固定最小高度，防止内容加载时的布局偏移 */
    min-height: 320px;
    height: 320px;
    padding: 1rem 1.2rem;
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
  width: fit-content;
  padding: 2px 8px;
  margin: auto;
  font-size: 12px;
  color: var(--anzhiyu-white);
  text-align: left;
  cursor: pointer;
  user-select: none;
  background: var(--anzhiyu-white-op);
  border-radius: 12px;
  transition: 0.3s;

  &:hover {
    color: var(--anzhiyu-fontcolor);
    background: var(--anzhiyu-card-bg);
    transform: scale(1.15);
  }

  &:active {
    opacity: 0.8;
    transform: scale(0.8);
  }
}

.author-info-avatar {
  position: relative;
  display: flex;
  justify-content: center;
  width: 118px;
  height: 118px;
  margin: 45px auto;
  user-select: none;
  transition: cubic-bezier(0.69, 0.39, 0, 1.21) 0.3s;
  transform-origin: bottom;

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: var(--style-border-avatar);
    border-radius: 50%;
    /* 图片加载过渡效果 */
    opacity: 0;
    background: var(--anzhiyu-secondbg);
    transition: opacity 0.6s ease;

    /* 图片加载完成后显示 */
    &[src] {
      animation: avatarFadeIn 0.6s ease forwards;
    }
  }

  @keyframes avatarFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .author-status {
    position: absolute;
    right: 2px;
    bottom: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 33px;
    height: 33px;
    overflow: hidden;
    background-color: var(--anzhiyu-white);
    border-radius: 50%;
    transition: 0.3s 0.2s;
    transform: scale(1);

    .g-status {
      width: 26px;
      height: 26px;
      border-radius: 0;
      /* 图片加载过渡效果 */
      opacity: 0;
      transition: opacity 0.6s ease;

      /* 图片加载完成后显示 */
      &[src] {
        animation: statusFadeIn 0.6s ease 0.2s forwards;
      }
    }

    @keyframes statusFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  }
}

.author-info__description {
  position: absolute;
  top: 50px;
  left: 0;
  width: 100%;
  padding: 1rem 1.2rem;
  color: var(--anzhiyu-white);
  opacity: 0;
  transition: 0.3s;

  :deep(div) {
    margin: 0.6rem 0;
    line-height: 1.38;
    color: rgb(255 255 255 / 80%);
    text-align: justify;
  }

  :deep(b) {
    color: #fff;
  }
}

.author-info__bottom-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .author-info__bottom-group-left {
    text-decoration: none;
  }

  .author-info__name {
    margin-top: 0;
    margin-bottom: 5px;
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
    color: var(--anzhiyu-white);
    text-align: left;
  }

  .author-info__desc {
    font-size: 12px;
    line-height: 1;
    color: var(--anzhiyu-white);
    opacity: 0.6;
  }
}

.card-info-social-icons {
  display: flex;
  flex-flow: row wrap;
  margin: 0;
  cursor: pointer;
  min-width: 100px;

  .social-icon {
    display: flex;
    margin: 0 0 0 10px;
    font-size: 1.4em;
    color: var(--anzhiyu-fontcolor);
    cursor: pointer;

    i {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 8px;
      font-size: 1rem;
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-white-op);
      border-radius: 32px;
      transition: all 0.3s ease 0s;

      &:hover {
        color: var(--anzhiyu-main);
        background: var(--anzhiyu-secondbg);
        box-shadow: none;
        transform: scale(1.1);
      }
    }
  }
}
</style>
