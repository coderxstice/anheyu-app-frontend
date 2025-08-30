<template>
  <div v-if="model.homeTop">
    <el-form-item label="网站拥有者名称">
      <el-input
        :model-value="model.siteOwnerName"
        placeholder="例如：安知鱼"
        clearable
        @update:model-value="updateSiteOwnerName"
      />
    </el-form-item>
    <el-form-item label="网站拥有者邮箱">
      <el-input
        :model-value="model.siteOwnerEmail"
        placeholder="例如：anzhiyu-c@qq.com"
        clearable
        @update:model-value="updateSiteOwnerEmail"
      />
    </el-form-item>

    <el-divider content-position="left">首页顶部配置</el-divider>
    <template v-if="model.homeTop">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="主标题">
            <el-input
              :model-value="model.homeTop.title"
              placeholder="例如：生活明朗"
              @update:model-value="updateHomeTopField('title', $event)"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="副标题">
            <el-input
              :model-value="model.homeTop.subTitle"
              placeholder="例如：万物可爱。"
              @update:model-value="updateHomeTopField('subTitle', $event)"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="站点标语">
        <el-input
          :model-value="model.homeTop.siteText"
          placeholder="例如：ANHEYU.COM"
          @update:model-value="updateHomeTopField('siteText', $event)"
        />
      </el-form-item>

      <el-divider content-position="left" style="margin-top: 20px"
        >横幅设置</el-divider
      >
      <div v-if="model.homeTop.banner">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="横幅标题">
              <el-input
                :model-value="model.homeTop.banner.title"
                @update:model-value="updateHomeTopBannerField('title', $event)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="横幅提示">
              <el-input
                :model-value="model.homeTop.banner.tips"
                @update:model-value="updateHomeTopBannerField('tips', $event)"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="横幅图片 URL">
              <el-input
                :model-value="model.homeTop.banner.image"
                @update:model-value="updateHomeTopBannerField('image', $event)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="横幅链接">
              <el-input
                :model-value="model.homeTop.banner.link"
                @update:model-value="updateHomeTopBannerField('link', $event)"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="新窗口打开横幅链接">
          <el-switch
            :model-value="model.homeTop.banner.isExternal"
            @update:model-value="updateHomeTopBannerField('isExternal', $event)"
          />
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
          <template #default="{ row, $index }">
            <el-input
              :model-value="row.name"
              placeholder="分类名称"
              @update:model-value="updateCategoryField($index, 'name', $event)"
            />
          </template>
        </el-table-column>
        <el-table-column label="路径" prop="path">
          <template #default="{ row, $index }">
            <el-input
              :model-value="row.path"
              placeholder="例如：/categories/前端/"
              @update:model-value="updateCategoryField($index, 'path', $event)"
            />
          </template>
        </el-table-column>
        <el-table-column label="图标" prop="icon">
          <template #default="{ row, $index }">
            <el-input
              :model-value="row.icon"
              placeholder="例如：anzhiyu-icon-dove"
              @update:model-value="updateCategoryField($index, 'icon', $event)"
            />
          </template>
        </el-table-column>
        <el-table-column label="背景" prop="background">
          <template #default="{ row, $index }">
            <el-input
              :model-value="row.background"
              placeholder="例如：linear-gradient(...)"
              @update:model-value="
                updateCategoryField($index, 'background', $event)
              "
            />
          </template>
        </el-table-column>
      </el-table>
    </template>
  </div>
  <el-divider content-position="left">页眉配置</el-divider>
  <el-row :gutter="20">
    <el-col :span="8">
      <el-form-item label="启用开往模块">
        <el-switch
          :model-value="model.navTravel"
          @update:model-value="updateNavTravel"
        />
      </el-form-item>
    </el-col>
    <el-col :span="8">
      <el-form-item label="启用轻提醒模块弹窗">
        <el-switch
          :model-value="model.navClock"
          @update:model-value="updateNavClock"
        />
      </el-form-item>
    </el-col>
  </el-row>

  <JsonEditorTable
    :model-value="JSON.stringify(model.menu)"
    title="导航菜单列表"
    :columns="menuColumns"
    :new-item-template="{ title: '', items: [] }"
    @update:model-value="updateMenu(JSON.parse($event || '[]'))"
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
    @update:model-value="updateNavMenuItems(JSON.parse($event || '[]'))"
  >
    <template #col-items="{ scope }">
      <el-button @click="openNavMenuItemsEditor(scope.row)">
        编辑链接 ({{ scope.row.items?.length || 0 }} 项)
      </el-button>
    </template>
  </JsonEditorTable>

  <el-divider content-position="left">页脚配置</el-divider>

  <el-form-item label="页脚版权所有者">
    <el-input
      :model-value="model.footerOwnerName"
      placeholder="例如：安知鱼"
      clearable
      @update:model-value="updateFooterOwnerName"
    />
  </el-form-item>
  <el-form-item label="页脚版权起始年份">
    <el-input
      :model-value="model.footerOwnerSince"
      placeholder="例如：2020"
      clearable
      @update:model-value="updateFooterOwnerSince"
    />
  </el-form-item>

  <el-divider content-position="left">网站运行时间</el-divider>
  <el-form-item label="启用页脚运行时间模块">
    <el-switch
      :model-value="model.footerRuntimeEnable"
      @update:model-value="updateFooterRuntimeEnable"
    />
  </el-form-item>
  <el-form-item label="网站上线时间(控制侧边栏建站天数以及页脚运行时间)">
    <el-date-picker
      :model-value="model.footerRuntimeLaunchTime"
      type="datetime"
      placeholder="选择日期和时间"
      format="MM/DD/YYYY HH:mm:ss"
      value-format="MM/DD/YYYY HH:mm:ss"
      style="width: 100%"
      @update:model-value="updateFooterRuntimeLaunchTime"
    />
  </el-form-item>

  <el-divider content-position="left">链接配置</el-divider>
  <el-form-item label="页脚列表随机友链数量">
    <el-input
      :model-value="model.footerListRandomFriends"
      placeholder="例如：3"
      clearable
      @update:model-value="updateFooterListRandomFriends"
    />
  </el-form-item>
  <el-form-item label="底部栏作者链接">
    <el-input
      :model-value="model.footerBarAuthorLink"
      placeholder="/about"
      clearable
      @update:model-value="updateFooterBarAuthorLink"
    />
  </el-form-item>
  <el-form-item label="底部栏CC协议链接">
    <el-input
      :model-value="model.footerBarCCLink"
      placeholder="/copyright"
      clearable
      @update:model-value="updateFooterBarCCLink"
    />
  </el-form-item>

  <el-divider content-position="left">图片配置</el-divider>
  <el-form-item label="社交链接栏中间图片 URL">
    <el-input
      :model-value="model.footerSocialBarCenterImg"
      placeholder="图片 URL"
      clearable
      @update:model-value="updateFooterSocialBarCenterImg"
    />
  </el-form-item>

  <JsonEditorTable
    :model-value="JSON.stringify(model.footerBadges)"
    title="徽标列表"
    :columns="badgeColumns"
    :new-item-template="{ link: '', shields: '', message: '' }"
    @update:model-value="updateFooterBadges(JSON.parse($event || '[]'))"
  />

  <JsonEditorTable
    :model-value="JSON.stringify(model.footerSocialBarLeft)"
    title="社交链接栏左侧列表"
    :columns="socialLinkColumns"
    :new-item-template="{ title: '', link: '', icon: '' }"
    @update:model-value="updateFooterSocialBarLeft"
    @item-deleted="syncDeleteRight"
  />

  <JsonEditorTable
    :model-value="JSON.stringify(model.footerSocialBarRight)"
    title="社交链接栏右侧列表"
    :columns="socialLinkColumns"
    :new-item-template="{ title: '', link: '', icon: '' }"
    @update:model-value="updateFooterSocialBarRight(JSON.parse($event || '[]'))"
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
    @update:model-value="updateFooterBarLinkList(JSON.parse($event || '[]'))"
  />

  <el-divider content-position="left">页脚多栏链接列表</el-divider>
  <FooterLinkListEditor
    :model-value="JSON.stringify(model.footerList)"
    @update:model-value="updateFooterList(JSON.parse($event || '[]'))"
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
  NavMenuItem,
  HomeTopInfo,
  HomeTopCategoryItem
} from "../../../type";
import JsonEditorTable from "../components/JsonEditorTable.vue";
import FooterLinkListEditor from "./FooterLinkListEditor.vue";
import SubMenuEditor from "./SubMenuEditor.vue";
import NavMenuItemsEditor from "./NavMenuItemsEditor.vue";

