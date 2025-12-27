<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-02 18:04:48
 * @LastEditTime: 2025-12-27 16:57:21
 * @LastEditors: 安知鱼
-->
<template>
  <el-divider content-position="left">
    <h3>文章配置</h3>
  </el-divider>

  <el-form-item label="默认cover图片">
    <el-input
      v-model="formData.default.defaultCover"
      placeholder="请输入默认cover图片地址"
    />
    <div class="form-item-help">
      用于文章未填写cover或者cover图片加载失败时的默认图片。
    </div>
  </el-form-item>

  <el-form-item label="默认双栏样式">
    <el-switch
      v-model="formData.default.doubleColumn"
      placeholder="例如：true"
    />
  </el-form-item>

  <el-form-item label="文章过期时间">
    <div>
      <el-input-number
        v-model="formData.expirationTime"
        :min="0"
        controls-position="right"
        style="width: 100%"
        placeholder="例如: 365"
        :style="{ width: '130px' }"
        :value-on-clear="null"
      />
      <div class="form-item-help">
        文章过期时间，单位为天。<br />
        <strong>不填则没有过期时间组件展示。</strong>
      </div>
    </div>
  </el-form-item>

  <el-form-item label="文章列表分页大小">
    <el-input-number
      v-model="formData.default.pageSize"
      :min="6"
      controls-position="right"
      style="width: 100%"
      placeholder="例如: 10"
      :style="{ width: '100px' }"
    />
  </el-form-item>

  <el-form-item label="404 页面默认图片">
    <el-input
      :model-value="formData.page404?.defaultImage || ''"
      placeholder="请输入 404 页面默认图片地址"
      @update:model-value="
        val => {
          if (!formData.page404) {
            formData.page404 = { defaultImage: '' };
          }
          formData.page404.defaultImage = val;
        }
      "
    />
    <div class="form-item-help">
      用于 404 错误页面和自定义页面的背景图片，默认为
      /static/img/background-effect.gif
    </div>
  </el-form-item>

  <el-form-item label="IP属地查询 API 地址">
    <el-input
      v-model="formData.ipApi"
      placeholder="例如：https://v1.nsuuu.com/api/ipip"
    />
    <div class="form-item-help">
      用于在发布/更新文章时获取IP属地信息的 API 地址。
    </div>
  </el-form-item>

  <el-form-item label="IP属地查询 API Token">
    <el-input
      v-model="formData.ipApiToken"
      placeholder="请输入IP属地查询 API Token"
      show-password
    />
    <div class="form-item-help">
      配合 IP 属地查询 API 使用的 Token (如有)。
      <br />
      <strong
        >注意：当 API 地址和 Token 均被配置时，发布和更新文章才会调用此 API
        来获取城市信息。</strong
      >
    </div>
  </el-form-item>

  <el-form-item label="是否开启文章打赏功能">
    <el-switch v-model="formData.reward.enable" placeholder="例如：true" />
  </el-form-item>

  <el-form-item label="开启微信打赏">
    <div>
      <el-switch
        v-model="formData.reward.weChatEnable"
        :disabled="!formData.reward.enable"
      />
      <div class="form-item-help">单独控制是否显示微信打赏方式。</div>
    </div>
  </el-form-item>

  <el-form-item label="文章打赏微信二维码图片">
    <el-input
      v-model="formData.reward.weChat"
      :disabled="!formData.reward.enable || !formData.reward.weChatEnable"
      placeholder="请输入文章打赏微信二维码图片链接地址"
    />
  </el-form-item>

  <el-form-item label="微信标签文案">
    <el-input
      v-model="formData.reward.weChatLabel"
      :disabled="!formData.reward.enable || !formData.reward.weChatEnable"
      placeholder="例如：微信"
    />
    <div class="form-item-help">微信二维码下方的标签文案，默认为"微信"。</div>
  </el-form-item>

  <el-form-item label="开启支付宝打赏">
    <div>
      <el-switch
        v-model="formData.reward.aliPayEnable"
        :disabled="!formData.reward.enable"
      />
      <div class="form-item-help">单独控制是否显示支付宝打赏方式。</div>
    </div>
  </el-form-item>

  <el-form-item label="文章打赏支付宝二维码图片">
    <el-input
      v-model="formData.reward.aliPay"
      :disabled="!formData.reward.enable || !formData.reward.aliPayEnable"
      placeholder="请输入文章打赏支付宝二维码图片链接地址"
    />
  </el-form-item>

  <el-form-item label="支付宝标签文案">
    <el-input
      v-model="formData.reward.aliPayLabel"
      :disabled="!formData.reward.enable || !formData.reward.aliPayEnable"
      placeholder="例如：支付宝"
    />
    <div class="form-item-help">
      支付宝二维码下方的标签文案，默认为"支付宝"。
    </div>
  </el-form-item>

  <el-form-item label="打赏按钮文案">
    <el-input
      v-model="formData.reward.buttonText"
      :disabled="!formData.reward.enable"
      placeholder="例如：打赏作者"
    />
    <div class="form-item-help">文章底部打赏按钮的文案，默认为"打赏作者"。</div>
  </el-form-item>

  <el-form-item label="打赏弹窗标题">
    <el-input
      v-model="formData.reward.title"
      :disabled="!formData.reward.enable"
      placeholder="例如：感谢你赐予我前进的力量"
    />
    <div class="form-item-help">
      打赏弹窗顶部的标题文案，默认为"感谢你赐予我前进的力量"。
    </div>
  </el-form-item>

  <el-form-item label="打赏者名单按钮文案">
    <el-input
      v-model="formData.reward.listButtonText"
      :disabled="!formData.reward.enable"
      placeholder="例如：打赏者名单"
    />
    <div class="form-item-help">
      打赏弹窗底部按钮的文案，默认为"打赏者名单"。
    </div>
  </el-form-item>

  <el-form-item label="打赏者名单按钮描述">
    <el-input
      v-model="formData.reward.listButtonDesc"
      :disabled="!formData.reward.enable"
      placeholder="例如：因为你们的支持让我意识到写文章的价值"
    />
    <div class="form-item-help">
      打赏弹窗底部按钮的描述文案，默认为"因为你们的支持让我意识到写文章的价值"。
    </div>
  </el-form-item>

  <el-form-item label="代码块最大行数">
    <div>
      <el-input-number
        v-model="formData.codeBlock.codeMaxLines"
        :min="1"
        :max="1000"
        controls-position="right"
        style="width: 100px"
        placeholder="例如: 50"
      />
      <div class="form-item-help">
        代码块超过此行数时将显示滚动条，默认为10行。此处为约数，不是准确行数，可以适当上下调整。
      </div>
    </div>
  </el-form-item>

  <el-form-item label="显示文章波浪区域">
    <div>
      <el-switch
        :model-value="formData.waves?.enable ?? true"
        @update:model-value="
          (val: boolean) => {
            if (!formData.waves) {
              formData.waves = { enable: true };
            }
            formData.waves.enable = val;
          }
        "
      />
      <div class="form-item-help">
        控制文章详情页顶部的波浪装饰区域是否显示。关闭后将隐藏文章头部下方的波浪动画效果。
      </div>
    </div>
  </el-form-item>

  <el-divider content-position="left">
    <h3>文章复制版权配置</h3>
  </el-divider>

  <el-form-item label="允许复制文章内容">
    <div>
      <el-switch
        :model-value="formData.copy?.enable ?? true"
        @update:model-value="
          (val: boolean) => {
            if (!formData.copy) {
              formData.copy = {
                enable: true,
                copyrightEnable: false,
                copyrightOriginal: '',
                copyrightReprint: ''
              };
            }
            formData.copy.enable = val;
          }
        "
      />
      <div class="form-item-help">
        是否允许访客复制文章内容。关闭后，访客将无法选择、复制文章内容，也无法通过右键菜单或快捷键复制。
      </div>
    </div>
  </el-form-item>

  <el-form-item label="复制时携带版权信息">
    <div>
      <el-switch
        :model-value="formData.copy?.copyrightEnable ?? false"
        :disabled="!(formData.copy?.enable ?? true)"
        @update:model-value="
          (val: boolean) => {
            if (!formData.copy) {
              formData.copy = {
                enable: true,
                copyrightEnable: false,
                copyrightOriginal: '',
                copyrightReprint: ''
              };
            }
            formData.copy.copyrightEnable = val;
          }
        "
      />
      <div class="form-item-help">
        启用后，访客复制文章内容时会自动追加版权信息。
      </div>
    </div>
  </el-form-item>

  <el-form-item label="原创文章版权模板">
    <el-input
      v-model="formData.copy.copyrightOriginal"
      type="textarea"
      :rows="3"
      :disabled="
        !(formData.copy?.enable ?? true) ||
        !(formData.copy?.copyrightEnable ?? false)
      "
      placeholder="本文来自 {siteName}，作者 {author}，转载请注明出处。\n原文地址：{url}"
    />
    <div class="form-item-help">
      原创文章复制时追加的版权信息模板。<br />
      支持变量：<code>{siteName}</code> 站点名称、<code>{author}</code>
      作者名称、<code>{url}</code> 当前文章链接
    </div>
  </el-form-item>

  <el-form-item label="转载文章版权模板">
    <el-input
      v-model="formData.copy.copyrightReprint"
      type="textarea"
      :rows="3"
      :disabled="
        !(formData.copy?.enable ?? true) ||
        !(formData.copy?.copyrightEnable ?? false)
      "
      placeholder="本文转载自 {originalAuthor}，原文地址：{originalUrl}\n当前页面：{currentUrl}"
    />
    <div class="form-item-help">
      转载文章复制时追加的版权信息模板。<br />
      支持变量：<code>{originalAuthor}</code> 原作者、<code>{originalUrl}</code>
      原文链接、<code>{currentUrl}</code> 当前页面链接
    </div>
  </el-form-item>

  <el-divider content-position="left">
    <h3>目录配置</h3>
  </el-divider>

  <el-form-item label="目录滚动Hash更新模式">
    <div>
      <el-select
        :model-value="formData.toc?.hashUpdateMode ?? 'replace'"
        placeholder="请选择Hash更新模式"
        style="width: 200px"
        @update:model-value="
          (val: string) => {
            if (!formData.toc) {
              formData.toc = { hashUpdateMode: 'replace' };
            }
            formData.toc.hashUpdateMode = val;
          }
        "
      >
        <el-option label="替换（不产生历史记录）" value="replace" />
        <el-option label="不更新（URL保持不变）" value="none" />
      </el-select>
      <div class="form-item-help">
        控制阅读文章时，目录滚动导致的URL Hash变化行为。<br />
        <strong>替换模式</strong>：使用 history.replaceState
        更新Hash，浏览器后退不会逐个回退Hash。<br />
        <strong>不更新模式</strong
        >：滚动时不自动更新URL中的Hash，避免产生任何历史记录。
      </div>
    </div>
  </el-form-item>

  <el-divider content-position="left">
    <h3>CDN 缓存刷新配置</h3>
  </el-divider>

  <el-form-item label="启用 CDN 缓存刷新">
    <div>
      <el-switch v-model="formData.cdn.enable" placeholder="例如：true" />
      <div class="form-item-help">
        启用后，文章更新或相关配置修改时会自动清除 CDN
        缓存，确保用户看到最新内容。
      </div>
    </div>
  </el-form-item>

  <el-form-item label="CDN 提供商">
    <div>
      <el-select
        v-model="formData.cdn.provider"
        placeholder="请选择 CDN 提供商"
        style="width: 200px"
      >
        <el-option label="腾讯云 CDN" value="tencent" />
        <el-option label="EdgeOne" value="edgeone" />
        <el-option label="阿里云 ESA" value="aliyun-esa" />
      </el-select>
      <div class="form-item-help">
        选择您使用的 CDN 服务提供商。目前支持腾讯云 CDN、EdgeOne 和阿里云 ESA。
      </div>
    </div>
  </el-form-item>

  <el-form-item
    :label="
      formData.cdn.provider === 'aliyun-esa'
        ? 'AccessKey ID'
        : '腾讯云 API 密钥 ID'
    "
  >
    <el-input
      v-model="formData.cdn.secretID"
      :placeholder="
        formData.cdn.provider === 'aliyun-esa'
          ? '请输入 AccessKey ID'
          : '请输入 SecretId'
      "
      show-password
    />
    <div class="form-item-help">
      <template v-if="formData.cdn.provider === 'aliyun-esa'">
        阿里云 API 密钥的 AccessKey ID。<br />
        <strong> 可在阿里云控制台的"AccessKey 管理"中创建和获取。 </strong>
      </template>
      <template v-else>
        腾讯云 API 密钥的 SecretId。<br />
        <strong>
          可在腾讯云控制台的"访问管理 > 访问密钥 > API密钥管理"中获取。
        </strong>
      </template>
    </div>
  </el-form-item>

  <el-form-item
    :label="
      formData.cdn.provider === 'aliyun-esa'
        ? 'AccessKey Secret'
        : '腾讯云 API 密钥 Key'
    "
  >
    <el-input
      v-model="formData.cdn.secretKey"
      :placeholder="
        formData.cdn.provider === 'aliyun-esa'
          ? '请输入 AccessKey Secret'
          : '请输入 SecretKey'
      "
      show-password
    />
    <div class="form-item-help">
      <template v-if="formData.cdn.provider === 'aliyun-esa'">
        阿里云 API 密钥的 AccessKey Secret。<br />
      </template>
      <template v-else> 腾讯云 API 密钥的 SecretKey。<br /> </template>
      <strong>请妥善保管，不要泄露给他人。</strong>
    </div>
  </el-form-item>

  <el-form-item
    v-if="formData.cdn.provider !== 'aliyun-esa'"
    label="腾讯云地域"
  >
    <el-input v-model="formData.cdn.region" placeholder="例如：ap-beijing" />
    <div class="form-item-help">
      腾讯云服务地域标识。<br />
      常用地域：ap-beijing（北京）、ap-shanghai（上海）、ap-guangzhou（广州）、ap-singapore（新加坡）。<br />
      <strong>EdgeOne 默认使用 ap-singapore。</strong>
    </div>
  </el-form-item>

  <el-form-item v-if="formData.cdn.provider === 'tencent'" label="CDN 加速域名">
    <el-input
      v-model="formData.cdn.domain"
      placeholder="例如：blog.example.com"
    />
    <div class="form-item-help">
      腾讯云 CDN 的加速域名（不含 http:// 或 https://）。<br />
      <strong>仅腾讯云 CDN 需要配置此项。</strong>
    </div>
  </el-form-item>

  <el-form-item
    v-if="formData.cdn.provider === 'edgeone'"
    label="EdgeOne 站点 ID"
  >
    <el-input
      v-model="formData.cdn.zoneID"
      placeholder="例如：zone-xxxxxxxxxxxx"
    />
    <div class="form-item-help">
      EdgeOne 站点的 Zone ID。<br />
      可在 EdgeOne 控制台的"站点列表"中查看。<br />
      <strong>仅 EdgeOne 需要配置此项。</strong>
    </div>
  </el-form-item>

  <el-form-item
    v-if="formData.cdn.provider === 'aliyun-esa'"
    label="阿里云 ESA 站点 ID"
  >
    <el-input v-model="formData.cdn.zoneID" placeholder="例如：123456789" />
    <div class="form-item-help">
      阿里云 ESA 的站点 ID（Site ID）。<br />
      可在阿里云 ESA 控制台的"站点管理"中查看。<br />
      <strong>仅阿里云 ESA 需要配置此项。</strong>
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PostSettingsInfo } from "../../type";
const props = defineProps<{
  modelValue: PostSettingsInfo;
}>();

