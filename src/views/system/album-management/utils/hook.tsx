import dayjs from "dayjs";
import editForm from "../form.vue";
import batchImportForm from "../batch-import-form.vue";
import { message } from "@/utils/message";
import {
  getWallpapertList,
  addWallpapert,
  updateWallpaper,
  deleteWallpaper
} from "@/api/album-home";
import { addDialog } from "@/components/ReDialog";
import { reactive, ref, onMounted, h } from "vue";
import type { FormItemProps } from "./types";
import { deviceDetection } from "@pureadmin/utils";
import type { PaginationProps, LoadingConfig } from "@pureadmin/table";
import { ElProgress } from "element-plus";

export function useAlbum() {
  const form = reactive({
    created_at: null,
    sort: "display_order_asc"
  });

  const formRef = ref();
  const dataList = ref([]);
  const loading = ref(true);

  const columns: TableColumnList = [
    {
      label: "id",
      prop: "id",
      minWidth: 70
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
      slot: "operation"
    }
  ];
  function resetForm(formEl) {
    if (!formEl) return;
    formEl.resetFields();
    form.created_at = null;
    form.sort = "display_order_asc";
    onSearch();
  }

  async function onSearch() {
    loading.value = true;
    const { currentPage, pageSize } = pagination;
    const { data } = await getWallpapertList({
      page: currentPage,
      pageSize: pageSize,
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
   * 策略性地获取图片Blob数据
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
   * 获取图片元数据的主函数
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
        }
      },
      width: "80vw",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
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

  /**
   * 批量导入图片
   */
  function openBatchImportDialog() {
    const batchFormRef = ref();
    addDialog({
      title: "批量导入图片",
      props: {
        formInline: {
          urls: "",
          thumbParam: "",
          bigParam: "",
          tags: [],
          displayOrder: 0
        }
      },
      top: "10vh",
      width: "80vw",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      sureBtnLoading: true,
      contentRenderer: () =>
        h(batchImportForm, { ref: batchFormRef, formInline: null }),
      beforeSure: async (done, { options, closeLoading }) => {
        const FormRef = batchFormRef.value.getRef();
        const curData = options.props.formInline;

        FormRef.validate(async valid => {
          if (valid) {
            // 解析URL列表
            const urls = curData.urls
              .split("\n")
              .map(line => line.trim())
              .filter(Boolean);

            if (urls.length === 0) {
              message("请输入至少一个图片链接", { type: "error" });
              closeLoading();
              return;
            }

            if (urls.length > 100) {
              message("单次最多导入100张图片", { type: "error" });
              closeLoading();
              return;
            }

            // 创建进度提示的弹窗
            let progressDialogContent = ref(
              h("div", { style: "padding: 20px" }, [
                h("p", { style: "margin-bottom: 16px" }, [
                  `正在导入图片... (0/${urls.length})`
                ]),
                h(ElProgress, { percentage: 0, status: "active" as any })
              ])
            );

            addDialog({
              title: "批量导入进度",
              width: "500px",
              closeOnClickModal: false,
              closeOnPressEscape: false,
              showClose: false,
              hideFooter: true,
              contentRenderer: () => progressDialogContent.value
            });

            let successCount = 0;
            let failCount = 0;
            const errors: string[] = [];

            // 批量处理图片
            for (let i = 0; i < urls.length; i++) {
              const url = urls[i];
              const displayOrder = curData.displayOrder + i;

              try {
                // 获取图片元数据
                const imageInfo = await getImageMeta(url);

                // 添加图片
                const res = await addWallpapert({
                  imageUrl: url,
                  bigImageUrl: url,
                  downloadUrl: url,
                  thumbParam: curData.thumbParam,
                  bigParam: curData.bigParam,
                  tags: curData.tags,
                  viewCount: 1,
                  downloadCount: 0,
                  displayOrder: displayOrder,
                  ...imageInfo
                });

                if (res.code === 200) {
                  successCount++;
                } else {
                  failCount++;
                  errors.push(`${url}: ${res.message}`);
                }
              } catch (error) {
                failCount++;
                errors.push(`${url}: ${error.message || "未知错误"}`);
              }

              // 更新进度
              const progress = Math.round(((i + 1) / urls.length) * 100);
              progressDialogContent.value = h(
                "div",
                { style: "padding: 20px" },
                [
                  h("p", { style: "margin-bottom: 16px" }, [
                    `正在导入图片... (${i + 1}/${urls.length})`
                  ]),
                  h(ElProgress, {
                    percentage: progress,
                    status:
                      progress === 100 ? ("success" as any) : ("active" as any)
                  }),
                  h(
                    "div",
                    { style: "margin-top: 16px; color: var(--el-color-info)" },
                    [
                      h("p", `成功: ${successCount} 张`),
                      h("p", `失败: ${failCount} 张`)
                    ]
                  )
                ]
              );
            }

            // 等待进度显示完成
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 显示结果
            if (failCount > 0) {
              message(
                `导入完成！成功 ${successCount} 张，失败 ${failCount} 张。部分图片导入失败，请检查控制台查看详情。`,
                { type: "warning" }
              );
              console.error("批量导入错误详情：", errors);
            } else {
              message(`批量导入成功！共导入 ${successCount} 张图片`, {
                type: "success"
              });
            }

            done(); // 关闭弹框
            onSearch(); // 刷新表格数据
          } else {
            closeLoading();
          }
        });
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

  /** 加载动画配置 */
  const loadingConfig = reactive<LoadingConfig>({
    text: "正在加载第一页...",
    viewBox: "-10, -10, 50, 50"
  });

  function onSizeChange(val) {
    pagination.pageSize = val;
    pagination.currentPage = 1;
    onSearch();
  }

  function onCurrentChange(val) {
    pagination.currentPage = val;
    loadingConfig.text = `正在加载第${val}页...`;
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
    onSizeChange,
    onCurrentChange,
    loadingConfig,
    onSearch,
    resetForm,
    openDialog,
    handleDelete,
    openBatchImportDialog
  };
}
