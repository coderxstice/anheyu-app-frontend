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
                  v-if="props.downloadBtn"
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
  },
  downloadBtn: {
    type: Boolean,
    default: false
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

const loadedImageIndexes = ref(new Set<number>());
const imageDimensionsCache = ref(
  new Map<string, { width: number; height: number }>()
);

const siteConfigStore = useSiteConfigStore();

const siteName = computed(
  () => siteConfigStore.getSiteConfig?.APP_NAME || "安和鱼"
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

// 优化 getImageSize 函数，增加缓存逻辑
const getImageSize = (url: string) => {
  // 如果缓存中已有尺寸，直接返回
  if (imageDimensionsCache.value.has(url)) {
    return Promise.resolve(imageDimensionsCache.value.get(url)!);
  }
  // 否则，正常加载并存入缓存
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
      imageDimensionsCache.value.set(url, dimensions); // 存入缓存
      resolve(dimensions);
    };
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
  if (popupRef.value) {
    gsap.killTweensOf(popupRef.value);
  }
  gsap.killTweensOf([".az-preview-image", ".caption"]);

  // const isCached = loadedImageIndexes.value.has(index);

  imageKey.value = `${index}-${Date.now()}`;
  visible.value = true;
  loading.value = true;
  containerVisible.value = false;

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

  // await nextTick();

  if (popupRef.value) {
    if (next) {
      containerVisible.value = true;
    } else {
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
          duration: 0.2,
          ease: "power2.out",
          onComplete: () => {
            containerVisible.value = true;
          }
        }
      );
    }
  }

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
  // 图片成功加载后，将其索引添加到记录中
  loadedImageIndexes.value.add(currentIndex.value);

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

  if (popupRef.value) {
    tl.to(popupRef.value, {
      width: finalWidth.value,
      height: finalHeight.value,
      duration: 0.3,
      ease: "power3.inOut"
    });
  }

  tl.add(() => {
    loading.value = false;
    gsap.set([".az-preview-image", ".caption"], { opacity: 0 });
  });

  tl.to([".az-preview-image", ".caption"], {
    opacity: 1,
    duration: 0.2,
    stagger: 0.1
  });
}
const close = () => {
  if (popupRef.value) {
    gsap.to(
      ".poptrox-popup .closer, .poptrox-popup .nav-previous, .poptrox-popup .nav-next",
      {
        opacity: 0,
        duration: 0.15,
        ease: "power2.in"
      }
    );

    gsap.to(popupRef.value, {
      opacity: 0,
      scale: 0.7,
      duration: 0.15,
      ease: "power2.in",
      x: "-50%",
      y: "-50%",
      onComplete: () => {
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
