<template>
  <header v-if="headerConfig" class="frontend-header">
    <div class="header-wrapper">
      <div class="header-content">
        <div class="header-left">
          <BackMenuListGroups :navConfig="navConfig" />

          <router-link to="/" class="site-name-link" accesskey="h">
            <el-tooltip content="返回主页" placement="bottom">
              <anzhiyu>
                <span class="site-title">{{ siteName }}</span>
                <i class="anzhiyufont anzhiyu-icon-house-chimney" />
              </anzhiyu>
            </el-tooltip>
          </router-link>
        </div>

        <div class="page-name-mask">
          <div class="page-name-container">
            <span class="page-name">{{ siteConfig.APP_NAME }}</span>
          </div>
        </div>

        <nav class="main-nav">
          <div class="menus-items">
            <div
              v-for="menuGroup in menuConfig"
              :key="menuGroup.title"
              class="menus-item"
            >
              <div class="menu-title">
                <span>{{ menuGroup.title }}</span>
              </div>
              <ul class="menus-item-child">
                <li v-for="item in menuGroup.items" :key="item.path">
                  <a
                    v-if="item.isExternal"
                    :href="item.path"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="site-page"
                  >
                    <i :class="['anzhiyufont', item.icon]" />
                    <span>{{ item.title }}</span>
                  </a>
                  <router-link v-else :to="item.path" class="site-page">
                    <i :class="['anzhiyufont', item.icon]" />
                    <span>{{ item.title }}</span>
                  </router-link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <HeaderRight :navConfig="navConfig" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import BackMenuListGroups from "./components/back-menu-list-groups.vue";
import HeaderRight from "./components/header-right.vue";

const siteConfigStore = useSiteConfigStore();
const siteConfig = computed(() => siteConfigStore.getSiteConfig);

const headerConfig = computed(() => siteConfig.value?.header);
const navConfig = computed(() => headerConfig.value?.nav);
const menuConfig = computed(() => headerConfig.value?.menu);
const siteName = computed(() => siteConfig.value?.APP_NAME || "安和鱼");
</script>

