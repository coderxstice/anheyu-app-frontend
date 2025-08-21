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
  position: absolute;
  right: 0;
  z-index: 102;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
  padding-right: 1.5rem;

  .nav-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 35px;
    height: 35px;
    padding: 0;
    margin-left: 1rem;
    cursor: pointer;
    border-radius: 50px;
    transition: 0.3s;

    i {
      font-size: 1.2rem;
      font-weight: 700;
      transition: color 0.3s;
    }

    &:not(.nav-totop):hover {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-lighttext);
    }
  }

  .nav-totop {
    width: 0;
    margin-left: 0;
    transition: all 0.3s ease-in-out;
    transform: scale(0);
    transform-origin: right center;

    &.is-visible {
      width: 25px;
      margin-left: 1rem;
      opacity: 1;
      transform: scale(1);
    }

    &.is-visible.long {
      width: 80px;
      margin-left: 0;

      .totopbtn {
        width: 70px;
      }
    }

    .totopbtn {
      position: absolute;
      top: 5px;
      right: 5px;
      width: 25px;
      height: 25px;
      color: var(--anzhiyu-card-bg);
      background: var(--anzhiyu-fontcolor);
      border-radius: 40px;
      transition: 0.3s;

      i,
      .percent {
        position: absolute;
        top: 50%;
        left: 50%;
        transition: all 0.3s;
        transform: translate(-50%, -50%);
      }

      i {
        opacity: 0;
      }

      .percent {
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
        opacity: 1;
      }
    }

    &:not(.long):hover {
      .totopbtn {
        top: 0;
        right: 0;
        width: 35px;
        height: 35px;
        background: var(--anzhiyu-lighttext);

        i {
          color: var(--anzhiyu-card-bg);
          opacity: 1;
          transition: 0.3s;
        }
      }

      .totopbtn .percent {
        opacity: 0;
      }
    }

    &.long:hover {
      transform: scale(1);

      .totopbtn {
        background: var(--anzhiyu-lighttext);
      }

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

@media (width <= 768px) {
  .header-right {
    padding: 0 1.2rem;
  }
}
</style>
