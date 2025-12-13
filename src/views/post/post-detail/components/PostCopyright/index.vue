<script setup lang="ts">
import { computed, ref, type PropType } from "vue";
import type { Article } from "@/api/post/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import HandHeartIcon from "@iconify-icons/ri/hand-heart-fill";
import RssIcon from "@iconify-icons/ri/plant-fill";
import { useRouter } from "vue-router";

const props = defineProps({
  article: {
    type: Object as PropType<Article>,
    required: true
  }
});

defineOptions({
  name: "PostCopyright"
});

const router = useRouter();
const siteConfigStore = useSiteConfigStore();
const siteConfig = siteConfigStore.getSiteConfig;
const showRewardPanel = ref(false);

// 获取文章的实际作者信息（优先使用文章发布者的信息，否则使用站点所有者）
const articleAuthor = computed(() => {
  // 优先使用发布者的 nickname
  if (props.article.owner_nickname) {
    return props.article.owner_nickname;
  }
  // 其次使用发布者名称（已废弃，兼容旧数据）
  if (props.article.owner_name) {
    return props.article.owner_name;
  }
  // 否则使用站点所有者名称
  return siteConfig.frontDesk?.siteOwner?.name || "本站博主";
});

// 获取文章发布者的头像（优先使用发布者头像，否则使用站点所有者头像）
const articleAuthorAvatar = computed(() => {
  // 优先使用发布者的头像
  if (props.article.owner_avatar) {
    return props.article.owner_avatar;
  }
  // 否则使用站点所有者头像
  return siteConfig.USER_AVATAR;
});

const copyrightInfo = computed(() => {
  const license = siteConfig.copyright?.license ?? "CC BY-NC-SA 4.0";
  const licenseUrl =
    siteConfig.copyright?.license_url ??
    "https://creativecommons.org/licenses/by-nc-sa/4.0/";
  const siteUrl = siteConfig.site?.url ?? "/";
  const actualAuthor = articleAuthor.value; // 使用文章的实际作者

  // 判断是否为转载文章
  const isReprint =
    props.article.copyright_author &&
    props.article.copyright_author !== actualAuthor;

  if (isReprint) {
    // 转载文章的版权声明
    const originalAuthor = props.article.copyright_author;
    const originalUrl = props.article.copyright_url;

    if (originalUrl) {
      return `本文是转载或翻译文章，版权归 <a href="${originalUrl}" target="_blank">${originalAuthor}</a> 所有。建议访问原文，转载本文请联系原作者。`;
    } else {
      return `本文是转载或翻译文章，版权归 ${originalAuthor} 所有。建议访问原文，转载本文请联系原作者。`;
    }
  } else {
    // 原创文章的版权声明（使用文章的实际作者）
    return `本文是原创文章，采用 <a href="${licenseUrl}" target="_blank">${license}</a> 协议，完整转载请注明来自 <a href="${siteUrl}" target="_blank">${actualAuthor}</a>`;
  }
});

const goAbout = () => {
  router.push({ path: "/about" });
};

const goRss = () => {
  window.open("/rss.xml", "_blank");
};

const goRewardPage = () => {
  router.push({ path: "/about" });
};

// 检查是否有任何打赏方式可用
const hasAnyRewardMethod = computed(() => {
  const reward = siteConfig.post?.reward;
  if (!reward) return false;
  const wechatEnabled = reward.wechat_enable !== false && reward.wechat_qr;
  const alipayEnabled = reward.alipay_enable !== false && reward.alipay_qr;
  return wechatEnabled || alipayEnabled;
});

// 获取打赏配置文案
const rewardConfig = computed(() => ({
  buttonText: siteConfig.post?.reward?.button_text || "打赏作者",
  title: siteConfig.post?.reward?.title || "感谢你赐予我前进的力量",
  wechatLabel: siteConfig.post?.reward?.wechat_label || "微信",
  alipayLabel: siteConfig.post?.reward?.alipay_label || "支付宝",
  listButtonText: siteConfig.post?.reward?.list_button_text || "打赏者名单",
  listButtonDesc:
    siteConfig.post?.reward?.list_button_desc ||
    "因为你们的支持让我意识到写文章的价值"
}));

// 检查微信打赏是否可用
const isWechatEnabled = computed(() => {
  const reward = siteConfig.post?.reward;
  return reward?.wechat_enable !== false && reward?.wechat_qr;
});

