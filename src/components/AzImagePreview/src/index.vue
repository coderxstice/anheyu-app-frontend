<template>
  <Teleport to="body">
    <Transition name="az-fade">
      <div v-show="visible" class="az-preview-overlay" @click.self="close">
        <div
          style="display: inline-block; height: 100%; vertical-align: middle"
        />
        <div ref="popupRef" class="poptrox-popup" :style="{ opacity: 0 }">
          <div v-if="loading" class="loader" />

          <div v-if="containerVisible" :key="imageKey" class="pic">
            <img
              ref="imgRef"
              class="az-preview-image"
              :src="
                previewSrcList[previewIndex]?.bigParam
                  ? previewSrcList[previewIndex]?.imageUrl +
                    `?${previewSrcList[previewIndex]?.bigParam}`
                  : previewSrcList[previewIndex]?.imageUrl
              "
              @click.stop
              @load="imgLoad()"
            />
          </div>

          <div v-if="!loading" class="caption">
            <div class="tag-info tag-info-bottom">
              <span
                v-if="props.page === 'album'"
                class="tag-device"
                style="margin-right: 4px; margin-bottom: 2px"
              >
                <Fire />
                热度 {{ previewSrcList[currentIndex].viewCount }}
              </span>
              <span
                v-if="props.page === 'album'"
                class="tag-location"
                style="margin-right: 4px"
              >
                <Downloads />
                下载量 {{ downloadCount }}
              </span>
              <span class="tag-location" style="margin-right: 4px">
                <Size />
                大小 {{ formatFileSize(previewSrcList[currentIndex].fileSize) }}
              </span>
              <span class="tag-time">
                <TimeLine />
                {{
                  dayjs(previewSrcList[currentIndex].createTime).format(
                    "YYYY-MM-DD HH:mm:ss"
                  )
                }}
              </span>
            </div>
            <div class="tag-info">
              <span class="tag-categorys">
                <div
                  class="link"
                  @click="downImage(previewSrcList[currentIndex])"
                >
                  <Download style="margin-right: 4px" />
                  原图下载
                </div>
              </span>
            </div>
          </div>

          <span
            v-show="showControls"
            class="az-preview-close closer"
            @click="close"
          />

          <template v-if="previewSrcList.length > 1 && showControls">
            <div class="az-nav nav-previous" @click.stop="prev" />
            <div class="az-nav nav-next" @click.stop="next" />
          </template>
        </div>
      </div>
    </Transition>

    <DownloadProgressBar ref="progressRef" />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";
import gsap from "gsap";
import Download from "@/assets/svg/download.svg?component";
import Downloads from "@/assets/svg/downloads.svg?component";
import Size from "@/assets/svg/size.svg?component";
import Fire from "@/assets/svg/fire.svg?component";
import TimeLine from "@/assets/svg/time-line.svg?component";
import { getFileExtension } from "@/utils/down";
import dayjs from "dayjs";
import { updateWallpaperStat } from "@/api/album-home";
import DownloadProgressBar from "./downloadProgressBar.vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

const props = defineProps({
  page: {
    type: String,
    default: "album"
  }
});

const progressRef = ref();
const popupRef = ref<HTMLElement | null>(null);
const imgRef = ref<HTMLImageElement | null>(null);

const visible = ref(false);
const previewSrcList = ref<any[]>([]);
const previewIndex = ref(0);
const imageKey = ref("");
const containerVisible = ref(false);
const loading = ref(true);
const currentIndex = ref(0);
const downloadCount = ref(0);
const showControls = ref(false);
const isSwitch = ref(false);
let currentImgSize = { width: 0, height: 0 };
let finalWidth = ref("150px");
let finalHeight = ref("150px");

const siteConfigStore = useSiteConfigStore();

const siteName = computed(
  () => siteConfigStore.getSiteConfig?.APP_NAME || "猫鱼"
);

const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return (size / 1024 / 1024).toFixed(2) + " MB";
  } else if (size >= 1024) {
    return (size / 1024).toFixed(2) + " KB";
  } else {
    return size + " B";
  }
};
const downImage = (imageInfo: any) => {
  if (props.page === "album") {
    updateWallpaperStat({
      id: imageInfo.id,
      type: "download"
    }).then(() => {
      downloadCount.value++;
      const finalDownloadUrl = imageInfo.downloadUrl;
      const extension = getFileExtension(finalDownloadUrl);
      const fileName = `${siteName.value}.${extension}`;
      progressRef.value.downloadImageWithProgress(finalDownloadUrl, fileName);
    });
  } else {
    // 不需要更新下载次数
    const finalDownloadUrl = imageInfo.downloadUrl;
    const extension = getFileExtension(finalDownloadUrl);
    const fileName = `${siteName.value}.${extension}`;
    progressRef.value.downloadImageWithProgress(finalDownloadUrl, fileName);
  }
};
const getImageSize = (url: string) => {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
};

