<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-24 14:34:19
 * @LastEditTime: 2025-06-24 14:38:37
 * @LastEditors: 安知鱼
-->
<template>
  <div class="actions">
    <el-button v-ripple :icon="useRenderIcon(Upload)" type="primary">
      上传
    </el-button>
    <el-button v-ripple :icon="useRenderIcon(FolderAdd)">新建文件夹</el-button>
  </div>
</template>

<script lang="ts" setup>
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import Upload from "@iconify-icons/ep/upload";
import FolderAdd from "@iconify-icons/ep/folder-add";
</script>

<style></style>
