<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-25 18:52:39
 * @LastEditTime: 2025-07-25 18:52:45
 * @LastEditors: 安知鱼
-->
<template>
  <div class="frontend-layout">
    <header class="frontend-header">
      <!-- 这里可以放置你的 Logo、导航链接等 -->
      <div class="header-content">
        <a href="/" class="logo">猫鱼的小站</a>
        <nav>
          <router-link to="/">首页</router-link>
          <router-link to="/album">相册</router-link>
          <!-- 其他导航链接 -->
        </nav>
      </div>
    </header>

    <main class="frontend-main">
      <!-- 子路由（文章首页、文章详情等）将在这里渲染 -->
      <router-view />
    </main>

    <footer class="frontend-footer">
      <!-- 这里是你的页脚信息 -->
      <p>&copy; 2024 猫鱼. All Rights Reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// 引入样式文件
import "./style.css";
</script>
