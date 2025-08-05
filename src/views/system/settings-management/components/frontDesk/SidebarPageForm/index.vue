<script setup lang="ts">
import { ref, computed } from "vue";
import type {
  SidebarPageSettingsInfo,
  JsonEditorTableColumn
} from "../../../type";
import JsonEditorTable from "../components/JsonEditorTable.vue";
import HighlightTagSelector from "../components/HighlightTagSelector.vue";

defineOptions({
  name: "SidebarPageForm"
});

const model = defineModel<SidebarPageSettingsInfo>({ required: true });

const skillColumns = ref<JsonEditorTableColumn[]>([
  { prop: "name", label: "技能描述" }
]);

const skillsForTable = computed(() =>
  (model.value.authorSkills || []).map(skill => ({ name: skill }))
);

const updateSkills = (jsonString: string) => {
  try {
    const arrayData = JSON.parse(jsonString || "[]");
    model.value.authorSkills = arrayData.map(
      (item: { name: string }) => item.name
    );
  } catch (e) {
    console.error("更新技能列表失败:", e);
  }
};

const socialColumns = ref<JsonEditorTableColumn[]>([
  { prop: "title", label: "标题 (如: Github)" },
  { prop: "link", label: "链接" },
  { prop: "icon", label: "图标类名" }
]);

const socialsForTable = computed(() => {
  return Object.entries(model.value.authorSocial || {}).map(
    ([title, data]) => ({
      title,
      icon: data.icon,
      link: data.link
    })
  );
});

const updateSocials = (jsonString: string) => {
  try {
    const arrayData = JSON.parse(jsonString || "[]");
    const newObject: SidebarPageSettingsInfo["authorSocial"] = {};
    for (const item of arrayData) {
      if (item.title) {
        newObject[item.title] = {
          icon: item.icon,
          link: item.link
        };
      }
    }
    model.value.authorSocial = newObject;
  } catch (e) {
    console.error("更新社交链接失败:", e);
  }
};
</script>

<template>
  <div>
    <el-divider content-position="left">作者信息卡</el-divider>
    <el-form-item label="启用作者信息卡">
      <el-switch v-model="model.authorEnable" />
    </el-form-item>
    <template v-if="model.authorEnable">
      <el-form-item label="状态图片 URL">
        <el-input
          v-model="model.authorStatusImg"
          placeholder="例如：https://..."
          clearable
        />
      </el-form-item>
      <el-form-item label="描述 (支持HTML)">
        <el-input
          v-model="model.authorDescription"
          type="textarea"
          :rows="3"
          placeholder="输入作者描述"
        />
      </el-form-item>

      <JsonEditorTable
        :model-value="JSON.stringify(skillsForTable)"
        title="技能列表"
        :columns="skillColumns"
        :new-item-template="{ name: '' }"
        @update:model-value="updateSkills($event)"
      />

      <JsonEditorTable
        :model-value="JSON.stringify(socialsForTable)"
        title="社交链接列表"
        :columns="socialColumns"
        :new-item-template="{ title: '', link: '', icon: '' }"
        @update:model-value="updateSocials($event)"
      />
    </template>

    <el-divider content-position="left">微信二维码</el-divider>
    <el-form-item label="启用微信二维码">
      <el-switch v-model="model.wechatEnable" />
    </el-form-item>
    <template v-if="model.wechatEnable">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="正面二维码图片 URL">
            <el-input v-model="model.wechatFace" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="反面二维码图片 URL">
            <el-input v-model="model.wechatBackFace" clearable />
          </el-form-item>
        </el-col>
      </el-row>
    </template>

    <el-divider content-position="left">标签与分类</el-divider>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="启用标签云">
          <el-switch v-model="model.tagsEnable" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="启用归档">
          <el-switch v-model="model.archivesEnable" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item v-if="model.tagsEnable" label="选择高亮的标签">
      <HighlightTagSelector v-model="model.tagsHighlight" />
    </el-form-item>

    <el-divider content-position="left">网站资讯</el-divider>
    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="启用文章总数">
          <el-switch v-model="model.siteInfoPostCountEnable" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="启用运行时长">
          <el-switch v-model="model.siteInfoRuntimeEnable" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="启用总字数">
          <el-switch v-model="model.siteInfoWordCountEnable" />
        </el-form-item>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped></style>
