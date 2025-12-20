/*
 * @Description: 友链管理 Hook
 * @Author: 安知鱼
 */

import { message } from "@/utils/message";
import {
  getAdminLinkList,
  deleteLink,
  reviewLink,
  checkLinksHealth,
  getHealthCheckStatus,
  getLinkCategories,
  getLinkTags,
  exportLinks
} from "@/api/postLink";
import type {
  LinkItem,
  GetAdminLinksParams,
  LinkStatus,
  LinkCategory,
  LinkTag
} from "@/api/postLink/type";
import { reactive, ref, onMounted, h, onUnmounted } from "vue";
import type { PaginationProps, LoadingConfig } from "@pureadmin/table";
import { ElTag, ElMessageBox, ElAvatar, ElLink, ElTooltip } from "element-plus";

export function useFlinkManagement() {
  const form = reactive<GetAdminLinksParams>({
    name: "",
    url: "",
    status: undefined,
    category_id: undefined,
    tag_id: undefined
  });

  const dataList = ref<LinkItem[]>([]);
  const loading = ref(true);
  const selectedIds = ref<number[]>([]);

  // 分类和标签列表
  const categories = ref<LinkCategory[]>([]);
  const tags = ref<LinkTag[]>([]);

  // 健康检查状态
  const healthCheckRunning = ref(false);
  let healthCheckTimer: ReturnType<typeof setInterval> | null = null;

  // 状态选项
  const statusOptions = [
    { value: undefined, label: "全部状态" },
    {
      value: "PENDING",
      label: "待审核",
      type: "warning",
      color: "var(--anzhiyu-orange)"
    },
    {
      value: "APPROVED",
      label: "已通过",
      type: "success",
      color: "var(--anzhiyu-green)"
    },
    {
      value: "REJECTED",
      label: "已拒绝",
      type: "danger",
      color: "var(--anzhiyu-red)"
    },
    {
      value: "INVALID",
      label: "失联",
      type: "info",
      color: "#909399"
    }
  ];

  // 状态映射
  const statusMap: Record<
    LinkStatus,
    { text: string; type: "success" | "warning" | "danger" | "info" }
  > = {
    APPROVED: { text: "已通过", type: "success" },
    PENDING: { text: "待审核", type: "warning" },
    REJECTED: { text: "已拒绝", type: "danger" },
    INVALID: { text: "失联", type: "info" }
  };

  // 表格列配置
  const columns: TableColumnList = [
    {
      type: "selection",
      width: 55,
      align: "center",
      headerAlign: "left"
    },
    {
      label: "网站信息",
      prop: "name",
      minWidth: 280,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          "div",
          { style: "display: flex; align-items: center; gap: 12px;" },
          [
            h(ElAvatar, {
              src: row.logo,
              size: 40,
              style: "flex-shrink: 0;"
            }),
            h(
              "div",
              {
                style:
                  "flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px;"
              },
              [
                h(
                  "span",
                  {
                    style:
                      "font-size: 14px; font-weight: 600; color: var(--anzhiyu-fontcolor); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                  },
                  row.name
                ),
                h(
                  ElLink,
                  {
                    href: row.url,
                    target: "_blank",
                    type: "primary",
                    underline: false,
                    style:
                      "font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block;"
                  },
                  () => row.url
                )
              ]
            )
          ]
        );
      }
    },
    {
      label: "描述",
      prop: "description",
      minWidth: 200,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        const desc = row.description || "暂无描述";
        return h(
          ElTooltip,
          {
            content: desc,
            placement: "top",
            showAfter: 300
          },
          {
            default: () =>
              h(
                "span",
                {
                  style:
                    "display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: 13px; color: var(--anzhiyu-secondtext); line-height: 1.5;"
                },
                desc
              )
          }
        );
      }
    },
    {
      label: "分类/标签",
      prop: "category",
      width: 160,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        const elements = [];
        if (row.category) {
          elements.push(
            h(
              ElTag,
              { size: "small", type: "info", style: "margin-right: 4px;" },
              () => row.category.name
            )
          );
        }
        if (row.tag) {
          elements.push(
            h(
              ElTag,
              {
                size: "small",
                color: row.tag.color,
                style: `color: white; background: ${row.tag.color}; border: none;`
              },
              () => row.tag.name
            )
          );
        }
        if (elements.length === 0) {
          return h(
            "span",
            { style: "color: var(--anzhiyu-secondtext); font-size: 12px;" },
            "未设置"
          );
        }
        return h(
          "div",
          { style: "display: flex; flex-wrap: wrap; gap: 4px;" },
          elements
        );
      }
    },
    {
      label: "状态",
      prop: "status",
      width: 100,
      align: "center",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        const status = statusMap[row.status];
        const elements = [];

        // 如果是待审核，显示申请类型
        if (row.status === "PENDING" && row.type) {
          elements.push(
            h(
              ElTag,
              {
                size: "small",
                type: row.type === "NEW" ? "primary" : "warning",
                effect: "plain",
                style: "margin-bottom: 4px;"
              },
              () => (row.type === "NEW" ? "新增" : "修改")
            )
          );
        }

        elements.push(
          h(
            ElTag,
            { type: status.type, size: "small", effect: "light" },
            () => status.text
          )
        );

        return h(
          "div",
          {
            style:
              "display: flex; flex-direction: column; align-items: center; gap: 2px;"
          },
          elements
        );
      }
    },
    {
      label: "排序",
      prop: "sort_order",
      width: 80,
      align: "center",
      headerAlign: "left"
    },
    {
      label: "操作",
      fixed: "right",
      width: 240,
      align: "center",
      headerAlign: "left",
      slot: "operation",
      showOverflowTooltip: false
    }
  ];

  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 20,
    currentPage: 1,
    background: true,
    pageSizes: [10, 20, 50, 100]
  });

  const loadingConfig = reactive<LoadingConfig>({
    text: "正在加载友链列表...",
    viewBox: "-10, -10, 50, 50",
    spinner: `
      <path class="path" d="
        M 30 15
        L 28 17
        M 25.61 25.61
        A 15 15, 0, 0, 1, 15 30
        A 15 15, 0, 1, 1, 27.99 7.5
        L 15 15
      " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
    `
  });

  // 获取分类和标签列表
  async function fetchCategoriesAndTags() {
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        getLinkCategories(),
        getLinkTags()
      ]);
      if (categoriesRes.code === 200) {
        categories.value = categoriesRes.data;
      }
      if (tagsRes.code === 200) {
        tags.value = tagsRes.data;
      }
    } catch (error) {
      console.error("获取分类和标签列表失败", error);
    }
  }

  function resetForm(formEl) {
    if (!formEl) return;
    formEl.resetFields();
    form.name = "";
    form.url = "";
    form.status = undefined;
    form.category_id = undefined;
    form.tag_id = undefined;
    onSearch();
  }

  async function onSearch() {
    loading.value = true;
    const { currentPage, pageSize } = pagination;
    try {
      const params: GetAdminLinksParams = {
        page: currentPage,
        pageSize: pageSize,
        name: form.name,
        url: form.url,
        status: form.status,
        category_id: form.category_id,
        tag_id: form.tag_id
      };
      const res = await getAdminLinkList(params);
      if (res.code === 200) {
        dataList.value = res.data.list;
        pagination.total = res.data.total;
      }
    } catch {
      message("获取友链列表失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  async function handleDelete(row: LinkItem) {
    try {
      await deleteLink(row.id);
      message("删除成功", { type: "success" });
      if (dataList.value.length === 1 && pagination.currentPage > 1) {
        pagination.currentPage--;
      }
      onSearch();
    } catch (error) {
      message(`删除失败: ${error.message}`, { type: "error" });
    }
  }

  async function handleReview(row: LinkItem, status: "APPROVED" | "REJECTED") {
    try {
      let siteshot: string | undefined;
      let reject_reason: string | undefined;

      if (status === "APPROVED") {
        const { value } = await ElMessageBox.prompt(
          "请输入网站快照链接（可选）：",
          "审核通过",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            inputPlaceholder: "https://example.com/siteshot.png",
            inputPattern: /^$|^https?:\/\/.+/,
            inputErrorMessage: "请输入有效的网站快照链接"
          }
        );
        siteshot = value || undefined;
      } else if (status === "REJECTED") {
        const { value } = await ElMessageBox.prompt(
          "请填写拒绝原因（可选）：",
          "拒绝友链申请",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            inputPlaceholder: "请详细说明拒绝的原因，以便申请者了解并改进"
          }
        );
        reject_reason = value?.trim();
      }

      await reviewLink(row.id, { status, siteshot, reject_reason });
      message("审核操作成功", { type: "success" });
      onSearch();
    } catch (error) {
      if (error !== "cancel") {
        console.error("审核失败", error);
        message("审核失败", { type: "error" });
      }
    }
  }

  // 导出友链
  async function handleExport() {
    try {
      message("正在导出友链数据...", { type: "info" });

      const res = await exportLinks({
        name: form.name,
        url: form.url,
        status: form.status,
        category_id: form.category_id,
        tag_id: form.tag_id
      });

      if (res.code === 200 && res.data) {
        const jsonData = JSON.stringify(res.data.links, null, 2);
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        const timestamp = new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/:/g, "-");
        link.download = `友链导出_${timestamp}.json`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        message(`成功导出 ${res.data.total} 个友链`, { type: "success" });
      } else {
        message(res.message || "导出失败", { type: "error" });
      }
    } catch (error) {
      console.error("导出友链失败", error);
      message("导出友链失败", { type: "error" });
    }
  }

  // 轮询健康检查状态
  async function pollHealthCheckStatus() {
    try {
      const res = await getHealthCheckStatus();
      if (res.code === 200 && res.data) {
        healthCheckRunning.value = res.data.is_running;

        if (!res.data.is_running && res.data.result) {
          if (healthCheckTimer) {
            clearInterval(healthCheckTimer);
            healthCheckTimer = null;
          }

          const { total, healthy, unhealthy } = res.data.result;
          message(
            `健康检查完成！共检查 ${total} 个友链，健康 ${healthy} 个，失联 ${unhealthy} 个`,
            { type: "success", duration: 5000 }
          );

          onSearch();
        } else if (!res.data.is_running && res.data.error) {
          if (healthCheckTimer) {
            clearInterval(healthCheckTimer);
            healthCheckTimer = null;
          }
          message("健康检查失败：" + res.data.error, { type: "error" });
        }
      }
    } catch (error) {
      console.error("获取健康检查状态失败", error);
    }
  }

  function startHealthCheckPolling() {
    healthCheckRunning.value = true;
    pollHealthCheckStatus();

    healthCheckTimer = setInterval(() => {
      pollHealthCheckStatus();
    }, 3000);
  }

  async function handleHealthCheck() {
    try {
      await ElMessageBox.confirm(
        "此操作将在后台检查所有友链的健康状态，无法访问的友链将被自动标记为失联状态。检查过程可能需要几分钟时间。是否继续？",
        "友链健康检查",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      try {
        const res = await checkLinksHealth();

        if (res.code === 200) {
          message("友链健康检查任务已启动，正在后台执行中...", {
            type: "success",
            duration: 3000
          });

          startHealthCheckPolling();
        } else {
          message("启动健康检查失败：" + res.message, { type: "error" });
        }
      } catch (error) {
        console.error("健康检查失败", error);
        message("启动健康检查失败", { type: "error" });
      }
    } catch (error) {
      if (error !== "cancel") {
        console.error("操作取消或出错", error);
      }
    }
  }

  function handleSelectionChange(val: LinkItem[]) {
    selectedIds.value = val.map(item => item.id);
  }

  function onSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch();
  }

  function onCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  function cleanupHealthCheckTimer() {
    if (healthCheckTimer) {
      clearInterval(healthCheckTimer);
      healthCheckTimer = null;
    }
  }

  async function checkRunningHealthCheck() {
    try {
      const res = await getHealthCheckStatus();
      if (res.code === 200 && res.data && res.data.is_running) {
        message("检测到正在进行的健康检查任务，将继续监控...", {
          type: "info"
        });
        startHealthCheckPolling();
      }
    } catch (error) {
      console.error("获取健康检查状态失败", error);
    }
  }

  onMounted(() => {
    onSearch();
    fetchCategoriesAndTags();
    checkRunningHealthCheck();
  });

  onUnmounted(() => {
    cleanupHealthCheckTimer();
  });

  return {
    form,
    loading,
    columns,
    dataList,
    pagination,
    loadingConfig,
    selectedIds,
    categories,
    tags,
    statusOptions,
    statusMap,
    healthCheckRunning,
    onSizeChange,
    onCurrentChange,
    onSearch,
    resetForm,
    handleDelete,
    handleReview,
    handleExport,
    handleHealthCheck,
    handleSelectionChange,
    fetchCategoriesAndTags
  };
}