<style scoped lang="scss">
.frontend-header {
  height: 60px;
  width: 100%;
  font-size: 1rem;
  position: relative;

  a {
    text-decoration: none;
    color: var(--anzhiyu-fontcolor);
    transition: color 0.3s;
    &:hover {
      color: var(--anzhiyu-main);
    }
  }

  .header-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    top: 0;
    z-index: 1000;
    transition: background-color 0.3s;
    outline: 1px solid var(--anzhiyu-card-border);
    position: fixed;
    background-color: var(--anzhiyu-card-bg);
    .header-content {
      max-width: 1400px;
      width: 100%;
      display: flex;
      position: relative;
      padding: 0 1.5rem;
      align-items: center;
      .header-left {
        display: flex;
        align-items: center;
        flex-wrap: nowrap;
        height: 60px;
        transition: 0.3s;
        z-index: 102;
        .site-name-link {
          border-radius: 50px;
          white-space: nowrap;
          overflow: hidden;

          padding: 0 2px;
          height: 35px;
          line-height: 35px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.3s;
          i {
            position: absolute;
            transition: 0.3s;
            opacity: 0;
            font-weight: 700;
            left: 50%;
            transform: translateX(-50%);
          }
          &:hover {
            color: var(--anzhiyu-white);
            background: var(--anzhiyu-main);
            box-shadow: var(--anzhiyu-shadow-main);

            i {
              opacity: 1;
              color: var(--anzhiyu-white);
              filter: none;
            }

            .site-title {
              opacity: 0;
            }
          }
          .site-title {
            letter-spacing: normal;
            font-size: 1.2rem;
            padding: 0 5px;
            line-height: 2rem;
            font-weight: 700;
            cursor: pointer;
            transition:
              all 0.3s,
              color 0s,
              opacity 0.3s;
          }
        }
      }
      .page-name-mask {
        width: 100%;
        height: 100%;
        position: absolute;
        overflow: hidden;
        left: 0;
        .page-name-container {
          align-items: center;
          display: flex;
          border-radius: 12px;
          height: 40px;
          position: absolute;
          top: 62px;
          left: 0;
          right: 0;
          margin: auto;
          justify-content: center;
          animation-timing-function: ease-out;
          .page-name {
            display: inline;
            font-weight: 700;
            padding: 4px 8px;
            opacity: 0;
            filter: alpha(opacity=0);
            transition: 0.1s;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            position: relative;
            text-align: center;
            cursor: pointer;
            top: 0;
            font-size: 1.1rem;
            animation-timing-function: ease-in;
          }
        }
      }
      .main-nav {
        display: flex;
        justify-content: center;
        width: 100%;
        position: absolute;
        height: 60px;
        left: 0;
        margin: 0;
        transform: translateZ(0);
        align-items: center;
        .menus-items {
          position: relative;
          width: fit-content;
          text-align: center;
          left: 0;
          right: 0;
          top: 0;
          display: flex;
          flex-direction: row;
          justify-content: center;
          .menus-item {
            padding: 0 0.4rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: auto;
            position: relative;
            border-radius: 30px;
            &:first-child .menus-item-child::after {
              position: absolute;
              top: -60px;
              left: 0;
              width: 50%;
              height: 60px;
              content: "";
            }

            &:last-child .menus-item-child::after {
              position: absolute;
              top: -60px;
              right: 0;
              width: 50%;
              height: 60px;
              content: "";
            }
            .menu-title {
              letter-spacing: 0.3rem;
              font-weight: 700;
              padding: 0 0.8em 0 1em;
              height: 35px;
              line-height: 35px;
              transition: color 0s !important;
              font-size: 1rem;
              cursor: pointer;
              border-radius: 50px;
            }

            .menus-item-child {
              position: absolute;
              opacity: 0;
              filter: alpha(opacity=0);
              width: max-content;
              border-radius: 5px;
              top: 35px;
              box-shadow: var(--anzhiyu-shadow-black);
              border: var(--style-border);
              transition: 0.2s;
              background-color: var(--anzhiyu-card-bg);
              border-radius: 50px;
              right: auto;
              left: auto;
              padding: 6px 4px;
              box-sizing: content-box;
              line-height: 35px;
              transform: translateY(-10px) scale(0);
              transform-origin: top;
              pointer-events: none;
              margin-top: 8px;
              li {
                border-radius: 50px;
                transition: all 0.3s;
                display: inline-block;
                margin: 0 3px;
                a {
                  padding: 2px 16px;
                }
              }
              &:before {
                position: absolute;
                top: -12px;
                left: 0;
                width: 100%;
                height: 16px;
                content: "";
              }

              .site-page {
                letter-spacing: 0;
                display: flex;
                align-items: center;
                border-radius: 100px;
                padding: 0.3rem 0.8rem;
                color: var(--anzhiyu-fontcolor);
                text-shadow: none;
                transition: 0.3s;
                &:hover {
                  background: var(--anzhiyu-lighttext);
                  color: var(--anzhiyu-card-bg);
                  box-shadow: var(--anzhiyu-shadow-main);
                  margin: 0 auto;
                  transform: scale(1);
                  padding: 0.3rem 1rem;
                }
                i {
                  font-size: 0.9rem;
                  line-height: 1;
                  margin-right: 6px;
                  line-height: 35px;
                }
              }
            }
            &:hover {
              .menu-title {
                color: var(--anzhiyu-white) !important;
                background: var(--anzhiyu-main);
                box-shadow: var(--anzhiyu-shadow-main);
              }
              .menus-item-child {
                border: var(--style-border-hover);
                box-shadow: var(--anzhiyu-shadow-main);
                opacity: 1;
                filter: none;
                pointer-events: all;
                transform: translateY(0) scale(1);
              }
            }
          }
        }
      }
    }
  }
}

#toggle-menu {
  display: block;
  font-size: 1.2rem;
  @media (min-width: 992px) {
    display: none;
  }
}
</style>
