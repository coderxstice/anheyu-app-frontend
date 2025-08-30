<!--
 * @Description: 生涯列表编辑器
 * @Author: 安知鱼
 * @Date: 2025-08-21
-->
<template>
  <el-form-item label="生涯列表">
    <div class="career-list-container">
      <div
        v-for="(career, index) in careerList"
        :key="index"
        class="career-item"
      >
        <el-card shadow="hover">
          <div class="career-item-header">
            <span class="career-index">#{{ index + 1 }}</span>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="removeCareer(index)"
            >
              删除
            </el-button>
          </div>

          <el-form-item label="颜色">
            <el-color-picker
              v-model="career.color"
              show-alpha
              placeholder="请选择颜色"
            />
          </el-form-item>

          <el-form-item label="描述">
            <el-input v-model="career.desc" placeholder="请输入生涯描述" />
          </el-form-item>
        </el-card>
      </div>

      <el-button
        type="primary"
        :icon="Plus"
        class="add-career-btn"
        @click="addCareer"
      >
        添加生涯
      </el-button>
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { Delete, Plus } from "@element-plus/icons-vue";

interface CareerItem {
  color: string;
  desc: string;
}

const props = defineProps<{
  careerList: CareerItem[];
}>();

const emit = defineEmits(["update:career-list"]);

const addCareer = () => {
  // 创建新的生涯项
  const newCareer: CareerItem = {
    color: "#409eff",
    desc: ""
  };

  // 创建新的数组并添加新项，避免直接修改props
  const updatedList = [...props.careerList, newCareer];
  emit("update:career-list", updatedList);
};

const removeCareer = (index: number) => {
  // 创建新的数组并移除指定项，避免直接修改props
  const updatedList = [...props.careerList];
  updatedList.splice(index, 1);
  emit("update:career-list", updatedList);
};
</script>

<style scoped lang="scss">
.career-list-container {
  .career-item {
    margin-bottom: 16px;

    .career-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      .career-index {
        font-weight: bold;
        color: #409eff;
      }
    }
  }

  .add-career-btn {
    width: 100%;
    margin-top: 16px;
  }
}

.el-form-item {
  margin-bottom: 16px;
}
</style>
