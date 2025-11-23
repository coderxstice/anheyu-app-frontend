<!--
 * @Description: 关于页设置表单
 * @Author: 安知鱼
 * @Date: 2025-08-20
-->
<template>
  <el-divider content-position="left">
    <h3>关于页配置</h3>
  </el-divider>

  <!-- 板块显示开关 -->
  <el-divider content-position="left">
    <h4>板块显示开关</h4>
  </el-divider>
  <div class="switches-container">
    <el-form-item label="作者头像框">
      <el-switch
        v-model="formData.enableAuthorBox"
        active-text="显示"
        inactive-text="隐藏"
      />
      <div class="form-item-help">控制关于页面作者头像框板块的显示。</div>
    </el-form-item>

    <el-form-item label="基础介绍内容">
      <el-switch
        v-model="formData.enablePageContent"
        active-text="显示"
        inactive-text="隐藏"
      />
      <div class="form-item-help">控制关于页面基础介绍内容板块的显示。</div>
    </el-form-item>

    <el-form-item label="技能卡片">
      <el-switch
        v-model="formData.enableSkills"
        active-text="显示"
        inactive-text="隐藏"
      />
      <div class="form-item-help">控制关于页面技能卡片板块的显示。</div>
    </el-form-item>

    <el-form-item label="职业经历卡片">
      <el-switch
        v-model="formData.enableCareers"
        active-text="显示"
        inactive-text="隐藏"
      />
      <div class="form-item-help">控制关于页面职业经历卡片板块的显示。</div>
    </el-form-item>

    <el-form-item label="访问统计卡片">
      <el-switch
        v-model="formData.enableStatistic"
        active-text="显示"
        inactive-text="隐藏"
      />
      <div class="form-item-help">控制关于页面访问统计卡片板块的显示。</div>
    </el-form-item>

    <el-form-item label="地图和个人信息">
      <el-switch
        v-model="formData.enableMapAndInfo"
        active-text="显示"
        inactive-text="隐藏"
      />
      <div class="form-item-help">
        控制关于页面地图和个人信息卡片板块的显示。
      </div>
    </el-form-item>

    <el-form-item label="性格卡片">
      <el-switch
        v-model="formData.enablePersonality"
        active-text="显示"
        inactive-text="隐藏"
      />
      <div class="form-item-help">控制关于页面性格卡片板块的显示。</div>
    </el-form-item>

    <el-form-item label="照片卡片">
      <el-switch
        v-model="formData.enablePhoto"
        active-text="显示"
        inactive-text="隐藏"
      />
      <div class="form-item-help">控制关于页面照片卡片板块的显示。</div>
    </el-form-item>

    <el-form-item label="格言卡片">
      <el-switch
        v-model="formData.enableMaxim"
        active-text="显示"
        inactive-text="隐藏"
      />
      <div class="form-item-help">控制关于页面格言卡片板块的显示。</div>
    </el-form-item>

    <el-form-item label="特长卡片">
      <el-switch
        v-model="formData.enableBuff"
        active-text="显示"
        inactive-text="隐藏"
      />
      <div class="form-item-help">控制关于页面特长卡片板块的显示。</div>
    </el-form-item>

    <el-form-item label="游戏卡片">
      <el-switch
        v-model="formData.enableGame"
        active-text="显示"
        inactive-text="隐藏"
      />
      <div class="form-item-help">控制关于页面游戏卡片板块的显示。</div>
    </el-form-item>

    <el-form-item label="漫画/番剧卡片">
      <el-switch
        v-model="formData.enableComic"
        active-text="显示"
        inactive-text="隐藏"
      />
      <div class="form-item-help">控制关于页面漫画/番剧卡片板块的显示。</div>
    </el-form-item>

    <el-form-item label="技术偏好卡片">
      <el-switch
        v-model="formData.enableLikeTech"
        active-text="显示"
        inactive-text="隐藏"
      />
      <div class="form-item-help">控制关于页面技术偏好卡片板块的显示。</div>
    </el-form-item>

    <el-form-item label="音乐卡片">
      <el-switch
        v-model="formData.enableMusic"
        active-text="显示"
        inactive-text="隐藏"
      />
      <div class="form-item-help">控制关于页面音乐卡片板块的显示。</div>
    </el-form-item>

    <el-form-item label="自定义内容块">
      <el-switch
        v-model="formData.enableCustomCode"
        active-text="显示"
        inactive-text="隐藏"
      />
      <div class="form-item-help">控制关于页面自定义内容块的显示。</div>
    </el-form-item>
  </div>

  <!-- 基本信息 -->
  <el-divider content-position="left">
    <h4>基本信息配置</h4>
  </el-divider>
  <el-form-item label="姓名">
    <el-input v-model="formData.name" placeholder="请输入姓名" />
    <div class="form-item-help">关于页面显示的个人姓名。</div>
  </el-form-item>

  <el-form-item label="个人描述">
    <el-input
      v-model="formData.description"
      type="textarea"
      :rows="3"
      placeholder="请输入个人描述"
    />
    <div class="form-item-help">关于页面的个人简介描述。</div>
  </el-form-item>

  <el-form-item label="头像图片">
    <el-input
      v-model="formData.avatarImg"
      placeholder="请输入头像图片链接地址"
    />
    <div class="form-item-help">关于页面显示的个人头像图片。</div>
  </el-form-item>

  <el-form-item label="副标题">
    <el-input v-model="formData.subtitle" placeholder="请输入副标题" />
    <div class="form-item-help">关于页面显示的副标题文字。</div>
  </el-form-item>

  <!-- 技能标签 -->
  <el-form-item label="左侧技能标签">
    <el-input
      v-model="skillsLeftText"
      type="textarea"
      :rows="4"
      placeholder="请输入左侧技能标签，每行一个"
    />
    <div class="form-item-help">左侧技能标签，每行输入一个标签。</div>
  </el-form-item>

  <el-form-item label="右侧技能标签">
    <el-input
      v-model="skillsRightText"
      type="textarea"
      :rows="4"
      placeholder="请输入右侧技能标签，每行一个"
    />
    <div class="form-item-help">右侧技能标签，每行输入一个标签。</div>
  </el-form-item>

  <!-- 站点提示 -->
  <el-form-item label="站点提示标题1">
    <el-input
      v-model="formData.aboutSiteTips.title1"
      placeholder="请输入标题1"
    />
  </el-form-item>

  <el-form-item label="站点提示标题2">
    <el-input
      v-model="formData.aboutSiteTips.title2"
      placeholder="请输入标题2"
    />
  </el-form-item>

  <el-form-item label="站点提示说明">
    <el-input
      v-model="formData.aboutSiteTips.tips"
      placeholder="请输入提示说明"
    />
  </el-form-item>

  <el-form-item label="站点提示关键词">
    <el-input
      v-model="siteTipsWordsText"
      type="textarea"
      :rows="3"
      placeholder="请输入关键词，用逗号分隔"
    />
    <div class="form-item-help">站点提示的关键词，用逗号分隔。</div>
  </el-form-item>

  <!-- 地图信息 -->
  <el-form-item label="地图背景图片">
    <el-input
      v-model="formData.map.background"
      placeholder="请输入地图背景图片链接地址"
    />
  </el-form-item>

  <el-form-item label="地图暗色背景图片">
    <el-input
      v-model="formData.map.backgroundDark"
      placeholder="请输入地图暗色背景图片链接地址"
    />
  </el-form-item>

  <el-form-item label="地图标题">
    <el-input v-model="formData.map.title" placeholder="请输入地图标题" />
  </el-form-item>

  <el-form-item label="地图强调标题">
    <el-input
      v-model="formData.map.strengthenTitle"
      placeholder="请输入地图强调标题"
    />
  </el-form-item>

  <!-- 个人信息 -->
  <el-form-item label="出生年份标签">
    <el-input
      v-model="formData.selfInfo.tips1"
      placeholder="请输入出生年份标签"
    />
  </el-form-item>

  <el-form-item label="出生年份">
    <el-input
      v-model="formData.selfInfo.contentYear"
      placeholder="请输入出生年份"
    />
  </el-form-item>

  <el-form-item label="学校标签">
    <el-input v-model="formData.selfInfo.tips2" placeholder="请输入学校标签" />
  </el-form-item>

  <el-form-item label="学校名称">
    <el-input
      v-model="formData.selfInfo.content2"
      placeholder="请输入学校名称"
    />
  </el-form-item>

  <el-form-item label="职业标签">
    <el-input v-model="formData.selfInfo.tips3" placeholder="请输入职业标签" />
  </el-form-item>

  <el-form-item label="职业描述">
    <el-input
      v-model="formData.selfInfo.content3"
      placeholder="请输入职业描述"
    />
  </el-form-item>

  <!-- 性格测试 -->
  <el-form-item label="性格类型名称">
    <el-input
      v-model="formData.personalities.authorName"
      placeholder="请输入性格类型名称"
    />
  </el-form-item>

  <el-form-item label="性格测试链接">
    <el-input
      v-model="formData.personalities.nameUrl"
      placeholder="请输入性格测试链接"
    />
  </el-form-item>

  <el-form-item label="性格类型图片">
    <el-input
      v-model="formData.personalities.personalityImg"
      placeholder="请输入性格类型图片链接"
    />
  </el-form-item>

  <el-form-item label="性格类型">
    <el-input
      v-model="formData.personalities.personalityType"
      placeholder="请输入性格类型"
    />
  </el-form-item>

  <el-form-item label="性格类型颜色">
    <el-input
      v-model="formData.personalities.personalityTypeColor"
      placeholder="请输入性格类型颜色"
    />
  </el-form-item>

  <el-form-item label="个人照片">
    <el-input
      v-model="formData.personalities.photoUrl"
      placeholder="请输入个人照片链接"
    />
  </el-form-item>

  <el-form-item label="性格标签">
    <el-input
      v-model="formData.personalities.tips"
      placeholder="请输入性格标签"
    />
  </el-form-item>

  <!-- 座右铭 -->
  <el-form-item label="座右铭上半部分">
    <el-input v-model="formData.maxim.top" placeholder="请输入座右铭上半部分" />
  </el-form-item>

  <el-form-item label="座右铭下半部分">
    <el-input
      v-model="formData.maxim.bottom"
      placeholder="请输入座右铭下半部分"
    />
  </el-form-item>

  <el-form-item label="座右铭标签">
    <el-input v-model="formData.maxim.tips" placeholder="请输入座右铭标签" />
  </el-form-item>

  <!-- 特长 -->
  <el-form-item label="特长上半部分">
    <el-input v-model="formData.buff.top" placeholder="请输入特长上半部分" />
  </el-form-item>

  <el-form-item label="特长下半部分">
    <el-input v-model="formData.buff.bottom" placeholder="请输入特长下半部分" />
  </el-form-item>

  <el-form-item label="特长标签">
    <el-input v-model="formData.buff.tips" placeholder="请输入特长标签" />
  </el-form-item>

  <!-- 游戏 -->
  <el-form-item label="游戏背景图片">
    <el-input
      v-model="formData.game.background"
      placeholder="请输入游戏背景图片链接"
    />
  </el-form-item>

  <el-form-item label="游戏标题">
    <el-input v-model="formData.game.title" placeholder="请输入游戏标题" />
  </el-form-item>

  <el-form-item label="游戏UID">
    <el-input v-model="formData.game.uid" placeholder="请输入游戏UID" />
  </el-form-item>

  <el-form-item label="游戏标签">
    <el-input v-model="formData.game.tips" placeholder="请输入游戏标签" />
  </el-form-item>

  <!-- 动漫 -->
  <el-form-item label="动漫标题">
    <el-input v-model="formData.comic.title" placeholder="请输入动漫标题" />
  </el-form-item>

  <el-form-item label="动漫标签">
    <el-input v-model="formData.comic.tips" placeholder="请输入动漫标签" />
  </el-form-item>

  <!-- 动漫列表编辑 -->
  <ComicListEditor v-model:comic-list="formData.comic.list" />

  <!-- 喜好 -->
  <el-form-item label="喜好背景图片">
    <el-input
      v-model="formData.like.background"
      placeholder="请输入喜好背景图片链接"
    />
  </el-form-item>

  <el-form-item label="喜好标题">
    <el-input v-model="formData.like.title" placeholder="请输入喜好标题" />
  </el-form-item>

  <el-form-item label="喜好描述">
    <el-input v-model="formData.like.bottom" placeholder="请输入喜好描述" />
  </el-form-item>

  <el-form-item label="喜好标签">
    <el-input v-model="formData.like.tips" placeholder="请输入喜好标签" />
  </el-form-item>

  <!-- 音乐 -->
  <el-form-item label="音乐背景图片">
    <el-input
      v-model="formData.music.background"
      placeholder="请输入音乐背景图片链接"
    />
  </el-form-item>

  <el-form-item label="音乐标题">
    <el-input v-model="formData.music.title" placeholder="请输入音乐标题" />
  </el-form-item>

  <el-form-item label="音乐链接">
    <el-input v-model="formData.music.link" placeholder="请输入音乐链接" />
  </el-form-item>

  <el-form-item label="音乐标签">
    <el-input v-model="formData.music.tips" placeholder="请输入音乐标签" />
  </el-form-item>

  <!-- 生涯 -->
  <el-form-item label="生涯背景图片">
    <el-input
      v-model="formData.careers.img"
      placeholder="请输入生涯背景图片链接"
    />
  </el-form-item>

  <el-form-item label="生涯标题">
    <el-input v-model="formData.careers.title" placeholder="请输入生涯标题" />
  </el-form-item>

  <el-form-item label="生涯标签">
    <el-input v-model="formData.careers.tips" placeholder="请输入生涯标签" />
  </el-form-item>

  <!-- 生涯列表编辑 -->
  <CareerListEditor v-model:career-list="formData.careers.list" />

  <!-- 技能提示 -->
  <el-form-item label="技能标题">
    <el-input
      v-model="formData.skillsTips.title"
      placeholder="请输入技能标题"
    />
  </el-form-item>

  <el-form-item label="技能标签">
    <el-input v-model="formData.skillsTips.tips" placeholder="请输入技能标签" />
  </el-form-item>

  <!-- 统计背景 -->
  <el-form-item label="统计背景图片">
    <el-input
      v-model="formData.statisticsBackground"
      placeholder="请输入统计背景图片链接地址"
    />
    <div class="form-item-help">关于页面统计区域的背景图片。</div>
  </el-form-item>

  <!-- 自定义内容块 -->
  <el-divider content-position="left">
    <h3>自定义内容块</h3>
  </el-divider>

  <el-form-item label="自定义内容">
    <div class="about-editor-container">
      <div class="markdown-editor-wrapper">
        <MarkdownEditor
          ref="editorRef"
          v-model="formData.customCode"
          :on-upload-img="handleImageUpload"
          @onSave="handleSave"
        />
      </div>
      <div class="editor-tip">
        支持 Markdown 语法和富文本编辑，内容将显示在关于页面的底部
      </div>
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from "vue";
import { ElMessage } from "element-plus";
import type { AboutPageSettingsInfo } from "../../../type";
import ComicListEditor from "./ComicListEditor.vue";
import CareerListEditor from "./CareerListEditor.vue";
import { uploadArticleImage } from "@/api/post";

