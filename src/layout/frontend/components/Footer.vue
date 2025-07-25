<template>
  <footer class="footer-container">
    <div class="footer-wrap">
      <!-- 顶部社交媒体图标 & 返回顶部 -->
      <div class="footer-social-bar">
        <a
          v-for="link in socialLinks.slice(0, 4)"
          :key="link.title"
          class="social-link"
          :href="link.href"
          :title="link.title"
          target="_blank"
          rel="noopener external nofollow noreferrer"
        >
          <i :class="['anzhiyufont', link.icon]" />
        </a>
        <img
          class="footer-back-to-top"
          title="返回顶部"
          alt="返回顶部"
          src="https://img02.anheyu.com/adminuploads/1/2023/05/09/645a3ff0dc540.gif"
          @click="scrollToTop"
        />
        <a
          v-for="link in socialLinks.slice(4)"
          :key="link.title"
          class="social-link"
          :href="link.href"
          :title="link.title"
          target="_blank"
          rel="noopener external nofollow noreferrer"
        >
          <i :class="['anzhiyufont', link.icon]" />
        </a>
      </div>

      <!-- 主要页脚链接网格 -->
      <div class="footer-link-grid">
        <div
          v-for="group in footerLinkGroups"
          :key="group.title"
          class="footer-group"
        >
          <div class="footer-title">{{ group.title }}</div>
          <div class="footer-links">
            <router-link
              v-for="link in group.links"
              :key="link.name"
              class="footer-item"
              :to="link.path"
              :title="link.name"
            >
              {{ link.name }}
            </router-link>
          </div>
        </div>

        <!-- 动态友链组 -->
        <div class="footer-group">
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
            <router-link to="/link/" class="footer-item">更多</router-link>
          </div>
        </div>
      </div>

      <!-- 技术栈/服务徽章 -->
      <p class="footer-badges">
        <a
          v-for="badge in badges"
          :key="badge.title"
          class="badge-link"
          target="_blank"
          :href="badge.href"
          rel="external nofollow noreferrer"
          :title="badge.title"
        >
          <img :src="badge.imgSrc" :alt="badge.title" />
        </a>
      </p>
    </div>

    <!-- 底部备案信息栏 -->
    <div class="footer-bottom-bar">
      <div class="bar-content">
        <div class="bar-left">
          <div class="copyright-info">
            ©2020 - {{ new Date().getFullYear() }} By
            <router-link to="/about" class="bar-link" title="安知鱼"
              >安知鱼</router-link
            >
          </div>
        </div>
        <div class="bar-right">
          <a
            class="bar-link"
            target="_blank"
            rel="noopener external nofollow noreferrer"
            href="https://github.com/anzhiyu-c/hexo-theme-anzhiyu"
            title="主题"
            >主题</a
          >
          <a
            class="bar-link"
            target="_blank"
            rel="noopener external nofollow noreferrer"
            href="https://beian.miit.gov.cn/"
            title="粤ICP备2021157833号"
            >粤ICP备2021157833号</a
          >
          <router-link to="/copyright" class="bar-link cc-link" title="cc协议">
            <i class="anzhiyufont anzhiyu-icon-copyright-line" />
            <i class="anzhiyufont anzhiyu-icon-creative-commons-by-line" />
            <i class="anzhiyufont anzhiyu-icon-creative-commons-nc-line" />
            <i class="anzhiyufont anzhiyu-icon-creative-commons-sa-line" />
          </router-link>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

// --- 数据部分 (与之前版本相同，无需修改) ---

const socialLinks = ref([
  {
    href: "mailto:anzhiyu-c@qq.com",
    title: "email",
    icon: "anzhiyu-icon-envelope"
  },
  {
    href: "https://weibo.com/u/6378063631",
    title: "微博",
    icon: "anzhiyu-icon-weibo"
  },
  {
    href: "https://www.facebook.com/profile.php?id=100092208016287",
    title: "facebook",
    icon: "anzhiyu-icon-facebook1"
  },
  { href: "/atom.xml", title: "RSS", icon: "anzhiyu-icon-rss" },
  {
    href: "https://github.com/anzhiyu-c",
    title: "Github",
    icon: "anzhiyu-icon-github"
  },
  {
    href: "https://space.bilibili.com/372204786",
    title: "Bilibili",
    icon: "anzhiyu-icon-bilibili"
  },
  {
    href: "https://v.douyin.com/DwCpMEy/",
    title: "抖音",
    icon: "anzhiyu-icon-tiktok"
  },
  { href: "/copyright", title: "CC", icon: "anzhiyu-icon-copyright-line" }
]);

