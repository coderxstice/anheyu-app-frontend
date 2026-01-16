<!--
 * @Description: 音乐页面配置表单
 * @Author: 安知鱼
 * @Date: 2026-01-16 10:00:00
-->
<template>
  <el-alert type="info" :closable="false" class="mb-4">
    <template #default>
      音乐胶囊（右下角播放器）和音乐馆页面可以分别配置不同的播放列表。如果两者使用相同的歌单，可以只配置一处，另一处留空即可自动使用相同配置。
    </template>
  </el-alert>

  <el-divider content-position="left">通用配置</el-divider>

  <el-form-item label="启用音乐播放器">
    <div>
      <el-switch
        :model-value="model.enable"
        @update:model-value="updateField('enable', $event)"
      />
      <div class="form-item-help">是否在前端页面显示音乐播放器组件</div>
    </div>
  </el-form-item>

  <el-form-item label="音乐API地址">
    <el-input
      :model-value="model.api?.base_url || ''"
      placeholder="https://metings.qjqq.cn"
      clearable
      @update:model-value="updateNestedField('api', 'base_url', $event)"
    />
    <div class="form-item-help">
      音乐API基础地址（不带末尾斜杠），用于获取歌曲信息和播放地址。默认为
      https://metings.qjqq.cn。可使用
      <a
        href="https://github.com/Suxiaoqinx/Netease_url"
        target="_blank"
        style="color: var(--anzhiyu-main)"
        >Netease_url</a
      >
      项目自行部署音乐API，支持无损音质解析。
    </div>
  </el-form-item>

  <el-divider content-position="left">
    <div class="divider-title">
      <i class="anzhiyufont anzhiyu-icon-music" />
      音乐胶囊配置
    </div>
  </el-divider>
  <p class="section-desc">右下角胶囊播放器的音乐配置</p>

  <el-form-item label="播放列表ID">
    <el-input
      :model-value="model.capsule?.playlist_id || ''"
      placeholder="例如：8152976493"
      clearable
      @update:model-value="updateNestedField('capsule', 'playlist_id', $event)"
    />
    <div class="form-item-help">
      网易云音乐歌单ID，用于音乐胶囊获取歌曲列表。如不配置，将使用音乐馆的歌单ID。
    </div>
  </el-form-item>

  <el-form-item label="自定义歌单JSON">
    <el-input
      :model-value="model.capsule?.custom_playlist || ''"
      placeholder="https://example.com/capsule-music.json"
      clearable
      @update:model-value="
        updateNestedField('capsule', 'custom_playlist', $event)
      "
    />
    <div class="form-item-help">
      音乐胶囊专用歌单：指向包含歌单信息的JSON文件的链接地址。配置后将优先使用此JSON，不再使用歌单ID。
    </div>
  </el-form-item>

  <el-divider content-position="left">
    <div class="divider-title">
      <i class="anzhiyufont anzhiyu-icon-record-vinyl" />
      音乐馆页面配置
    </div>
  </el-divider>
  <p class="section-desc">音乐馆页面的音乐配置</p>

  <el-form-item label="播放列表ID">
    <el-input
      :model-value="model.page?.playlist_id || ''"
      placeholder="例如：8152976493"
      clearable
      @update:model-value="updateNestedField('page', 'playlist_id', $event)"
    />
    <div class="form-item-help">
      网易云音乐歌单ID，用于音乐馆页面获取歌曲列表。
    </div>
  </el-form-item>

  <el-form-item label="自定义歌单JSON">
    <el-input
      :model-value="model.page?.custom_playlist || ''"
      placeholder="https://ik.imagekit.io/anzhiyu/music_8fjmi9igk.json"
      clearable
      @update:model-value="updateNestedField('page', 'custom_playlist', $event)"
    />
    <div class="form-item-help">
      音乐馆页面歌单：指向包含歌单信息的JSON文件的链接地址。配置后将优先使用此JSON，不再使用歌单ID。
    </div>
  </el-form-item>

  <el-divider content-position="left">
    <div class="divider-title">
      <i class="anzhiyufont anzhiyu-icon-compact-disc" />
      唱片外观配置
    </div>
  </el-divider>
  <p class="section-desc">自定义音乐播放器唱片的外观图片</p>

  <el-form-item label="唱片背景图">
    <el-input
      :model-value="model.vinyl?.background || ''"
      placeholder="/static/img/music-vinyl-background.png"
      clearable
      @update:model-value="updateNestedField('vinyl', 'background', $event)"
    />
    <div class="form-item-help">
      音乐播放器唱片背景图片，默认为 /static/img/music-vinyl-background.png
    </div>
  </el-form-item>

  <el-form-item label="唱片外圈图">
    <el-input
      :model-value="model.vinyl?.outer || ''"
      placeholder="/static/img/music-vinyl-outer.png"
      clearable
      @update:model-value="updateNestedField('vinyl', 'outer', $event)"
    />
    <div class="form-item-help">
      音乐播放器唱片外圈图片，默认为 /static/img/music-vinyl-outer.png
    </div>
  </el-form-item>

  <el-form-item label="唱片内圈图">
    <el-input
      :model-value="model.vinyl?.inner || ''"
      placeholder="/static/img/music-vinyl-inner.png"
      clearable
      @update:model-value="updateNestedField('vinyl', 'inner', $event)"
    />
    <div class="form-item-help">
      音乐播放器唱片内圈图片，默认为 /static/img/music-vinyl-inner.png
    </div>
  </el-form-item>

  <el-form-item label="撞针图">
    <el-input
      :model-value="model.vinyl?.needle || ''"
      placeholder="/static/img/music-vinyl-needle.png"
      clearable
      @update:model-value="updateNestedField('vinyl', 'needle', $event)"
    />
    <div class="form-item-help">
      音乐播放器撞针图片，默认为 /static/img/music-vinyl-needle.png
    </div>
  </el-form-item>

  <el-form-item label="凹槽背景图">
    <el-input
      :model-value="model.vinyl?.groove || ''"
      placeholder="/static/img/music-vinyl-groove.png"
      clearable
      @update:model-value="updateNestedField('vinyl', 'groove', $event)"
    />
    <div class="form-item-help">
      音乐播放器凹槽背景图片，默认为 /static/img/music-vinyl-groove.png
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { MusicPageSettingsInfo } from "../../../type";

const props = defineProps<{
  modelValue: MusicPageSettingsInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

const model = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

// 更新顶级字段
const updateField = (field: keyof MusicPageSettingsInfo, value: any) => {
  model.value = {
    ...model.value,
    [field]: value
  };
};

// 更新嵌套字段
const updateNestedField = (
  parent: "capsule" | "page" | "api" | "vinyl",
  field: string,
  value: any
) => {
  model.value = {
    ...model.value,
    [parent]: {
      ...model.value[parent],
      [field]: value
    }
  };
};
</script>

<style scoped lang="scss">
.form-item-help {
  font-size: 12px;
  color: var(--anzhiyu-secondtext);
  margin-top: 8px;
  line-height: 1.5;
}

.section-desc {
  font-size: 13px;
  color: var(--anzhiyu-secondtext);
  margin: -8px 0 16px 0;
}

.divider-title {
  display: flex;
  align-items: center;
  gap: 6px;

  .anzhiyufont {
    font-size: 16px;
    color: var(--anzhiyu-theme);
  }
}

.el-divider {
  margin: 32px 0 16px;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>