// 检查支付宝打赏是否可用
const isAlipayEnabled = computed(() => {
  const reward = siteConfig.post?.reward;
  return reward?.alipay_enable !== false && reward?.alipay_qr;
});
</script>

<template>
  <div v-if="article.copyright" class="post-copyright">
    <div class="author-avatar" title="关于作者" @click="goAbout">
      <img :src="articleAuthorAvatar" alt="作者头像" />
    </div>
    <div class="author-name">
      {{ articleAuthor }}
    </div>
    <div class="author-desc">{{ siteConfig?.SUB_TITLE }}</div>

    <div class="button-group">
      <div
        v-if="siteConfig.post.reward?.enable && hasAnyRewardMethod"
        class="reward"
      >
        <div class="reward-button" @click="showRewardPanel = !showRewardPanel">
          <IconifyIconOffline :icon="HandHeartIcon" />
          <span>{{ rewardConfig.buttonText }}</span>
        </div>
        <Transition name="reward-slide">
          <div v-show="showRewardPanel" class="reward-main">
            <div class="reward-all">
              <span class="reward-title">{{ rewardConfig.title }}</span>
              <ul class="reward-group">
                <li v-if="isWechatEnabled" class="reward-item">
                  <a :href="siteConfig.post.reward.wechat_qr" target="_blank">
                    <img
                      class="qr-code"
                      :src="siteConfig.post.reward.wechat_qr"
                      :alt="rewardConfig.wechatLabel"
                    />
                  </a>

                  <div class="qr-code-desc">{{ rewardConfig.wechatLabel }}</div>
                </li>
                <li v-if="isAlipayEnabled" class="reward-item">
                  <a :href="siteConfig.post.reward.alipay_qr" target="_blank">
                    <img
                      class="qr-code"
                      :src="siteConfig.post.reward.alipay_qr"
                      :alt="rewardConfig.alipayLabel"
                    />
                  </a>
                  <div class="qr-code-desc">{{ rewardConfig.alipayLabel }}</div>
                </li>
              </ul>
              <div class="reward-main-btn" @click="goRewardPage">
                <div class="reward-text">{{ rewardConfig.listButtonText }}</div>
                <div class="reward-dec">
                  {{ rewardConfig.listButtonDesc }}
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
      <Transition name="fade">
        <div
          v-show="showRewardPanel"
          id="quit-box"
          @click="showRewardPanel = !showRewardPanel"
        />
      </Transition>
      <div class="subscribe-button" @click="goRss">
        <IconifyIconOffline :icon="RssIcon" />
        <span>订阅</span>
      </div>
    </div>

    <div class="copyright-notice">
      <span v-html="copyrightInfo" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.post-copyright {
  position: relative;
  padding: 34px 12px 20px;
  margin: 80px 0 30px;
  background: var(--anzhiyu-secondbg);
  border: var(--style-border-always);
  border-width: 1px;
  border-radius: 12px;
  transition: 0.3s;
}

.author-avatar {
  position: absolute;
  top: -33px;
  left: calc(50% - 33px);
  width: 66px;
  height: 66px;
  margin: auto;
  overflow: hidden;
  cursor: pointer;
  background: var(--anzhiyu-main);
  border: var(--style-border-always);
  border-radius: 66px;
  box-shadow: var(--anzhiyu-shadow-main);
  transition: all 0.2s ease 0s;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: all 0.2s ease 0s;
  }

  &:hover {
    box-shadow: inset 0 0 0 10px var(--anzhiyu-main);
    transform: scale(1.05);

    img {
      overflow: hidden;
      border-radius: 66px;
      transform: scale(0.8);
    }
  }
}

.author-name {
  margin-top: 16px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  color: var(--anzhiyu-fontcolor);
  text-align: center;
}

.author-desc {
  margin-top: 4px;
  font-size: 14px;
  color: var(--anzhiyu-secondtext);
  text-align: center;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  width: 100%;
  margin-top: 8px;
  user-select: none;
  user-select: none;

  .reward {
    position: relative;
    display: flex;
    justify-content: center;
    margin-top: 0;

    .reward-button {
      background: var(--anzhiyu-red);

      svg {
        font-size: 22px;
        line-height: 1;
      }
    }

    &:hover .reward-main {
      display: flex;
      justify-content: left;
    }
  }

  .reward-button,
  .subscribe-button {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    height: 40px;
    padding: 0.6rem 1.5rem;
    font-weight: bold;
    color: var(--anzhiyu-white);
    cursor: pointer;
    border: none;
    border-radius: 8px;
    transition: all 0.4s ease 0s;

    &:hover {
      background: var(--anzhiyu-theme);
      box-shadow: none;
    }
  }

  .subscribe-button {
    background: var(--anzhiyu-green);
  }
}

