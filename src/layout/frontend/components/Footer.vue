<template>
  <!-- 确保 siteConfig 加载完成后才渲染整个页脚，防止因数据未加载而报错 -->
  <footer v-if="siteConfig" class="footer-container">
    <div class="footer-wrap">
      <!-- 1. 顶部社交链接栏 -->
      <div v-if="footerConfig.socialBar" class="footer-social-bar">
        <!-- 左侧链接 -->
        <a
          v-for="item in footerConfig.socialBar.left"
          :key="item.link"
          class="social-link"
          :href="item.link"
          :title="item.title"
          target="_blank"
          rel="noopener external nofollow noreferrer"
        >
          <i :class="getIconClass(item.icon)" />
        </a>

        <!-- 中间返回顶部图片 -->
        <img
          v-if="footerConfig.socialBar.centerImg"
          class="footer-back-to-top"
          title="返回顶部"
          alt="返回顶部"
          :src="footerConfig.socialBar.centerImg"
          @click="scrollToTop"
        />

        <!-- 右侧链接 -->
        <a
          v-for="item in footerConfig.socialBar.right"
          :key="item.link"
          class="social-link"
          :href="item.link"
          :title="item.title"
          target="_blank"
          rel="noopener external nofollow noreferrer"
        >
          <i :class="getIconClass(item.icon)" />
        </a>
      </div>

      <!-- 2. 主要链接网格 -->
      <div v-if="footerConfig.list?.project?.length" class="footer-link-grid">
        <!-- 遍历链接分组 -->
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

        <!-- 随机友链 -->
        <div v-if="footerConfig.list.randomFriends > 0" class="footer-group">
          <div class="footer-title-group">
            <div class="footer-title">友链</div>
            <a
              class="random-friends-btn"
              href="javascript:void(0);"
              title="换一批友情链接"
              @click="refreshFriendLinks"
            >
              <i
                class="anzhiyufont anzhiyu-icon-arrow-rotate-right"
                :class="{ rotating: isRotating }"
              />
            </a>
          </div>
          <div class="footer-links">
            <!-- 实际显示的友链 -->
            <a
              v-for="friend in displayedFriends"
              :key="friend.name"
              class="footer-item"
              :href="friend.href"
              target="_blank"
              rel="noopener nofollow"
            >
              {{ friend.name }}
            </a>
            <!-- "更多" 链接 -->
            <router-link to="/link/" class="footer-item">更多</router-link>
          </div>
        </div>
      </div>

      <!-- 3. 自定义文本 -->
      <div
        v-if="footerConfig.custom_text"
        class="footer-custom-text"
        v-html="footerConfig.custom_text"
      />

      <!-- 4. 技术栈/服务徽章 -->
      <p v-if="footerConfig.badgeitem?.list?.length" class="footer-badges">
        <a
          v-for="badge in footerConfig.badgeitem.list"
          :key="badge.shields"
          class="badge-link"
          target="_blank"
          :href="badge.link"
          rel="external nofollow noreferrer"
          :title="badge.message"
        >
          <img :src="badge.shields" :alt="badge.message" />
        </a>
      </p>
    </div>

    <!-- 5. 底部信息栏 -->
    <div v-if="footerConfig.footerBar" class="footer-bottom-bar">
      <div class="bar-content">
        <!-- 左侧版权信息 -->
        <div class="bar-left">
          <div
            v-if="footerConfig.owner"
            class="copyright-info"
            v-html="copyrightText"
          />
        </div>
        <!-- 右侧链接 -->
        <div class="bar-right">
          <!-- 循环遍历 linkList -->
          <a
            v-for="link in footerConfig.footerBar.linkList"
            :key="link.text"
            class="bar-link"
            :href="link.link"
            :title="link.text"
            target="_blank"
            rel="noopener"
          >
            {{ link.text }}
          </a>
          <!-- 单独添加备案号 -->
          <a
            v-if="icpNumber"
            class="bar-link"
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener"
            :title="icpNumber"
          >
            {{ icpNumber }}
          </a>
          <!-- CC 协议图标，判断 link 是否存在且不为空 -->
          <a
            v-if="footerConfig.footerBar.cc && footerConfig.footerBar.cc.link"
            class="bar-link cc-link"
            :href="footerConfig.footerBar.cc.link"
            title="CC协议"
            target="_blank"
            rel="noopener"
          >
            <i class="anzhiyufont anzhiyu-icon-copyright-line" />
            <i class="anzhiyufont anzhiyu-icon-creative-commons-by-line" />
            <i class="anzhiyufont anzhiyu-icon-creative-commons-nc-line" />
            <i class="anzhiyufont anzhiyu-icon-creative-commons-sa-line" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

// --- 1. 从 Pinia Store 获取配置 ---
const siteConfigStore = useSiteConfigStore();
const siteConfig = computed(() => siteConfigStore.getSiteConfig);
const footerConfig = computed(() => siteConfig.value?.footer);
const icpNumber = computed(() => siteConfig.value?.ICP_NUMBER);

// --- 2. 计算属性，处理动态文本 ---
const copyrightText = computed(() => {
  if (!footerConfig.value?.owner) return "";
  const since = footerConfig.value.owner.since;
  const author = footerConfig.value.owner.name;
  const authorLink = footerConfig.value.footerBar?.authorLink || "/about";
  const nowYear = new Date().getFullYear();
  let yearRange = String(nowYear);
  if (since && Number(since) !== nowYear) {
    yearRange = `${since} - ${nowYear}`;
  }
  const authorHtml = `<a class="bar-link" href="${authorLink}" title="${author}" target="_blank">${author}</a>`;
  return `&copy;${yearRange} By ${authorHtml}`;
});

