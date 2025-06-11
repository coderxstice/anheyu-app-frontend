/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-04-11 15:37:44
 * @LastEditTime: 2025-04-11 17:03:57
 * @LastEditors: 安知鱼
 */
import { reactive } from "vue";
import type { FormRules } from "element-plus";

/** 自定义表单规则校验 */
export const formRules = reactive(<FormRules>{
  imageUrl: [
    { required: true, message: "壁纸图链接为必填项", trigger: "blur" },
    {
      pattern: /^(https?|http):\/\/[^\s/$.?#].[^\s]*$/i,
      message: "请输入有效的链接地址",
      trigger: ["blur", "change"]
    }
  ],
  bigImageUrl: [
    {
      pattern: /^(https?|http):\/\/[^\s/$.?#].[^\s]*$/i,
      message: "请输入有效的链接地址",
      trigger: ["blur", "change"]
    }
  ],
  downloadUrl: [
    {
      pattern: /^(https?|http):\/\/[^\s/$.?#].[^\s]*$/i,
      message: "请输入有效的链接地址",
      trigger: ["blur", "change"]
    }
  ]
});
