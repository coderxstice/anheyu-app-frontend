<template>
  <Teleport to="body">
    <Transition name="az-fade">
      <div v-show="visible" class="az-preview-overlay" @click="close">
        <div
          style="display: inline-block; height: 100%; vertical-align: middle"
        />
        <div
          ref="popupRef"
          class="poptrox-popup"
          :style="{ opacity: 0 }"
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd"
        >
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
              @load="imgLoad()"
            />
          </div>

          <div v-if="!loading" class="caption">
            <!-- 标题和描述 -->
            <div
              v-if="
                props.page === 'album' &&
                (previewSrcList[currentIndex]?.title ||
                  previewSrcList[currentIndex]?.description)
              "
              class="image-title-desc"
            >
              <h3
                v-if="previewSrcList[currentIndex]?.title"
                class="image-title"
              >
                {{ previewSrcList[currentIndex].title }}
              </h3>
              <p
                v-if="previewSrcList[currentIndex]?.description"
                class="image-description"
              >
                {{ previewSrcList[currentIndex].description }}
              </p>
            </div>
            <div class="tag-info-row">
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
                  大小
                  {{ formatFileSize(previewSrcList[currentIndex].fileSize) }}
                </span>
                <span class="tag-time">
                  <TimeLine />
                  {{
                    formatToChina(
                      previewSrcList[currentIndex].created_at ||
                        previewSrcList[currentIndex].createTime
                    )
                  }}
                </span>
                <span
                  v-if="
                    props.page === 'album' &&
                    previewSrcList[currentIndex].location
                  "
                  class="tag-location"
                >
                  <Location />
                  {{ previewSrcList[currentIndex].location }}
                </span>
              </div>
              <div
                v-if="props.downloadBtn"
                class="download-btn"
                @click.stop="downImage(previewSrcList[currentIndex])"
              >
                <Download style="margin-right: 4px" />
                原图下载
              </div>
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
import { ref, onMounted, onUnmounted, computed } from "vue";
import gsap from "gsap";
import Download from "@/assets/svg/download.svg?component";
import Downloads from "@/assets/svg/downloads.svg?component";
import Size from "@/assets/svg/size.svg?component";
import Fire from "@/assets/svg/fire.svg?component";
import TimeLine from "@/assets/svg/time-line.svg?component";
import Location from "@/assets/svg/map-pin-2-line.svg?component";
import { getFileExtension } from "@/utils/down";
import { formatToChina } from "@/utils/dayjs";
import { updateWallpaperStat } from "@/api/album-home";
import DownloadProgressBar from "./downloadProgressBar.vue";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