const handleResize = () => {
  if (visible.value && popupRef.value && !loading.value) {
    const isMobile = window.innerWidth < 600;
    let targetWidth: string, targetHeight: string;
    if (isMobile) {
      targetWidth = "100vw";
      targetHeight = "auto";
    } else {
      const viewportWidth = window.innerWidth * 0.9;
      const viewportHeight = window.innerHeight * 0.9;
      const ratio = Math.min(
        viewportWidth / currentImgSize.width,
        viewportHeight / currentImgSize.height,
        1
      );
      targetWidth = `${Math.floor(currentImgSize.width * ratio)}px`;
      targetHeight = `${Math.floor(currentImgSize.height * ratio)}px`;
    }
    gsap.to(popupRef.value, {
      width: targetWidth,
      height: targetHeight,
      duration: 0.3,
      ease: "power2.out"
    });
    finalWidth.value = targetWidth;
    finalHeight.value = targetHeight;
  }
};
const handleKeydown = (e: KeyboardEvent) => {
  if (!visible.value || !showControls.value) return;
  switch (e.key) {
    case "Escape":
      close();
      break;
    case "ArrowLeft":
      prev();
      break;
    case "ArrowRight":
      next();
      break;
  }
};
onMounted(() => {
  window.addEventListener("resize", handleResize);
  window.addEventListener("keydown", handleKeydown);
});
onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("keydown", handleKeydown);
});

const open = async (list: Array<any>, index = 0, next = false) => {
  // 这使得动画可以被随时打断
  if (popupRef.value) {
    gsap.killTweensOf(popupRef.value);
  }
  gsap.killTweensOf([".az-preview-image", ".caption"]);

  imageKey.value = `${index}-${Date.now()}`;
  visible.value = true;
  loading.value = true;
  containerVisible.value = false;

  // 只有在“全新打开”时才隐藏按钮，翻页切换时保持显示
  if (!next) {
    showControls.value = false;
  }

  previewSrcList.value = list;
  previewIndex.value = index;
  currentIndex.value = index;
  downloadCount.value = list[index].downloadCount;

  isSwitch.value = next;

  if (props.page === "album") {
    updateWallpaperStat({
      id: list[index].id,
      type: "view"
    })
      .then(() => {
        list[index].viewCount++;
      })
      .catch(err => {
        console.error("Failed to update view count:", err);
      });
  }

  await nextTick();

  // 阶段一：显示初始加载框
  if (popupRef.value) {
    // 如果是图片切换，则不播放初始的“从无到有”的动画，因为弹窗已经是打开状态
    if (next) {
      // 对于切换，我们直接让 containerVisible 为 true，以便立即加载下一张图片
      containerVisible.value = true;
    } else {
      // 对于全新打开，播放初始加载框动画
      gsap.fromTo(
        popupRef.value,
        {
          width: "150px",
          height: "150px",
          scale: 0.7,
          opacity: 0,
          x: "-50%",
          y: "-50%"
        },
        {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
          onComplete: () => {
            containerVisible.value = true; // 加载框出现后，才开始加载图片
          }
        }
      );
    }
  }

  // 后台获取图片最终尺寸
  const imgUrl = list[index].bigParam
    ? list[index].imageUrl + `?${list[index].bigParam}`
    : list[index].imageUrl;

  try {
    currentImgSize = await getImageSize(imgUrl);
  } catch (error) {
    console.error("Image size calculation failed:", error);
    close();
  }
};

