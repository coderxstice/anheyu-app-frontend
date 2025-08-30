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

// 使用 defineModel 接收来自父组件的 v-model:career-list
const careerList = defineModel<CareerItem[]>("career-list", { required: true });

const addCareer = () => {
  const newCareer: CareerItem = {
    color: "#409eff",
    desc: ""
  };
  // 直接修改 careerList.value，defineModel 会自动 emit 更新
  careerList.value = [...careerList.value, newCareer];
};

const removeCareer = (index: number) => {
  const updatedList = [...careerList.value];
  updatedList.splice(index, 1);
  // 直接修改 careerList.value，defineModel 会自动 emit 更新
  careerList.value = updatedList;
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
