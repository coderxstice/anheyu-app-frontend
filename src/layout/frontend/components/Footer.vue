<template>
  <footer v-if="siteConfig" class="footer-container">
    <div class="footer-wrap">
      <div v-if="footerConfig.socialBar" class="footer-social-bar">
        <el-tooltip
          v-for="item in footerConfig.socialBar.left"
          :key="item.link"
          :content="item.title"
          placement="top"
          :show-arrow="false"
          :offset="12"
          popper-class="custom-tooltip"
          :transition-props="{ onEnter, onLeave }"
        >
          <a
            class="social-link"
            :href="item.link"
            target="_blank"
            rel="noopener external nofollow noreferrer"
          >
            <i :class="getIconClass(item.icon)" />
          </a>
        </el-tooltip>
        <el-tooltip
          content="返回顶部"
          placement="top"
          :show-arrow="false"
          :offset="12"
          popper-class="custom-tooltip"
          :transition-props="{ onEnter, onLeave }"
        >
          <img
            v-if="footerConfig.socialBar.centerImg"
            class="footer-back-to-top"
            alt="返回顶部"
            :src="footerConfig.socialBar.centerImg"
            @click="scrollToTop"
          />
        </el-tooltip>
        <el-tooltip
          v-for="item in footerConfig.socialBar.right"
          :key="item.link"
          :content="item.title"
          placement="top"
          :show-arrow="false"
          :offset="12"
          popper-class="custom-tooltip"
          :transition-props="{ onEnter, onLeave }"
        >
          <a
            class="social-link"
            :href="item.link"
            target="_blank"
            rel="noopener external nofollow noreferrer"
          >
            <i :class="getIconClass(item.icon)" />
          </a>
        </el-tooltip>
      </div>

      <div v-if="footerConfig.list?.project?.length" class="footer-link-grid">
        <div
          v-for="group in footerConfig.list.project"
          :key="group.title"
          class="footer-group"
        >
          <div class="footer-title">{{ group.title }}</div>
          <div class="footer-links">
            <a
              v-for="link in group.links"
              :key="link.link"
              class="footer-item"
              :href="link.link"
              :title="link.title"
              target="_blank"
              rel="noopener"
            >
              {{ link.title }}
            </a>
          </div>
        </div>

        <div v-if="footerConfig.list.randomFriends > 0" class="footer-group">
          <div class="footer-title-group">
            <div class="footer-title">友链</div>
            <el-tooltip
              content="换一批友情链接"
              placement="top"
              :show-arrow="false"
              :offset="8"
              popper-class="custom-tooltip"
              :transition-props="{ onEnter, onLeave }"
            >
              <a
                class="random-friends-btn"
                href="javascript:void(0);"
                @click="refreshFriendLinks"
              >
                <i
                  class="anzhiyufont anzhiyu-icon-arrow-rotate-right"
                  :class="{ 'is-animating': isAnimating }"
                  :style="{ transform: `rotate(${rotationCount * 360}deg)` }"
                />
              </a>
            </el-tooltip>
          </div>
          <div class="footer-links">
            <a
              v-for="friend in displayedFriends"
              :key="friend.name"
              class="footer-item"
              :href="friend.href"
              :title="friend.name"
              target="_blank"
              rel="noopener nofollow"
            >
              {{ friend.name }}
            </a>
            <router-link to="/link/" class="footer-item" title="更多友情链接"
              >更多</router-link
            >
          </div>
        </div>
      </div>

      <!-- 3. 自定义文本 -->
      <div
        v-if="footerConfig.custom_text"
        class="footer-custom-text"
        v-html="footerConfig.custom_text"
      />

      <!-- 4. 技术栈/服务徽章 (保持 el-tooltip) -->
      <p v-if="footerConfig.badgeitem?.list?.length" class="footer-badges">
        <el-tooltip
          v-for="badge in footerConfig.badgeitem.list"
          :key="badge.shields"
          :content="badge.message"
          placement="top"
          :show-arrow="false"
          :offset="8"
          popper-class="custom-tooltip"
          :transition-props="{ onEnter, onLeave }"
        >
          <a
            class="badge-link"
            target="_blank"
            :href="badge.link"
            rel="external nofollow noreferrer"
          >
            <img :src="badge.shields" :alt="badge.message" />
          </a>
        </el-tooltip>
      </p>
    </div>

    <!-- 5. 底部信息栏 (保持 el-tooltip) -->
    <div v-if="footerConfig.footerBar" class="footer-bottom-bar">
      <div class="bar-content">
        <div class="bar-left">
          <div
            v-if="footerConfig.owner"
            class="copyright-info"
            v-html="copyrightText"
          />
        </div>
        <div class="bar-right">
          <a
            v-for="link in footerConfig.footerBar.linkList"
            :key="link.text"
            class="bar-link"
            :href="link.link"
            target="_blank"
            rel="noopener"
          >
            {{ link.text }}
          </a>
          <a
            v-if="icpNumber"
            class="bar-link"
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener"
          >
            {{ icpNumber }}
          </a>
          <el-tooltip
            content="CC BY-NC-ND 4.0 协议"
            placement="top"
            :show-arrow="false"
            :offset="8"
            popper-class="custom-tooltip"
            :transition-props="{ onEnter, onLeave }"
          >
            <a
              v-if="footerConfig.footerBar.cc && footerConfig.footerBar.cc.link"
              class="bar-link cc-link"
              :href="footerConfig.footerBar.cc.link"
              target="_blank"
              rel="noopener"
            >
              <i class="anzhiyufont anzhiyu-icon-copyright-line" />
              <i class="anzhiyufont anzhiyu-icon-creative-commons-by-line" />
              <i class="anzhiyufont anzhiyu-icon-creative-commons-nc-line" />
              <i class="anzhiyufont anzhiyu-icon-creative-commons-nd-line" />
            </a>
          </el-tooltip>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// Script 部分无需改动
