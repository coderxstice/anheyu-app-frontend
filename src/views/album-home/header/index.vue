<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { useAlbumStore } from "@/store/modules/album";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";

defineOptions({
  name: "HeaderComponent"
});
const router = useRouter();
const siteConfigStore = useSiteConfigStore();

const albumStore = useAlbumStore();
const { sortOrder, categoryId, categories } = storeToRefs(albumStore);

// 当前打开的下拉菜单
const activeDropdown = ref<string | null>(null);

// 计算属性，从 Pinia Store 获取站点配置
const siteConfig = computed(() => siteConfigStore.getSiteConfig);

// 动态获取网站名称
const siteName = computed(() => siteConfig.value?.APP_NAME || "安和鱼");

// 动态获取关于链接
const aboutLink = computed(() => siteConfig.value?.ABOUT_LINK || "#");

// 动态获取 ICP 备案号
const icpNumber = computed(() => siteConfig.value?.ICP_NUMBER || "");

// 动态获取公安联网备案号
const policeRecordNumber = computed(
  () => siteConfig.value?.POLICE_RECORD_NUMBER || ""
);

// 动态获取公安联网备案图标
const policeRecordIcon = computed(
  () => siteConfig.value?.POLICE_RECORD_ICON || ""
);

// 前往首页
const goHome = () => {
  router.push("/");
};

// 切换下拉菜单
const toggleDropdown = (event: Event, name: string) => {
  event.stopPropagation();
  activeDropdown.value = activeDropdown.value === name ? null : name;
};

// 关闭所有下拉菜单
const closeDropdowns = () => {
  activeDropdown.value = null;
};

// 点击外部关闭下拉菜单
const handleClickOutside = () => {
  closeDropdowns();
};

const handleSortChange = (newOrder: string) => {
  albumStore.setSortOrder(newOrder);
  closeDropdowns();
};

const handleCategoryChange = (newCategoryId: number | null) => {
  albumStore.setCategoryId(newCategoryId);
  closeDropdowns();
};

