<template>
  <div v-if="model.homeTop">
    <el-divider content-position="left">首页顶部配置</el-divider>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="主标题">
          <el-input
            v-model="model.homeTop.title"
            placeholder="例如：生活明朗"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="副标题">
          <el-input
            v-model="model.homeTop.subTitle"
            placeholder="例如：万物可爱。"
          />
        </el-form-item>
      </el-col>
    </el-row>
    <el-form-item label="站点标语">
      <el-input
        v-model="model.homeTop.siteText"
        placeholder="例如：ANHEYU.COM"
      />
    </el-form-item>

    <el-divider content-position="left" style="margin-top: 20px"
      >横幅设置</el-divider
    >
    <div v-if="model.homeTop.banner">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="横幅标题">
            <el-input v-model="model.homeTop.banner.title" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="横幅提示">
            <el-input v-model="model.homeTop.banner.tips" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="横幅图片 URL">
            <el-input v-model="model.homeTop.banner.image" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="横幅链接">
            <el-input v-model="model.homeTop.banner.link" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="新窗口打开横幅链接">
        <el-switch v-model="model.homeTop.banner.isExternal" />
      </el-form-item>
    </div>

    <el-divider content-position="left" style="margin-top: 20px"
      >分类设置 (必须为3项)</el-divider
    >
    <el-table
      v-if="model.homeTop.category"
      :data="model.homeTop.category"
      border
      style="width: 100%"
    >
      <el-table-column label="名称" prop="name">
        <template #default="{ row }">
          <el-input v-model="row.name" placeholder="分类名称" />
        </template>
      </el-table-column>
      <el-table-column label="路径" prop="path">
        <template #default="{ row }">
          <el-input v-model="row.path" placeholder="例如：/categories/前端/" />
        </template>
      </el-table-column>
      <el-table-column label="图标" prop="icon">
        <template #default="{ row }">
          <el-input v-model="row.icon" placeholder="例如：anzhiyu-icon-dove" />
        </template>
      </el-table-column>
      <el-table-column label="背景" prop="background">
        <template #default="{ row }">
          <el-input
            v-model="row.background"
            placeholder="例如：linear-gradient(...)"
          />
        </template>
      </el-table-column>
    </el-table>
  </div>
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
    :model-value="JSON.stringify(model.menu)"
    title="导航菜单列表"
    :columns="menuColumns"
    :new-item-template="{ title: '', items: [] }"
    @update:model-value="model.menu = JSON.parse($event || '[]')"
  >
    <template #col-items="{ scope }">
      <el-button @click="openSubMenuEditor(scope.row)">
        编辑子菜单 ({{ scope.row.items?.length || 0 }} 项)
      </el-button>
    </template>
  </JsonEditorTable>

  <JsonEditorTable
    :model-value="JSON.stringify(model.navMenuItems)"
    title="页眉下拉菜单列表"
    :columns="navMenuItemsColumns"
    :new-item-template="{ title: '', items: [] }"
    @update:model-value="model.navMenuItems = JSON.parse($event || '[]')"
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
    :model-value="JSON.stringify(model.footerBadges)"
    title="徽标列表"
    :columns="badgeColumns"
    :new-item-template="{ link: '', shields: '', message: '' }"
    @update:model-value="model.footerBadges = JSON.parse($event || '[]')"
  />

  <JsonEditorTable
    :model-value="JSON.stringify(model.footerSocialBarLeft)"
    title="社交链接栏左侧列表"
    :columns="socialLinkColumns"
    :new-item-template="{ title: '', link: '', icon: '' }"
    @update:model-value="model.footerSocialBarLeft = JSON.parse($event || '[]')"
    @item-deleted="syncDeleteRight"
  />

  <JsonEditorTable
    :model-value="JSON.stringify(model.footerSocialBarRight)"
    title="社交链接栏右侧列表"
    :columns="socialLinkColumns"
    :new-item-template="{ title: '', link: '', icon: '' }"
    @update:model-value="
      model.footerSocialBarRight = JSON.parse($event || '[]')
    "
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
    :model-value="JSON.stringify(model.footerBarLinkList)"
    title="底部栏链接列表"
    :columns="footerBarLinkColumns"
    :new-item-template="{ text: '', link: '' }"
    @update:model-value="model.footerBarLinkList = JSON.parse($event || '[]')"
  />

  <el-divider content-position="left">页脚多栏链接列表</el-divider>
  <FooterLinkListEditor
    :model-value="JSON.stringify(model.footerList)"
    @update:model-value="model.footerList = JSON.parse($event || '[]')"
  />

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
import { ref, watch } from "vue";
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

watch(
  () => model.value.homeTop?.category,
  newCategory => {
    if (!newCategory) return;

    // 遍历数组，去除每个 path 属性末尾的斜杠
    newCategory.forEach(item => {
      if (typeof item.path === "string" && item.path.endsWith("/")) {
        // 使用正则表达式替换一个或多个尾随斜杠
        item.path = item.path.replace(/\/+$/, "");
      }
    });

    // 保持原有的数组长度必须为3的逻辑
    if (newCategory.length !== 3) {
      const categoryTemplate = {
        name: "",
        path: "",
        icon: "",
        background: "",
        isExternal: false
      };

      if (newCategory.length > 3) {
        model.value.homeTop.category = newCategory.slice(0, 3);
      } else {
        const needed = 3 - newCategory.length;
        for (let i = 0; i < needed; i++) {
          model.value.homeTop.category.push({ ...categoryTemplate });
        }
      }
    }
  },
  { deep: true, immediate: true }
);

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

// --- Social Links Sync Logic (Simplified) ---
const isListIncomplete = (list: any[]): boolean => {
  if (list.length === 0) {
    return false;
  }
  const lastItem = list[list.length - 1];
  return Object.values(lastItem).some(
    v => v === "" || v === null || v === undefined
  );
};

const addSocialLinkPair = () => {
  if (isListIncomplete(model.value.footerSocialBarLeft)) {
    ElMessage.warning("请先填写完左侧列表的当前项！");
    return;
  }
  if (isListIncomplete(model.value.footerSocialBarRight)) {
    ElMessage.warning("请先填写完右侧列表的当前项！");
    return;
  }

  const newItem = { title: "", link: "", icon: "" };
  model.value.footerSocialBarLeft.push({ ...newItem });
  model.value.footerSocialBarRight.push({ ...newItem });
};

const syncDeleteRight = (index: number) => {
  if (index < model.value.footerSocialBarRight.length) {
    model.value.footerSocialBarRight.splice(index, 1);
  }
};

const syncDeleteLeft = (index: number) => {
  if (index < model.value.footerSocialBarLeft.length) {
    model.value.footerSocialBarLeft.splice(index, 1);
  }
};
</script>
