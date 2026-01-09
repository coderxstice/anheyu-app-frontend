<script setup lang="ts">
import { computed, ref, type PropType } from "vue";
import type { Article } from "@/api/post/type";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import HandHeartIcon from "@iconify-icons/ri/hand-heart-fill";
import RssIcon from "@iconify-icons/ri/plant-fill";
import ShareIcon from "@iconify-icons/ri/share-box-fill";
import WeiboIcon from "@iconify-icons/ri/weibo-fill";
import QQIcon from "@iconify-icons/ri/qq-fill";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import AnDialog from "@/components/AnDialog/index.vue";
import { useCopyToClipboard } from "@pureadmin/utils";
import { generatePoster, downloadPoster } from "@/utils/posterGenerator";

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
const isGeneratingPoster = ref(false);
const showPosterDialog = ref(false);
const posterDataUrl = ref<string>("");
const { update: copyToClipboard } = useCopyToClipboard();

// 订阅相关状态
const showSubscribeDialog = ref(false);
const subscribeEmail = ref("");
const subscribeCode = ref("");
const isSubscribing = ref(false);
const isSendingCode = ref(false);
const codeCountdown = ref(0);
let codeTimer: ReturnType<typeof setInterval> | null = null;

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
  const avatar = props.article.owner_avatar;
  if (avatar) {
    // 如果是完整 URL，直接使用
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      return avatar;
    }
    // 如果是 Gravatar 相对路径（如 avatar/xxx?d=identicon），拼接 Gravatar base URL
    if (avatar.startsWith("avatar/")) {
      const baseUrl = siteConfig?.GRAVATAR_URL || "https://cravatar.cn";
      return `${baseUrl}/${avatar}`;
    }
    // 其他情况直接返回（可能是本地路径）
    return avatar;
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

  // 获取自定义版权声明模板配置
  const copyrightConfig = siteConfig.post?.copyright;

  // 判断是否为转载文章
  const isReprint =
    props.article.copyright_author &&
    props.article.copyright_author !== actualAuthor;

  if (isReprint) {
    // 转载文章的版权声明
    const originalAuthor = props.article.copyright_author;
    const originalUrl = props.article.copyright_url;

    if (originalUrl) {
      // 有原文链接的转载文章
      const templateWithUrl =
        copyrightConfig?.reprintTemplateWithUrl ||
        copyrightConfig?.reprint_template_with_url ||
        '本文是转载或翻译文章，版权归 <a href="{originalUrl}" target="_blank">{originalAuthor}</a> 所有。建议访问原文，转载本文请联系原作者。';
      return templateWithUrl
        .replace(/{originalAuthor}/g, originalAuthor)
        .replace(/{originalUrl}/g, originalUrl);
    } else {
      // 无原文链接的转载文章
      const templateWithoutUrl =
        copyrightConfig?.reprintTemplateWithoutUrl ||
        copyrightConfig?.reprint_template_without_url ||
        "本文是转载或翻译文章，版权归 {originalAuthor} 所有。建议访问原文，转载本文请联系原作者。";
      return templateWithoutUrl.replace(/{originalAuthor}/g, originalAuthor);
    }
  } else {
    // 原创文章的版权声明（使用文章的实际作者）
    const originalTemplate =
      copyrightConfig?.originalTemplate ||
      copyrightConfig?.original_template ||
      '本文是原创文章，采用 <a href="{licenseUrl}" target="_blank">{license}</a> 协议，完整转载请注明来自 <a href="{siteUrl}" target="_blank">{author}</a>';
    return originalTemplate
      .replace(/{license}/g, license)
      .replace(/{licenseUrl}/g, licenseUrl)
      .replace(/{author}/g, actualAuthor)
      .replace(/{siteUrl}/g, siteUrl);
  }
});

const goAbout = () => {
  router.push({ path: "/about" });
};

const goRss = () => {
  window.open("/rss.xml", "_blank");
};

// 订阅配置
const subscribeConfig = computed(() => ({
  enable: siteConfig.post?.subscribe?.enable ?? false,
  buttonText: siteConfig.post?.subscribe?.buttonText || "订阅",
  dialogTitle: siteConfig.post?.subscribe?.dialogTitle || "订阅博客更新",
  dialogDesc:
    siteConfig.post?.subscribe?.dialogDesc || "输入您的邮箱，获取最新文章推送"
}));

