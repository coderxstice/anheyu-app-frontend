<p align="center">
  <a href="https://github.com/anzhiyu-c/anheyu-app" target="_blank" title="访问项目仓库">
    <img src="https://upload-bbs.miyoushe.com/upload/2025/08/27/125766904/445bc304fe1a5edf8c0250beac0731b5_953439680145318785.png" height="400" width="600" alt="Logo" />
  </a>
</p>

<p align="center"><strong>安和鱼应用 - 前端项目</strong></p>

<p align="center">
  <a title="Vue Version" target="_blank" href="https://vuejs.org/"><img alt="Vue Version" src="https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat&logo=vue.js"></a>
  <a title="TypeScript" target="_blank" href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript"></a>
  <a title="Vite" target="_blank" href="https://vitejs.dev/"><img alt="Vite" src="https://img.shields.io/badge/Vite-5.x-646CFF?style=flat&logo=vite"></a>
  <a title="Element Plus" target="_blank" href="https://element-plus.org/"><img alt="Element Plus" src="https://img.shields.io/badge/Element%20Plus-2.x-409EFF?style=flat"></a>
  <br>
  <a title="Node.js Version" target="_blank" href="https://nodejs.org/"><img alt="Node Version" src="https://img.shields.io/badge/Node-%3E%3D%2020.19.4-yellowgreen?style=flat"></a>
  <a title="License" target="_blank" href="https://github.com/anzhiyu-c/anheyu-app/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/anzhiyu-c/anheyu-app.svg?style=flat"></a>
</p>

这是 [Anheyu](https://github.com/anzhiyu-c/anheyu-app) 内容管理平台的前端项目，基于 **Vue3 + TypeScript** 构建的现代化单页应用程序。

## 🚀 快速开始

### 环境要求

- Node.js >= 20.19.4
- pnpm >= 8.x（推荐）或 npm/yarn

### 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 开发环境

```bash
# 启动开发服务器
pnpm dev

# 或使用 npm
npm run dev
```

访问 http://localhost:5173 查看应用。

### 构建部署

```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

## ✨ 主要功能

### 🎨 用户界面

- ✅ 现代化的响应式设计
- ✅ 暗色/亮色主题切换
- ✅ 沉浸式状态栏体验
- ✅ 定制化主色调随封面图片变化
- ✅ 优秀的右键菜单交互
- ✅ 全局中控台支持

### 📝 内容管理

- ✅ 强大的 Markdown 编辑器
- ✅ 富文本实时预览
- ✅ 支持 LaTeX 数学公式
- ✅ 支持 Mermaid 流程图
- ✅ 支持脚注语法
- ✅ 代码高亮显示

### 🖼️ 媒体处理

- ✅ 图片上传与管理
- ✅ 图片懒加载优化
- ✅ 大图查看功能
- ✅ 自动缩略图生成
- ✅ 相册集展示

### 🎯 用户体验

- ✅ 页面组件懒加载
- ✅ 渐进式 Web 应用 (PWA)
- ✅ 高速缓存策略
- ✅ 快捷键操作支持
- ✅ 搜索引擎优化 (SEO)

### 📊 数据展示

- ✅ 访客统计可视化
- ✅ 访客趋势分析
- ✅ 设备和浏览器统计
- ✅ 来源分析图表

## 🏗️ 技术架构

### 核心技术栈

- **Vue 3** - 采用 Composition API 的现代前端框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 极速的构建工具和开发服务器
- **Element Plus** - 基于 Vue 3 的组件库

### 状态管理

- **Pinia** - Vue 3 官方推荐的状态管理库

### 路由管理

- **Vue Router 4** - Vue 3 的官方路由

### CSS 预处理器

- **SCSS/SASS** - 功能强大的 CSS 扩展语言

### 工程化工具

- **ESLint** - JavaScript 代码检查工具
- **Prettier** - 代码格式化工具
- **Stylelint** - CSS 代码检查工具
- **Commitlint** - Git 提交消息规范检查

### 打包优化

- **代码分割** - 按需加载优化
- **Tree Shaking** - 移除未使用的代码
- **资源压缩** - Gzip/Brotli 压缩支持
- **CDN 优化** - 静态资源 CDN 加速

## 📁 项目结构

```
src/
├── assets/          # 静态资源
├── components/      # 通用组件
├── composables/     # 组合式函数
├── layouts/         # 布局组件
├── pages/          # 页面组件
├── plugins/        # 插件配置
├── router/         # 路由配置
├── stores/         # 状态管理
├── styles/         # 全局样式
├── types/          # TypeScript 类型定义
├── utils/          # 工具函数
└── views/          # 视图页面
```

## 🛠️ 开发指南

### 代码规范

项目采用严格的代码规范，包括：

- ESLint + Vue3 规则
- Prettier 格式化
- Stylelint CSS 规范
- TypeScript 严格模式

### 提交规范

使用 Conventional Commits 规范：

```
feat: 添加新功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建或辅助工具变动
```

### 组件开发

- 使用 Composition API
- TypeScript 类型定义
- 组件文档注释
- Props 验证

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

> **注意事项**  
> 在提交 Pull Request 之前，请确保所有测试都通过，并遵循项目的代码规范。

## 👨‍💻 贡献者

[![contributors](https://opencollective.com/anheyu-app-frontend/contributors.svg?width=890&button=false)](https://github.com/anzhiyu-c/anheyu-app-frontend)

**[安知鱼](https://github.com/anzhiyu-c)** - 项目维护者

**[张洪 Heo](https://github.com/zhheo)** - UI/UX

## 📄 许可证

本项目采用 [GPL-3.0 license](https://github.com/anzhiyu-c/anheyu-app?tab=GPL-3.0-1-ov-file#readme) 许可证。

## 🔗 相关链接

- [主项目仓库](https://github.com/anzhiyu-c/anheyu-app)
- [在线预览](https://anheyu.com/)
- [文档站点](https://anheyu.com/posts/Z3MC)
- [QQ 交流群](https://jq.qq.com/?_wv=1027&k=v7NK7ELr)

## 仓库统计

![仓库统计](https://repobeats.axiom.co/api/embed/73ae8a67dd8979e96635df37e0c6901b16a9b19b.svg "Repobeats analytics image")