// 懒加载 Markdown 编辑器
const MarkdownEditor = defineAsyncComponent(
  () => import("@/components/MarkdownEditor/index.vue")
);

const formData = defineModel<AboutPageSettingsInfo>({ required: true });
const editorRef = ref<any>();

const skillsLeftText = computed({
  get: () => (formData.value.avatarSkillsLeft || []).join("\n"),
  set: (value: string) => {
    if (formData.value) {
      formData.value.avatarSkillsLeft = value
        .split("\n")
        .filter(item => item.trim());
    }
  }
});

const skillsRightText = computed({
  get: () => (formData.value.avatarSkillsRight || []).join("\n"),
  set: (value: string) => {
    if (formData.value) {
      formData.value.avatarSkillsRight = value
        .split("\n")
        .filter(item => item.trim());
    }
  }
});

// 站点提示关键词文本处理
const siteTipsWordsText = computed({
  get: () => (formData.value.aboutSiteTips?.word || []).join(","),
  set: (value: string) => {
    if (formData.value && formData.value.aboutSiteTips) {
      formData.value.aboutSiteTips.word = value
        .split(",")
        .map(item => item.trim())
        .filter(item => item);
    }
  }
});

// 处理图片上传
const handleImageUpload = async (
  files: File[],
  callback: (urls: string[]) => void
) => {
  const loadingInstance = ElMessage.info({
    message: "正在上传图片...",
    duration: 0
  });
  try {
    const urls = await Promise.all(
      files.map(async file => {
        const res = await uploadArticleImage(file);
        const url = res?.data?.url;
        if (!url) {
          throw new Error(`图片 ${file.name} 上传失败: 服务器未返回有效URL`);
        }
        return url;
      })
    );
    callback(urls);
    ElMessage.success("图片上传成功！");
  } catch (error: any) {
    console.error("图片上传失败:", error);
    ElMessage.error(error.message || "图片上传失败，请稍后再试。");
  } finally {
    loadingInstance.close();
  }
};