// 处理订阅按钮点击
const handleSubscribeClick = () => {
  if (subscribeConfig.value.enable) {
    subscribeEmail.value = "";
    subscribeCode.value = "";
    showSubscribeDialog.value = true;
  } else {
    goRss();
  }
};

// 发送验证码
const handleSendCode = async () => {
  if (!subscribeEmail.value) {
    ElMessage.warning("请输入邮箱地址");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(subscribeEmail.value)) {
    ElMessage.warning("请输入有效的邮箱地址");
    return;
  }

  if (isSendingCode.value || codeCountdown.value > 0) return;

  try {
    isSendingCode.value = true;
    const response = await fetch("/api/public/subscribe/code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: subscribeEmail.value })
    });

    const data = await response.json();

    if (response.ok) {
      ElMessage.success("验证码已发送，请查收邮件");
      codeCountdown.value = 60;
      codeTimer = setInterval(() => {
        codeCountdown.value--;
        if (codeCountdown.value <= 0) {
          if (codeTimer) clearInterval(codeTimer);
        }
      }, 1000);
    } else {
      ElMessage.error(data.message || "发送验证码失败，请稍后重试");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "发送验证码失败，请稍后重试");
  } finally {
    isSendingCode.value = false;
  }
};

// 提交订阅
const handleSubscribe = async () => {
  if (!subscribeEmail.value) {
    ElMessage.warning("请输入邮箱地址");
    return;
  }

  // 简单的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(subscribeEmail.value)) {
    ElMessage.warning("请输入有效的邮箱地址");
    return;
  }

  if (!subscribeCode.value) {
    ElMessage.warning("请输入验证码");
    return;
  }

  try {
    isSubscribing.value = true;
    const response = await fetch("/api/public/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: subscribeEmail.value,
        code: subscribeCode.value
      })
    });

    const data = await response.json();

    if (response.ok) {
      ElMessage.success("订阅成功！您将在新文章发布时收到邮件通知");
      showSubscribeDialog.value = false;
      subscribeEmail.value = "";
      subscribeCode.value = "";
      codeCountdown.value = 0;
      if (codeTimer) clearInterval(codeTimer);
    } else {
      ElMessage.error(data.message || "订阅失败，请稍后重试");
    }
  } catch (error: any) {
    ElMessage.error(error.message || "订阅失败，请稍后重试");
  } finally {
    isSubscribing.value = false;
  }
};

const goRewardPage = () => {
  router.push({ path: "/about" });
};

// 生成分享海报
const handleGeneratePoster = async () => {
  if (isGeneratingPoster.value) return;

  try {
    isGeneratingPoster.value = true;
    ElMessage.info("正在生成海报...");

    // 获取当前文章URL
    const articleUrl = window.location.href;

    // 获取文章封面图
    const coverImage = props.article.cover_url || undefined;

    // 获取文章简介（优先使用第一个摘要）
    const description = props.article.summaries?.[0] || undefined;

    // 格式化发布时间
    const publishDate = formatDate(props.article.created_at);

    // 生成海报
    const dataUrl = await generatePoster({
      title: props.article.title,
      description: description,
      author: articleAuthor.value,
      authorAvatar: articleAuthorAvatar.value,
      siteName: siteConfig.APP_NAME || siteConfig.frontDesk?.siteOwner?.name,
      siteSubtitle: siteConfig.SUB_TITLE,
      articleUrl: articleUrl,
      coverImage: coverImage,
      publishDate: publishDate
    });

    // 保存海报数据并显示弹窗
    posterDataUrl.value = dataUrl;
    showPosterDialog.value = true;
    ElMessage.success("海报生成成功！");
  } catch (error: any) {
    console.error("生成海报失败:", error);
    ElMessage.error(error.message || "生成海报失败，请稍后重试");
  } finally {
    isGeneratingPoster.value = false;
  }
};

// 下载海报
const handleDownloadPoster = () => {
  if (!posterDataUrl.value) return;
  const filename = `${props.article.title || "文章"}_分享海报.png`;
  downloadPoster(posterDataUrl.value, filename);
};

// 获取当前文章URL
const articleUrl = computed(() => window.location.href);

// 复制链接
const handleCopyLink = async () => {
  await copyToClipboard(articleUrl.value);
  ElMessage.success("链接已复制到剪贴板");
};

