<!--
 * @Description: 生涯列表编辑器
 * @Author: 安知鱼
 * @Date: 2025-08-21
-->
<template>
  <el-form-item label="生涯列表">
    <div class="career-list-container">
      <div
        v-for="(career, index) in localCareerList"
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
import { ref, watch } from "vue";
import { Delete, Plus } from "@element-plus/icons-vue";

interface CareerItem {
  color: string;
  desc: string;
}

const props = defineProps<{
  careerList: CareerItem[];
}>();

const emit = defineEmits(["update:career-list"]);

const localCareerList = ref<CareerItem[]>([...props.careerList]);

// 监听外部数据变化
watch(
  () => props.careerList,
  newList => {
    localCareerList.value = [...newList];
  },
  { deep: true }
);

// 监听本地数据变化，同步到父组件
watch(
  localCareerList,
  newList => {
    emit("update:career-list", newList);
  },
  { deep: true }
);

const addCareer = () => {
  localCareerList.value.push({
    color: "#409eff",
    desc: ""
  });
};

const removeCareer = (index: number) => {
  localCareerList.value.splice(index, 1);
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