// 处理保存（当用户按 Ctrl+S 时）
const handleSave = async (markdown: string, html: string) => {
  // 保存 Markdown（用于编辑器再次编辑）
  formData.value.customCode = markdown;
  // 保存渲染后的 HTML（用于前台展示）
  formData.value.customCodeHtml = html;
};

// 在表单提交前同步更新 HTML 内容
const syncEditorContent = async () => {
  if (editorRef.value?.triggerSave) {
    editorRef.value.triggerSave();
    // 等待一小段时间确保 handleSave 被调用
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};

// 暴露方法给父组件调用
defineExpose({
  syncEditorContent
});
</script>

<style scoped lang="scss">
.el-form-item {
  margin-bottom: 24px;
}

.form-item-help {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--anzhiyu-secondtext);
}

.el-divider {
  margin: 40px 0 28px;

  h3,
  h4 {
    margin: 0;
    color: var(--anzhiyu-fontcolor);
  }

  :deep(.el-divider__text) {
    background-color: var(--anzhiyu-background);
  }
}

.switches-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px 40px;
  margin-bottom: 20px;
  padding: 20px;
  background-color: var(--anzhiyu-secondbg);
  border-radius: 8px;
  box-shadow: var(--anzhiyu-shadow-border);
  border: var(--style-border-always);
  transition: all 0.3s ease;

  .el-form-item {
    margin-bottom: 0;
  }

  // 暗色模式优化
  @media (prefers-color-scheme: dark) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  html.dark & {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
}

