export interface BannerCardProps {
  /** 提示文字 */
  tips?: string;
  /** 标题 */
  title?: string;
  /** 描述文字 */
  description?: string;
  /** 背景图片URL */
  backgroundImage?: string;
  /** 组件高度 */
  height?: string | number;
  /** 是否圆角 */
  rounded?: boolean;
}
