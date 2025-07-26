<template>
  <!-- 基础信息 -->
  <el-form-item label="网站拥有者名称">
    <el-input
      v-model="model.siteOwnerName"
      placeholder="例如：安知鱼"
      clearable
    />
  </el-form-item>
  <el-form-item label="网站拥有者邮箱">
    <el-input
      v-model="model.siteOwnerEmail"
      placeholder="例如：anzhiyu-c@qq.com"
      clearable
    />
  </el-form-item>
  <el-form-item label="页脚版权所有者">
    <el-input
      v-model="model.footerOwnerName"
      placeholder="例如：安知鱼"
      clearable
    />
  </el-form-item>
  <el-form-item label="页脚版权起始年份">
    <el-input
      v-model="model.footerOwnerSince"
      placeholder="例如：2020"
      clearable
    />
  </el-form-item>

  <!-- 网站运行时间 -->
  <el-divider content-position="left">网站运行时间</el-divider>
  <el-form-item label="启用模块">
    <el-switch v-model="model.footerRuntimeEnable" />
  </el-form-item>
  <el-form-item label="网站上线时间">
    <el-date-picker
      v-model="model.footerRuntimeLaunchTime"
      type="datetime"
      placeholder="选择日期和时间"
      format="MM/DD/YYYY HH:mm:ss"
      value-format="MM/DD/YYYY HH:mm:ss"
      style="width: 100%"
    />
  </el-form-item>

  <!-- 链接配置 -->
  <el-divider content-position="left">链接配置</el-divider>
  <el-form-item label="页脚列表随机友链数量">
    <el-input
      v-model="model.footerListRandomFriends"
      placeholder="例如：3"
      clearable
    />
  </el-form-item>
  <el-form-item label="底部栏作者链接">
    <el-input
      v-model="model.footerBarAuthorLink"
      placeholder="/about"
      clearable
    />
  </el-form-item>
  <el-form-item label="底部栏CC协议链接">
    <el-input
      v-model="model.footerBarCCLink"
      placeholder="/copyright"
      clearable
    />
  </el-form-item>

  <!-- 图片配置 -->
  <el-divider content-position="left">图片配置</el-divider>
  <el-form-item label="社交链接栏中间图片 URL">
    <el-input
      v-model="model.footerSocialBarCenterImg"
      placeholder="图片 URL"
      clearable
    />
  </el-form-item>

  <!-- 使用 JsonEditorTable 的部分 -->
  <JsonEditorTable
    v-model="model.footerBadgeJSON"
    title="徽标列表"
    :columns="badgeColumns"
    :new-item-template="{ link: '', shields: '', message: '' }"
  />

  <!-- 社交链接栏同步逻辑 -->
  <JsonEditorTable
    v-model="model.footerSocialBarLeftJSON"
    title="社交链接栏左侧列表"
    :columns="socialLinkColumns"
    :new-item-template="{ title: '', link: '', icon: '' }"
    @item-deleted="syncDeleteRight"
  />

  <JsonEditorTable
    v-model="model.footerSocialBarRightJSON"
    title="社交链接栏右侧列表"
    :columns="socialLinkColumns"
    :new-item-template="{ title: '', link: '', icon: '' }"
    @item-deleted="syncDeleteLeft"
  />

  <!-- 专用于同步添加的按钮 -->
  <el-button
    style="width: 100%; margin-top: -12px; margin-bottom: 24px"
    type="primary"
    plain
    @click="addSocialLinkPair"
  >
    <el-icon><Plus /></el-icon>
    <span>同步添加左右社交链接</span>
  </el-button>

  <JsonEditorTable
    v-model="model.footerBarLinkListJSON"
    title="底部栏链接列表"
    :columns="footerBarLinkColumns"
    :new-item-template="{ text: '', link: '' }"
  />

  <!-- 使用新的页脚链接列表编辑器 -->
  <el-divider content-position="left">页脚多栏链接列表</el-divider>
  <FooterLinkListEditor v-model="model.footerListJSON" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import type { HomePageSettingsInfo } from "../../type";
import JsonEditorTable from "./JsonEditorTable.vue";
import FooterLinkListEditor from "./FooterLinkListEditor.vue";

const model = defineModel<Omit<HomePageSettingsInfo, "footerCustomText">>({
  required: true
});

// 定义不同 JSON 结构的列
const badgeColumns = ref([
  { prop: "link", label: "链接" },
  { prop: "shields", label: "徽标图片URL" },
  { prop: "message", label: "悬浮提示" }
]);

const socialLinkColumns = ref([
  { prop: "title", label: "标题" },
  { prop: "link", label: "链接" },
  { prop: "icon", label: "图标类名" }
]);

const footerBarLinkColumns = ref([
  { prop: "text", label: "显示文本" },
  { prop: "link", label: "链接" }
]);

// --- 社交链接栏同步逻辑 ---

// 检查指定列表的最后一行是否未填写完整
const isListIncomplete = (jsonString: string): boolean => {
  if (!jsonString) return false;
  try {
    const list = JSON.parse(jsonString);
    if (list.length === 0) return false;
    const lastItem = list[list.length - 1];
    return Object.values(lastItem).some(
      v => v === "" || v === null || v === undefined
    );
  } catch {
    return false;
  }
};

// 添加左右社交链接对的方法
const addSocialLinkPair = () => {
  // 检查左侧和右侧列表是否允许添加新项
  if (isListIncomplete(model.value.footerSocialBarLeftJSON)) {
    ElMessage.warning("请先填写完左侧列表的当前项！");
    return;
  }
  if (isListIncomplete(model.value.footerSocialBarRightJSON)) {
    ElMessage.warning("请先填写完右侧列表的当前项！");
    return;
  }

  try {
    const leftList = JSON.parse(model.value.footerSocialBarLeftJSON || "[]");
    const rightList = JSON.parse(model.value.footerSocialBarRightJSON || "[]");

    const newItem = { title: "", link: "", icon: "" };
    leftList.push({ ...newItem });
    rightList.push({ ...newItem });

    model.value.footerSocialBarLeftJSON = JSON.stringify(leftList, null, 2);
    model.value.footerSocialBarRightJSON = JSON.stringify(rightList, null, 2);
  } catch (e) {
    ElMessage.error("添加社交链接失败，请检查JSON格式是否正确。");
    console.error(e);
  }
};

// 当左侧列表删除时，同步删除右侧对应项
const syncDeleteRight = (index: number) => {
  try {
    const rightList = JSON.parse(model.value.footerSocialBarRightJSON || "[]");
    if (index < rightList.length) {
      rightList.splice(index, 1);
      model.value.footerSocialBarRightJSON = JSON.stringify(rightList, null, 2);
    }
  } catch (e) {
    ElMessage.error("同步删除右侧链接失败。");
  }
};

// 当右侧列表删除时，同步删除左侧对应项
const syncDeleteLeft = (index: number) => {
  try {
    const leftList = JSON.parse(model.value.footerSocialBarLeftJSON || "[]");
    if (index < leftList.length) {
      leftList.splice(index, 1);
      model.value.footerSocialBarLeftJSON = JSON.stringify(leftList, null, 2);
    }
  } catch (e) {
    ElMessage.error("同步删除左侧链接失败。");
  }
};
</script>