const footerLinkGroups = ref([
  {
    title: "服务",
    links: [
      { name: "51la统计", path: "https://v6.51.la/" },
      { name: "十年之约", path: "https://foreverblog.cn/go.html" },
      { name: "开往", path: "https://github.com/travellings-link/travellings" }
    ]
  },
  {
    title: "主题",
    links: [
      { name: "文档", path: "https://docs.anheyu.com" },
      { name: "源码", path: "https://github.com/anzhiyu-c/hexo-theme-anzhiyu" },
      { name: "更新日志", path: "/update/" }
    ]
  },
  {
    title: "导航",
    links: [
      { name: "即刻短文", path: "/essay/" },
      { name: "友链文章", path: "/fcircle/" },
      { name: "留言板", path: "/comments/" }
    ]
  },
  {
    title: "协议",
    links: [
      { name: "隐私协议", path: "/privacy/" },
      { name: "Cookies", path: "/cookies/" },
      { name: "版权协议", path: "/copyright/" }
    ]
  }
]);

const badges = ref([
  {
    href: "https://hexo.io/",
    title: "博客框架为Hexo",
    imgSrc:
      "https://npm.elemecdn.com/anzhiyu-blog@2.1.5/img/badge/Frame-Hexo.svg"
  },
  {
    href: "https://www.dogecloud.com/",
    title: "本站使用多吉云为静态资源提供CDN加速",
    imgSrc:
      "https://npm.elemecdn.com/anzhiyu-blog@2.2.0/img/badge/CDN-多吉云-3693F3.svg"
  },
  {
    href: "https://blog.anheyu.com/",
    title: "本站使用AnZhiYu主题",
    imgSrc:
      "https://npm.elemecdn.com/anzhiyu-theme-static@1.0.9/img/Theme-AnZhiYu-2E67D3.svg"
  },
  {
    href: "https://beian.miit.gov.cn/",
    title: "粤ICP备2021157833号",
    imgSrc: "https://img.shields.io/badge/粤ICP备-2021157833号-blue"
  },
  {
    href: "https://github.com/",
    title: "本站项目由Github托管",
    imgSrc:
      "https://npm.elemecdn.com/anzhiyu-blog@2.1.5/img/badge/Source-Github.svg"
  },
  {
    href: "http://creativecommons.org/licenses/by-nc-sa/4.0/",
    title:
      "本站采用知识共享署名-非商业性使用-相同方式共享4.0国际许可协议进行许可",
    imgSrc:
      "https://npm.elemecdn.com/anzhiyu-blog@2.2.0/img/badge/Copyright-BY-NC-SA.svg"
  }
]);

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

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const refreshFriendLinks = () => {
  const shuffled = [...allFriends.value].sort(() => 0.5 - Math.random());
  displayedFriends.value = shuffled.slice(0, 3);
  isRotating.value = true;
  setTimeout(() => {
    isRotating.value = false;
  }, 500);
};

onMounted(() => {
  refreshFriendLinks();
});
</script>

<style scoped>
/* 确保在 public/index.html 中引入了 anzhizu-font 的 CSS */
/* <link rel="stylesheet" href="https://npm.elemecdn.com/anzhiyu-theme-static@1.1.4/dist/font/anzhiyu-font.css"> */

/* --- 变量和全局页脚样式 --- */
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

/* --- 顶部社交媒体图标 & 返回顶部 --- */
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

/* --- 主要页脚链接网格 --- */
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

/* --- 技术栈/服务徽章 --- */
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

/* --- 底部备案信息栏 --- */
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
.bar-link {
  color: var(--anzhiyu-lighttext);
}
.bar-link:hover {
  color: var(--anzhiyu-main);
}
.cc-link i {
  margin: 0 2px;
}

/* --- 响应式设计 --- */
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
