<!--
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-08-20 14:51:39
 * @LastEditTime: 2025-08-20 14:57:31
 * @LastEditors: 安知鱼
-->
<script setup lang="ts">
defineOptions({
  name: "AuthorPageContent"
});
</script>

<template>
  <div class="author-page-content">
    <div class="author-content">
      <div class="author-content-item myInfoAndSayHello">
        <div class="title1">你好，很高兴认识你👋</div>
        <div class="title2">我叫 <span class="inline-word">张洪Heo</span></div>
        <div class="title1">
          是一名 设计师、产品经理、独立开发者、<span class="inline-word"
            >博主</span
          >
        </div>
      </div>
      <div class="aboutsiteTips author-content-item">
        <div class="author-content-item-tips">追求</div>
        <h2>
          源于<br />
          热爱而去<span class="inline-word">创造</span>
          <div class="mask">
            <span class="first-tips">产品</span><span data-up="">设计</span
            ><span data-show="">程序</span><span>体验</span>
          </div>
        </h2>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.author-page-content {
  width: 100%;
}

.author-content-item {
  border-radius: 12px;
  background: var(--heo-card-bg);
  border: var(--style-border-always);
  box-shadow: var(--heo-shadow-border);
  position: relative;
  padding: 1rem 2rem;
  overflow: hidden;
  flex: 1;
}

.author-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
  gap: 0.625rem;
}

.myInfoAndSayHello {
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: var(--anzhiyu-white);
  background: linear-gradient(120deg, #5b27ff 0, #00d4ff 100%);
  background-size: 200%;
  min-height: 200px;
  flex: 4;
  .title1 {
    opacity: 0.8;
    line-height: 1.3;
  }
  .title2 {
    font-size: 36px;
    font-weight: 700;
    line-height: 1.1;
    margin: 0.625rem 0;
  }
}

.author-content-item.aboutsiteTips {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  flex-direction: column;
  flex: 3;
  h2 {
    margin-right: auto;
    font-size: 36px;
    font-family: Helvetica;
    line-height: 1.06;
    letter-spacing: -0.02em;
    color: var(--heo-fontcolor);
    margin-top: 0;
  }
  .mask {
    height: 36px;
    position: relative;
    overflow: hidden;
    margin-top: 4px;
    span:nth-child(1) {
      background-image: linear-gradient(45deg, #0ecffe 50%, #07a6f1);
    }

    span:nth-child(2) {
      background-image: linear-gradient(45deg, #18e198 50%, #0ec15d);
    }
  }
}

.author-content-item-tips {
  opacity: 0.8;
  font-size: 0.6rem;
  margin-bottom: 0.5rem;
}

.author-content-item {
  animation: slide-in 0.6s 0s backwards;
}

.inline-word {
  word-break: keep-all;
  white-space: nowrap;
}
</style>