.reward-main {
  position: absolute;
  bottom: 40px;
  left: -96px;
  z-index: 102;
  display: flex;
  width: fit-content;
  padding: 0 0 15px;

  // 移动端抽屉效果
  @media (max-width: 768px) {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 0;
  }
}

.reward-all {
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  margin: 0;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  border-radius: 12px;
  box-shadow: var(--anzhiyu-shadow-border);

  &::before {
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 100%;
    height: 20px;
    content: "";
  }

  // 移动端抽屉样式
  @media (max-width: 768px) {
    width: 100%;
    max-height: 80vh;
    padding: 1.5rem 1rem;
    overflow-y: auto;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -4px 20px rgb(0 0 0 / 20%);

    &::before {
      display: none;
    }
  }

  .reward-title {
    font-weight: 700;
    color: var(--anzhiyu-red);
  }

  .reward-group {
    display: flex;
    margin-top: 0.625rem;
  }

  .reward-item {
    display: inline-block;
    padding: 0 8px;
    text-align: center;
    vertical-align: top;
    list-style-type: none;

    &:first-child img {
      border-color: var(--anzhiyu-green);
    }

    &:last-child img {
      border-color: var(--anzhiyu-blue);
    }

    .qr-code {
      width: 130px;
      height: 130px;
      border: var(--style-border-always);
      border-radius: 8px;
      box-shadow: var(--anzhiyu-shadow-lightblack);

      // 移动端调整二维码大小
      @media (max-width: 768px) {
        width: 140px;
        height: 140px;
      }

      @media (max-width: 480px) {
        width: 120px;
        height: 120px;
      }
    }

    .qr-code-desc {
      width: 130px;
      padding-top: 0;
      margin-top: -8px;
      margin-bottom: 8px;

      @media (max-width: 768px) {
        width: 140px;
      }

      @media (max-width: 480px) {
        width: 120px;
      }
    }
  }

  .reward-main-btn {
    display: flex;
    flex-direction: column;
    width: calc(100% - 16px);
    padding: 4px 0;
    margin: 8px;
    color: var(--anzhiyu-fontcolor);
    text-align: center;
    cursor: pointer;
    background: var(--anzhiyu-secondbg);
    border: var(--style-border-always);
    border-radius: 12px;

    &:hover {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-red);
      background-image: url("https://upload-bbs.miyoushe.com/upload/2025/08/10/125766904/dfc8878f7e65451f068d69830a4ff39c_2744970941687453951.gif");
      border-color: var(--anzhiyu-red);
      box-shadow: var(--anzhiyu-shadow-red);
    }

    .reward-text {
      margin-bottom: 0;
      font-weight: 700;
    }

    .reward-dec {
      font-size: 0.75rem;
    }
  }
}

#quit-box {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 101;
  display: flex;
  width: 100vw;
  height: 100vh;
  margin: 0;
  background: rgb(0 0 0 / 20%);
}

.copyright-notice {
  padding-left: 0;
  margin: 1rem 0 0.5rem;
  overflow: hidden;
  font-size: 12px;
  color: var(--anzhiyu-secondtext);
  text-align: center;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;

  :deep(a) {
    font-weight: bold;
    color: var(--anzhiyu-fontcolor);
    border-bottom: 1px solid var(--anzhiyu-gray-100);

    &:hover {
      color: var(--anzhiyu-main);
      border-bottom-color: var(--anzhiyu-main);
    }
  }
}

[data-theme="dark"] .reward .reward-button,
[data-theme="dark"] .button-group .subscribe-button {
  filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=50)";
  filter: alpha(opacity=50);
  opacity: 0.5;
}

// Vue Transition 过渡动画
// 打赏面板进入和离开动画
.reward-slide-enter-active {
  animation: slide-in 0.3s ease;

  @media (max-width: 768px) {
    animation: slide-up 0.3s ease;
  }
}

.reward-slide-leave-active {
  animation: slide-in 0.3s ease reverse;

  @media (max-width: 768px) {
    animation: slide-up 0.3s ease reverse;
  }
}

// 遮罩层淡入淡出动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
