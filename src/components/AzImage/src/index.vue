<template>
  <div class="az-image-wrapper">
    <img
      ref="imageRef"
      :alt="alt"
      :class="['az-image', { loaded: isLoaded }]"
      :style="imageStyle"
      loading="lazy"
      @load="handleImageLoad"
      @click="openPreview"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

type ObjectFit = "fill" | "contain" | "cover" | "none" | "scale-down";

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: "图片" },
  fit: { type: String as PropType<ObjectFit>, default: "cover" },
  lazy: { type: Boolean, default: true },
  previewSrcList: { type: Array as any, default: () => [] }
});

watch(
  () => props.src,
  () => {
    isLoaded.value = false;
    if (!props.lazy) {
      loadImage();
    } else {
      observer.value?.disconnect();
      if (imageRef.value) observer.value.observe(imageRef.value);
    }
  }
);

const emit = defineEmits<{
  (e: "open-preview"): void;
  (e: "load"): void;
}>();

const currentImage = computed(() => {
  return props.previewSrcList.find(item => item.imageUrl === props.src);
});

function openPreview() {
  emit("open-preview");
}

const imageRef = ref<HTMLImageElement | null>(null);

const isLoaded = ref(false);
const observer = ref<IntersectionObserver | null>(null);

import type { CSSProperties, PropType } from "vue";

const imageStyle = computed(
  (): CSSProperties => ({
    objectFit: props.fit,
    width: "100%",
    height: "100%"
  })
);

const handleImageLoad = () => {
  isLoaded.value = true;
  emit("load");
};

const loadImage = () => {
  if (imageRef.value) {
    imageRef.value.src =
      props.src +
      (currentImage.value.thumbParam
        ? `?${currentImage.value.thumbParam}`
        : "");
  }
};

onMounted(() => {
  if (!props.lazy) {
    loadImage();
    return;
  }

  observer.value = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting) {
        loadImage();
        observer.value?.disconnect();
      }
    },
    { rootMargin: "100px" }
  );

  if (imageRef.value) observer.value.observe(imageRef.value);
});

onUnmounted(() => {
  observer.value?.disconnect();
});
</script>

<style scoped lang="scss">
.az-image-wrapper {
  display: block;
  width: 100%;
  height: 100%;
}

.az-image-placeholder,
.az-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  object-fit: cover;
  transition: opacity 0.4s ease;
}

.az-image {
  opacity: 0;

  &.loaded {
    opacity: 1;
  }
}
</style>
