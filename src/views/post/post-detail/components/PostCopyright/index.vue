<script setup lang="ts">
import { computed, ref, type PropType } from "vue";
import type { Article } from "@/api/post/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import HandHeartIcon from "@iconify-icons/ri/hand-heart-fill";
import RssIcon from "@iconify-icons/ri/plant-fill";
import { useRouter } from "vue-router";

defineProps({
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

const copyrightInfo = computed(() => {
  const license = siteConfig.copyright?.license ?? "CC BY-NC-SA 4.0";
  const licenseUrl =
    siteConfig.copyright?.license_url ??
    "https://creativecommons.org/licenses/by-nc-sa/4.0/";
  const author = siteConfig.author?.name ?? "本站博主";
  const siteUrl = siteConfig.site?.url ?? "/";

  return `本文是原创文章，采用 <a href="${licenseUrl}" target="_blank">${license}</a> 协议，完整转载请注明来自 <a href="${siteUrl}" target="_blank">${author}</a>`;
});

const goAbout = () => {
  router.push({ path: "/about" });
};

const goRewardPage = () => {
  router.push({ path: "/about/#about-reward" });
};
</script>

<template>
  <div v-if="article.copyright" class="post-copyright">
    <div class="author-avatar" title="关于博主" @click="goAbout">
      <img :src="siteConfig.USER_AVATAR" alt="作者形象" />
    </div>
    <div class="author-name">
      {{ siteConfig.frontDesk.siteOwner?.name }}
    </div>
    <div class="author-desc">{{ siteConfig?.SUB_TITLE }}</div>

    <div class="button-group">
      <div v-if="siteConfig.post.reward?.enable" class="reward">
        <div class="reward-button" @click="showRewardPanel = !showRewardPanel">
          <IconifyIconOffline :icon="HandHeartIcon" />
          <span>打赏作者</span>
        </div>
        <div
          class="reward-main"
          :style="{ display: showRewardPanel ? 'flex' : '', zIndex: 102 }"
        >
          <div class="reward-all">
            <span class="reward-title">感谢你赐予我前进的力量</span>
            <ul class="reward-group">
              <li class="reward-item">
                <a :href="siteConfig.post.reward.wechat_qr" target="_blank">
                  <img
                    class="qr-code"
                    :src="siteConfig.post.reward.wechat_qr"
                    alt="微信"
                  />
                </a>

                <div class="qr-code-desc">微信</div>
              </li>
              <li class="reward-item">
                <a :href="siteConfig.post.reward.alipay_qr" target="_blank">
                  <img
                    class="qr-code"
                    :src="siteConfig.post.reward.alipay_qr"
                    alt="支付宝"
                  />
                </a>
                <div class="qr-code-desc">支付宝</div>
              </li>
            </ul>
            <div class="reward-main-btn" @click="goRewardPage">
              <div class="reward-text">打赏者名单</div>
              <div class="reward-dec">
                因为你们的支持让我意识到写文章的价值🙏
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        id="quit-box"
        :style="{ display: showRewardPanel ? 'flex' : 'none' }"
        @click="showRewardPanel = !showRewardPanel"
      />
      <div class="subscribe-button">
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
  background: var(--anzhiyu-secondbg);
  border-width: 1px;
  transition: 0.3s;
  position: relative;
  margin: 80px 0 30px;
  border-radius: 12px;
  padding: 34px 12px 20px 12px;
  border: var(--style-border-always);
}

.author-avatar {
  width: 66px;
  height: 66px;
  margin: auto;
  border-radius: 66px;
  overflow: hidden;
  position: absolute;
  left: calc(50% - 33px);
  top: -33px;
  border: var(--style-border-always);
  box-shadow: var(--anzhiyu-shadow-main);
  background: var(--anzhiyu-main);
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: all 0.2s ease 0s;
  }
  transition: all 0.2s ease 0s;
  &:hover {
    transform: scale(1.05);
    box-shadow: inset 0px 0px 0px 10px var(--anzhiyu-main);
    img {
      transform: scale(0.8);
      border-radius: 66px;
      overflow: hidden;
    }
  }
}

.author-name {
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  margin-top: 16px;
  color: var(--anzhiyu-fontcolor);
  line-height: 1;
}

.author-desc {
  text-align: center;
  font-size: 14px;
  color: var(--anzhiyu-secondtext);
  margin-top: 4px;
}

.button-group {
  display: flex;
  width: 100%;
  justify-content: center;
  margin-top: 8px;
  flex-wrap: wrap;
  user-select: none;
  -webkit-user-select: none;
  gap: 1rem;

  .reward {
    margin-top: 0;
    display: flex;
    justify-content: center;
    position: relative;
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
    border-radius: 8px;
    padding: 0.6rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    font-weight: bold;
    color: var(--anzhiyu-white);
    transition: all 0.4s ease 0s;
    border: none;
    height: 40px;
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
  z-index: 100;
  display: none;
  padding: 0 0 15px;
  width: fit-content;
  animation: slide-in 0.3s ease 0s 1 normal none running;
}

.reward-all {
  border-radius: 12px;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border-always);
  padding: 1rem;
  display: flex;
  box-shadow: var(--anzhiyu-shadow-border);
  flex-direction: column;
  align-items: center;
  margin: 0;
  z-index: 999;
  &::before {
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 100%;
    height: 20px;
    content: "";
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
    list-style-type: none;
    vertical-align: top;
    text-align: center;
    &:first-child img {
      border-color: var(--anzhiyu-green);
    }
    &:last-child img {
      border-color: var(--anzhiyu-blue);
    }
    .qr-code {
      width: 130px;
      height: 130px;
      border-radius: 8px;
      box-shadow: var(--anzhiyu-shadow-lightblack);
      border: var(--style-border-always);
    }
    .qr-code-desc {
      padding-top: 0;
      margin-top: -8px;
      margin-bottom: 8px;
      width: 130px;
    }
  }

  .reward-main-btn {
    background: var(--anzhiyu-secondbg);
    color: var(--anzhiyu-fontcolor);
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    padding: 4px 0;
    border: var(--style-border-always);
    margin: 8px;
    width: calc(100% - 16px);
    text-align: center;
    cursor: pointer;
    &:hover {
      color: var(--anzhiyu-white);
      background: var(--anzhiyu-red);
      background-image: url(https://upload-bbs.miyoushe.com/upload/2025/08/10/125766904/dfc8878f7e65451f068d69830a4ff39c_2744970941687453951.gif);
      box-shadow: var(--anzhiyu-shadow-red);
      border-color: var(--anzhiyu-red);
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
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.2);
  top: 0;
  left: 0;
  display: none;
  z-index: 101;
  margin: 0;
}

.copyright-notice {
  font-size: 12px;
  margin: 1rem 0 0.5rem 0;
  color: var(--anzhiyu-fontcolor-p);
  padding-left: 0;
  color: var(--anzhiyu-secondtext);
  overflow: hidden;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  text-align: center;

  :deep(a) {
    color: var(--anzhiyu-fontcolor);
    font-weight: bold;
    border-bottom: 1px solid var(--anzhiyu-gray-100);
    &:hover {
      color: var(--anzhiyu-main);
      border-bottom-color: var(--anzhiyu-main);
    }
  }
}
[data-theme="dark"] .reward .reward-button,
[data-theme="dark"] .button-group .subscribe-button {
  opacity: 0.5;
  -ms-filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=50)";
  filter: alpha(opacity=50);
}
</style>
