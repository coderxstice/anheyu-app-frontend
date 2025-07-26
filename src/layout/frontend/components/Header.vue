<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-26 02:11:44
 * @LastEditTime: 2025-07-26 12:30:39
 * @LastEditors: 安知鱼
-->
<!-- src/layout/frontend/components/Header.vue -->
<template>
  <header class="frontend-header">
    <div class="header-content">
      <a href="/" class="logo">猫鱼的小站</a>
      <nav>
        <router-link to="/">首页</router-link>
        <router-link to="/album">相册</router-link>
        <!-- 其他导航链接 -->
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
// 这里可以添加 Header 相关的逻辑，目前是纯静态的
</script>

<style scoped>
.frontend-header {
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0 40px;
  height: 60px;
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  text-decoration: none;
}

nav a {
  margin-left: 20px;
  font-size: 16px;
  color: #555;
  text-decoration: none;
  padding-bottom: 5px;
  border-bottom: 2px solid transparent;
  transition:
    color 0.3s,
    border-color 0.3s;
}

nav a:hover,
nav a.router-link-active {
  color: #007bff;
  border-bottom-color: #007bff;
}
</style>
