/*
 * @Description: 评论管理 Hook
 * @Author: 安知鱼
 */

import { formatToChina } from "@/utils/dayjs";
import { message } from "@/utils/message";
import {
  getAdminComments,
  pinAdminComment,
  updateAdminCommentStatus,
  deleteAdminComments,
  createPublicComment
} from "@/api/comment";
import type {
  AdminComment,
  CommentQuery,
  CreateCommentPayload
} from "@/api/comment/type";
import { reactive, ref, onMounted, h, computed } from "vue";
import type { PaginationProps, LoadingConfig } from "@pureadmin/table";
import {
  ElTag,
  ElMessageBox,
  ElAvatar,
  ElTooltip,
  ElLink,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem
} from "element-plus";
import { useSiteConfigStore } from "@/store/modules/siteConfig";
import { IconifyIconOnline } from "@/components/ReIcon";
import md5 from "blueimp-md5";

export function useCommentManagement() {
  const siteConfigStore = useSiteConfigStore();

  // 站点配置
  const siteOwner = computed(
    () => siteConfigStore.getSiteConfig.frontDesk?.siteOwner || {}
  );
  const siteUrl = computed(() => siteConfigStore.getSiteConfig.SITE_URL || "");

  const form = reactive<CommentQuery>({
    nickname: "",
    email: "",
    target_path: "",
    ip_address: "",
    content: "",
    status: undefined
  });

  const dataList = ref<AdminComment[]>([]);
  const loading = ref(true);
  const selectedIds = ref<string[]>([]);

  // 状态选项
  const statusOptions = [
    { value: undefined, label: "全部状态" },
    {
      value: 1,
      label: "已发布",
      type: "success",
      color: "var(--anzhiyu-green)"
    },
    {
      value: 2,
      label: "待审核",
      type: "warning",
      color: "var(--anzhiyu-orange)"
    }
  ];

  // 获取状态标签类型
  const getStatusTagType = (
    status: number
  ): "success" | "warning" | "danger" | "info" | "primary" => {
    const statusMap: Record<number, "success" | "warning"> = {
      1: "success",
      2: "warning"
    };
    return statusMap[status] || "info";
  };

  // 获取状态文本
  const getStatusText = (status: number): string => {
    const statusMap: Record<number, string> = {
      1: "已发布",
      2: "待审核"
    };
    return statusMap[status] || "未知";
  };

  // 获取 Gravatar URL
  const getGravatarUrl = (emailMD5: string) => {
    const config = siteConfigStore.getSiteConfig;
    const gravatarUrl = config.GRAVATAR_URL || "https://cravatar.cn";
    const defaultType = config.DEFAULT_GRAVATAR_TYPE || "identicon";

    try {
      const url = new URL(gravatarUrl);
      url.pathname =
        url.pathname.replace(/\/+$/, "") + `/avatar/${emailMD5 || ""}`;
      url.searchParams.set("d", defaultType);
      url.searchParams.set("s", "80");
      return url.toString();
    } catch {
      // URL 解析失败，使用简单拼接
      const baseUrl = gravatarUrl.replace(/\/+$/, "");
      return `${baseUrl}/avatar/${emailMD5 || ""}?d=${defaultType}&s=80`;
    }
  };

  // 获取头像 URL
  const getAvatarSrc = (comment: AdminComment): string => {
    // 优先使用用户自定义头像
    if (comment.avatar_url) {
      return comment.avatar_url;
    }

    // 检查是否有 QQ 号（后端返回的 qq_number 字段）
    if (comment.qq_number) {
      const qqEmailMd5 = md5(`${comment.qq_number}@qq.com`).toLowerCase();
      if (comment.email_md5?.toLowerCase() === qqEmailMd5) {
        return `https://thirdqq.qlogo.cn/g?b=sdk&nk=${comment.qq_number}&s=80`;
      }
    }

    // 如果昵称是 QQ 号格式，也尝试获取 QQ 头像
    if (comment.nickname) {
      const isQQ = /^[1-9]\d{4,10}$/.test(comment.nickname.trim());
      if (isQQ) {
        const qqEmailMd5 = md5(
          `${comment.nickname.trim()}@qq.com`
        ).toLowerCase();
        if (comment.email_md5?.toLowerCase() === qqEmailMd5) {
          return `https://thirdqq.qlogo.cn/g?b=sdk&nk=${comment.nickname.trim()}&s=80`;
        }
      }
    }

    // 使用 Gravatar
    return getGravatarUrl(comment.email_md5 || "");
  };

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return formatToChina(dateStr);
  };

  // 表格列配置
  const columns: TableColumnList = [
    {
      type: "selection",
      width: 55,
      align: "left",
      headerAlign: "left"
    },
    {
      label: "用户",
      prop: "nickname",
      width: 180,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          "div",
          {
            style:
              "display: flex; align-items: center; gap: 10px; cursor: pointer;"
          },
          [
            h(ElAvatar, {
              src: getAvatarSrc(row),
              size: 36,
              style: "flex-shrink: 0;"
            }),
            h(
              "div",
              {
                style:
                  "display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1;"
              },
              [
                h(
                  "div",
                  {
                    style:
                      "display: flex; align-items: center; gap: 6px; flex-wrap: wrap;"
                  },
                  [
                    h(
                      "span",
                      {
                        style:
                          "font-size: 14px; font-weight: 600; color: var(--anzhiyu-fontcolor); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                      },
                      row.nickname
                    ),
                    row.is_admin_comment
                      ? h(
                          ElTag,
                          { type: "danger", size: "small", effect: "dark" },
                          () => "博主"
                        )
                      : null,
                    row.pinned_at
                      ? h(
                          ElTag,
                          { type: "warning", size: "small", effect: "light" },
                          () => "置顶"
                        )
                      : null
                  ]
                ),
                row.email
                  ? h(
                      ElTooltip,
                      {
                        content: row.email,
                        placement: "top",
                        showAfter: 300
                      },
                      {
                        default: () =>
                          h(
                            "span",
                            {
                              style:
                                "font-size: 12px; color: var(--anzhiyu-secondtext); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                            },
                            row.email
                          )
                      }
                    )
                  : null
              ]
            )
          ]
        );
      }
    },
    {
      label: "评论内容",
      prop: "content",
      minWidth: 280,
      align: "left",
      headerAlign: "left",
      showOverflowTooltip: false,
      cellRenderer: ({ row }) => {
        const content = row.content || "-";
        const isLong = content.length > 100;

        const contentNode = h("div", {
          style:
            "display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.5; color: var(--anzhiyu-fontcolor); word-break: break-word;",
          innerHTML: row.content_html || content
        });

        if (isLong) {
          return h(
            ElTooltip,
            {
              content: content,
              placement: "top",
              showAfter: 300
            },
            {
              default: () => contentNode
            }
          );
        }

        return contentNode;
      }
    },
    {
      label: "来源",
      prop: "target_path",
      width: 160,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          "div",
          {
            style:
              "display: flex; flex-direction: column; gap: 4px; min-width: 0;"
          },
          [
            h(
              ElLink,
              {
                type: "primary",
                href: row.target_path,
                target: "_blank",
                underline: false,
                style:
                  "font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; display: inline-block;"
              },
              () => row.target_title || row.target_path
            ),
            row.reply_to_nick
              ? h(
                  "span",
                  {
                    style:
                      "font-size: 11px; color: var(--anzhiyu-secondtext); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                  },
                  `回复 @${row.reply_to_nick}`
                )
              : null
          ]
        );
      }
    },
    {
      label: "IP/位置",
      prop: "ip_address",
      width: 140,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          "div",
          {
            style: "display: flex; flex-direction: column; gap: 2px;"
          },
          [
            h(
              "span",
              {
                style:
                  "font-size: 12px; color: var(--anzhiyu-fontcolor); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
              },
              row.ip_address || "-"
            ),
            h(
              "span",
              {
                style:
                  "font-size: 11px; color: var(--anzhiyu-secondtext); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
              },
              row.ip_location || "-"
            )
          ]
        );
      }
    },
    {
      label: "状态",
      prop: "status",
      width: 100,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          ElDropdown,
          {
            trigger: "click",
            onCommand: (status: number) => handleStatusUpdate(row, status)
          },
          {
            default: () =>
              h(
                ElTag,
                {
                  type: getStatusTagType(row.status),
                  size: "small",
                  effect: "dark",
                  style: "cursor: pointer;"
                },
                () =>
                  h(
                    "div",
                    {
                      style:
                        "display: flex; align-items: center; justify-content: center; gap: 4px;"
                    },
                    [
                      h("span", {}, getStatusText(row.status)),
                      h(IconifyIconOnline, {
                        icon: "ep:arrow-down",
                        width: 12,
                        height: 12
                      })
                    ]
                  )
              ),
            dropdown: () =>
              h(ElDropdownMenu, {}, () => [
                h(ElDropdownItem, { command: 1 }, () => "设为已发布"),
                h(ElDropdownItem, { command: 2 }, () => "设为待审核")
              ])
          }
        );
      }
    },
    {
      label: "统计",
      prop: "like_count",
      minWidth: 120,
      align: "center",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        return h(
          "div",
          {
            style:
              "display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 12px; color: var(--anzhiyu-secondtext);"
          },
          [
            h(IconifyIconOnline, {
              icon: "ep:thumb-up",
              width: 14,
              height: 14
            }),
            h("span", {}, row.like_count || 0)
          ]
        );
      }
    },
    {
      label: "时间",
      prop: "created_at",
      width: 140,
      align: "left",
      headerAlign: "left",
      cellRenderer: ({ row }) => {
        const pinnedInfo = row.pinned_at
          ? `\n置顶于: ${formatDate(row.pinned_at)}`
          : "";
        return h(
          ElTooltip,
          {
            content: `发布于: ${formatDate(row.created_at)}${pinnedInfo}`,
            placement: "top",
            showAfter: 300
          },
          {
            default: () =>
              h(
                "span",
                {
                  style: "font-size: 12px; color: var(--anzhiyu-secondtext);"
                },
                formatToChina(row.created_at, "YYYY-MM-DD HH:mm")
              )
          }
        );
      }
    },
    {
      label: "操作",
      fixed: "right",
      minWidth: 200,
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
    text: "正在加载评论列表...",
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

  function resetForm(formEl) {
    if (!formEl) return;
    formEl.resetFields();
    form.nickname = "";
    form.email = "";
    form.target_path = "";
    form.ip_address = "";
    form.content = "";
    form.status = undefined;
    onSearch();
  }

  async function onSearch() {
    loading.value = true;
    const { currentPage, pageSize } = pagination;
    try {
      const params: CommentQuery = {
        page: currentPage,
        pageSize: pageSize,
        nickname: form.nickname || undefined,
        email: form.email || undefined,
        target_path: form.target_path || undefined,
        ip_address: form.ip_address || undefined,
        content: form.content || undefined,
        status: form.status
      };
      const { data } = await getAdminComments(params);
      dataList.value = data.list;
      pagination.total = data.total;
    } catch {
      message("获取评论列表失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  // 置顶/取消置顶
  async function handlePinUpdate(comment: AdminComment, pinned: boolean) {
    try {
      await pinAdminComment(comment.id, pinned);
      message(pinned ? "置顶成功" : "取消置顶成功", { type: "success" });
      onSearch();
    } catch {
      message("操作失败", { type: "error" });
    }
  }

  // 更新状态
  async function handleStatusUpdate(comment: AdminComment, status: number) {
    try {
      await updateAdminCommentStatus(comment.id, status);
      const index = dataList.value.findIndex(c => c.id === comment.id);
      if (index !== -1) {
        dataList.value[index].status = status;
      }
      message("状态更新成功", { type: "success" });
    } catch {
      message("状态更新失败", { type: "error" });
    }
  }

  // 删除单条评论
  function handleDelete(row: AdminComment) {
    ElMessageBox.confirm("确定要删除这条评论吗？此操作不可逆。", "警告", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }).then(async () => {
      try {
        await deleteAdminComments([row.id]);
        message("删除成功", { type: "success" });

        const index = selectedIds.value.indexOf(row.id);
        if (index > -1) {
          selectedIds.value.splice(index, 1);
        }

        if (dataList.value.length === 1 && pagination.currentPage > 1) {
          pagination.currentPage--;
        }
        onSearch();
      } catch {
        message("删除失败", { type: "error" });
      }
    });
  }

  // 批量删除
  function handleBatchDelete() {
    if (selectedIds.value.length === 0) {
      message("请至少选择一条评论", { type: "warning" });
      return;
    }

    ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 条评论吗？`,
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    ).then(async () => {
      try {
        await deleteAdminComments(selectedIds.value);
        message(`成功删除 ${selectedIds.value.length} 条评论`, {
          type: "success"
        });
        selectedIds.value = [];
        onSearch();
      } catch {
        message("删除失败", { type: "error" });
      }
    });
  }

  // 编辑评论相关状态
  const editDialogVisible = ref(false);
  const editingComment = ref<AdminComment | null>(null);

  // 打开编辑对话框
  function handleEdit(row: AdminComment) {
    editingComment.value = row;
    editDialogVisible.value = true;
  }

  // 编辑成功后的回调
  function handleEditSuccess(updatedComment: AdminComment) {
    const index = dataList.value.findIndex(c => c.id === updatedComment.id);
    if (index !== -1) {
      dataList.value[index] = updatedComment;
    }
    message("编辑成功", { type: "success" });
  }

  // 回复评论
  function handleReply(row: AdminComment) {
    // 匿名评论不允许回复
    if (row.is_anonymous) {
      message("匿名评论无法回复", { type: "warning" });
      return;
    }

    ElMessageBox.prompt(`回复 @${row.nickname}:`, "回复评论", {
      inputType: "textarea",
      confirmButtonText: "提交",
      cancelButtonText: "取消",
      inputValidator: (val: string) => {
        if (!val || val.trim() === "") {
          return "回复内容不能为空";
        }
        return true;
      }
    })
      .then(async ({ value }) => {
        if (!siteOwner.value.name || !siteOwner.value.email) {
          message("未找到站点所有者配置，无法回复。请检查配置！", {
            type: "error"
          });
          return;
        }

        const payload: CreateCommentPayload = {
          target_path: row.target_path,
          parent_id: row.id,
          nickname: siteOwner.value.name,
          email: siteOwner.value.email,
          website: siteUrl.value,
          content: value,
          allow_notification: false
        };

        try {
          await createPublicComment(payload);
          message("回复成功", { type: "success" });
          onSearch();
        } catch {
          message("回复失败，请稍后重试", { type: "error" });
        }
      })
      .catch(() => {
        message("已取消回复", { type: "info" });
      });
  }

  function handleSelectionChange(val: AdminComment[]) {
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

  onMounted(() => {
    onSearch();
  });

  return {
    form,
    loading,
    columns,
    dataList,
    pagination,
    loadingConfig,
    selectedIds,
    statusOptions,
    editDialogVisible,
    editingComment,
    onSizeChange,
    onCurrentChange,
    onSearch,
    resetForm,
    handlePinUpdate,
    handleStatusUpdate,
    handleDelete,
    handleBatchDelete,
    handleEdit,
    handleEditSuccess,
    handleReply,
    handleSelectionChange,
    getStatusTagType,
    getStatusText
  };
}
