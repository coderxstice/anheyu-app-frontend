<script setup lang="ts">
import { computed } from "vue";
import NoticeIcon from "@iconify-icons/ri/notification-fill";
import dayjs from "dayjs";
import { useSiteConfigStore } from "@/store/modules/siteConfig";

const props = defineProps<{
  updateDate: string;
}>();

defineOptions({
  name: "PostOutdateNotice"
});

const siteConfigStore = useSiteConfigStore();
const siteConfig = siteConfigStore.getSiteConfig;

/**
 * 计算从最后更新日期到今天的天数
 */
const daysSinceUpdate = computed(() => {
  const lastUpdateDate = dayjs(props.updateDate);
  const today = dayjs();
  return today.diff(lastUpdateDate, "day");
});

/**
 * 从站点配置中获取文章过期时间阈值，如果没有配置，则默认为 365 天
 */
const expirationThreshold = computed(() => {
  return siteConfig.post?.expiration_time ?? 365;
});

/**
 * 判断文章是否已过时。
 * @returns {boolean} 如果上次更新天数大于或等于配置的阈值，则返回 true。
 * 如果阈值为 0，则代表功能关闭，始终返回 false。
 */
const isOutdated = computed(() => {
  const threshold = expirationThreshold.value;

  // 当阈值为 0 时，表示不开启过期提示功能
  if (threshold === 0) {
    return false;
  }

  // 否则，正常判断天数是否超过阈值
  return daysSinceUpdate.value >= threshold;
});
</script>

<template>
  <div v-if="isOutdated" class="post-outdate-notice">
    <IconifyIconOffline :icon="NoticeIcon" />
    距离上次更新已经过去了 {{ daysSinceUpdate }} 天，文章的内容可能已经过时。
  </div>
</template>

<style lang="scss" scoped>
.post-outdate-notice {
  display: flex;
  gap: 0.5em;
  align-items: center;
  padding: 0.5em 1em;
  color: #f66;
  background-color: #ffe6e6;
  border-left: 5px solid #ff8080;
  border-radius: 3px;
}
</style>