// 组件挂载时获取分类列表
onMounted(() => {
  albumStore.fetchCategories();
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <header id="header">
    <div class="header-left" @click="goHome">
      <a style="cursor: pointer">
        <img
          class="site-logo"
          :src="
            siteConfig?.USER_AVATAR ||
            'https://npm.elemecdn.com/anzhiyu-blog-static@1.0.4/img/avatar.jpg'
          "
          alt="网站Logo"
        />
      </a>
      <h1>
        <a style="cursor: pointer">
          <strong class="site-name">{{ siteName }}</strong>
        </a>
      </h1>
    </div>
    <nav>
      <ul class="nav_links">
        <li
          v-if="categories.length > 0"
          class="nav-item nav-dropdown"
          :class="{ 'is-open': activeDropdown === 'category' }"
          @click.stop
        >
          <a
            class="dropdown-trigger"
            @click="toggleDropdown($event, 'category')"
          >
            分类
          </a>
          <div class="nav-item-child" @click.stop>
            <ul>
              <li class="mb-1 category-parent category-level-0">
                <a
                  :class="{ active: categoryId === null }"
                  @click="handleCategoryChange(null)"
                  >全部
                </a>
              </li>
              <li
                v-for="category in categories"
                :key="category.id"
                class="mb-1 category-parent category-level-0"
              >
                <a
                  :class="{ active: categoryId === category.id }"
                  @click="handleCategoryChange(category.id)"
                  >{{ category.name }}
                </a>
              </li>
            </ul>
          </div>
        </li>
        <li
          class="nav-item nav-dropdown"
          :class="{ 'is-open': activeDropdown === 'sort' }"
          @click.stop
        >
          <a class="dropdown-trigger" @click="toggleDropdown($event, 'sort')">
            排序
          </a>
          <div class="nav-item-child" @click.stop>
            <ul>
              <li class="mb-1 category-parent category-level-0">
                <a
                  :class="{ active: sortOrder === 'display_order_asc' }"
                  @click="handleSortChange('display_order_asc')"
                  >默认排序
                </a>
              </li>
              <li class="category-parent category-level-0">
                <a
                  :class="{ active: sortOrder === 'created_at_desc' }"
                  @click="handleSortChange('created_at_desc')"
                  >最新发布
                </a>
              </li>
              <li class="category-parent category-level-0">
                <a
                  :class="{ active: sortOrder === 'view_count_desc' }"
                  @click="handleSortChange('view_count_desc')"
                  >热度排序</a
                >
              </li>
            </ul>
          </div>
        </li>
        <li class="nav-item nav-about">
          <a style="cursor: pointer" :href="aboutLink" target="_blank">关于</a>
        </li>
        <li v-if="icpNumber" class="nav-item nav-icp">
          <a
            class="footer-bar-link"
            target="_blank"
            rel="noopener external nofollow noreferrer"
            href="https://beian.miit.gov.cn/"
            :title="icpNumber"
            >{{ icpNumber }}
          </a>
        </li>
        <li v-if="policeRecordNumber" class="nav-item nav-police">
          <a
            class="footer-bar-link police-record-link"
            target="_blank"
            rel="noopener external nofollow noreferrer"
            href="http://www.beian.gov.cn/portal/registerSystemInfo"
            :title="policeRecordNumber"
          >
            <img
              v-if="policeRecordIcon"
              :src="policeRecordIcon"
              alt="公安备案"
              class="police-record-icon"
            />
            {{ policeRecordNumber }}
          </a>
        </li>
      </ul>
    </nav>
  </header>
</template>

<style lang="scss" scoped>
/* 关键帧动画 */
@keyframes header-slide-up {
  to {
    transform: translateY(0);
  }
}

@keyframes header-fade-in {
  to {
    opacity: 1;
  }
}

#header {
  position: fixed;
  top: calc(100vh - 80px);
  left: 0;
  z-index: 10002;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 80px;
  padding: 0 1.5em;
  line-height: 1;
  user-select: none;

  /* 基础样式 */
  background: rgb(18 18 18 / 80%);
  backdrop-filter: saturate(180%) blur(20px);
  opacity: 0;

  /* 过渡效果（用于其他交互） */
  transition: transform 1s ease;

  /* 初始状态 */
  transform: translateY(4em);

  /* 动画效果 */
  animation:
    header-slide-up 0.8s ease-out 1s forwards,
    header-fade-in 0.6s ease-in 1s forwards;

  /* 减少运动设置 */
  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: translateY(0);
    animation: none;
  }

  .header-left {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    cursor: pointer;
  }

  h1 {
    display: flex;
    align-items: center;
    height: 4em;
    margin: 0;
    font-size: 1em;
    line-height: 4.5em;
    color: #a0a0a1;
    vertical-align: middle;

    a {
      line-height: 1;
      color: inherit;
      border: 0;

      &:hover {
        color: inherit !important;
      }
    }
  }

  nav {
    flex: 1;
    min-width: 0;
    margin-left: auto;

    > ul {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;
      justify-content: flex-end;
      padding: 0;
      margin: 0;
      list-style: none;

      > li {
        position: relative;
        display: flex;
        justify-content: center;
        padding: 0;
        list-style-type: none;

        &.nav-item {
          .nav-item-child {
            position: absolute;
            bottom: 64px;
            display: flex;
            flex-direction: column;
            align-items: center;
            height: fit-content;
            padding: 8px;
            margin-bottom: 0;
            pointer-events: none;
            background: rgb(0 0 0 / 60%);
            backdrop-filter: blur(10px);
            border-radius: 8px;
            opacity: 0;
            transition: 0.3s;

            > ul {
              padding-left: 0;
            }

            &::before {
              position: absolute;
              bottom: -40px;
              left: 0;
              width: 100%;
              height: 40px;
              content: "";
            }
          }

          /* PC端 hover 触发 */
          @media (hover: hover) {
            &:hover {
              .nav-item-child {
                display: flex;
                pointer-events: all;
                opacity: 1;
              }

              > a {
                background: #ffffff1e;
              }
            }
          }

          /* 点击展开状态（移动端 + PC端点击） */
          &.is-open {
            .nav-item-child {
              display: flex;
              pointer-events: all;
              opacity: 1;
            }

            > a {
              background: #ffffff1e;
            }
          }

          .category-parent {
            font-size: 14px;
            border-radius: 8px;
            transition: 0.3s;

            &:hover {
              background: #0d00ff;
            }

            &.category-level-0 {
              width: 100%;
              text-align: center;

              a {
                width: 100%;
                text-align: center;
              }
            }
          }
        }

        a {
          display: inline-block;
          padding: 8px 16px;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          white-space: nowrap;
          cursor: pointer;
          border: 0;
          border-radius: 8px;
          transition: background-color 0.5s ease;

          &.dropdown-trigger {
            user-select: none;
          }

          &.icon {
            &::before {
              float: right;
              margin-left: 0.75em;
              color: #505051;
            }
          }

          &:hover {
            color: #fff !important;
            background: #ffffff1e;
          }

          &.active {
            background-color: #30343f;
          }
        }
      }
    }
  }

  .discription {
    margin-left: 8px;
  }

  .site-logo {
    width: 30px;
    height: 30px;
    margin-right: 1rem;
    border-radius: 20px;
  }

  .site-name {
    color: #fff;
  }

  .police-record-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    .police-record-icon {
      width: 14px;
      height: 14px;
      object-fit: contain;
    }
  }

  /* 平板适配 (768px - 1024px) */
  @media screen and (width <= 1024px) {
    padding: 0 1em;

    nav > ul > li a {
      padding: 8px 10px;
      font-size: 0.85em;
    }

    .nav-icp,
    .nav-police {
      display: none;
    }
  }

  /* 手机适配 (< 768px) */
  @media screen and (width <= 768px) {
    top: 0;
    bottom: auto;
    height: 56px;
    padding: 0 12px;
    transform: translateY(0);
    animation:
      header-slide-up 0.6s ease-out 0.5s forwards,
      header-fade-in 0.4s ease-in 0.5s forwards;

    .header-left {
      flex-shrink: 0;
    }

    .site-logo {
      width: 32px;
      height: 32px;
      margin-right: 8px;
    }

    h1 {
      display: none !important;
    }

    nav {
      flex: 1;
      overflow: visible;

      > ul {
        gap: 4px;
        justify-content: flex-end;

        > li {
          &.nav-item {
            .nav-item-child {
              bottom: auto;
              top: 46px;

              &::before {
                top: -40px;
                bottom: auto;
              }
            }
          }

          a {
            padding: 8px 14px;
            font-size: 0.9em;
            letter-spacing: 0.05em;
          }
        }
      }
    }

    .nav-about {
      display: none;
    }

    .nav-icp,
    .nav-police {
      display: none;
    }
  }

  /* 超小屏幕适配 (< 480px) */
  @media screen and (width <= 480px) {
    height: 50px;
    padding: 0 10px;

    .site-logo {
      width: 28px;
      height: 28px;
      margin-right: 6px;
    }

    nav > ul {
      gap: 2px;

      > li a {
        padding: 6px 12px;
        font-size: 0.85em;
      }
    }
  }
}
</style>