const model = defineModel<Omit<HomePageSettingsInfo, "footerCustomText">>({
  required: true
});

// --- Helper functions to update nested state immutably ---
const updateHomeTopField = (key: keyof HomeTopInfo, value: any) => {
  model.value = {
    ...model.value,
    homeTop: {
      ...model.value.homeTop,
      [key]: value
    }
  };
};

const updateHomeTopBannerField = (
  key: keyof HomeTopInfo["banner"],
  value: any
) => {
  model.value = {
    ...model.value,
    homeTop: {
      ...model.value.homeTop,
      banner: {
        ...model.value.homeTop.banner,
        [key]: value
      }
    }
  };
};

const updateCategoryField = (
  index: number,
  key: keyof HomeTopCategoryItem,
  value: any
) => {
  const newCategory = [...model.value.homeTop.category];
  newCategory[index] = { ...newCategory[index], [key]: value };
  updateHomeTopField("category", newCategory);
};

// --- Watcher for category array validation ---
watch(
  () => model.value.homeTop?.category,
  newCategory => {
    if (!newCategory) return;

    let isChanged = false;
    let processedCategory = [...newCategory];

    // 1. Sanitize paths
    processedCategory = processedCategory.map(item => {
      if (typeof item.path === "string" && item.path.endsWith("/")) {
        isChanged = true;
        return { ...item, path: item.path.replace(/\/+$/, "") };
      }
      return item;
    });

    // 2. Enforce array length of 3
    if (processedCategory.length !== 3) {
      isChanged = true;
      const categoryTemplate = {
        name: "",
        path: "",
        icon: "",
        background: "",
        isExternal: false
      };
      if (processedCategory.length > 3) {
        processedCategory = processedCategory.slice(0, 3);
      } else {
        const needed = 3 - processedCategory.length;
        for (let i = 0; i < needed; i++) {
          processedCategory.push({ ...categoryTemplate });
        }
      }
    }

    if (isChanged) {
      updateHomeTopField("category", processedCategory);
    }
  },
  { deep: true, immediate: true }
);

