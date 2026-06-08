"use client";

import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, addToast } from "@heroui/react";
import { ChevronDown, FileText, Info, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { useImportArticles } from "@/hooks/queries/use-post-management";

interface ImportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: ReturnType<typeof useImportArticles>;
}

export function ImportModal({ isOpen, onOpenChange, onImport }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFormatHelpOpen, setIsFormatHelpOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSupportedFile = (nextFile: File) => {
    const lowerCaseName = nextFile.name.toLowerCase();
    return lowerCaseName.endsWith(".json") || lowerCaseName.endsWith(".zip");
  };

  const selectFile = (nextFile: File | null) => {
    if (!nextFile) return;

    if (!isSupportedFile(nextFile)) {
      addToast({ title: "仅支持 JSON 或 ZIP 文件", color: "warning", timeout: 3000 });
      return;
    }

    setFile(nextFile);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0] ?? null);
  };

  const handleDragEnter = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleImport = async () => {
    if (!file) {
      addToast({ title: "请选择文件", color: "warning", timeout: 3000 });
      return;
    }
    try {
      const result = await onImport.mutateAsync({ file });
      const msg =
        result.failed_count > 0
          ? `导入完成：成功 ${result.success_count} 篇，跳过 ${result.skipped_count} 篇，失败 ${result.failed_count} 篇`
          : `导入完成：成功 ${result.success_count} 篇，跳过 ${result.skipped_count} 篇`;
      addToast({
        title: msg,
        color: result.failed_count > 0 ? "warning" : "success",
        timeout: 5000,
      });
      setFile(null);
      onOpenChange(false);
    } catch (error) {
      addToast({ title: error instanceof Error ? error.message : "导入失败", color: "danger", timeout: 3000 });
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" placement="center" size="lg" scrollBehavior="inside">
      <ModalContent>
        {onClose => (
          <>
            <ModalHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary-50">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span>导入文章</span>
                  <p className="text-xs text-muted-foreground font-normal mt-0.5">支持 JSON 或 ZIP 格式</p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="rounded-xl border border-primary/15 bg-primary-50/30 dark:bg-primary-900/10">
                <button
                  type="button"
                  onClick={() => setIsFormatHelpOpen(open => !open)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Info className="h-4 w-4 text-primary" />
                    查看导入格式
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isFormatHelpOpen ? "rotate-180" : ""
                    )}
                  />
                </button>
                {isFormatHelpOpen && (
                  <div className="space-y-4 border-t border-primary/10 px-4 pb-4 pt-3 text-xs leading-5 text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">支持文件</p>
                      <p>可上传系统导出的 ZIP 包，或直接上传 ZIP 内的 articles.json。</p>
                      <p>ZIP 根目录必须包含 articles.json；markdown/ 目录只作为阅读备份，导入时不会单独解析 Markdown 文件。</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">JSON 顶层结构</p>
                      <pre className="mt-2 max-h-36 overflow-auto rounded-lg bg-muted/60 p-3 text-[11px] text-foreground">
{`{
  "version": "1.0",
  "export_at": "2026-06-08T12:00:00Z",
  "articles": [
    {
      "title": "文章标题",
      "content_md": "Markdown 正文",
      "content_html": "<p>HTML 正文</p>",
      "status": "DRAFT"
    }
  ],
  "meta": {}
}`}
                      </pre>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">文章字段</p>
                      <p>必填建议包含 title、content_md、content_html；status 可为 DRAFT、PUBLISHED、ARCHIVED 或 SCHEDULED，缺省时按草稿导入。</p>
                      <p>可选字段包括 categories、tags、summaries、cover_url、top_img_url、abbrlink、keywords、home_sort、pin_sort、copyright、is_reprint、copyright_author、copyright_author_href、copyright_url。</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">导入策略</p>
                      <p>默认自动创建不存在的分类和标签，并按 abbrlink 或标题跳过已存在文章。</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.zip"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "w-full border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
                  isDragging
                    ? "border-primary bg-primary-50/40 ring-2 ring-primary/25"
                    : "",
                  file
                    ? "border-primary/50 bg-primary-50/30"
                    : "border-border/60 hover:border-primary/30 hover:bg-muted/30"
                )}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-2.5 rounded-xl bg-primary-100">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="p-2.5 rounded-xl bg-muted">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium">{isDragging ? "释放鼠标上传文件" : "拖拽文件到此处，或点击选择文件"}</span>
                    <span className="text-xs text-muted-foreground/40">JSON / ZIP</span>
                  </div>
                )}
              </button>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} isDisabled={onImport.isPending}>
                取消
              </Button>
              <Button color="primary" onPress={handleImport} isDisabled={!file} isLoading={onImport.isPending}>
                开始导入
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