function imgLoad() {
  // 阶段二：图片加载完成，执行“放大 -> 切换内容 -> 淡入内容”的动画序列
  const isMobile = window.innerWidth < 600;
  if (isMobile) {
    finalWidth.value = "100vw";
    finalHeight.value = "auto";
  } else {
    const viewportWidth = window.innerWidth * 0.9;
    const viewportHeight = window.innerHeight * 0.9;
    const ratio = Math.min(
      viewportWidth / currentImgSize.width,
      viewportHeight / currentImgSize.height,
      1
    );
    finalWidth.value = `${Math.floor(currentImgSize.width * ratio)}px`;
    finalHeight.value = `${Math.floor(currentImgSize.height * ratio)}px`;
  }

  const tl = gsap.timeline({
    onComplete: () => {
      showControls.value = true;
    }
  });

  // 动画1：放大弹窗
  if (popupRef.value) {
    tl.to(popupRef.value, {
      width: finalWidth.value,
      height: finalHeight.value,
      duration: 0.5,
      ease: "power3.inOut"
    });
  }

  // 动画2：在放大动画完成后，切换内容
  tl.add(() => {
    loading.value = false;
    gsap.set([".az-preview-image", ".caption"], { opacity: 0 });
  });

  // 动画3：平滑淡入图片和文字
  tl.to([".az-preview-image", ".caption"], {
    opacity: 1,
    duration: 0.4,
    stagger: 0.1
  });
}
const close = () => {
  if (popupRef.value) {
    // 动画1：让操作按钮平滑淡出
    gsap.to(
      ".poptrox-popup .closer, .poptrox-popup .nav-previous, .poptrox-popup .nav-next",
      {
        opacity: 0,
        duration: 0.15,
        ease: "power2.in"
      }
    );

    // 动画2：让主弹窗缩小并淡出
    gsap.to(popupRef.value, {
      opacity: 0,
      scale: 0.7,
      duration: 0.15,
      ease: "power2.in",
      x: "-50%",
      y: "-50%",
      onComplete: () => {
        // 动画结束后，更新状态并重置所有相关样式
        visible.value = false;
        containerVisible.value = false;
        showControls.value = false;

        gsap.set(
          ".poptrox-popup .closer, .poptrox-popup .nav-previous, .poptrox-popup .nav-next",
          { clearProps: "opacity" }
        );

        gsap.set(popupRef.value, { clearProps: "all" });
      }
    });
  } else {
    visible.value = false;
  }
};

const next = () => {
  open(
    previewSrcList.value,
    (previewIndex.value + 1) % previewSrcList.value.length,
    true
  );
};

const prev = () => {
  open(
    previewSrcList.value,
    (previewIndex.value - 1 + previewSrcList.value.length) %
      previewSrcList.value.length,
    true
  );
};

defineExpose({ open, downImage });
</script>

<style scoped lang="scss">
$popup-bg: rgb(31 34 36 / 92.5%);
$gradient-color: rgb(31 34 36 / 35%);
$caption-gradient: linear-gradient(
  to top,
  rgb(16 16 16 / 45%) 25%,
  rgb(16 16 16 / 0%) 100%
);
$transition: opacity 0.2s ease-in-out;

@keyframes spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(359deg);
  }
}

.az-fade-enter-active,
.az-fade-leave-active {
  transition: opacity 0.6s ease;
}

.az-fade-enter-from,
.az-fade-leave-to {
  opacity: 0;
}

.pic-fade-enter-active {
  transition:
    opacity 0.5s ease 0.2s,
    transform 0.4s cubic-bezier(0.33, 0, 0.2, 1) 0.2s;
  img {
    transition:
      clip-path 0.4s cubic-bezier(0.33, 0, 0.2, 1),
      filter 0.3s ease;
  }
}

.pic-fade-enter-from {
  opacity: 0;
  transform: translateY(2px) scale(0.995);
  img {
    clip-path: inset(0% 20% 0% 20%);
    filter: brightness(1.02) contrast(0.98);
  }
}

.pic {
  will-change: transform, opacity;
  backface-visibility: hidden;
  img {
    transform: translateZ(0);
  }
}