import { ref, computed, onMounted } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { onEnter, onLeave } from "@/utils/transitions";

const siteConfigStore = useSiteConfigStore();
const siteConfig = computed(() => siteConfigStore.getSiteConfig);
const footerConfig = computed(() => siteConfig.value?.footer);
const icpNumber = computed(() => siteConfig.value?.ICP_NUMBER);

const allFriends = ref([
  { name: "胡桃木实验室", href: "https://www.htmacg.cn/" },
  { name: "包子哟", href: "https://blog.bugjava.cn" },
  { name: "道宣的窝", href: "https://daoxuan.cc/" },
  { name: "张洪Heo", href: "https://blog.zhheo.com/" },
  { name: "Leonus", href: "https://blog.leonus.cn/" },
  { name: "無名のBlog", href: "https://wumou.org" }
]);
const displayedFriends = ref<{ name: string; href: string }[]>([]);
const rotationCount = ref(0);
const isAnimating = ref(false);

function refreshFriendLinks() {
  if (isAnimating.value) return;
  if (!footerConfig.value?.list?.randomFriends) return;
  const count = Number(footerConfig.value.list.randomFriends);
  const shuffled = [...allFriends.value].sort(() => 0.5 - Math.random());
  displayedFriends.value = shuffled.slice(0, count);
  rotationCount.value++;
  isAnimating.value = true;
  setTimeout(() => {
    isAnimating.value = false;
  }, 300);
}

const copyrightText = computed(() => {
  if (!footerConfig.value?.owner) return "";
  const since = footerConfig.value.owner.since;
  const author = footerConfig.value.owner.name;
  const authorLink = footerConfig.value.footerBar?.authorLink || "/about";
  const nowYear = new Date().getFullYear();
  let yearRange = String(nowYear);
  if (since && Number(since) !== nowYear) yearRange = `${since} - ${nowYear}`;
  const authorHtml = `<a class="bar-link" href="${authorLink}" target="_blank">${author}</a>`;
  return `&copy;${yearRange} By ${authorHtml}`;
});

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};
const getIconClass = (iconName: string) => {
  if (iconName?.startsWith("anzhiyu")) return ["anzhiyufont", iconName];
  if (iconName?.startsWith("fa")) return iconName.split(" ");
  return [iconName];
};
onMounted(() => {
  if (footerConfig.value) refreshFriendLinks();
});
</script>

