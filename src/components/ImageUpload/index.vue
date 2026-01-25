<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { ElMessage } from "element-plus";
import {
  Plus,
  Link,
  Delete,
  Upload,
  Scissor,
  ArrowDown
} from "@element-plus/icons-vue";
import { uploadArticleImage } from "@/api/post";

import Cropper from "cropperjs";

const CUSTOM_CROPPER_TEMPLATE = `
  <cropper-canvas background style="height: 100%">
    <cropper-image rotatable scalable skewable translatable></cropper-image>
    <cropper-shade hidden></cropper-shade>
    <cropper-handle action="select" plain></cropper-handle>
    <cropper-selection
      initial-coverage="0.5"
      aspect-ratio="1.77777777778"
      movable
      resizable
    >
      <cropper-grid role="grid" bordered covered></cropper-grid>
      <cropper-crosshair centered></cropper-crosshair>
      <cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle>
      <cropper-handle action="n-resize"></cropper-handle>
      <cropper-handle action="e-resize"></cropper-handle>
      <cropper-handle action="s-resize"></cropper-handle>
      <cropper-handle action="w-resize"></cropper-handle>
      <cropper-handle action="ne-resize"></cropper-handle>
      <cropper-handle action="nw-resize"></cropper-handle>
      <cropper-handle action="se-resize"></cropper-handle>
      <cropper-handle action="sw-resize"></cropper-handle>
    </cropper-selection>
  </cropper-canvas>
`;

const props = withDefaults(
  defineProps<{
    modelValue: string;
    /** 是否允许上传文件（false时只显示网络链接选项） */
    canUpload?: boolean;
  }>(),
  {
    canUpload: true
  }
);

const emit = defineEmits(["update:modelValue"]);

const imageUrl = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

const isUploading = ref(false);

const linkDialogVisible = ref(false);
const linkUrlInput = ref("");
const openLinkDialog = () => {
  linkUrlInput.value = "";
  linkDialogVisible.value = true;
};
const confirmAddLink = () => {
  if (linkUrlInput.value) {
    imageUrl.value = linkUrlInput.value;
    linkDialogVisible.value = false;
  } else {
    ElMessage.warning("请输入图片链接");
  }
};

const performUpload = async (file: File | Blob) => {
  const loading = ElMessage.info({
    message: "正在上传...",
    duration: 0,
    showClose: false
  });
  isUploading.value = true;
  try {
    const fileToUpload =
      file instanceof File
        ? file
        : new File([file], `cropped_image_${Date.now()}.png`, {
            type: file.type
          });
    const res = await uploadArticleImage(fileToUpload);
    const url = res?.data?.url;
    if (!url) {
      throw new Error("服务器未返回有效URL");
    }
    imageUrl.value = url;
    ElMessage.success("上传成功！");
    return true;
  } catch (error: any) {
    console.error("图片上传失败:", error);
    ElMessage.error(error.message || "图片上传失败，请稍后再试。");
    return false;
  } finally {
    isUploading.value = false;
    loading.close();
  }
};

const cropperDialogVisible = ref(false);
const cropperImagePath = ref("");
const cropperContainerRef = ref<HTMLDivElement | null>(null);
const cropperInstance = ref<Cropper | null>(null);

watch(cropperDialogVisible, isVisible => {
  if (isVisible) {
    nextTick(() => {
      if (!cropperContainerRef.value || !cropperImagePath.value) return;

      const image = new Image();
      image.src = cropperImagePath.value;

      image.onload = () => {
        cropperInstance.value = new Cropper(image, {
          container: cropperContainerRef.value,
          template: CUSTOM_CROPPER_TEMPLATE
        });
      };
    });
  } else {
    if (cropperContainerRef.value) {
      cropperContainerRef.value.innerHTML = "";
    }
    cropperInstance.value = null;
  }
});