// 分享到社交平台
const shareToWeibo = () => {
  const url = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(articleUrl.value)}&title=${encodeURIComponent(props.article.title)}`;
  window.open(url, "_blank", "width=600,height=400");
};

const shareToQQ = () => {
  const url = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(articleUrl.value)}&title=${encodeURIComponent(props.article.title)}&summary=${encodeURIComponent(props.article.summaries?.[0] || "")}`;
  window.open(url, "_blank", "width=600,height=400");
};

const shareToQZone = () => {
  const url = `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(articleUrl.value)}&title=${encodeURIComponent(props.article.title)}&summary=${encodeURIComponent(props.article.summaries?.[0] || "")}`;
  window.open(url, "_blank", "width=600,height=400");
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
      <div class="subscribe-button" @click="handleSubscribeClick">
        <IconifyIconOffline :icon="RssIcon" />
        <span>{{ subscribeConfig.buttonText }}</span>
      </div>
      <div
        class="share-button"
        :class="{ loading: isGeneratingPoster }"
        @click="handleGeneratePoster"
      >
        <IconifyIconOffline :icon="ShareIcon" />
        <span>{{ isGeneratingPoster ? "生成中..." : "分享" }}</span>
      </div>
    </div>

    <div class="copyright-notice">
      <span v-html="copyrightInfo" />
    </div>

    <!-- 海报预览弹窗 -->
    <AnDialog
      v-model="showPosterDialog"
      title="分享海报"
      width="720px"
      max-width="95vw"
      :show-footer="false"
      class="share-poster-dialog"
    >
      <div class="poster-dialog-content">
        <!-- 左侧：海报预览 -->
        <div class="poster-preview-side">
          <div v-if="posterDataUrl" class="poster-image-wrapper">
            <img :src="posterDataUrl" alt="分享海报" class="poster-image" />
          </div>
          <div v-else class="poster-loading">
            <p>正在生成海报...</p>
          </div>
        </div>

        <!-- 右侧：操作区域 -->
        <div class="poster-actions-side">
          <!-- 复制链接 -->
          <div class="action-section">
            <div class="section-label">点击复制链接：</div>
            <el-input
              :model-value="articleUrl"
              readonly
              class="url-input"
              @click="handleCopyLink"
            />
          </div>

          <!-- 分享到 -->
          <div class="action-section">
            <div class="section-label">分享到：</div>
            <div class="share-buttons">
              <el-button
                class="share-btn share-btn-weibo"
                @click="shareToWeibo"
              >
                <IconifyIconOffline :icon="WeiboIcon" />
                <span>微博</span>
              </el-button>
              <el-button class="share-btn share-btn-qq" @click="shareToQQ">
                <IconifyIconOffline :icon="QQIcon" />
                <span>QQ好友</span>
              </el-button>
              <el-button
                class="share-btn share-btn-qzone"
                @click="shareToQZone"
              >
                <IconifyIconOffline :icon="QQIcon" />
                <span>QQ空间</span>
              </el-button>
            </div>
          </div>

          <!-- 下载海报 -->
          <div class="action-section">
            <div class="section-label">下载海报：</div>
            <el-button class="download-btn" @click="handleDownloadPoster">
              <span>点击下载</span>
            </el-button>
          </div>
        </div>
      </div>
    </AnDialog>

    <!-- 订阅弹窗 -->
    <AnDialog
      v-model="showSubscribeDialog"
      :title="subscribeConfig.dialogTitle"
      width="400px"
      max-width="90vw"
      :show-footer="false"
      class="subscribe-dialog"
    >
      <div class="subscribe-dialog-content">
        <p class="subscribe-desc">{{ subscribeConfig.dialogDesc }}</p>
        <el-input
          v-model="subscribeEmail"
          placeholder="请输入您的邮箱"
          size="large"
          :disabled="isSubscribing"
          @keyup.enter="handleSubscribe"
        />
        <div class="code-input-wrapper">
          <el-input
            v-model="subscribeCode"
            placeholder="请输入验证码"
            size="large"
            :disabled="isSubscribing"
            @keyup.enter="handleSubscribe"
          />
          <el-button
            type="primary"
            size="large"
            :disabled="codeCountdown > 0 || isSendingCode"
            @click="handleSendCode"
            class="send-code-btn"
          >
            {{ codeCountdown > 0 ? `${codeCountdown}s` : "发送验证码" }}
          </el-button>
        </div>
        <div class="subscribe-actions">
          <el-button
            type="primary"
            size="large"
            :loading="isSubscribing"
            @click="handleSubscribe"
          >
            {{ isSubscribing ? "订阅中..." : "订阅" }}
          </el-button>
        </div>
        <p class="subscribe-tips">您可以随时通过邮件中的链接取消订阅</p>
      </div>
    </AnDialog>
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
  .subscribe-button,
  .share-button {
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

    &.loading {
      cursor: not-allowed;
      opacity: 0.7;
    }
  }

  .subscribe-button {
    background: var(--anzhiyu-green);
  }

  .share-button {
    background: var(--anzhiyu-blue);
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

.poster-dialog-content {
  display: flex;
  gap: 1.5rem;
  padding: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.2rem;
  }
}

.poster-preview-side {
  flex: 0 0 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;

  @media (max-width: 768px) {
    flex: 1;
    width: 100%;
  }

  .poster-image-wrapper {
    width: 100%;
    max-width: 320px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  .poster-image {
    width: 100%;
    height: auto;
    display: block;
  }

  .poster-loading {
    padding: 3rem;
    text-align: center;
    color: var(--anzhiyu-secondtext);
    font-size: 14px;
  }
}

.poster-actions-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
  justify-content: center;

  .action-section {
    .section-label {
      margin-bottom: 0.6rem;
      font-size: 14px;
      color: var(--anzhiyu-fontcolor);
    }

    .url-input {
      :deep(.el-input__wrapper) {
        cursor: pointer;
        font-size: 13px;
        background: var(--anzhiyu-card-bg);
        border: var(--style-border);
        box-shadow: none;
        border-radius: 6px;
        transition: all 0.3s ease;

        &:hover {
          border-color: var(--anzhiyu-main);
        }
      }
    }

    .share-buttons {
      display: flex;
      flex-direction: column;
      gap: 0;

      .share-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border: none;
        font-weight: 500;
        padding: 12px 20px;
        font-size: 14px;
        border-radius: 6px;
        width: 100%;

        &:hover {
          opacity: 0.9;
        }

        svg {
          font-size: 18px;
        }

        &.share-btn-weibo {
          background: #e6162d;
          color: #fff;

          &:hover {
            background: #d1142a;
          }
        }

        &.share-btn-qq {
          background: #12b7f5;
          color: #fff;
          margin-top: 0.6rem;
          margin-left: 0;

          &:hover {
            background: #0fa5db;
          }
        }

        &.share-btn-qzone {
          background: #fcee21;
          color: #333;
          margin-top: 0.6rem;
          margin-left: 0;

          &:hover {
            background: #f5e31a;
          }
        }
      }
    }

    .download-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      background: #4a4a4a;
      border: none;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 6px;
      color: #fff;

      &:hover {
        background: #3a3a3a;
      }
    }
  }
}

