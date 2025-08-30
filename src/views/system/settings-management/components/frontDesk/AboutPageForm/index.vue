<template>
  <el-divider content-position="left">
    <h3>关于页配置</h3>
  </el-divider>

  <el-form-item label="姓名">
    <el-input v-model="formData.name" placeholder="请输入姓名" />
    <div class="form-item-help">关于页面显示的个人姓名。</div>
  </el-form-item>

  <el-form-item label="个人描述">
    <el-input
      v-model="formData.description"
      type="textarea"
      :rows="3"
      placeholder="请输入个人描述"
    />
    <div class="form-item-help">关于页面的个人简介描述。</div>
  </el-form-item>

  <el-form-item label="头像图片">
    <el-input
      v-model="formData.avatarImg"
      placeholder="请输入头像图片链接地址"
    />
    <div class="form-item-help">关于页面显示的个人头像图片。</div>
  </el-form-item>

  <el-form-item label="副标题">
    <el-input v-model="formData.subtitle" placeholder="请输入副标题" />
    <div class="form-item-help">关于页面显示的副标题文字。</div>
  </el-form-item>

  <el-form-item label="左侧技能标签">
    <el-input
      v-model="skillsLeftText"
      type="textarea"
      :rows="4"
      placeholder="请输入左侧技能标签，每行一个"
    />
    <div class="form-item-help">左侧技能标签，每行输入一个标签。</div>
  </el-form-item>

  <el-form-item label="右侧技能标签">
    <el-input
      v-model="skillsRightText"
      type="textarea"
      :rows="4"
      placeholder="请输入右侧技能标签，每行一个"
    />
    <div class="form-item-help">右侧技能标签，每行输入一个标签。</div>
  </el-form-item>

  <el-form-item label="站点提示标题1">
    <el-input
      v-model="formData.aboutSiteTips.title1"
      placeholder="请输入标题1"
    />
  </el-form-item>

  <el-form-item label="站点提示标题2">
    <el-input
      v-model="formData.aboutSiteTips.title2"
      placeholder="请输入标题2"
    />
  </el-form-item>

  <el-form-item label="站点提示说明">
    <el-input
      v-model="formData.aboutSiteTips.tips"
      placeholder="请输入提示说明"
    />
  </el-form-item>

  <el-form-item label="站点提示关键词">
    <el-input
      v-model="siteTipsWordsText"
      type="textarea"
      :rows="3"
      placeholder="请输入关键词，用逗号分隔"
    />
    <div class="form-item-help">站点提示的关键词，用逗号分隔。</div>
  </el-form-item>

  <ComicListEditor v-model:comic-list="formData.comic.list" />

  <CareerListEditor v-model:career-list="formData.careers.list" />

  <el-form-item label="统计背景图片">
    <el-input
      v-model="formData.statisticsBackground"
      placeholder="请输入统计背景图片链接地址"
    />
    <div class="form-item-help">关于页面统计区域的背景图片。</div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AboutPageSettingsInfo } from "../../../type";
import ComicListEditor from "./ComicListEditor.vue";
import CareerListEditor from "./CareerListEditor.vue";

// 使用 defineModel，替代 props 和 emit，实现真正的双向绑定
const formData = defineModel<AboutPageSettingsInfo>({ required: true });

// 技能标签文本处理
// 注意：现在需要通过 .value 来访问 formData
const skillsLeftText = computed({
  get: () => (formData.value.avatarSkillsLeft || []).join("\n"),
  set: (value: string) => {
    if (formData.value) {
      formData.value.avatarSkillsLeft = value
        .split("\n")
        .filter(item => item.trim());
    }
  }
});

const skillsRightText = computed({
  get: () => (formData.value.avatarSkillsRight || []).join("\n"),
  set: (value: string) => {
    if (formData.value) {
      formData.value.avatarSkillsRight = value
        .split("\n")
        .filter(item => item.trim());
    }
  }
});

// 站点提示关键词文本处理
const siteTipsWordsText = computed({
  get: () => (formData.value.aboutSiteTips?.word || []).join(","),
  set: (value: string) => {
    if (formData.value && formData.value.aboutSiteTips) {
      formData.value.aboutSiteTips.word = value
        .split(",")
        .map(item => item.trim())
        .filter(item => item);
    }
  }
});

// updateComicList 和 updateCareerList 函数现在不再需要了，因为 v-model 会自动处理
</script>

<style scoped lang="scss">
.el-form-item {
  margin-bottom: 24px;
}

.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}

.el-divider {
  margin: 40px 0 28px;

  h3 {
    margin: 0;
    color: #606266;
  }
}
</style>