// --- Table column definitions ---
const menuColumns = ref<JsonEditorTableColumn[]>([
  { prop: "title", label: "主菜单标题" },
  { prop: "items", label: "子菜单项", slot: "col-items", width: "200px" }
]);

const navMenuItemsColumns = ref<JsonEditorTableColumn[]>([
  { prop: "title", label: "分组标题" },
  { prop: "items", label: "链接列表", slot: "col-items", width: "200px" }
]);

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

// --- Modal/Editor visibility and data logic ---
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

// --- Social Links Sync Logic ---
const isListIncomplete = (list: any[]): boolean => {
  if (list.length === 0) return false;
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
  const newLeft = [...model.value.footerSocialBarLeft, { ...newItem }];
  const newRight = [...model.value.footerSocialBarRight, { ...newItem }];

  model.value = {
    ...model.value,
    footerSocialBarLeft: newLeft,
    footerSocialBarRight: newRight
  };
};

const syncDeleteRight = (index: number) => {
  if (index < model.value.footerSocialBarRight.length) {
    const newRight = [...model.value.footerSocialBarRight];
    newRight.splice(index, 1);
    model.value = { ...model.value, footerSocialBarRight: newRight };
  }
};

const syncDeleteLeft = (index: number) => {
  if (index < model.value.footerSocialBarLeft.length) {
    const newLeft = [...model.value.footerSocialBarLeft];
    newLeft.splice(index, 1);
    model.value = { ...model.value, footerSocialBarLeft: newLeft };
  }
};

// --- Footer Badges Update Logic ---
const updateFooterBadges = (newBadges: any[]) => {
  model.value = {
    ...model.value,
    footerBadges: newBadges
  };
};

// --- Footer Social Bar Left Update Logic ---
const updateFooterSocialBarLeft = (newLeft: any[]) => {
  model.value = {
    ...model.value,
    footerSocialBarLeft: newLeft
  };
};

// --- Footer Social Bar Right Update Logic ---
const updateFooterSocialBarRight = (newRight: any[]) => {
  model.value = {
    ...model.value,
    footerSocialBarRight: newRight
  };
};

// --- Footer Bar Link List Update Logic ---
const updateFooterBarLinkList = (newList: any[]) => {
  model.value = {
    ...model.value,
    footerBarLinkList: newList
  };
};

// --- Footer List Update Logic ---
const updateFooterList = (newList: any[]) => {
  model.value = {
    ...model.value,
    footerList: newList
  };
};

// --- Menu Update Logic ---
const updateMenu = (newMenu: any[]) => {
  model.value = {
    ...model.value,
    menu: newMenu
  };
};

// --- Nav Menu Items Update Logic ---
const updateNavMenuItems = (newItems: any[]) => {
  model.value = {
    ...model.value,
    navMenuItems: newItems
  };
};

// --- Site Owner Update Logic ---
const updateSiteOwnerName = (newName: string) => {
  model.value = {
    ...model.value,
    siteOwnerName: newName
  };
};

const updateSiteOwnerEmail = (newEmail: string) => {
  model.value = {
    ...model.value,
    siteOwnerEmail: newEmail
  };
};

// --- Navigation Update Logic ---
const updateNavTravel = (newValue: boolean) => {
  model.value = {
    ...model.value,
    navTravel: !!newValue
  };
};

const updateNavClock = (newValue: boolean) => {
  model.value = {
    ...model.value,
    navClock: !!newValue
  };
};

// --- Footer Update Logic ---
const updateFooterOwnerName = (newName: string) => {
  model.value = {
    ...model.value,
    footerOwnerName: newName
  };
};

const updateFooterOwnerSince = (newYear: string) => {
  model.value = {
    ...model.value,
    footerOwnerSince: newYear
  };
};

const updateFooterRuntimeEnable = (newValue: boolean) => {
  model.value = {
    ...model.value,
    footerRuntimeEnable: !!newValue
  };
};

const updateFooterRuntimeLaunchTime = (newTime: string) => {
  model.value = {
    ...model.value,
    footerRuntimeLaunchTime: newTime
  };
};

const updateFooterListRandomFriends = (newCount: string) => {
  model.value = {
    ...model.value,
    footerListRandomFriends: newCount
  };
};

const updateFooterBarAuthorLink = (newLink: string) => {
  model.value = {
    ...model.value,
    footerBarAuthorLink: newLink
  };
};

const updateFooterBarCCLink = (newLink: string) => {
  model.value = {
    ...model.value,
    footerBarCCLink: newLink
  };
};

const updateFooterSocialBarCenterImg = (newImg: string) => {
  model.value = {
    ...model.value,
    footerSocialBarCenterImg: newImg
  };
};
</script>
