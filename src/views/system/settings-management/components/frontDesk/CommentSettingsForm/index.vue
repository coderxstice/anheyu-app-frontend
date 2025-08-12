<script setup lang="ts">
import type { CommentSettingsInfo } from "../../../type";

defineOptions({
  name: "CommentSettingsForm"
});
const model = defineModel<CommentSettingsInfo>({ required: true });
</script>

<template>
  <div>
    <el-divider content-position="left">基础设置</el-divider>
    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="启用登录后评论">
          <el-switch v-model="model.loginRequired" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="显示评论者UA">
          <el-switch v-model="model.showUA" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="显示评论者归属地">
          <el-switch v-model="model.showRegion" />
        </el-form-item>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="评论每页数量">
          <el-input-number v-model="model.pageSize" :min="1" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="博主标识(Master Tag)">
          <el-input v-model="model.masterTag" placeholder="例如：博主" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="博主邮箱 (用于身份识别)">
          <el-input v-model="model.bloggerEmail" placeholder="输入博主邮箱" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="表情 CDN 链接 (.json)">
          <el-input v-model="model.emojiCDN" placeholder="输入表情包json链接" />
        </el-form-item>
      </el-col>
    </el-row>
    <el-form-item label="评论框占位文字">
      <el-input
        v-model="model.placeholder"
        type="textarea"
        :rows="2"
        placeholder="例如：欢迎留下宝贵的建议啦～"
      />
    </el-form-item>

    <el-divider content-position="left">安全与限制</el-divider>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="单IP每分钟评论数限制">
          <el-input-number v-model="model.limitPerMinute" :min="0" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="单条评论最大字数">
          <el-input-number v-model="model.limitLength" :min="0" />
        </el-form-item>
      </el-col>
    </el-row>
    <el-form-item label="违禁词列表 (逗号分隔，匹配到的评论将进入待审)">
      <el-input
        v-model="model.forbiddenWords"
        type="textarea"
        :rows="3"
        placeholder="例如：违禁词1,违禁词2"
      />
    </el-form-item>

    <el-divider content-position="left">邮件通知</el-divider>
    <el-form-item label="收到垃圾评论时通知博主">
      <el-switch v-model="model.notifySpam" />
    </el-form-item>
    <el-form-item label="用户收到回复的邮件标题">
      <el-input v-model="model.mailSubject" />
    </el-form-item>
    <el-form-item label="用户收到回复的邮件模板 (支持HTML)">
      <el-input v-model="model.mailTemplate" type="textarea" :rows="4" />
      <div class="template-hint">
        可用变量: $\{POST_TITLE}, $\{NICK}, $\{COMMENT}, $\{POST_URL}
      </div>
    </el-form-item>
    <el-form-item label="博主收到新评论的邮件标题">
      <el-input v-model="model.mailSubjectAdmin" />
    </el-form-item>
    <el-form-item label="博主收到新评论的邮件模板 (支持HTML)">
      <el-input v-model="model.mailTemplateAdmin" type="textarea" :rows="4" />
      <div class="template-hint">
        可用变量: $\{POST_TITLE}, $\{NICK}, $\{COMMENT}, $\{MANAGE_URL}
      </div>
    </el-form-item>
  </div>
</template>

<style scoped>
.template-hint {
  font-size: 12px;
  color: #999;
  line-height: 1.5;
  margin-top: 4px;
}
</style>
