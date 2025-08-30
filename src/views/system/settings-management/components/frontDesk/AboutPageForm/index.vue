<!--
 * @Description: 关于页设置表单
 * @Author: 安知鱼
 * @Date: 2025-08-20
-->
<template>
  <el-divider content-position="left">
    <h3>关于页配置</h3>
  </el-divider>

  <!-- 基本信息 -->
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

  <!-- 技能标签 -->
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

  <!-- 站点提示 -->
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

  <!-- 地图信息 -->
  <el-form-item label="地图背景图片">
    <el-input
      v-model="formData.map.background"
      placeholder="请输入地图背景图片链接地址"
    />
  </el-form-item>

  <el-form-item label="地图暗色背景图片">
    <el-input
      v-model="formData.map.backgroundDark"
      placeholder="请输入地图暗色背景图片链接地址"
    />
  </el-form-item>

  <el-form-item label="地图标题">
    <el-input v-model="formData.map.title" placeholder="请输入地图标题" />
  </el-form-item>

  <el-form-item label="地图强调标题">
    <el-input
      v-model="formData.map.strengthenTitle"
      placeholder="请输入地图强调标题"
    />
  </el-form-item>

  <!-- 个人信息 -->
  <el-form-item label="出生年份标签">
    <el-input
      v-model="formData.selfInfo.tips1"
      placeholder="请输入出生年份标签"
    />
  </el-form-item>

  <el-form-item label="出生年份">
    <el-input
      v-model="formData.selfInfo.contentYear"
      placeholder="请输入出生年份"
    />
  </el-form-item>

  <el-form-item label="学校标签">
    <el-input v-model="formData.selfInfo.tips2" placeholder="请输入学校标签" />
  </el-form-item>

  <el-form-item label="学校名称">
    <el-input
      v-model="formData.selfInfo.content2"
      placeholder="请输入学校名称"
    />
  </el-form-item>

  <el-form-item label="职业标签">
    <el-input v-model="formData.selfInfo.tips3" placeholder="请输入职业标签" />
  </el-form-item>

  <el-form-item label="职业描述">
    <el-input
      v-model="formData.selfInfo.content3"
      placeholder="请输入职业描述"
    />
  </el-form-item>

  <!-- 性格测试 -->
  <el-form-item label="性格类型名称">
    <el-input
      v-model="formData.personalities.authorName"
      placeholder="请输入性格类型名称"
    />
  </el-form-item>

  <el-form-item label="性格测试链接">
    <el-input
      v-model="formData.personalities.nameUrl"
      placeholder="请输入性格测试链接"
    />
  </el-form-item>

  <el-form-item label="性格类型图片">
    <el-input
      v-model="formData.personalities.personalityImg"
      placeholder="请输入性格类型图片链接"
    />
  </el-form-item>

  <el-form-item label="性格类型">
    <el-input
      v-model="formData.personalities.personalityType"
      placeholder="请输入性格类型"
    />
  </el-form-item>

  <el-form-item label="性格类型颜色">
    <el-input
      v-model="formData.personalities.personalityTypeColor"
      placeholder="请输入性格类型颜色"
    />
  </el-form-item>

  <el-form-item label="个人照片">
    <el-input
      v-model="formData.personalities.photoUrl"
      placeholder="请输入个人照片链接"
    />
  </el-form-item>

  <el-form-item label="性格标签">
    <el-input
      v-model="formData.personalities.tips"
      placeholder="请输入性格标签"
    />
  </el-form-item>

  <!-- 座右铭 -->
  <el-form-item label="座右铭上半部分">
    <el-input v-model="formData.maxim.top" placeholder="请输入座右铭上半部分" />
  </el-form-item>

  <el-form-item label="座右铭下半部分">
    <el-input
      v-model="formData.maxim.bottom"
      placeholder="请输入座右铭下半部分"
    />
  </el-form-item>

  <el-form-item label="座右铭标签">
    <el-input v-model="formData.maxim.tips" placeholder="请输入座右铭标签" />
  </el-form-item>

  <!-- 特长 -->
  <el-form-item label="特长上半部分">
    <el-input v-model="formData.buff.top" placeholder="请输入特长上半部分" />
  </el-form-item>

  <el-form-item label="特长下半部分">
    <el-input v-model="formData.buff.bottom" placeholder="请输入特长下半部分" />
  </el-form-item>

  <el-form-item label="特长标签">
    <el-input v-model="formData.buff.tips" placeholder="请输入特长标签" />
  </el-form-item>

  <!-- 游戏 -->
  <el-form-item label="游戏背景图片">
    <el-input
      v-model="formData.game.background"
      placeholder="请输入游戏背景图片链接"
    />
  </el-form-item>

  <el-form-item label="游戏标题">
    <el-input v-model="formData.game.title" placeholder="请输入游戏标题" />
  </el-form-item>

  <el-form-item label="游戏UID">
    <el-input v-model="formData.game.uid" placeholder="请输入游戏UID" />
  </el-form-item>

  <el-form-item label="游戏标签">
    <el-input v-model="formData.game.tips" placeholder="请输入游戏标签" />
  </el-form-item>

  <!-- 动漫 -->
  <el-form-item label="动漫标题">
    <el-input v-model="formData.comic.title" placeholder="请输入动漫标题" />
  </el-form-item>

  <el-form-item label="动漫标签">
    <el-input v-model="formData.comic.tips" placeholder="请输入动漫标签" />
  </el-form-item>

  <!-- 动漫列表编辑 -->
  <ComicListEditor
    :comic-list="formData.comic.list"
    @update:comic-list="updateComicList"
  />

  <!-- 喜好 -->
  <el-form-item label="喜好背景图片">
    <el-input
      v-model="formData.like.background"
      placeholder="请输入喜好背景图片链接"
    />
  </el-form-item>

  <el-form-item label="喜好标题">
    <el-input v-model="formData.like.title" placeholder="请输入喜好标题" />
  </el-form-item>

  <el-form-item label="喜好描述">
    <el-input v-model="formData.like.bottom" placeholder="请输入喜好描述" />
  </el-form-item>

  <el-form-item label="喜好标签">
    <el-input v-model="formData.like.tips" placeholder="请输入喜好标签" />
  </el-form-item>

  <!-- 音乐 -->
  <el-form-item label="音乐背景图片">
    <el-input
      v-model="formData.music.background"
      placeholder="请输入音乐背景图片链接"
    />
  </el-form-item>

  <el-form-item label="音乐标题">
    <el-input v-model="formData.music.title" placeholder="请输入音乐标题" />
  </el-form-item>

  <el-form-item label="音乐链接">
    <el-input v-model="formData.music.link" placeholder="请输入音乐链接" />
  </el-form-item>

  <el-form-item label="音乐标签">
    <el-input v-model="formData.music.tips" placeholder="请输入音乐标签" />
  </el-form-item>

  <!-- 生涯 -->
  <el-form-item label="生涯背景图片">
    <el-input
      v-model="formData.careers.img"
      placeholder="请输入生涯背景图片链接"
    />
  </el-form-item>

  <el-form-item label="生涯标题">
    <el-input v-model="formData.careers.title" placeholder="请输入生涯标题" />
  </el-form-item>

  <el-form-item label="生涯标签">
    <el-input v-model="formData.careers.tips" placeholder="请输入生涯标签" />
  </el-form-item>

  <!-- 生涯列表编辑 -->
  <CareerListEditor
    :career-list="formData.careers.list"
    @update:career-list="updateCareerList"
  />

  <!-- 技能提示 -->
  <el-form-item label="技能标题">
    <el-input
      v-model="formData.skillsTips.title"
      placeholder="请输入技能标题"
    />
  </el-form-item>

  <el-form-item label="技能标签">
    <el-input v-model="formData.skillsTips.tips" placeholder="请输入技能标签" />
  </el-form-item>

  <!-- 统计背景 -->
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