.az-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 10006;
  display: block;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  text-align: center;
  background: rgb(0 0 0 / 85%);
  backdrop-filter: blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  contain: strict;
  -webkit-tap-highlight-color: rgb(255 255 255 / 0%);

  @media screen and (width <= 736px) {
    .poptrox-popup .tag-info-bottom {
      flex-direction: column;
      align-items: flex-start;
    }
    .poptrox-popup {
      margin-bottom: 120px;
      border-radius: 0 !important;
    }
    .poptrox-popup::before {
      display: none;
    }
    .poptrox-popup .caption {
      position: fixed;
      bottom: 0;
    }
    .poptrox-popup .closer,
    .poptrox-popup .nav-previous,
    .poptrox-popup .nav-next {
      display: none !important;
    }
  }

  .az-preview-image {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    transform: translateZ(0);
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .poptrox-popup {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 1;
    display: inline-block;
    overflow: hidden;
    vertical-align: middle;
    cursor: default;
    background: $popup-bg;
    border-radius: 12px;
    box-shadow: 0 1em 3em 0.5em rgb(0 0 0 / 25%);
    opacity: 0;
    will-change: transform, opacity, width, height;

    @media screen and (width <= 980px) {
      .closer {
        background-size: 3em;
      }
      .nav-previous,
      .nav-next {
        background-size: 4em;
      }
    }

    .az-image-enter {
      opacity: 1 !important;
    }

    &::before {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      display: block;
      width: 100%;
      height: 100%;
      content: "";
      background-image: linear-gradient(
          to left,
          $gradient-color,
          rgb(31 34 36 / 0%) 10em,
          rgb(31 34 36 / 0%)
        ),
        linear-gradient(
          to right,
          $gradient-color,
          rgb(31 34 36 / 0%) 10em,
          rgb(31 34 36 / 0%)
        );
      opacity: 0;
      transition: $transition;
      cursor: auto;
    }

    &:hover::before {
      opacity: 1;
    }

    span.tag-list a {
      color: #fff;
      opacity: 0.8;
      transition: all 0.3s ease-in-out;
    }
    span.tag-list a:hover {
      opacity: 1;
    }

    .tag-info-bottom {
      display: flex;
      span {
        display: flex;
        gap: 4px;
        align-items: center;
        font-size: 14px;
        line-height: 1;
        color: #fff;
      }
    }

    .closer,
    .nav-previous,
    .nav-next {
      position: absolute;
      z-index: 2;
      background-repeat: no-repeat;
      background-position: center;
      opacity: 0;
      transition: $transition;
      cursor: pointer;
    }

    .delayed-hidden {
      opacity: 0 !important;
      pointer-events: none !important;
    }

    .closer {
      top: 0;
      right: 0;
      width: 5em;
      height: 5em;
      color: #fff;
      background-image: url("@/assets/svg/close.svg");
      background-size: 3em;
    }

    .nav-previous,
    .nav-next {
      top: 50%;
      width: 6em;
      height: 8em;
      margin-top: -4em;
      color: #fff;
      cursor: pointer;
      background-image: url("@/assets/svg/arrow.svg");
      background-size: 5em;
    }

    .nav-previous {
      left: 0;
      transform: scaleX(-1);
    }
    .nav-next {
      right: 0;
    }

    .caption {
      position: absolute;
      bottom: 0;
      left: 0;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      padding: 2em 2em 0.1em;
      padding-bottom: 2rem;
      text-align: left;
      background-image: $caption-gradient;
      opacity: 0.8;
      transition: $transition;
      cursor: auto;

      h2,
      h3,
      h4,
      h5,
      h6 {
        margin: 0;
        font-weight: bold;
      }
      p {
        font-size: 15px;
        color: #fff;
      }
    }

    .loader {
      position: absolute;
      top: 50%;
      left: 50%;
      display: block;
      width: 2em;
      height: 2em;
      margin: -1em 0 0 -1em;
      font-size: 2em;
      line-height: 2em;
      text-align: center;
      background-image: url("@/assets/svg/spinner.svg");
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      opacity: 0.25;
      animation: spinner 1s infinite linear !important;
    }

    &:hover .closer,
    &:hover .nav-previous,
    &:hover .nav-next {
      opacity: 0.5;
      &:hover {
        opacity: 1;
      }
    }

    .tag-categorys .link {
      margin: 0;
      background: rgb(0 0 0 / 80%);
      cursor: pointer;
      &:hover {
        background: #0d00ff;
      }
    }
  }

  body.touch .poptrox-popup {
    .closer,
    .nav-previous,
    .nav-next {
      opacity: 1 !important;
    }
  }

  .tag-categorys {
    display: flex;
    .link {
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      margin-top: 12px;
      margin-left: 12px;
      font-size: 12px;
      line-height: 1;
      color: #f7f7fa;
      background: rgb(0 0 0 / 30%);
      backdrop-filter: blur(20px);
      backdrop-filter: saturate(180%) blur(20px);
      border-radius: 8px;
      transition: 0.3s;
      &:hover {
        color: #fff;
        background: #0d00ff;
      }
    }
  }
}
</style>