.about-editor-container {
  width: 100%;

  .markdown-editor-wrapper {
    width: 100%;
    height: 500px;
    border: var(--style-border-always);
    border-radius: 4px;
    overflow: hidden;
    background: var(--anzhiyu-card-bg);
    transition: all 0.3s ease;

    :deep(.md-editor-container) {
      height: 100%;
    }

    // 暗色模式优化
    @media (prefers-color-scheme: dark) {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    html.dark & {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
  }

  .editor-tip {
    margin-top: 8px;
    font-size: 12px;
    color: var(--anzhiyu-secondtext);
    line-height: 1.5;
  }
}

// 暗色模式下的输入框优化
@media (prefers-color-scheme: dark) {
  :deep(.el-input__wrapper) {
    background-color: var(--el-fill-color-blank);
    border-color: var(--el-border-color-darker);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-border-color);
    }

    &.is-focus {
      background-color: var(--el-bg-color);
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }
  }

  :deep(.el-textarea__inner) {
    background-color: var(--el-fill-color-blank);
    border-color: var(--el-border-color-darker);
    color: var(--el-text-color-primary);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-border-color);
    }

    &:focus {
      background-color: var(--el-bg-color);
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }
  }

  :deep(.el-switch) {
    &.is-checked {
      .el-switch__core {
        background-color: var(--el-color-primary);
      }
    }
  }
}

// 手动切换暗色模式支持
html.dark & {
  :deep(.el-input__wrapper) {
    background-color: var(--el-fill-color-blank);
    border-color: var(--el-border-color-darker);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-border-color);
    }

    &.is-focus {
      background-color: var(--el-bg-color);
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }
  }

  :deep(.el-textarea__inner) {
    background-color: var(--el-fill-color-blank);
    border-color: var(--el-border-color-darker);
    color: var(--el-text-color-primary);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-border-color);
    }

    &:focus {
      background-color: var(--el-bg-color);
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }
  }

  :deep(.el-switch) {
    &.is-checked {
      .el-switch__core {
        background-color: var(--el-color-primary);
      }
    }
  }
}
</style>

<style lang="scss">
// 引入文章内容基础样式
@use "@/style/article-content-base.scss" as *;

// 关于页编辑器容器 - 应用与文章编辑器相同的样式
.about-editor-container {
  .markdown-editor-wrapper {
    .md-editor-container {
      height: 100%;

      // 应用所有文章内容基础样式
      @include article-content-base;
    }

    .md-editor-fullscreen {
      z-index: 2100;
    }
  }
}
</style>