const emit = defineEmits(["update:modelValue"]);

const formData = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
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

  strong {
    color: var(--anzhiyu-yellow);
    font-weight: 600;
  }
}

.el-divider {
  margin: 40px 0 28px;

  h3 {
    margin: 0;
    color: var(--anzhiyu-fontcolor);
  }

  :deep(.el-divider__text) {
    background-color: var(--anzhiyu-background);
  }
}

// 暗色模式下的输入框优化
@media (prefers-color-scheme: dark) {
  :deep(.el-input__wrapper) {
    background-color: var(--anzhiyu-card-bg);
    border-color: var(--el-border-color-darker);

    &:hover {
      border-color: var(--anzhiyu-card-border);
    }

    &.is-focus {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--anzhiyu-theme);
      box-shadow: 0 0 0 1px var(--anzhiyu-theme) inset;
    }
  }

  :deep(.el-textarea__inner) {
    background-color: var(--anzhiyu-card-bg);
    border-color: var(--el-border-color-darker);
    color: var(--anzhiyu-fontcolor);

    &:hover {
      border-color: var(--anzhiyu-card-border);
    }

    &:focus {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--anzhiyu-theme);
      box-shadow: 0 0 0 1px var(--anzhiyu-theme) inset;
    }
  }

  :deep(.el-input-number) {
    .el-input__wrapper {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--el-border-color-darker);

      &:hover {
        border-color: var(--anzhiyu-card-border);
      }

      &.is-focus {
        background-color: var(--anzhiyu-card-bg);
        border-color: var(--anzhiyu-theme);
      }
    }
  }

  :deep(.el-select) {
    .el-input__wrapper {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--el-border-color-darker);

      &:hover {
        border-color: var(--anzhiyu-card-border);
      }

      &.is-focus {
        background-color: var(--anzhiyu-card-bg);
        border-color: var(--anzhiyu-theme);
      }
    }
  }
}

