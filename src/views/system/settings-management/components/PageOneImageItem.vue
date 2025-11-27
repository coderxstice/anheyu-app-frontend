<template>
  <div class="page-one-image-item">
    <el-form-item :label="`是否开启${pageName}一图流`">
      <div>
        <el-switch v-model="localValue.enable" @change="handleUpdate" />
        <div class="form-item-help">开启后将显示全屏背景图片和标题</div>
      </div>
    </el-form-item>

    <template v-if="localValue.enable">
      <!-- 桌面端配置 -->
      <el-divider content-position="left">桌面端配置</el-divider>

      <el-form-item :label="`${pageName}背景媒体类型`">
        <div>
          <el-radio-group v-model="localValue.mediaType" @change="handleUpdate">
            <el-radio value="image">图片</el-radio>
            <el-radio value="video">视频</el-radio>
          </el-radio-group>
          <div class="form-item-help">选择使用图片还是视频作为背景</div>
        </div>
      </el-form-item>

      <el-form-item
        :label="
          localValue.mediaType === 'image'
            ? `${pageName}全屏背景图片URL`
            : `${pageName}全屏背景视频URL`
        "
      >
        <div>
          <el-input
            v-model="localValue.background"
            :placeholder="
              localValue.mediaType === 'image'
                ? '请输入背景图片URL'
                : '请输入背景视频URL（支持 .mp4, .webm 等格式）'
            "
            @input="handleUpdate"
          />
          <div class="form-item-help">
            {{
              localValue.mediaType === "image"
                ? "全屏背景图片的URL地址，建议使用高清大图"
                : "全屏背景视频的URL地址，建议使用压缩优化后的视频文件"
            }}
          </div>
        </div>
      </el-form-item>

      <template v-if="localValue.mediaType === 'video'">
        <el-form-item :label="`${pageName}视频自动播放`">
          <div>
            <el-switch
              v-model="localValue.videoAutoplay"
              @change="handleUpdate"
            />
            <div class="form-item-help">开启后视频将自动播放</div>
          </div>
        </el-form-item>

        <el-form-item :label="`${pageName}视频循环播放`">
          <div>
            <el-switch v-model="localValue.videoLoop" @change="handleUpdate" />
            <div class="form-item-help">开启后视频将循环播放</div>
          </div>
        </el-form-item>

        <el-form-item :label="`${pageName}视频静音`">
          <div>
            <el-switch v-model="localValue.videoMuted" @change="handleUpdate" />
            <div class="form-item-help">
              开启后视频将静音播放（建议开启，否则可能影响用户体验）
            </div>
          </div>
        </el-form-item>
      </template>

      <!-- 移动端配置 -->
      <el-divider content-position="left">移动端配置（可选）</el-divider>

      <el-form-item :label="`${pageName}移动端背景媒体类型`">
        <div>
          <el-radio-group
            v-model="localValue.mobileMediaType"
            @change="handleUpdate"
          >
            <el-radio value="image">图片</el-radio>
            <el-radio value="video">视频</el-radio>
          </el-radio-group>
          <div class="form-item-help">
            选择移动设备上使用图片还是视频作为背景，留空背景URL时将使用桌面端配置
          </div>
        </div>
      </el-form-item>

      <el-form-item
        :label="
          localValue.mobileMediaType === 'image'
            ? `${pageName}移动端背景图片URL`
            : `${pageName}移动端背景视频URL`
        "
      >
        <div>
          <el-input
            v-model="localValue.mobileBackground"
            :placeholder="
              localValue.mobileMediaType === 'image'
                ? '请输入移动端背景图片URL（留空则使用桌面端配置）'
                : '请输入移动端背景视频URL（留空则使用桌面端配置）'
            "
            @input="handleUpdate"
          />
          <div class="form-item-help">
            移动设备上的背景URL，建议使用竖版或适合移动端的媒体资源，留空将使用桌面端配置
          </div>
        </div>
      </el-form-item>

      <template v-if="localValue.mobileMediaType === 'video'">
        <el-form-item :label="`${pageName}移动端视频自动播放`">
          <div>
            <el-switch
              v-model="localValue.mobileVideoAutoplay"
              @change="handleUpdate"
            />
            <div class="form-item-help">开启后移动端视频将自动播放</div>
          </div>
        </el-form-item>

        <el-form-item :label="`${pageName}移动端视频循环播放`">
          <div>
            <el-switch
              v-model="localValue.mobileVideoLoop"
              @change="handleUpdate"
            />
            <div class="form-item-help">开启后移动端视频将循环播放</div>
          </div>
        </el-form-item>

        <el-form-item :label="`${pageName}移动端视频静音`">
          <div>
            <el-switch
              v-model="localValue.mobileVideoMuted"
              @change="handleUpdate"
            />
            <div class="form-item-help">
              开启后移动端视频将静音播放（建议开启，否则可能影响用户体验）
            </div>
          </div>
        </el-form-item>
      </template>

      <!-- 通用标题配置 -->
      <el-divider content-position="left">标题配置</el-divider>

      <el-form-item :label="`${pageName}主标题`">
        <div>
          <el-input
            v-model="localValue.mainTitle"
            placeholder="请输入主标题"
            @input="handleUpdate"
          />
          <div class="form-item-help">显示在页面顶部的主标题</div>
        </div>
      </el-form-item>

      <el-form-item :label="`${pageName}副标题`">
        <div>
          <el-input
            v-model="localValue.subTitle"
            placeholder="请输入副标题"
            @input="handleUpdate"
          />
          <div class="form-item-help">
            显示在主标题下方的副标题，开启一言后此设置将失效
          </div>
        </div>
      </el-form-item>

      <el-form-item :label="`${pageName}副标题打字机效果`">
        <div>
          <el-switch v-model="localValue.typingEffect" @change="handleUpdate" />
          <div class="form-item-help">开启后副标题将以打字机效果显示</div>
        </div>
      </el-form-item>

      <el-form-item :label="`${pageName}副标题一言`">
        <div>
          <el-switch v-model="localValue.hitokoto" @change="handleUpdate" />
          <div class="form-item-help">
            开启后将使用一言API随机显示句子，手动设置的副标题将失效
          </div>
        </div>
      </el-form-item>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import type { PageOneImageItem } from "../type";

