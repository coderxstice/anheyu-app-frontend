import dayjs from "dayjs";
import editForm from "../form.vue";
import importExportForm from "../import-export-form.vue";
import { message } from "@/utils/message";
import {
  getWallpapertList,
  addWallpapert,
  updateWallpaper,
  deleteWallpaper,
  batchImportAlbums,
  batchDeleteAlbums,
  exportAlbums,
  importAlbums
} from "@/api/album-home";
import {
  getAlbumCategoryList,
  type AlbumCategoryDTO
} from "@/api/album-category";
import { addDialog } from "@/components/AnDialog";
import { reactive, ref, onMounted, h } from "vue";
import type { FormItemProps } from "./types";
import { deviceDetection } from "@pureadmin/utils";
import type { PaginationProps, LoadingConfig } from "@pureadmin/table";
import { ElIcon, ElScrollbar } from "element-plus";
import {
  SuccessFilled,
  WarningFilled,
  InfoFilled
} from "@element-plus/icons-vue";

export function useAlbum() {
  const form = reactive({
    categoryId: null,
    created_at: null,
    sort: "display_order_asc"
  });

  const categories = ref<AlbumCategoryDTO[]>([]);

  const formRef = ref();
  const dataList = ref([]);
  const loading = ref(true);
  const selectedRows = ref<any[]>([]);

  const columns: TableColumnList = [
    {
      type: "selection",
      width: 55,
      align: "center",
      headerAlign: "center",
      reserveSelection: true
    },
    {
      label: "序号",
      prop: "index",
      minWidth: 70,
      align: "center",
      cellRenderer: ({ index }) => {
        const { currentPage, pageSize, total } = pagination;
        return String(total - (currentPage - 1) * pageSize - index);
      }
    },
    {
      label: "分类",
      prop: "categoryId",
      minWidth: 100,
      cellRenderer: ({ row }) => {
        if (!row.categoryId) return "未分类";
        const category = categories.value.find(c => c.id === row.categoryId);
        return category?.name || "未知分类";
      }
    },
    {
      label: "图片URL",
      prop: "imageUrl",
      minWidth: 120,
      cellRenderer: ({ row }) => {
        const thumbnailUrl =
          row.imageUrl + "?" + (row.thumbParam ? row.thumbParam : "");
        return h("img", {
          src: thumbnailUrl,
          alt: "缩略图",
          style: {
            width: "100px",
            height: "auto",
            objectFit: "contain"
          }
        });
      }
    },
    {
      label: "大图",
      prop: "bigImageUrl",
      minWidth: 70,
      hide: true
    },
    {
      label: "下载地址",
      prop: "downloadUrl",
      minWidth: 120,
      hide: true
    },
    {
      label: "大图参数",
      prop: "bigParam",
      minWidth: 120
    },
    {
      label: "缩略参数",
      prop: "thumbParam",
      minWidth: 120
    },
    {
      label: "标签",
      prop: "tags",
      minWidth: 120
    },
    {
      label: "查看次数",
      prop: "viewCount",
      minWidth: 70,
      hide: true
    },
    {
      label: "图片大小",
      prop: "fileSize",
      minWidth: 70,
      formatter: (row: any) => {
        const size = row.fileSize;
        if (size >= 1024 * 1024) {
          return (size / 1024 / 1024).toFixed(2) + " MB";
        } else if (size >= 1024) {
          return (size / 1024).toFixed(2) + " KB";
        } else {
          return size + " B";
        }
      },
      hide: true
    },
    {
      label: "长宽比",
      prop: "aspectRatio",
      minWidth: 70,
      hide: true
    },
    {
      label: "下载次数",
      prop: "downloadCount",
      minWidth: 70,
      hide: true
    },
    {
      label: "宽*高",
      prop: "widthAndHeight",
      minWidth: 90,
      hide: true
    },
    {
      label: "排序",
      prop: "displayOrder",
      minWidth: 70
    },
    {
      label: "创建时间",
      minWidth: 180,
      prop: "created_at",
      formatter: ({ created_at }) =>
        dayjs(created_at).format("YYYY-MM-DD HH:mm:ss")
    },
    {
      label: "操作",
      // fixed: "right",
      width: 210,
      slot: "operation",
      showOverflowTooltip: false
    }
  ];
  function resetForm(formEl) {
    if (!formEl) return;
    formEl.resetFields();
    form.categoryId = null;
    form.created_at = null;
    form.sort = "display_order_asc";
    onSearch();
  }

  async function loadCategories() {
    try {
      const { data } = await getAlbumCategoryList();
      if (data) {
        categories.value = data;
      }
    } catch (error) {
      console.error("加载分类列表失败:", error);
    }
  }

  async function onSearch() {
    loading.value = true;
    const { currentPage, pageSize } = pagination;
    const { data } = await getWallpapertList({
      page: currentPage,
      pageSize: pageSize,
      categoryId: form.categoryId,
      created_at: form.created_at,
      sort: form.sort
    });
    dataList.value = data.list;
    pagination.total = data.total;
    pagination.currentPage = data.pageNum;
    pagination.pageSize = data.pageSize;
    setTimeout(() => {
      loading.value = false;
    }, 300);
  }

  /**
   * 策略性地获取图片Blob数据（单张图片添加时使用）
   * 优先尝试直接fetch，失败后回退到后端代理
   * @param url 图片的原始URL
   * @returns Promise<Blob>
   */
  async function fetchImageBlobWithStrategies(url: string): Promise<Blob> {
    const proxyUrl = `/api/proxy/download?url=${encodeURIComponent(url)}`;

    try {
      // 策略1: 尝试直接 fetch
      console.log("尝试直接获取图片元数据:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`直接获取失败，状态码: ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      console.warn("直接获取失败，回退到后端代理:", error);
      // 策略2: 尝试使用后端代理
      try {
        const proxyResponse = await fetch(proxyUrl);
        if (!proxyResponse.ok) {
          throw new Error(`代理获取失败，状态码: ${proxyResponse.status}`);
        }
        return await proxyResponse.blob();
      } catch (proxyError) {
        console.error("所有获取图片的方案均失败:", proxyError);
        // 抛出最终错误，让调用者处理
        throw proxyError;
      }
    }
  }

  /**
   * 从Blob数据中获取图片尺寸
   * @param blob 图片的Blob对象
   * @returns Promise<{ width: number; height: number }>
   */
  function getImageDimensionsFromBlob(
    blob: Blob
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(objectUrl); // 及时释放内存
      };
      img.onerror = err => {
        reject(err);
        URL.revokeObjectURL(objectUrl); // 出错也要释放
      };
      img.src = objectUrl;
    });
  }

  /**
   * 计算文件的SHA-256哈希值
   * @param blob 文件的Blob对象
   * @returns Promise<string>
   */
  async function getFileHash(blob: Blob): Promise<string> {
    try {
      const buffer = await blob.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    } catch (error) {
      console.error("计算文件哈希值失败:", error);
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      return `fallback_${timestamp}_${randomStr}`; // 返回备用哈希
    }
  }

  // 默认的元数据返回值
  function getDefaultMetadata() {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    return {
      width: 0,
      height: 0,
      fileSize: 0,
      format: "unknown",
      fileHash: `fallback_${timestamp}_${randomStr}`
    };
  }

  /**
   * 获取图片元数据的主函数（单张图片添加时使用）
   * @param url 图片URL
   */
  async function getImageMeta(url: string) {
    if (!url) {
      message("图片 URL 不能为空", { type: "error" });
      return getDefaultMetadata();
    }

    try {
      // 1. 使用策略函数获取Blob
      const blob = await fetchImageBlobWithStrategies(url);

      // 2. 从Blob并行计算尺寸和哈希
      const [dimensions, fileHash] = await Promise.all([
        getImageDimensionsFromBlob(blob),
        getFileHash(blob)
      ]);

      // 3. 组装元数据
      const fileSize = blob.size;
      const format = url.split(".").pop()?.toLowerCase() ?? "unknown";

      return {
        width: dimensions.width,
        height: dimensions.height,
        fileSize,
        format,
        fileHash
      };
    } catch (error) {
      console.error("获取图片元数据失败:", error);
      message("无法获取图片元数据，请检查URL或网络连接", { type: "error" });
      return getDefaultMetadata(); // 发生任何错误都返回默认值
    }
  }

  function openDialog(title = "新增", row?: FormItemProps) {
    addDialog({
      title: `${title}图片`,
      props: {
        formInline: {
          id: row?.id ?? 0,
          title: title,
          categoryId: row?.categoryId ?? null,
          imageUrl: row?.imageUrl ?? "",
          bigImageUrl: row?.bigImageUrl ?? "",
          downloadUrl: row?.downloadUrl ?? "",
          thumbParam: row?.thumbParam ?? "",
          bigParam: row?.bigParam ?? "",
          tags: (() => {
            const tags: any = row?.tags;
            if (tags === undefined || tags === null) return [];
            if (Array.isArray(tags)) return tags;
            if (typeof tags === "string")
              return tags
                .split(",")
                .map(item => item.trim())
                .filter(Boolean);
            return [];
          })(),
          viewCount: row?.viewCount ?? 1,
          downloadCount: row?.downloadCount ?? 0,
          aspectRatio: row?.aspectRatio ?? "",
          widthAndHeight: row?.widthAndHeight ?? "",
          fileSize: row?.fileSize ?? 0,
          displayOrder: row?.displayOrder ?? 0
        },
        categories: categories.value
      },
      top: "10vh",
      width: "80vw",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      contentRenderer: () =>
        h(editForm, {
          ref: formRef,
          formInline: null,
          categories: categories.value
        }),
      beforeSure: (done, { options, closeLoading }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;
        function chores() {
          message(`您${title}了一张图片`, {
            type: "success"
          });
          done(); // 关闭弹框
          onSearch(); // 刷新表格数据
        }

        FormRef.validate(async valid => {
          if (valid) {
            // 表单规则校验通过
            if (title === "新增") {
              // 🧠 调用重构后的函数获取图片元数据
              const imageInfo = await getImageMeta(curData.imageUrl);
              addWallpapert({
                ...curData,
                ...imageInfo
              }).then(res => {
                if (res.code === 200) {
                  chores();
                } else {
                  message(res.message, { type: "error" });
                  closeLoading();
                }
              });
            } else {
              updateWallpaper(curData).then(res => {
                if (res.code === 200) {
                  chores();
                } else {
                  message(res.message, { type: "error" });
                }
              });
            }
          } else {
            // 如果校验失败，确保关闭加载状态
            closeLoading();
          }
        });
      }
    });
  }

  function handleDelete(row) {
    deleteWallpaper(row).then(res => {
      if (res.code === 200) {
        message(`您删除了图片id为${row.id}的这条数据`, {
          type: "success"
        });
        onSearch();
      } else {
        message(res.message, { type: "error" });
      }
    });
  }

  /** 处理选择变化 */
  function handleSelectionChange(selection: any[]) {
    selectedRows.value = selection;
  }

  /** 批量删除 */
  async function handleBatchDelete() {
    if (selectedRows.value.length === 0) {
      message("请先选择要删除的图片", { type: "warning" });
      return;
    }

    const ids = selectedRows.value.map((row: any) => row.id);
    try {
      const res = await batchDeleteAlbums(ids);
      if (res.code === 200) {
        message(`成功删除 ${res.data.deleted} 张图片`, { type: "success" });
        selectedRows.value = [];
        onSearch();
      } else {
        message(res.message, { type: "error" });
      }
    } catch (error) {
      console.error("批量删除失败:", error);
      message(`批量删除失败: ${error.message || "未知错误"}`, {
        type: "error"
      });
    }
  }

  /**
   * 显示导入结果弹窗
   */
  function showImportResultDialog(result: {
    successCount: number;
    failCount: number;
    skipCount: number;
    invalidCount: number;
    total: number;
    duration: string;
    errors?: Array<{ url: string; reason: string }>;
    duplicates?: string[];
    invalidUrls?: string[];
  }) {
    const {
      successCount,
      failCount,
      skipCount,
      invalidCount,
      total,
      duration,
      errors,
      duplicates
      // invalidUrls 暂未在此函数中直接使用，但保留以供future扩展
    } = result;

    // 判断整体状态
    const hasError = failCount > 0 || invalidCount > 0;
    const allSuccess = successCount === total && failCount === 0;

    const resultContent = h(
      "div",
      {
        style: {
          padding: "20px 10px",
          maxHeight: "73vh",
          overflowY: "auto"
        }
      },
      [
        // 状态图标和标题
        h(
          "div",
          {
            style: {
              textAlign: "center",
              marginBottom: "24px"
            }
          },
          [
            h(
              ElIcon,
              {
                size: 64,
                color: allSuccess
                  ? "var(--anzhiyu-green)"
                  : hasError
                    ? "var(--anzhiyu-yellow)"
                    : "#409EFF",
                style: { marginBottom: "12px" }
              },
              () =>
                h(
                  allSuccess
                    ? SuccessFilled
                    : hasError
                      ? WarningFilled
                      : InfoFilled
                )
            ),
            h(
              "div",
              {
                style: {
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#303133"
                }
              },
              allSuccess
                ? "导入成功！"
                : hasError
                  ? "导入完成（部分失败）"
                  : "导入完成"
            ),
            h(
              "div",
              {
                style: {
                  fontSize: "13px",
                  color: "#909399",
                  marginTop: "8px"
                }
              },
              `耗时 ${duration} 秒`
            )
          ]
        ),

        // 统计信息
        h(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "12px",
              marginBottom: "20px"
            }
          },
          [
            // 成功
            h(
              "div",
              {
                style: {
                  padding: "16px",
                  background: "#f0f9ff",
                  borderRadius: "8px",
                  border: "var(--style-border-always)"
                }
              },
              [
                h(
                  "div",
                  {
                    style: {
                      fontSize: "13px",
                      color: "#909399",
                      marginBottom: "4px"
                    }
                  },
                  "成功导入"
                ),
                h(
                  "div",
                  {
                    style: {
                      fontSize: "24px",
                      fontWeight: "600",
                      color: "var(--anzhiyu-green)"
                    }
                  },
                  successCount
                )
              ]
            ),
            // 失败
            h(
              "div",
              {
                style: {
                  padding: "16px",
                  background: failCount > 0 ? "#fef0f0" : "#f5f5f5",
                  borderRadius: "8px",
                  border:
                    failCount > 0
                      ? "1px solid #F5672220"
                      : "var(--style-border-always)"
                }
              },
              [
                h(
                  "div",
                  {
                    style: {
                      fontSize: "13px",
                      color: "#909399",
                      marginBottom: "4px"
                    }
                  },
                  "导入失败"
                ),
                h(
                  "div",
                  {
                    style: {
                      fontSize: "24px",
                      fontWeight: "600",
                      color: failCount > 0 ? "var(--anzhiyu-red)" : "#909399"
                    }
                  },
                  failCount
                )
              ]
            ),
            // 跳过
            h(
              "div",
              {
                style: {
                  padding: "16px",
                  background: skipCount > 0 ? "#fdf6ec" : "#f5f5f5",
                  borderRadius: "8px",
                  border:
                    skipCount > 0
                      ? "1px solid var(--anzhiyu-yellow)20"
                      : "var(--style-border-always)"
                }
              },
              [
                h(
                  "div",
                  {
                    style: {
                      fontSize: "13px",
                      color: "#909399",
                      marginBottom: "4px"
                    }
                  },
                  "跳过重复"
                ),
                h(
                  "div",
                  {
                    style: {
                      fontSize: "24px",
                      fontWeight: "600",
                      color: skipCount > 0 ? "var(--anzhiyu-yellow)" : "#909399"
                    }
                  },
                  skipCount
                )
              ]
            ),
            // 无效URL
            h(
              "div",
              {
                style: {
                  padding: "16px",
                  background: invalidCount > 0 ? "#f4f4f5" : "#f5f5f5",
                  borderRadius: "8px",
                  border: "var(--style-border-always)"
                }
              },
              [
                h(
                  "div",
                  {
                    style: {
                      fontSize: "13px",
                      color: "#909399",
                      marginBottom: "4px"
                    }
                  },
                  "无效URL"
                ),
                h(
                  "div",
                  {
                    style: {
                      fontSize: "24px",
                      fontWeight: "600",
                      color: invalidCount > 0 ? "#909399" : "#C0C4CC"
                    }
                  },
                  invalidCount
                )
              ]
            )
          ]
        ),

        // 错误详情（如果有）
        (errors && errors.length > 0) || (duplicates && duplicates.length > 0)
          ? h(
              "div",
              {
                style: {
                  marginTop: "20px",
                  padding: "16px",
                  background: "#fafafa",
                  borderRadius: "8px"
                }
              },
              [
                h(
                  "div",
                  {
                    style: {
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#606266",
                      marginBottom: "12px"
                    }
                  },
                  "📋 详细信息"
                ),
                h(ElScrollbar, { maxHeight: "250px" }, () =>
                  h(
                    "div",
                    {
                      style: {
                        fontSize: "13px",
                        lineHeight: "1.8"
                      }
                    },
                    [
                      errors && errors.length > 0
                        ? h("div", { style: { marginBottom: "12px" } }, [
                            h(
                              "div",
                              {
                                style: {
                                  fontWeight: "500",
                                  color: "var(--anzhiyu-red)",
                                  marginBottom: "8px"
                                }
                              },
                              `❌ 失败 ${errors.length} 个：`
                            ),
                            ...errors.map((err, idx) =>
                              h(
                                "div",
                                {
                                  style: {
                                    padding: "8px",
                                    background: "#fff",
                                    borderRadius: "4px",
                                    marginBottom: "6px",
                                    fontSize: "12px"
                                  }
                                },
                                [
                                  h(
                                    "div",
                                    {
                                      style: {
                                        color: "#303133",
                                        marginBottom: "4px"
                                      }
                                    },
                                    `${idx + 1}. ${err.url}`
                                  ),
                                  h(
                                    "div",
                                    {
                                      style: {
                                        color: "var(--anzhiyu-red)",
                                        paddingLeft: "16px"
                                      }
                                    },
                                    `原因: ${err.reason}`
                                  )
                                ]
                              )
                            )
                          ])
                        : null,
                      duplicates &&
                      duplicates.length > 0 &&
                      duplicates.length <= 10
                        ? h("div", [
                            h(
                              "div",
                              {
                                style: {
                                  fontWeight: "500",
                                  color: "var(--anzhiyu-yellow)",
                                  marginBottom: "8px"
                                }
                              },
                              `⚠️ 重复 ${duplicates.length} 个：`
                            ),
                            ...duplicates.map((url, idx) =>
                              h(
                                "div",
                                {
                                  style: {
                                    padding: "6px 8px",
                                    background: "#fff",
                                    borderRadius: "4px",
                                    marginBottom: "4px",
                                    fontSize: "12px",
                                    color: "#606266"
                                  }
                                },
                                `${idx + 1}. ${url}`
                              )
                            )
                          ])
                        : duplicates && duplicates.length > 10
                          ? h(
                              "div",
                              {
                                style: {
                                  color: "var(--anzhiyu-yellow)",
                                  fontSize: "12px"
                                }
                              },
                              `⚠️ ${duplicates.length} 个重复图片（太多，请查看控制台）`
                            )
                          : null
                    ].filter(Boolean)
                  )
                )
              ]
            )
          : null
      ].filter(Boolean)
    );

    addDialog({
      title: "批量导入结果",
      width: "600px",
      top: "10vh",
      draggable: true,
      closeOnClickModal: true,
      contentRenderer: () => resultContent,
      props: {
        class: "batch-import-result-dialog"
      }
    });
  }

  /** 分页配置 */
  const pagination = reactive<PaginationProps>({
    pageSize: 10,
    currentPage: 1,
    pageSizes: [10, 12, 24, 50, 100],
    total: 0,
    align: "right",
    background: true,
    size: "default",
    style: {
      paddingRight: "20px"
    }
  });

  /** 加载动画配置 - 优化的图片加载动画 */
  const loadingConfig = reactive<LoadingConfig>({
    text: "正在加载相册...",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="albumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:var(--el-color-primary);stop-opacity:1" />
          <stop offset="100%" style="stop-color:var(--el-color-primary-light-3);stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="40" stroke="var(--el-border-color-lighter)" stroke-width="6" fill="none"/>
      <circle cx="50" cy="50" r="40" stroke="url(#albumGradient)" stroke-width="6" fill="none"
        stroke-linecap="round" stroke-dasharray="180 251.2">
        <animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" from="0 50 50" to="360 50 50"/>
      </circle>
      <g transform="translate(50,50)">
        <rect x="-15" y="-12" width="30" height="24" rx="3" fill="none" stroke="var(--el-color-primary)" stroke-width="2.5">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite"/>
        </rect>
        <circle cx="-6" cy="-3" r="3" fill="var(--el-color-primary)">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        <polygon points="-12,8 -3,0 3,5 12,0 12,8 -12,8" fill="var(--el-color-primary-light-5)">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite"/>
        </polygon>
      </g>
    </svg>`,
    viewBox: "0 0 100 100",
    background: "var(--el-mask-color)"
  });

  function onSizeChange(val) {
    pagination.pageSize = val;
    pagination.currentPage = 1;
    onSearch();
  }

  function onCurrentChange(val) {
    pagination.currentPage = val;
    loadingConfig.text = `加载第 ${val} 页`;
    onSearch();
  }

  /**
   * 导出相册
   */
  async function handleExport() {
    try {
      // 获取所有相册的ID
      const albumIds = dataList.value.map((item: any) => item.id);

      if (albumIds.length === 0) {
        message("当前没有可导出的相册", { type: "warning" });
        return;
      }

      // 导入 AnSelect 组件
      const AnSelect = (await import("@/components/AnSelect")).default;

      // 创建响应式的格式选择
      const selectedFormat = ref("json");

      // 使用 AnDialog 显示导出对话框
      await new Promise((resolve, reject) => {
        addDialog({
          title: "导出相册",
          width: "480px",
          showFooter: true,
          confirmText: "导出",
          cancelText: "取消",
          contentRenderer: () => {
            return h("div", { class: "export-dialog-content" }, [
              h(
                "p",
                {
                  style: {
                    marginBottom: "16px",
                    fontSize: "14px",
                    color: "var(--anzhiyu-fontcolor)",
                    lineHeight: "1.6"
                  }
                },
                `即将导出 ${albumIds.length} 个相册，请选择导出格式：`
              ),
              h(
                "div",
                {
                  style: {
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "var(--anzhiyu-secondtext)"
                  }
                },
                "导出格式"
              ),
              h(AnSelect, {
                modelValue: selectedFormat.value,
                "onUpdate:modelValue": (val: string) => {
                  selectedFormat.value = val;
                },
                options: [
                  { label: "JSON 格式（纯文本）", value: "json" },
                  { label: "ZIP 格式（压缩包）", value: "zip" }
                ],
                placeholder: "请选择导出格式"
              })
            ]);
          },
          onConfirm: () => {
            resolve(selectedFormat.value);
          },
          closeCallBack: ({ args }) => {
            if (args?.command === "cancel" || args?.command === "close") {
              reject(new Error("cancelled"));
            }
          }
        });
      });

      message(`正在导出 ${albumIds.length} 个相册...`, {
        type: "info",
        duration: 0
      });

      // 调用导出接口
      const response: any = await exportAlbums({
        album_ids: albumIds,
        format: selectedFormat.value
      });

      // 创建下载链接
      let blob: Blob;
      if (response instanceof Blob) {
        blob = response;
      } else if (response?.data instanceof Blob) {
        blob = response.data;
      } else {
        throw new Error("响应数据格式不正确");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `albums-export-${new Date().getTime()}.${selectedFormat.value}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message(`成功导出 ${albumIds.length} 个相册！`, { type: "success" });
    } catch (error) {
      if (error?.message !== "cancelled") {
        console.error("导出失败:", error);
        message(`导出失败: ${error.message || "未知错误"}`, {
          type: "error"
        });
      }
    }
  }

  /**
   * 导入相册
   */
  function openImportDialog() {
    const importFormRef = ref();

    addDialog({
      title: "导入相册",
      props: {
        formInline: {
          importMode: "urls",
          file: null,
          jsonContent: "",
          urlsContent: "",
          skipExisting: true,
          overwriteExisting: false,
          defaultCategoryId: null,
          thumbParam: "",
          bigParam: "",
          tags: []
        },
        categories: categories.value
      },
      top: "10vh",
      width: "70vw",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      contentRenderer: () =>
        h(importExportForm, {
          ref: importFormRef,
          formInline: null,
          categories: categories.value
        }),
      beforeSure: async (done, { options, closeLoading }) => {
        const FormRef = importFormRef.value.getRef();
        const curData = options.props.formInline;

        FormRef.validate(async valid => {
          if (valid) {
            // 根据导入模式处理数据
            let formData: FormData;

            if (curData.importMode === "urls") {
              // 链接导入模式：直接调用批量导入接口
              const urls = curData.urlsContent
                .split("\n")
                .map(line => line.trim())
                .filter(Boolean);

              if (urls.length === 0) {
                message("请输入至少一个图片链接", { type: "error" });
                closeLoading();
                return;
              }

              if (urls.length > 100) {
                message("单次最多导入 100 个链接", { type: "error" });
                closeLoading();
                return;
              }

              // 验证URL格式
              const invalidUrls: string[] = [];
              const validUrls = urls.filter(url => {
                try {
                  new URL(url);
                  const isImageUrl =
                    /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url) ||
                    url.includes("upload") ||
                    url.includes("image");
                  if (!isImageUrl) {
                    console.warn(`可能不是图片URL: ${url}`);
                  }
                  return true;
                } catch {
                  invalidUrls.push(url);
                  return false;
                }
              });

              if (invalidUrls.length > 0) {
                console.warn("无效的URL格式：", invalidUrls);
                message(
                  `发现 ${invalidUrls.length} 个无效的URL格式，已自动跳过。有效URL: ${validUrls.length} 个`,
                  { type: "warning" }
                );
                if (validUrls.length === 0) {
                  closeLoading();
                  return;
                }
              }

              // 显示加载提示
              const loadingMsg = message(
                `正在导入 ${validUrls.length} 张图片，请稍候...`,
                {
                  type: "info",
                  duration: 0
                }
              );

              try {
                const startTime = Date.now();
                const res = await batchImportAlbums({
                  categoryId: curData.defaultCategoryId,
                  urls: validUrls,
                  thumbParam: curData.thumbParam,
                  bigParam: curData.bigParam,
                  tags: curData.tags,
                  displayOrder: 0
                });
                const duration = ((Date.now() - startTime) / 1000).toFixed(1);

                loadingMsg.close();
                closeLoading();

                if (res.code === 200 && res.data) {
                  const {
                    successCount,
                    failCount,
                    skipCount,
                    errors,
                    duplicates
                  } = res.data;

                  if (errors && errors.length > 0) {
                    console.group("📋 链接导入详细错误信息");
                    errors.forEach(({ url, reason }, index) => {
                      console.error(`${index + 1}. ${url}\n   原因: ${reason}`);
                    });
                    console.groupEnd();
                  }

                  if (duplicates && duplicates.length > 0) {
                    console.warn("跳过的重复图片：", duplicates);
                  }

                  showImportResultDialog({
                    successCount,
                    failCount,
                    skipCount,
                    invalidCount: invalidUrls.length,
                    total: validUrls.length + invalidUrls.length,
                    duration,
                    errors,
                    duplicates,
                    invalidUrls
                  });

                  done();
                  onSearch();
                } else {
                  message(`导入失败: ${res.message || "未知错误"}`, {
                    type: "error"
                  });
                }
              } catch (error) {
                loadingMsg.close();
                closeLoading();
                console.error("导入请求失败:", error);
                message(`导入请求失败: ${error.message || "未知错误"}`, {
                  type: "error",
                  duration: 5000
                });
              }
              return;
            } else if (curData.importMode === "json") {
              // JSON 模式：创建临时文件
              if (!curData.jsonContent) {
                message("请输入 JSON 数据", { type: "error" });
                closeLoading();
                return;
              }

              try {
                // 验证 JSON 格式
                JSON.parse(curData.jsonContent);

                // 创建 Blob 和 File 对象
                const blob = new Blob([curData.jsonContent], {
                  type: "application/json"
                });
                const file = new File([blob], "albums-import.json", {
                  type: "application/json"
                });

                formData = new FormData();
                formData.append("file", file);
              } catch {
                message("JSON 格式不正确", { type: "error" });
                closeLoading();
                return;
              }
            } else {
              // 文件模式
              if (!curData.file) {
                message("请上传相册数据文件", { type: "error" });
                closeLoading();
                return;
              }

              formData = new FormData();
              formData.append("file", curData.file);
            }

            // 添加其他参数
            formData.append(
              "skip_existing",
              curData.skipExisting ? "true" : "false"
            );
            formData.append(
              "overwrite_existing",
              curData.overwriteExisting ? "true" : "false"
            );
            if (curData.defaultCategoryId) {
              formData.append(
                "default_category_id",
                curData.defaultCategoryId.toString()
              );
            }

            // 显示加载提示
            const loadingMsg = message("正在导入相册数据，请稍候...", {
              type: "info",
              duration: 0
            });

            try {
              const res = await importAlbums(formData);

              // 关闭加载提示
              loadingMsg.close();
              closeLoading();

              if (res.code === 200 && res.data) {
                const { success_count, skipped_count, failed_count, errors } =
                  res.data;

                // 输出详细日志
                if (errors && errors.length > 0) {
                  console.group("📋 相册导入详细错误信息");
                  errors.forEach((error, index) => {
                    console.error(`${index + 1}. ${error}`);
                  });
                  console.groupEnd();
                }

                // 显示结果
                if (failed_count > 0) {
                  message(
                    `导入完成！成功 ${success_count} 个，跳过 ${skipped_count} 个，失败 ${failed_count} 个`,
                    { type: "warning", duration: 5000 }
                  );
                } else {
                  message(
                    `导入成功！成功 ${success_count} 个，跳过 ${skipped_count} 个`,
                    { type: "success" }
                  );
                }

                done(); // 关闭导入表单弹框
                onSearch(); // 刷新表格数据
              } else {
                message(`导入失败: ${res.message || "未知错误"}`, {
                  type: "error"
                });
              }
            } catch (error) {
              // 关闭加载提示
              loadingMsg.close();
              closeLoading();
              console.error("导入请求失败:", error);
              message(`导入请求失败: ${error.message || "未知错误"}`, {
                type: "error",
                duration: 5000
              });
            }
          } else {
            closeLoading();
          }
        });
      }
    });
  }

  onMounted(() => {
    loadCategories();
    onSearch();
  });

  return {
    form,
    categories,
    loading,
    columns,
    dataList,
    pagination,
    selectedRows,
    onSizeChange,
    onCurrentChange,
    loadingConfig,
    onSearch,
    resetForm,
    openDialog,
    handleDelete,
    handleBatchDelete,
    handleSelectionChange,
    handleExport,
    openImportDialog,
    loadCategories
  };
}
