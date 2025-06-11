<template>
  <el-config-provider :locale="currentLocale">
    <router-view />
    <ReDialog />
  </el-config-provider>
</template>

<script lang="ts">
import { defineComponent, onMounted } from "vue";
import { ElConfigProvider } from "element-plus";
import { ReDialog } from "@/components/ReDialog";
import zhCn from "element-plus/es/locale/lang/zh-cn";

import { useSiteConfigStore } from "@/store/modules/siteConfig";

export default defineComponent({
  name: "app",
  components: {
    [ElConfigProvider.name]: ElConfigProvider,
    ReDialog
  },
  setup() {
    const siteConfigStore = useSiteConfigStore();

    onMounted(async () => {
      // 1. 获取站点配置
      await siteConfigStore.fetchSiteConfig();
      const siteConfig = siteConfigStore.getSiteConfig;

      // 2. 动态更新页面标题 (document.title)
      if (siteConfig?.APP_NAME) {
        document.title = siteConfig.APP_NAME;
      } else {
        document.title = "鱼鱼相册"; // 默认标题
      }

      // 3. 动态更新 Favicon (link rel="icon")
      // 找到现有的 Favicon 链接元素
      let faviconLink = document.querySelector(
        'link[rel="icon"]'
      ) as HTMLLinkElement;
      if (!faviconLink) {
        // 如果不存在，则创建它
        faviconLink = document.createElement("link");
        faviconLink.rel = "icon";
        document.head.appendChild(faviconLink);
      }
      if (siteConfig?.ICON_URL) {
        faviconLink.href = siteConfig.ICON_URL;
      } else {
        faviconLink.href = "/logo.svg"; // 默认 Favicon 路径
      }

      // 4. 动态更新 Windows Tile Logo (meta name="msapplication-TileImage")
      let msTileImageMeta = document.querySelector(
        'meta[name="msapplication-TileImage"]'
      ) as HTMLMetaElement;
      if (!msTileImageMeta) {
        msTileImageMeta = document.createElement("meta");
        msTileImageMeta.name = "msapplication-TileImage";
        document.head.appendChild(msTileImageMeta);
      }
      if (siteConfig?.LOGO_URL) {
        msTileImageMeta.content = siteConfig.LOGO_URL;
      } else {
        msTileImageMeta.content = "/logo.svg";
      }

      console.log("App.vue 已获取站点配置并更新页面元信息:", siteConfig);
    });

    return {};
  },
  computed: {
    currentLocale() {
      return zhCn;
    }
  }
});
</script>
