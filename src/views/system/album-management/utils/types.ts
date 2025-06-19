/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-04-11 15:38:10
 * @LastEditTime: 2025-04-11 17:35:06
 * @LastEditors: 安知鱼
 */
interface FormItemProps {
  id: number;
  imageUrl: string;
  bigImageUrl: string;
  downloadUrl: string;
  thumbParam: string;
  bigParam: string;
  tags: Array<string>;
  viewCount: number;
  downloadCount: number;
}
interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
