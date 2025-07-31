<template>
  <el-divider content-position="left">页眉配置</el-divider>
  <el-row :gutter="20">
    <el-col :span="8">
      <el-form-item label="启用开往模块">
        <el-switch v-model="model.navTravel" />
      </el-form-item>
    </el-col>
    <el-col :span="8">
      <el-form-item label="启用轻提醒模块弹窗">
        <el-switch v-model="model.navClock" />
      </el-form-item>
    </el-col>
  </el-row>

  <JsonEditorTable
    v-model="model.menuJSON"
    title="导航菜单列表"
    :columns="menuColumns"
    :new-item-template="{ title: '', items: [] }"
  >
    <template #col-items="{ scope }">
      <el-button @click="openSubMenuEditor(scope.row)">
        编辑子菜单 ({{ scope.row.items?.length || 0 }} 项)
      </el-button>
    </template>
  </JsonEditorTable>

  <JsonEditorTable
    v-model="model.navMenuItemsJSON"
    title="页眉下拉菜单列表"
    :columns="navMenuItemsColumns"
    :new-item-template="{ title: '', items: [] }"
  >
    <template #col-items="{ scope }">
      <el-button @click="openNavMenuItemsEditor(scope.row)">
        编辑链接 ({{ scope.row.items?.length || 0 }} 项)
      </el-button>
    </template>
  </JsonEditorTable>

  <el-divider content-position="left">页脚配置</el-divider>

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

  <el-divider content-position="left">图片配置</el-divider>
  <el-form-item label="社交链接栏中间图片 URL">
    <el-input
      v-model="model.footerSocialBarCenterImg"
      placeholder="图片 URL"
      clearable
    />
  </el-form-item>

  <JsonEditorTable
    v-model="model.footerBadgeJSON"
    title="徽标列表"
    :columns="badgeColumns"
    :new-item-template="{ link: '', shields: '', message: '' }"
  />

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

  <el-divider content-position="left">页脚多栏链接列表</el-divider>
  <FooterLinkListEditor v-model="model.footerListJSON" />

  <SubMenuEditor
    v-if="currentEditingMainMenu"
    v-model:visible="isSubMenuEditorVisible"
    v-model:items="currentEditingMainMenu.items"
  />
  <NavMenuItemsEditor
    v-if="currentEditingNavMenuGroup"
    v-model:visible="isNavMenuEditorVisible"
    v-model:items="currentEditingNavMenuGroup.items"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import type {
  HomePageSettingsInfo,
  JsonEditorTableColumn,
  SubMenuItem,
  NavMenuItem
} from "../../type";
import JsonEditorTable from "./JsonEditorTable.vue";
import FooterLinkListEditor from "./FooterLinkListEditor.vue";
import SubMenuEditor from "./SubMenuEditor.vue";
import NavMenuItemsEditor from "./NavMenuItemsEditor.vue";

const model = defineModel<Omit<HomePageSettingsInfo, "footerCustomText">>({
  required: true
});

// for Header Menu
const menuColumns = ref<JsonEditorTableColumn[]>([
  { prop: "title", label: "主菜单标题" },
  { prop: "items", label: "子菜单项", slot: "col-items", width: "200px" }
]);

// for Header Nav Dropdown Menu
const navMenuItemsColumns = ref<JsonEditorTableColumn[]>([
  { prop: "title", label: "分组标题" },
  { prop: "items", label: "链接列表", slot: "col-items", width: "200px" }
]);

// for Footer Sections
const badgeColumns = ref<JsonEditorTableColumn[]>([
  { prop: "link", label: "链接" },
  { prop: "shields", label: "徽标图片URL" },
  { prop: "message", label: "悬浮提示" }
]);

const socialLinkColumns = ref<JsonEditorTableColumn[]>([
  { prop: "title", label: "标题" },
  { prop: "link", label: "链接" },
  { prop: "icon", label: "图标类名" }
]);

const footerBarLinkColumns = ref<JsonEditorTableColumn[]>([
  { prop: "text", label: "显示文本" },
  { prop: "link", label: "链接" }
]);

// --- Editor for header.menu (SubMenuEditor) ---
const isSubMenuEditorVisible = ref(false);
interface MainMenuRow {
  title: string;
  items: SubMenuItem[];
}
const currentEditingMainMenu = ref<MainMenuRow | null>(null);
const openSubMenuEditor = (row: MainMenuRow) => {
  currentEditingMainMenu.value = row;
  isSubMenuEditorVisible.value = true;
};

// --- Editor for header.nav.menu (NavMenuItemsEditor) ---
const isNavMenuEditorVisible = ref(false);
interface NavMenuGroupRow {
  title: string;
  items: NavMenuItem[];
}
const currentEditingNavMenuGroup = ref<NavMenuGroupRow | null>(null);
const openNavMenuItemsEditor = (row: NavMenuGroupRow) => {
  currentEditingNavMenuGroup.value = row;
  isNavMenuEditorVisible.value = true;
};

// --- Social Links Sync Logic ---
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

const addSocialLinkPair = () => {
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
