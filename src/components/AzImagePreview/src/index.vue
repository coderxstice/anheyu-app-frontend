<template>
  <Teleport to="body">
    <Transition name="az-fade">
      <div v-if="visible" class="az-preview-overlay" @click.self="close">
        <div
          style="display: inline-block; height: 100%; vertical-align: middle"
        />
        <div
          class="poptrox-popup"
          :style="{
            width: containerEnter
              ? containerWidth
              : isSwitch
                ? containerWidth
                : '150px',
            height: containerEnter
              ? containerHeight
              : isSwitch
                ? containerHeight
                : '150px',
            opacity: visible ? 1 : 0
          }"
        >
          <div v-if="loading" class="loader" />
          <Transition name="pic-fade">
            <div v-show="imageReady" class="pic">
              <img
                ref="imgRef"
                class="az-preview-image"
                :class="{ 'az-image-enter': showTransition }"
                :src="
                  previewSrcList[previewIndex].bigParam
                    ? previewSrcList[previewIndex].imageUrl +
                      `?${previewSrcList[previewIndex].bigParam}`
                    : previewSrcList[previewIndex].imageUrl
                "
                @click.stop
                @load="imgLoad()"
              />
            </div>
          </Transition>

          <div
            v-if="!loading"
            class="caption"
            :class="{ 'az-image-enter': showTransition }"
          >
            <div class="tag-info tag-info-bottom">
              <span
                class="tag-device"
                style="margin-right: 4px; margin-bottom: 2px"
              >
                <Fire />
                热度 {{ previewSrcList[currentIndex].viewCount }}
              </span>
              <span class="tag-location" style="margin-right: 4px">
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
          <span class="az-preview-close closer" @click="close" />
          <template v-if="previewSrcList.length > 1">
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

const progressRef = ref();

const visible = ref(false);
const previewSrcList = ref([]);
const previewIndex = ref(0);
const imageReady = ref(false);
const containerVisible = ref(true);
const containerWidth = ref("150px");
const containerHeight = ref("150px");
const containerEnter = ref(false);
const loading = ref(true);
const showTransition = ref(false);
const currentIndex = ref(0);

const downloadCount = ref(0);

let currentImgSize = { width: 0, height: 0 };

const siteConfigStore = useSiteConfigStore();

const siteName = computed(
  () => siteConfigStore.getSiteConfig?.APP_NAME || "鱼鱼相册"
);

const formatFileSize = size => {
  if (size >= 1024 * 1024) {
    return (size / 1024 / 1024).toFixed(2) + " MB";
  } else if (size >= 1024) {
    return (size / 1024).toFixed(2) + " KB";
  } else {
    return size + " B";
  }
};

const downImage = imageInfo => {
  updateWallpaperStat({
    id: imageInfo.id,
    type: "download"
  }).then(() => {
    downloadCount.value++;

    const finalDownloadUrl = imageInfo.downloadUrl;

    const extension = getFileExtension(finalDownloadUrl);
    const fileName = `${siteName.value}.${extension}`;

    // 使用图片原始的 downloadUrl 和动态生成的文件名进行下载
    progressRef.value.downloadImageWithProgress(finalDownloadUrl, fileName);
  });
};

const getImageSize = (url: string) => {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = url;
  });
};

const updateContainerSize = () => {
  const isMobile = window.innerWidth < 600;

  if (isMobile) {
    containerWidth.value = `100vw`;
    containerHeight.value = `auto`;
    return;
  }

  const viewportWidth = window.innerWidth * 0.9;
  const viewportHeight = window.innerHeight * 0.9;

  const widthRatio = viewportWidth / currentImgSize.width;
  const heightRatio = viewportHeight / currentImgSize.height;
  const ratio = Math.min(widthRatio, heightRatio, 1);

  const targetWidth = Math.floor(currentImgSize.width * ratio);
  const targetHeight = Math.floor(currentImgSize.height * ratio);

  containerWidth.value = `${targetWidth}px`;
  containerHeight.value = `${targetHeight}px`;
};

const handleResize = () => {
  if (visible.value && currentImgSize.width && currentImgSize.height) {
    updateContainerSize();
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  if (!visible.value) return;
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

const isSwitch = ref(false);

const open = async (list: Array<any>, index = 0, next = false) => {
  visible.value = true;
  containerEnter.value = false;
  imageReady.value = false;
  containerVisible.value = false;
  loading.value = true;

  previewSrcList.value = list;
  previewIndex.value = index;
  downloadCount.value = list[index].downloadCount;

  if (next) {
    isSwitch.value = true;
  } else {
    isSwitch.value = false;
  }

  const imgUrl = list[index].bigParam
    ? list[index].imageUrl + `?${list[index].bigParam}`
    : list[index].imageUrl;
  currentIndex.value = index;
  // 预加载
  const size = await getImageSize(imgUrl);
  currentImgSize = size;

  await nextTick();
  updateContainerSize();
  await nextTick();

  requestAnimationFrame(() => {
    containerVisible.value = true;
  });
};

function imgLoad() {
  containerEnter.value = true;

  updateWallpaperStat({
    id: previewSrcList.value[previewIndex.value].id,
    type: "view"
  }).then(() => {
    loading.value = false;
    imageReady.value = true;
    showTransition.value = true;
  });
}

const close = () => {
  visible.value = false;
  containerVisible.value = false;
  containerEnter.value = false;
  imageReady.value = false;
  showTransition.value = false;
};

const next = () => {
  previewIndex.value = (previewIndex.value + 1) % previewSrcList.value.length;
  currentIndex.value = previewIndex.value;
  reopenCurrentImage();
};

const prev = () => {
  previewIndex.value =
    (previewIndex.value - 1 + previewSrcList.value.length) %
    previewSrcList.value.length;
  currentIndex.value = previewIndex.value;
  reopenCurrentImage();
};

const reopenCurrentImage = () => {
  open(previewSrcList.value, previewIndex.value, true);
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

/* 添加淡入淡出动画 */
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
    transform 0.4s cubic-bezier(0.33, 0, 0.2, 1) 0.2s; // 更平缓的贝塞尔曲线

  img {
    transition:
      clip-path 0.4s cubic-bezier(0.33, 0, 0.2, 1),
      filter 0.3s ease;
  }
}

.pic-fade-enter-from {
  opacity: 0;
  transform: translateY(2px) scale(0.995); // 减少位移和缩放幅度

  img {
    clip-path: inset(0% 20% 0% 20%); // 改为中间展开式裁剪
    filter: brightness(1.02) contrast(0.98); // 减少滤镜强度
  }
}

/* 添加动画性能优化 */
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
    transform: translateZ(0); // 强制开启 GPU 合成
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .poptrox-popup {
    position: relative;
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 1;
    display: inline-block;
    width: 150px;
    min-width: 150px;
    height: 150px;
    min-height: 150px;
    overflow: hidden;
    vertical-align: middle;
    cursor: default;
    cursor: pointer;
    background: $popup-bg;
    border-radius: 12px;
    box-shadow: 0 1em 3em 0.5em rgb(0 0 0 / 25%);
    opacity: 0;
    transition:
      width 0.5s ease,
      height 0.5s ease;
    transform: translate(-50%, -50%);
    will-change: transform, opacity;

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

    &:hover {
      .closer,
      .nav-previous,
      .nav-next {
        opacity: 0.5;

        &:hover {
          opacity: 1;
        }
      }
    }

    .tag-categorys {
      .link {
        margin: 0;
        background: rgb(0 0 0 / 80%);

        &:hover {
          background: #0d00ff;
        }
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