// --- 3. 方法 ---
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const getIconClass = (iconName: string) => {
  if (iconName?.startsWith("anzhiyu")) {
    return ["anzhiyufont", iconName];
  }
  if (iconName?.startsWith("fa")) {
    return iconName.split(" ");
  }
  return [iconName];
};

// --- 4. 友链功能 (当前为静态数据，未来将替换为 API 调用) ---
// TODO: 后端API准备好后，将此静态列表替换为API调用返回的数据。
const allFriends = ref([
  { name: "胡桃木实验室", href: "https://www.htmacg.cn/" },
  { name: "包子哟", href: "https://blog.bugjava.cn" },
  { name: "道宣的窝", href: "https://daoxuan.cc/" },
  { name: "张洪Heo", href: "https://blog.zhheo.com/" },
  { name: "Leonus", href: "https://blog.leonus.cn/" },
  { name: "無名のBlog", href: "https://wumou.org" }
]);
const displayedFriends = ref<{ name: string; href: string }[]>([]);
const isRotating = ref(false);

const refreshFriendLinks = () => {
  if (!footerConfig.value?.list?.randomFriends) return;

  const count = Number(footerConfig.value.list.randomFriends);
  // 从 allFriends 数组中随机抽取指定数量的友链来显示
  const shuffled = [...allFriends.value].sort(() => 0.5 - Math.random());
  displayedFriends.value = shuffled.slice(0, count);

  // 触发刷新按钮的旋转动画
  isRotating.value = true;
  setTimeout(() => {
    isRotating.value = false;
  }, 500);
};

// --- 5. 生命周期钩子 ---
onMounted(() => {
  // 组件挂载后，如果配置已加载，则初始化友链
  if (footerConfig.value) {
    refreshFriendLinks();
  }
});
</script>

<style scoped>
/* 样式无需修改，保持原样 */
.footer-container {
  --anzhiyu-card-bg: rgba(255, 255, 255, 0.6);
  --anzhiyu-card-bg-none: rgba(255, 255, 255, 0);
  --anzhiyu-fontcolor: #4c4948;
  --anzhiyu-gray: #8a8a8a;
  --anzhiyu-main: #49b1f5;
  --anzhiyu-lighttext: #a9a9b3;

  position: relative;
  background: linear-gradient(
    180deg,
    var(--anzhiyu-card-bg-none) 0,
    var(--anzhiyu-card-bg) 25%
  );
  color: var(--anzhiyu-fontcolor);
  padding: 2rem 1rem 0;
  margin-top: 1rem;
}

.footer-wrap {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
}

.footer-container a {
  color: var(--anzhiyu-fontcolor);
  text-decoration: none;
  transition:
    color 0.3s,
    transform 0.3s;
}
.footer-container a:hover {
  color: var(--anzhiyu-main);
}

/* 顶部社交链接栏 */
.footer-social-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  padding: 1rem 0;
  gap: 1rem;
}

.social-link {
  font-size: 1.5rem;
}
.social-link:hover {
  transform: scale(1.2);
}

.footer-back-to-top {
  width: 50px;
  height: 50px;
  cursor: pointer;
  transition: transform 0.3s ease-in-out;
}
.footer-back-to-top:hover {
  transform: rotate(360deg);
}

/* 主要链接网格 */
.footer-link-grid {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 1.5rem 0;
  gap: 1rem;
}

.footer-group {
  flex: 1 1 180px;
  min-width: 150px;
  text-align: left;
}

.footer-title-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-title {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.8rem;
}

.random-friends-btn {
  font-size: 1.2rem;
  transition: transform 0.5s ease-in-out;
}
.random-friends-btn .rotating {
  transform: rotate(360deg);
}

.footer-links .footer-item {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  color: var(--anzhiyu-gray);
}
.footer-links .footer-item:hover {
  color: var(--anzhiyu-main);
  transform: translateX(3px);
}

/* 自定义文本 */
.footer-custom-text {
  text-align: center;
  padding: 1rem 0;
  font-size: 0.9rem;
  color: var(--anzhiyu-gray);
}

/* 技术栈/服务徽章 */
.footer-badges {
  text-align: center;
  padding: 1.5rem 0;
  margin: 0;
}
.badge-link {
  display: inline-block;
  margin: 5px;
}
.badge-link img {
  height: 20px;
  vertical-align: middle;
}

/* 底部信息栏 */
.footer-bottom-bar {
  border-top: 1px solid #e3e8f7;
  padding: 1rem 0;
  font-size: 0.85rem;
  color: var(--anzhiyu-lighttext);
}
.bar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}
.bar-left,
.bar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.copyright-info :deep(a) {
  color: var(--anzhiyu-lighttext);
}
.copyright-info :deep(a:hover) {
  color: var(--anzhiyu-main);
}
.bar-link {
  color: var(--anzhiyu-lighttext);
}
.bar-link:hover {
  color: var(--anzhiyu-main);
}
.cc-link i {
  margin: 0 2px;
}

/* 响应式设计 */
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
  .footer-links .footer-item:hover {
    transform: translateX(0);
  }
}
</style>