const handleCropAndUpload = async () => {
  if (!cropperInstance.value) {
    ElMessage.error("裁剪实例不存在");
    return;
  }

  const selection = cropperInstance.value.getCropperSelection();

  if (!selection) {
    ElMessage.error("未能获取裁剪区域");
    return;
  }

  isUploading.value = true;
  try {
    const croppedCanvas = await selection.$toCanvas({
      width: 1920,
      height: 1080
    });

    const blob = await new Promise<Blob | null>(resolve => {
      croppedCanvas.toBlob(resolve, "image/png", 0.9);
    });

    if (!blob) {
      throw new Error("无法将Canvas转换为Blob");
    }

    const success = await performUpload(blob);
    if (success) {
      cropperDialogVisible.value = false;
    }
  } catch (error) {
    console.error("裁剪处理或上传失败:", error);
    ElMessage.error("操作失败");
    isUploading.value = false;
  }
};

const uploadMode = ref<"direct" | "crop">("direct");

const onFileSelected = (e: any) => {
  const file = e.target.files[0];
  if (!file) return;

  if (uploadMode.value === "crop") {
    const reader = new FileReader();
    reader.onload = e => {
      cropperImagePath.value = e.target?.result as string;
      cropperDialogVisible.value = true;
    };
    reader.readAsDataURL(file);
  } else {
    performUpload(file);
  }
  e.target.value = "";
};

const handleCommand = (
  command: "direct-upload" | "crop-upload" | "link" | "delete"
) => {
  const fileInput = document.querySelector(
    `#fileInput-${_uid}`
  ) as HTMLInputElement;

  switch (command) {
    case "direct-upload":
      uploadMode.value = "direct";
      fileInput?.click();
      break;
    case "crop-upload":
      uploadMode.value = "crop";
      fileInput?.click();
      break;
    case "link":
      openLinkDialog();
      break;
    case "delete":
      imageUrl.value = "";
      break;
  }
};

const _uid = Math.random().toString(36).substring(2);
</script>

<template>
  <div class="image-uploader-v2">
    <div v-if="imageUrl" class="preview-area">
      <el-image :src="imageUrl" fit="cover" />
    </div>

    <div class="button-area">
      <el-dropdown :teleported="false" @command="handleCommand">
        <el-button type="primary" :loading="isUploading" plain>
          {{ imageUrl ? "更换图片" : "选择图片"
          }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <template v-if="props.canUpload">
              <el-dropdown-item :icon="Upload" command="direct-upload"
                >直接上传</el-dropdown-item
              >
              <el-dropdown-item :icon="Scissor" command="crop-upload"
                >裁剪上传</el-dropdown-item
              >
            </template>
            <el-dropdown-item :icon="Link" command="link"
              >网络链接</el-dropdown-item
            >
            <el-dropdown-item
              v-if="imageUrl"
              :icon="Delete"
              command="delete"
              divided
              >删除图片</el-dropdown-item
            >
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <input
      :id="`fileInput-${_uid}`"
      type="file"
      accept="image/*"
      style="display: none"
      @change="onFileSelected"
    />

    <el-dialog
      v-model="linkDialogVisible"
      title="添加网络图片链接"
      width="500px"
      append-to-body
      :z-index="2200"
    >
      <el-input v-model="linkUrlInput" placeholder="请输入图片URL" />
      <template #footer>
        <el-button @click="linkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddLink">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="cropperDialogVisible"
      title="图片裁剪"
      width="600px"
      append-to-body
      destroy-on-close
      :z-index="2200"
    >
      <div class="cropper-wrapper">
        <div ref="cropperContainerRef" class="cropper-container" />
      </div>
      <template #footer>
        <el-button @click="cropperDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="isUploading"
          @click="handleCropAndUpload"
          >确认上传</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.image-uploader-v2 {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  width: 100%;
}

.preview-area {
  width: 200px;
  height: 112px; // 16:9
  overflow: hidden;
  background-color: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;

  .el-image {
    width: 100%;
    height: 100%;
  }
}

.button-area {
  display: flex;
  flex-direction: column;
}

.cropper-wrapper {
  height: 350px;
}

.cropper-container {
  width: 100%;
  height: 100%;

  :deep(img) {
    display: block;
    max-width: 100%;
  }
}
</style>
