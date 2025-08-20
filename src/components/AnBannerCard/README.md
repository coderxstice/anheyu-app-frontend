# AnBannerCard 横幅卡片组件

一个简化的横幅卡片组件，专注于文字内容展示，支持背景图片。

## 特性

- 🎨 简洁的文字内容展示
- 🖼️ 支持自定义背景图片
- 📱 响应式设计
- ✨ 平滑的动画效果和悬停状态
- 🎭 可自定义高度和圆角

## 基本用法

```vue
<template>
  <AnBannerCard
    tips="好物"
    title="实物装备推荐"
    description="跟 安知鱼 一起享受科技带来的乐趣"
    :background-image="imageUrl"
    :height="200"
  />
</template>

<script setup>
import AnBannerCard from '@/components/AnBannerCard';

const imageUrl = 'https://example.com/image.jpg';
</script>
```

## Props

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| tips | string | '好物' | 提示文字 |
| title | string | '实物装备推荐' | 主标题 |
| description | string | '跟 安知鱼 一起享受科技带来的乐趣' | 描述文字 |
| backgroundImage | string | - | 背景图片URL |
| height | string \| number | 200 | 组件高度 |
| rounded | boolean | true | 是否显示圆角 |

## 样式特点

- 背景图片支持 `left 37%/cover no-repeat` 定位
- 白色文字，带有半透明黑色遮罩
- 悬停时有阴影和上移动画效果
- 响应式设计，移动端字体大小自适应

## 响应式设计

- 桌面端：标准字体大小和间距
- 移动端：减小字体大小和间距

## 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