const props = defineProps<{
  modelValue: PageOneImageItem;
  pageName: string;
}>();

const emit = defineEmits(["update:modelValue"]);

const localValue = reactive<PageOneImageItem>({
  enable: props.modelValue.enable ?? false,
  background: props.modelValue.background ?? "",
  mediaType: props.modelValue.mediaType ?? "image",
  mainTitle: props.modelValue.mainTitle ?? "",
  subTitle: props.modelValue.subTitle ?? "",
  typingEffect: props.modelValue.typingEffect ?? false,
  hitokoto: props.modelValue.hitokoto ?? false,
  videoAutoplay: props.modelValue.videoAutoplay ?? true,
  videoLoop: props.modelValue.videoLoop ?? true,
  videoMuted: props.modelValue.videoMuted ?? true,
  // 移动端配置
  mobileBackground: props.modelValue.mobileBackground ?? "",
  mobileMediaType: props.modelValue.mobileMediaType ?? "image",
  mobileVideoAutoplay: props.modelValue.mobileVideoAutoplay ?? true,
  mobileVideoLoop: props.modelValue.mobileVideoLoop ?? true,
  mobileVideoMuted: props.modelValue.mobileVideoMuted ?? true
});

watch(
  () => props.modelValue,
  newValue => {
    Object.assign(localValue, newValue);
  },
  { deep: true }
);

const handleUpdate = () => {
  emit("update:modelValue", { ...localValue });
};
</script>

<style scoped lang="scss">
.page-one-image-item {
  .el-form-item {
    margin-bottom: 24px;
  }

  .form-item-help {
    margin-top: 8px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--anzhiyu-secondtext);
  }
}
</style>
