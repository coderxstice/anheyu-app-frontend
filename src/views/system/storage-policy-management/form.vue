<script setup lang="ts">
import { ref, computed, watch, h } from "vue";
import type { StoragePolicy } from "@/api/sys-policy";
import { addDialog } from "@/components/ReDialog";
import MagicVariablesTable from "./MagicVariablesTable.vue";

// ... (props, emits, formData, aera 等逻辑保持不变)
const props = defineProps<{ modelValue: Partial<StoragePolicy> }>();
const emit = defineEmits(["update:modelValue"]);
const formData = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
const ruleFormRef = ref();
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
      (newChunkSize as number) ?? 0
    );
  },
  { immediate: true }
);
const showOneDriveFields = computed(() => formData.value.type === "onedrive");

// ▼▼▼ 1. 修改函数，让它能接收上下文参数 ▼▼▼
function showMagicVariablesDialog(context: "path" | "filename") {
  addDialog({
    title: "魔法变量说明",
    width: "750px",
    hideFooter: true,
    // ▼▼▼ 2. 将 context 作为 prop 传递给子组件 ▼▼▼
    contentRenderer: () => h(MagicVariablesTable, { context })
  });
}

function getRef() {
  return ruleFormRef.value;
}
defineExpose({ getRef });
</script>

<template>
  <el-form ref="ruleFormRef" :model="formData" label-width="150px">
    <h1>基本信息</h1>
    <el-form-item label="策略名称" prop="name">
      <el-input v-model="formData.name" placeholder="请输入策略名称" />
      <div class="form-item-help">存储策略的展示名，也会用于向用户展示。</div>
    </el-form-item>
    <el-form-item label="存储类型" prop="type">
      <el-select v-model="formData.type" placeholder="请选择存储类型">
        <el-option label="本机存储" value="local" />
        <el-option label="OneDrive" value="onedrive" />
      </el-select>
      <div class="form-item-help">选择一种存储驱动。</div>
    </el-form-item>
    <template v-if="showOneDriveFields" />

    <el-divider>
      <h2 class="divider-title">存储与上传</h2>
    </el-divider>

    <el-form-item label="Blob 存储目录">
      <el-input
        v-model="formData.dir_name_rule"
        placeholder="例如: data/uploads/{uid}/{path}"
      />
      <div class="form-item-help">
        文件 Blob 的存放目录，可以使用
        <el-link type="primary" @click="showMagicVariablesDialog('path')"
          >魔法变量</el-link
        >。
      </div>
    </el-form-item>

    <el-form-item label="Blob 名称">
      <el-input
        v-model="formData.file_name_rule"
        placeholder="例如: {uuid}_{originname}"
      />
      <div class="form-item-help">
        文件 Blob 的名称，可以使用
        <el-link type="primary" @click="showMagicVariablesDialog('filename')"
          >魔法变量</el-link
        >，需确保绝对唯一。
      </div>
    </el-form-item>

    <el-form-item label="文件大小限制">
      <el-input v-model.number="maxsizeValue" type="number" :min="0">
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
    <el-form-item label="上传分片大小">
      <el-input v-model.number="chunkSizeValue" type="number" :min="0">
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
.el-link {
  line-height: 1.3 !important;
  vertical-align: baseline !important;
}
.el-link__inner {
  font-size: 12px !important;
}
</style>
