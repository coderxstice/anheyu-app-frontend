/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-23 13:41:03
 * @LastEditTime: 2025-06-23 19:13:22
 * @LastEditors: 安知鱼
 */
import { ref, onMounted, reactive } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@/utils/message";
import {
  getPolicyList,
  createPolicy,
  deletePolicy,
  type StoragePolicy,
  type PolicyListParams
} from "@/api/sys-policy";
import type { Router } from "vue-router";

export function usePolicy(router: Router) {
  const dataList = ref<StoragePolicy[]>([]);
  const loading = ref(true);

  const pagination = reactive({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });

  async function onSearch() {
    loading.value = true;
    try {
      const params: PolicyListParams = {
        page: pagination.currentPage,
        pageSize: pagination.pageSize
      };
      // 2. 调用 getPolicyList 时传入分页参数
      const { data } = await getPolicyList(params);
      // 3. 正确地赋值 list 和 total
      dataList.value = data.list;
      pagination.total = data.total;
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => {
        loading.value = false;
      }, 300);
    }
  }

  function onSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }

  function onCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  // 处理创建流程
  async function handleCreate(type: "local" | "onedrive", typeName: string) {
    try {
      const { value: name } = await ElMessageBox.prompt(
        `为新的 ${typeName} 策略命名`,
        "创建存储策略",
        {
          confirmButtonText: "创建并配置",
          cancelButtonText: "取消",
          inputPattern: /.+/,
          inputErrorMessage: "名称不能为空"
        }
      );

      const { data: newPolicy } = await createPolicy({ name, type });
      message(`策略 ${name} 创建成功，请继续配置。`, { type: "success" });

      // 跳转到新的编辑页面
      router.push({ name: "StoragePolicyEdit", params: { id: newPolicy.id } });
    } catch (e) {
      if (e !== "cancel") {
        console.error(e);
      }
    }
  }

  // 处理编辑跳转
  function handleEdit(row: StoragePolicy) {
    router.push({ name: "StoragePolicyEdit", params: { id: row.id } });
  }

  async function handleDelete(row: StoragePolicy) {
    await deletePolicy(row.id);
    message(`您删除了存储策略 ${row.name}`, { type: "success" });
    onSearch();
  }

  onMounted(() => {
    onSearch();
  });

  return {
    loading,
    dataList,
    pagination,
    onSearch,
    handleCreate,
    handleEdit,
    handleDelete,
    onSizeChange,
    onCurrentChange
  };
}
