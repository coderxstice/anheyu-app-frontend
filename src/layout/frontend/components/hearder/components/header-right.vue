<template>
  <div class="header-right">
    <el-tooltip
      v-if="navConfig?.travelling"
      content="随机前往一个开往项目网站"
      placement="top"
      :show-arrow="false"
      :offset="8"
    >
      <a class="nav-button" @click="handleTravelClick">
        <i class="anzhiyufont anzhiyu-icon-train" />
      </a>
    </el-tooltip>
    <el-tooltip
      content="随机前往一个文章"
      placement="top"
      :show-arrow="false"
      :offset="8"
    >
      <div
        class="nav-button"
        @click.prevent="articleStore.navigateToRandomArticle()"
      >
        <i class="anzhiyufont anzhiyu-icon-dice" />
      </div>
    </el-tooltip>
    <el-tooltip content="搜索" placement="top" :show-arrow="false" :offset="8">
      <a class="nav-button">
        <i class="anzhiyufont anzhiyu-icon-magnifying-glass" />
      </a>
    </el-tooltip>

    <div
      class="nav-button nav-totop"
      :class="{ 'is-visible': showToTopButton, long: isFooterVisible }"
      @click="scrollToTop"
    >
      <div class="totopbtn">
        <i class="anzhiyufont anzhiyu-icon-arrow-up" />
        <span class="percent">{{ toTopText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from "vue";
import { useSnackbar } from "@/composables/useSnackbar";
import { useArticleStore } from "@/store/modules/articleStore";

defineOptions({
  name: "HeaderRight"
});

const props = defineProps({
  navConfig: {
    type: Object as PropType<any>,
    required: false
  },
  isTransparent: {
    type: Boolean,
    default: true
  },
  scrollPercent: {
    type: Number,
    default: 0
  },
  isFooterVisible: {
    type: Boolean,
    default: false
  }
});

const articleStore = useArticleStore();
const { showSnackbar } = useSnackbar();

let travellingsTimer: ReturnType<typeof setTimeout> | null = null;
const handleTravelClick = () => {
  if (travellingsTimer) {
    clearTimeout(travellingsTimer);
  }
  const cancelAction = () => {
    if (travellingsTimer) {
      clearTimeout(travellingsTimer);
      showSnackbar("跳转已取消");
    }
  };
  showSnackbar(
    "即将跳转到「开往」项目的成员博客，不保证跳转网站的安全性和可用性",
    cancelAction,
    5000,
    "取消"
  );
  travellingsTimer = setTimeout(() => {
    window.open("https://www.travellings.cn/go.html", "_blank");
  }, 5000);
};

const showToTopButton = computed(() => !props.isTransparent);
const toTopText = computed(() => {
  if (props.isFooterVisible) {
    return "返回顶部";
  }
  return `${props.scrollPercent}`;
});
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};
</script>

<style scoped lang="scss">
.header-right {
  z-index: 102;
  position: absolute;
  right: 0;
  display: flex;
  flex-direction: row;
  height: 100%;
  align-items: center;
  padding-right: 1.5rem;

  .nav-button {
    margin-left: 1rem;
    padding: 0;
    border-radius: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.3s;
    height: 35px;
    width: 35px;
    cursor: pointer;
    i {
      font-size: 1.2rem;
      transition: color 0.3s;
      font-weight: 700;
    }

    &:not(.nav-totop):hover {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-lighttext);
    }
  }

  .nav-totop {
    width: 0;
    transform: scale(0);
    transform-origin: right center;
    margin-left: 0;
    transition: all 0.3s ease-in-out;

    &.is-visible {
      width: 25px;
      margin-left: 1rem;
      transform: scale(1);
      opacity: 1;
    }

    &.is-visible.long {
      width: 80px;
      margin-left: 0rem;
      .totopbtn {
        width: 70px;
      }
    }

    .totopbtn {
      width: 25px;
      height: 25px;
      border-radius: 40px;
      background: var(--anzhiyu-fontcolor);
      color: var(--anzhiyu-card-bg);
      position: absolute;
      top: 5px;
      right: 5px;
      transition: 0.3s;

      i,
      .percent {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        transition: all 0.3s;
      }

      i {
        opacity: 0;
      }

      .percent {
        opacity: 1;
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
      }
    }

    &:not(.long):hover {
      .totopbtn {
        background: var(--anzhiyu-lighttext);
        width: 35px;
        height: 35px;
        top: 0;
        right: 0;
        i {
          opacity: 1;
          color: var(--anzhiyu-card-bg);
          transition: 0.3s;
        }
      }
      .totopbtn .percent {
        opacity: 0;
      }
    }

    &.long:hover {
      .totopbtn {
        background: var(--anzhiyu-lighttext);
      }
      transform: scale(1);
      .totopbtn i {
        opacity: 1;
      }
      .totopbtn .percent {
        opacity: 0;
        transform: translate(-50%, -50%) scale(1.5);
      }
    }
  }
}
</style>
