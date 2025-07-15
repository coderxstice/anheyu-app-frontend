<script setup lang="ts">
import { ref, computed, watch, shallowRef } from "vue";
import type { StoragePolicy } from "@/api/sys-policy";
import type { FormInstance, FormRules } from "element-plus";
import { commonFormRules } from "./utils/rule";

// --- 动态导入所有策略的特定组件和规则 ---
// 1. 本地存储
import LocalForm from "./components/local/Form.vue";
import { localRules } from "./components/local/config";

// 2. OneDrive
import OneDriveForm from "./components/onedrive/Form.vue";
import { oneDriveRules } from "./components/onedrive/config";

// 3. 未来在这里添加 S3, COS ...
// import S3Form from "./components/s3/Form.vue";
// import { s3Rules } from "./components/s3/config";

// --- 注册动态组件和规则 ---
const providerForms = shallowRef({
  local: LocalForm,
  onedrive: OneDriveForm
  // s3: S3Form,
});

const providerRules = {
  local: localRules,
  onedrive: oneDriveRules
  // s3: s3Rules,
};

// --- props, emits ---
const props = defineProps<{ modelValue: Partial<StoragePolicy> }>();
const emit = defineEmits(["update:modelValue"]);
const formData = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

// --- 表单引用和动态规则合并 ---
const ruleFormRef = ref<FormInstance>();
const formRules = computed<FormRules>(() => {
  const currentProviderRules = providerRules[formData.value.type] || {};
  return { ...commonFormRules, ...currentProviderRules };
});

// --- 动态加载当前策略的表单组件 ---
const providerFormComponent = computed(() => {
  return providerForms.value[formData.value.type] || null;
});

// --- 单位换算逻辑 (保持不变) ---
const units = [
  { label: "B", value: 1 },
  { label: "KB", value: 1024 },
  { label: "MB", value: 1024 * 1024 },
  { label: "GB", value: 1024 * 1024 * 1024 }
];
const maxsizeValue = ref(0);
const maxsizeUnit = ref(1024 * 1024);
const chunkSizeValue = ref(0);
const chunkSizeUnit = ref(1024 * 1024);

function bytesToHuman(bytes: number): [number, number] {
  if (bytes === 0) return [0, 1024 * 1024];
  for (let i = units.length - 1; i >= 0; i--) {
    const unit = units[i];
    if (bytes >= unit.value && bytes % unit.value === 0) {
      return [bytes / unit.value, unit.value];
    }
  }
  const mbValue = 1024 * 1024;
  return [parseFloat((bytes / mbValue).toFixed(2)), mbValue];
}

watch([maxsizeValue, maxsizeUnit], ([newSize, newUnit]) => {
  formData.value.max_size = Math.round(newSize * newUnit);
});
watch(
  () => props.modelValue.max_size,
  newMaxSize => {
    [maxsizeValue.value, maxsizeUnit.value] = bytesToHuman(newMaxSize ?? 0);
  },
  { immediate: true }
);

watch([chunkSizeValue, chunkSizeUnit], ([newSize, newUnit]) => {
  if (!formData.value.settings) formData.value.settings = {};
  formData.value.settings.chunk_size = Math.round(newSize * newUnit);
});
watch(
  () => props.modelValue.settings?.chunk_size,
  newChunkSize => {
    if (!formData.value.settings) formData.value.settings = {};
    [chunkSizeValue.value, chunkSizeUnit.value] = bytesToHuman(
      (newChunkSize as number) ?? 50 * 1024 * 1024 // 默认50MB
    );
  },
  { immediate: true }
);

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="formData"
    :rules="formRules"
    label-width="150px"
  >
    <h1>基本信息</h1>
    <el-form-item label="策略名称" prop="name">
      <el-input v-model="formData.name" placeholder="请输入策略名称" />
      <div class="form-item-help">存储策略的展示名，也会用于向用户展示。</div>
    </el-form-item>
    <el-form-item label="存储类型" prop="type">
      <el-select
        v-model="formData.type"
        placeholder="请选择存储类型"
        :disabled="!!formData.id"
      >
        <el-option label="本机存储" value="local" />
        <el-option label="OneDrive" value="onedrive" />
      </el-select>
      <div class="form-item-help">选择一种存储驱动。创建后不可更改。</div>
    </el-form-item>

    <component
      :is="providerFormComponent"
      v-if="providerFormComponent"
      v-model="formData"
    />

    <el-divider>
      <h2 class="divider-title">存储与上传</h2>
    </el-divider>

    <el-form-item label="文件大小限制" prop="max_size">
      <el-input v-model.number="maxsizeValue" :min="0" style="width: 180px">
        <template #append>
          <el-select v-model="maxsizeUnit" style="width: 80px">
            <el-option
              v-for="u in units"
              :key="u.value"
              :label="u.label"
              :value="u.value"
            />
          </el-select>
        </template>
      </el-input>
      <div class="form-item-help">
        单个文件的最大大小，输入为 0 时表示不限制单文件大小。
      </div>
    </el-form-item>
    <el-form-item label="上传分片大小" prop="settings.chunk_size">
      <el-input v-model.number="chunkSizeValue" :min="0" style="width: 180px">
        <template #append>
          <el-select v-model="chunkSizeUnit" style="width: 80px">
            <el-option
              v-for="u in units"
              :key="u.value"
              :label="u.label"
              :value="u.value"
            />
          </el-select>
        </template>
      </el-input>
      <div class="form-item-help">
        分片上传时每个分片的大小，0 表示不启用分片上传。
      </div>
    </el-form-item>
  </el-form>
</template>

<style scoped lang="scss">
.form-item-help {
  color: #999;
  font-size: 12px;
  line-height: 1.5;
  margin-top: 4px;
}
.divider-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}
</style>
