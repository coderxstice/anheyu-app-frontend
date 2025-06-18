<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-06-18 13:05:58
 * @LastEditors: 安知鱼
-->
<script lang="ts" setup>
import { getConfig } from "@/config";

const TITLE = getConfig("Title");
</script>

<template>
  <footer
    class="layout-footer text-[rgba(0,0,0,0.6)] dark:text-[rgba(220,220,242,0.8)]"
  >
    Copyright © 2025-present
    <a
      class="hover:text-primary"
      href="https://github.com/pure-admin"
      target="_blank"
    >
      &nbsp;{{ TITLE }}
    </a>
  </footer>
</template>

<style lang="scss" scoped>
.layout-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 0 8px;
  font-size: 14px;
}
</style>