// 触摸滑动相关
let touchStartX = 0;
let touchEndX = 0;
const minSwipeDistance = 50;

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
    const isMobile = window.innerWidth <= 736;
    let targetWidth: string, targetHeight: string;
    if (isMobile) {
      targetWidth = "100vw";
      targetHeight = "100vh";
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

// 触摸事件处理
const handleTouchStart = (e: TouchEvent) => {
  touchStartX = e.changedTouches[0].screenX;
};

const handleTouchEnd = (e: TouchEvent) => {
  if (!visible.value || !showControls.value) return;
  if (previewSrcList.value.length <= 1) return;

  touchEndX = e.changedTouches[0].screenX;
  const swipeDistance = touchEndX - touchStartX;

  if (Math.abs(swipeDistance) > minSwipeDistance) {
    if (swipeDistance > 0) {
      // 向右滑动 -> 上一张
      prev();
    } else {
      // 向左滑动 -> 下一张
      next();
    }
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

  const isMobile = window.innerWidth <= 736;

  if (popupRef.value) {
    if (next) {
      containerVisible.value = true;
    } else {
      if (isMobile) {
        // 移动端：直接全屏显示，无动画
        gsap.set(popupRef.value, {
          width: "100vw",
          height: "100vh",
          top: 0,
          left: 0,
          transform: "none",
          opacity: 1
        });
        containerVisible.value = true;
      } else {
        // 桌面端：使用原有动画
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

  // 直接从 imgRef 获取图片实际尺寸，避免竞态条件
  // 因为 @load 事件触发时图片已加载完成，naturalWidth/naturalHeight 是可用的
  if (imgRef.value) {
    currentImgSize = {
      width: imgRef.value.naturalWidth,
      height: imgRef.value.naturalHeight
    };
    // 同时更新缓存
    const imgUrl = previewSrcList.value[previewIndex.value]?.bigParam
      ? previewSrcList.value[previewIndex.value]?.imageUrl +
        `?${previewSrcList.value[previewIndex.value]?.bigParam}`
      : previewSrcList.value[previewIndex.value]?.imageUrl;
    if (imgUrl) {
      imageDimensionsCache.value.set(imgUrl, { ...currentImgSize });
    }
  }

  const isMobile = window.innerWidth <= 736;
  if (isMobile) {
    finalWidth.value = "100vw";
    finalHeight.value = "100vh";
    // 移动端直接设置，不需要动画
    if (popupRef.value) {
      gsap.set(popupRef.value, {
        width: "100vw",
        height: "100vh",
        top: 0,
        left: 0,
        transform: "none"
      });
    }
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

  if (popupRef.value && !isMobile) {
    // 桌面端才需要动画
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
  const isMobile = window.innerWidth <= 736;

  if (popupRef.value) {
    // 隐藏控制按钮
    gsap.to(
      ".poptrox-popup .closer, .poptrox-popup .nav-previous, .poptrox-popup .nav-next",
      {
        opacity: 0,
        duration: 0.15,
        ease: "power2.in"
      }
    );

    // 隐藏图片和说明文字
    gsap.to([".az-preview-image", ".caption"], {
      opacity: 0,
      duration: 0.15,
      ease: "power2.in"
    });

    if (isMobile) {
      // 移动端：淡出动画
      gsap.to(popupRef.value, {
        opacity: 0,
        scale: 0.95,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          visible.value = false;
          containerVisible.value = false;
          showControls.value = false;

          gsap.set(
            ".poptrox-popup .closer, .poptrox-popup .nav-previous, .poptrox-popup .nav-next",
            { clearProps: "opacity" }
          );

          gsap.set([".az-preview-image", ".caption"], {
            clearProps: "opacity"
          });
          gsap.set(popupRef.value, { clearProps: "all" });
        }
      });
    } else {
      // 桌面端：原有动画
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

          gsap.set([".az-preview-image", ".caption"], {
            clearProps: "opacity"
          });
          gsap.set(popupRef.value, { clearProps: "all" });
        }
      });
    }
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
    .az-preview-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .az-preview-overlay > div:first-of-type {
      display: none !important;
    }

    .poptrox-popup .tag-info-bottom {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .poptrox-popup {
      position: fixed !important;
      margin: 0 !important;
      border-radius: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      top: 0 !important;
      left: 0 !important;
      transform: none !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
    }

    .poptrox-popup::before {
      display: none;
    }

    .poptrox-popup .pic {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-bottom: 200px;
      box-sizing: border-box;
    }

    .poptrox-popup .az-preview-image {
      max-width: 90%;
      max-height: calc(100vh - 200px);
      width: auto;
      height: auto;
      object-fit: contain;
      display: block;
    }

    .poptrox-popup .caption {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
      background: linear-gradient(
        to top,
        rgb(16 16 16 / 95%) 0%,
        rgb(16 16 16 / 85%) 30%,
        rgb(16 16 16 / 0%) 100%
      );
      backdrop-filter: blur(20px);
      border-radius: 0;
      z-index: 3;
    }

    .poptrox-popup .image-title-desc {
      margin-bottom: 8px;

      .image-title {
        margin: 0 0 3px;
        font-size: 15px;
        font-weight: 600;
        line-height: 1.3;
        color: #fff;
      }

      .image-description {
        display: -webkit-box;
        margin: 0;
        overflow: hidden;
        font-size: 12px;
        line-height: 1.4;
        color: rgb(255 255 255 / 80%);
        line-clamp: 2;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }

    .poptrox-popup .tag-info-row {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .poptrox-popup .tag-info-bottom {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .poptrox-popup .tag-info-bottom span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      margin: 0;
      font-size: 11px;
      white-space: nowrap;
      background: rgb(255 255 255 / 10%);
      border-radius: 4px;
    }

    .poptrox-popup .tag-info-bottom span svg {
      flex-shrink: 0;
      width: 14px;
      height: 14px;
    }

    .poptrox-popup .download-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 10px 16px;
      font-size: 13px;
      color: #f7f7fa;
      cursor: pointer;
      background: rgb(255 255 255 / 15%);
      backdrop-filter: blur(10px);
      border-radius: 8px;

      &:active {
        background: rgb(255 255 255 / 25%);
      }
    }

    .poptrox-popup .tag-categorys {
      margin-top: 8px;
    }

    .poptrox-popup .tag-categorys .link {
      padding: 10px 16px;
      font-size: 14px;
      margin: 0;
      width: 100%;
      justify-content: center;
      border-radius: 8px;
      background: rgb(255 255 255 / 15%);
      backdrop-filter: blur(10px);
    }

    .poptrox-popup .tag-categorys .link:active {
      background: rgb(255 255 255 / 25%);
    }

    /* 移动端隐藏导航按钮 */
    .poptrox-popup .closer {
      display: none !important;
    }

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
      cursor: auto;
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
      cursor: pointer;
      background-repeat: no-repeat;
      background-position: center;
      opacity: 0;
      transition: $transition;
    }

    .delayed-hidden {
      pointer-events: none !important;
      opacity: 0 !important;
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
      cursor: auto;
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

      .image-title-desc {
        margin-bottom: 8px;

        .image-title {
          margin: 0 0 6px;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.4;
          color: #fff;
        }

        .image-description {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: var(--anzhiyu-white);
        }
      }

      .tag-info-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      .download-btn {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        padding: 8px 16px;
        font-size: 13px;
        line-height: 1;
        color: #f7f7fa;
        cursor: pointer;
        background: rgb(0 0 0 / 50%);
        backdrop-filter: saturate(180%) blur(20px);
        border-radius: 8px;
        transition: 0.3s;

        &:hover {
          color: #fff;
          background: #0d00ff;
        }
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
      cursor: pointer;
      background: rgb(0 0 0 / 80%);

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