// 订阅弹窗样式
.subscribe-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  text-align: center;

  .subscribe-desc {
    margin: 0 0 1.5rem;
    font-size: 15px;
    color: var(--anzhiyu-secondtext);
    line-height: 1.6;
  }

  .code-input-wrapper {
    display: flex;
    gap: 12px;
    width: 100%;
    max-width: 300px;
    margin-top: 1rem;

    .el-input {
      flex: 1;
      width: auto;
      max-width: none;
    }

    .send-code-btn {
      width: 110px;
      flex-shrink: 0;
      border-radius: 8px;
      font-weight: 600;
    }
  }

  :deep(.el-input) {
    width: 100%;
    max-width: 300px;

    .el-input__wrapper {
      background: var(--anzhiyu-card-bg);
      border: var(--style-border);
      box-shadow: none;

      &:hover,
      &.is-focus {
        border-color: var(--anzhiyu-theme);
        box-shadow: none;
      }
      border-radius: 8px;
    }
  }

  .subscribe-actions {
    margin-top: 1.5rem;
    width: 100%;
    max-width: 300px;

    .el-button {
      width: 100%;
      border-radius: 8px;
      font-weight: 600;
    }
  }

  .subscribe-tips {
    margin: 1rem 0 0;
    font-size: 12px;
    color: var(--anzhiyu-secondtext);
    opacity: 0.7;
  }
}
</style>
