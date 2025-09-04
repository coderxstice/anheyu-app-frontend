<script setup lang="ts">
import type { CommentSettingsInfo } from "../../../type";
import { ElMessage } from "element-plus";
import { useClipboard } from "@vueuse/core";

defineOptions({
  name: "CommentSettingsForm"
});

const model = defineModel<CommentSettingsInfo>({ required: true });

const { copy } = useClipboard();
const handleCopy = (text: string) => {
  copy(text)
    .then(() => {
      ElMessage.success(`占位符 ${text} 已复制!`);
    })
    .catch(() => {
      ElMessage.error("复制失败");
    });
};

const tip = `https://api.day.app/YOUR_KEY/{{.TITLE}}/{{.BODY}}?isArchive=1&sound=health&icon={{.SITE_URL}}/favicon.ico&group={{.SITE_NAME}}&url={{.POST_URL}}`;
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

    <el-divider content-position="left">通知设置</el-divider>
    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="收到评论时通知博主">
          <el-switch v-model="model.notifyAdmin" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="开启评论回复通知功能">
          <el-switch v-model="model.notifyReply" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="同时通过邮件和IM通知">
          <el-switch v-model="model.scMailNotify" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-divider content-position="left">即时通知配置</el-divider>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="推送平台">
          <el-select
            v-model="model.pushooChannel"
            placeholder="选择推送平台"
            clearable
          >
            <el-option label="Bark" value="bark" />
            <el-option label="Webhook" value="webhook" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="推送URL">
          <el-input
            v-model="model.pushooURL"
            placeholder="例如：https://api.day.app/YOUR_KEY/{{.TITLE}}/{{.BODY}}?isArchive=1&sound=health&icon={{.SITE_URL}}/favicon.ico&group={{.SITE_NAME}}&url={{.POST_URL}}"
          />
        </el-form-item>
      </el-col>
    </el-row>
    <div class="pushoo-hint">
      <b>推送平台说明:</b>
      <ul>
        <li>
          <b>Bark:</b>
          iOS推送服务，URL格式(示例)：
          {{ tip }}
        </li>
        <li><b>Webhook:</b> 自定义Webhook，将发送JSON格式的POST请求</li>
      </ul>
      <p>
        <b>通知逻辑:</b>
        如果配置了即时通知但未开启"同时通过邮件和IM通知"，则只发送即时通知，不发送邮件
      </p>
    </div>
    <div class="template-hint">
      <b>可用占位符 (点击可复制):</b>
      <ul>
        <li @click="handleCopy('{{.TITLE}}')">
          <code v-pre>{{.TITLE}}</code
          >: 推送的默认标题
        </li>
        <li @click="handleCopy('{{.BODY}}')">
          <code v-pre>{{.BODY}}</code
          >: 推送的默认内容
        </li>
        <li @click="handleCopy('{{.SITE_NAME}}')">
          <code v-pre>{{.SITE_NAME}}</code
          >: 网站名称
        </li>
        <li @click="handleCopy('{{.POST_URL}}')">
          <code v-pre>{{.POST_URL}}</code
          >: 评论所在页面的链接
        </li>
        <li @click="handleCopy('{{.NICK}}')">
          <code v-pre>{{.NICK}}</code
          >: 新评论者的昵称
        </li>
        <li @click="handleCopy('{{.COMMENT}}')">
          <code v-pre>{{.COMMENT}}</code
          >: 新评论的内容 (纯文本)
        </li>
        <li @click="handleCopy('{{.PARENT_NICK}}')">
          <code v-pre>{{.PARENT_NICK}}</code
          >: 被回复者的昵称 (仅在回复时有效)
        </li>
        <li @click="handleCopy('{{.MAIL}}')">
          <code v-pre>{{.MAIL}}</code
          >: 新评论者的邮箱
        </li>
        <li @click="handleCopy('{{.IP}}')">
          <code v-pre>{{.IP}}</code
          >: 新评论者的IP地址
        </li>
        <li @click="handleCopy('{{.TIME}}')">
          <code v-pre>{{.TIME}}</code
          >: 评论发表时间
        </li>
      </ul>
    </div>

    <el-divider content-position="left">邮件模板设置</el-divider>
    <el-form-item label="用户收到回复的邮件主题">
      <el-input
        v-model="model.mailSubject"
        placeholder="您在 {{.SITE_NAME}} 上的评论有了新回复"
      />
    </el-form-item>
    <el-form-item label="用户收到回复的邮件内容模板 (支持HTML)">
      <el-input v-model="model.mailTemplate" type="textarea" :rows="5" />
      <div v-pre class="template-hint">
        <b>可用占位符:</b>
        <ul>
          <li>
            <code>{{.SITE_NAME}}</code
            >: 您的网站名称
          </li>
          <li>
            <code>{{.SITE_URL}}</code
            >: 您的网站地址
          </li>
          <li>
            <code>{{.POST_URL}}</code
            >: 评论所在的文章链接
          </li>
          <li>
            <code>{{.NICK}}</code
            >: 新评论者的昵称
          </li>
          <li>
            <code>{{.COMMENT}}</code
            >: 新评论的内容 (HTML格式)
          </li>
          <li>
            <code>{{.IMG}}</code
            >: 新评论者的Gravatar头像链接
          </li>
          <li>
            <code>{{.PARENT_NICK}}</code
            >: 被回复者的昵称
          </li>
          <li>
            <code>{{.PARENT_COMMENT}}</code
            >: 被回复的评论内容 (HTML格式)
          </li>
          <li>
            <code>{{.PARENT_IMG}}</code
            >: 被回复者的Gravatar头像链接
          </li>
        </ul>
      </div>
    </el-form-item>

    <el-form-item label="博主收到新评论的邮件主题">
      <el-input
        v-model="model.mailSubjectAdmin"
        placeholder="{{.SITE_NAME}} 上有来自 {{.NICK}} 的新评论"
      />
    </el-form-item>
    <el-form-item label="博主收到新评论的邮件内容模板 (支持HTML)">
      <el-input v-model="model.mailTemplateAdmin" type="textarea" :rows="5" />
      <div v-pre class="template-hint">
        <b>可用占位符:</b>
        <ul>
          <li>
            <code>{{.SITE_NAME}}</code
            >: 您的网站名称
          </li>
          <li>
            <code>{{.SITE_URL}}</code
            >: 您的网站地址
          </li>
          <li>
            <code>{{.POST_URL}}</code
            >: 评论所在的文章链接
          </li>
          <li>
            <code>{{.NICK}}</code
            >: 新评论者的昵称
          </li>
          <li>
            <code>{{.COMMENT}}</code
            >: 新评论的内容 (HTML格式)
          </li>
          <li>
            <code>{{.IMG}}</code
            >: 新评论者的Gravatar头像链接
          </li>
          <li>
            <code>{{.MAIL}}</code
            >: 新评论者的邮箱地址
          </li>
          <li>
            <code>{{.IP}}</code
            >: 新评论者的IP地址
          </li>
        </ul>
      </div>
    </el-form-item>
  </div>
</template>

<style scoped>
.template-hint {
  padding: 8px 16px;
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.template-hint b {
  font-weight: 600;
}

.template-hint ul {
  padding-left: 18px;
  margin: 6px 0 0;
  list-style-type: disc;
}

.template-hint li {
  margin-bottom: 5px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.template-hint li:hover {
  background-color: #ecf5ff;
  color: #409eff;
}

.template-hint code {
  padding: 2px 5px;
  margin-right: 8px;
  font-family: "Courier New", Courier, monospace;
  font-size: 12px;
  background-color: #e9e9eb;
  border-radius: 3px;
}

.pushoo-hint {
  padding: 12px 16px;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
  background-color: #f0f9ff;
  border: 1px solid #b3e5fc;
  border-radius: 4px;
}

.pushoo-hint b {
  font-weight: 600;
  color: #1976d2;
}

.pushoo-hint ul {
  padding-left: 18px;
  margin: 6px 0;
  list-style-type: disc;
}

.pushoo-hint li {
  margin-bottom: 4px;
}

.pushoo-hint p {
  margin: 8px 0 0;
  font-style: italic;
}
</style>