const props = defineProps<{
  modelValue: AboutPageSettingsInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

const formData = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

// 技能标签文本处理
const skillsLeftText = computed({
  get: () => (props.modelValue.avatarSkillsLeft || []).join("\n"),
  set: (value: string) => {
    formData.value.avatarSkillsLeft = value
      .split("\n")
      .filter(item => item.trim());
  }
});

const skillsRightText = computed({
  get: () => (props.modelValue.avatarSkillsRight || []).join("\n"),
  set: (value: string) => {
    formData.value.avatarSkillsRight = value
      .split("\n")
      .filter(item => item.trim());
  }
});

// 站点提示关键词文本处理
const siteTipsWordsText = computed({
  get: () => (props.modelValue.aboutSiteTips?.word || []).join(","),
  set: (value: string) => {
    formData.value.aboutSiteTips.word = value
      .split(",")
      .map(item => item.trim())
      .filter(item => item);
  }
});

const updateComicList = (newList: any[]) => {
  // 创建新的comic对象，确保Vue能检测到变化
  formData.value.comic = {
    ...formData.value.comic,
    list: newList
  };
};

const updateCareerList = (newList: any[]) => {
  // 创建新的careers对象，确保Vue能检测到变化
  formData.value.careers = {
    ...formData.value.careers,
    list: newList
  };
};
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