<style scoped lang="scss">
/* scoped 样式无需改动 */
.footer-container {
  position: relative;
  background: linear-gradient(
    180deg,
    var(--anzhiyu-card-bg-none) 0,
    var(--anzhiyu-card-bg) 25%
  );
  color: var(--anzhiyu-fontcolor);
  margin-top: 1rem;
}
.footer-wrap {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
}
a {
  color: var(--anzhiyu-fontcolor);
  text-decoration: none;
  &:hover {
    color: var(--anzhiyu-main);
  }
}
.footer-social-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  padding: 1rem 0;
  gap: 1rem;
  .social-link {
    font-size: 1.5rem;
    display: flex;
    margin: 1rem 27px;
    color: var(--anzhiyu-card-bg);
    border-radius: 3rem;
    width: 32px;
    height: 32px;
    background: var(--anzhiyu-fontcolor);
    justify-content: center;
    align-items: center;
    transition: 0.3s;
    &:hover {
      transform: scale(1.2);
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-main);
    }
  }
}
.footer-back-to-top {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 50%;
  margin: 0 1rem;
  cursor: pointer;
  transition: cubic-bezier(0, 0, 0, 1.29) 0.5s;
  &:hover {
    transform: rotate(360deg);
  }
}
.footer-link-grid {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8rem;
  padding: 0 2rem;
}
.footer-group {
  flex: 1 1;
  min-width: 120px;
  text-align: left;
}
.footer-title-group {
  display: flex;
  align-items: center;
}
.footer-title {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.8rem;
  color: var(--anzhiyu-secondtext);
}
.random-friends-btn {
  font-size: 1.1rem;
  margin-left: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-bottom: 0.8rem;
  > i {
    display: inline-block;
    transition:
      transform 0.3s ease-out,
      opacity 0.3s ease-out;
    &.is-animating {
      opacity: 0.2;
    }
  }
}
.footer-links .footer-item {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 120px;
}
.footer-custom-text {
  text-align: center;
  padding: 1rem 0;
  font-size: 0.9rem;
  color: var(--anzhiyu-gray);
}
.footer-badges {
  text-align: center;
  padding: 1.5rem 0;
  margin: 0;
}
.badge-link {
  display: inline-block;
  margin: 5px;
  img {
    height: 20px;
    vertical-align: middle;
  }
}
.footer-bottom-bar {
  padding: 1rem;
  color: var(--anzhiyu-fontcolor);
  margin-top: 1rem;
  background: var(--anzhiyu-secondbg);
  display: flex;
  overflow: hidden;
  transition: 0.3s;
}
.bar-content {
  display: flex;
  justify-content: space-between;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  flex-wrap: wrap;
  align-items: center;
  line-height: 1;
}
.bar-left,
.bar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  min-height: 32px;
}
.copyright-info :deep(a:hover) {
  color: var(--anzhiyu-main);
}
:deep(.bar-link) {
  margin-top: 8px;
  margin-bottom: 8px;
  color: var(--anzhiyu-fontcolor);
  font-size: 1rem;
  font-weight: 700;
  white-space: nowrap;
}
.cc-link {
  display: flex;
  align-items: center;
  i {
    margin: 0 2px;
  }
}
@media (max-width: 768px) {
  .footer-link-grid {
    justify-content: flex-start;
  }
  .footer-group {
    flex-basis: 45%;
  }
  .bar-content {
    flex-direction: column;
    gap: 0.5rem;
  }
}
@media (max-width: 480px) {
  .footer-group {
    flex-basis: 100%;
    text-align: center;
  }
  .footer-title-group {
    justify-content: center;
    gap: 1rem;
  }
}
</style>
