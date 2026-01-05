import type { FormRules } from "element-plus";

export const qiniuKodoRules: FormRules = {
  bucket_name: [
    { required: true, message: "存储空间名称不能为空", trigger: "blur" }
  ],
  access_key: [
    { required: true, message: "AccessKey 不能为空", trigger: "blur" }
  ],
  secret_key: [
    { required: true, message: "SecretKey 不能为空", trigger: "blur" }
  ],
  virtual_path: [
    { required: true, message: "应用内挂载路径不能为空", trigger: "blur" }
  ],
  "settings.cdn_domain": [
    { required: true, message: "访问域名不能为空", trigger: "blur" },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value) {
          // 验证是否为完整的URL格式或域名格式
          try {
            // 如果没有协议，添加 https:// 前缀进行验证
            const urlToValidate = value.startsWith("http")
              ? value
              : `https://${value}`;
            const url = new URL(urlToValidate);
            if (!url.hostname) {
              callback(new Error("访问域名格式不正确"));
              return;
            }
            callback();
          } catch {
            callback(new Error("访问域名格式不正确，请输入有效的域名或URL"));
          }
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
};
