<!--
 * @Description: 动漫列表编辑器
 * @Author: 安知鱼
 * @Date: 2025-08-21
-->
<template>
  <el-form-item label="动漫列表">
    <div class="comic-list-container">
      <div
        v-for="(comic, index) in localComicList"
        :key="index"
        class="comic-item"
      >
        <el-card shadow="hover">
          <div class="comic-item-header">
            <span class="comic-index">#{{ index + 1 }}</span>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="removeComic(index)"
            >
              删除
            </el-button>
          </div>

          <el-form-item label="封面图片">
            <el-input
              v-model="comic.cover"
              placeholder="请输入动漫封面图片链接"
            />
          </el-form-item>

          <el-form-item label="链接地址">
            <el-input v-model="comic.href" placeholder="请输入动漫链接地址" />
          </el-form-item>

          <el-form-item label="动漫名称">
            <el-input v-model="comic.name" placeholder="请输入动漫名称" />
          </el-form-item>
        </el-card>
      </div>

      <el-button
        type="primary"
        :icon="Plus"
        class="add-comic-btn"
        @click="addComic"
      >
        添加动漫
      </el-button>
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Delete, Plus } from "@element-plus/icons-vue";

interface ComicItem {
  cover: string;
  href: string;
  name: string;
}

const props = defineProps<{
  comicList: ComicItem[];
}>();

const emit = defineEmits(["update:comic-list"]);

const localComicList = ref<ComicItem[]>([...props.comicList]);

// 监听外部数据变化
watch(
  () => props.comicList,
  newList => {
    localComicList.value = [...newList];
  },
  { deep: true }
);

// 监听本地数据变化，同步到父组件
watch(
  localComicList,
  newList => {
    emit("update:comic-list", newList);
  },
  { deep: true }
);

const addComic = () => {
  localComicList.value.push({
    cover: "",
    href: "",
    name: ""
  });
};

const removeComic = (index: number) => {
  localComicList.value.splice(index, 1);
};
</script>

<style scoped lang="scss">
.comic-list-container {
  .comic-item {
    margin-bottom: 16px;

    .comic-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      .comic-index {
        font-weight: bold;
        color: #409eff;
      }
    }
  }

  .add-comic-btn {
    width: 100%;
    margin-top: 16px;
  }
}

.el-form-item {
  margin-bottom: 16px;
}
</style>