// 手动切换暗色模式支持
html.dark {
  :deep(.el-input__wrapper) {
    background-color: var(--anzhiyu-card-bg);
    border-color: var(--el-border-color-darker);

    &:hover {
      border-color: var(--anzhiyu-card-border);
    }

    &.is-focus {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--anzhiyu-theme);
      box-shadow: 0 0 0 1px var(--anzhiyu-theme) inset;
    }
  }

  :deep(.el-textarea__inner) {
    background-color: var(--anzhiyu-card-bg);
    border-color: var(--el-border-color-darker);
    color: var(--anzhiyu-fontcolor);

    &:hover {
      border-color: var(--anzhiyu-card-border);
    }

    &:focus {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--anzhiyu-theme);
      box-shadow: 0 0 0 1px var(--anzhiyu-theme) inset;
    }
  }

  :deep(.el-input-number) {
    .el-input__wrapper {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--el-border-color-darker);

      &:hover {
        border-color: var(--anzhiyu-card-border);
      }

      &.is-focus {
        background-color: var(--anzhiyu-card-bg);
        border-color: var(--anzhiyu-theme);
      }
    }
  }

  :deep(.el-select) {
    .el-input__wrapper {
      background-color: var(--anzhiyu-card-bg);
      border-color: var(--el-border-color-darker);

      &:hover {
        border-color: var(--anzhiyu-card-border);
      }

      &.is-focus {
        background-color: var(--anzhiyu-card-bg);
        border-color: var(--anzhiyu-theme);
      }
    }
  }
}
</style>
