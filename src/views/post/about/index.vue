<script setup lang="ts">
import AuthorPageContent from "./components/AuthorPageContent.vue";
defineOptions({
  name: "PostAbout"
});
</script>

<template>
  <div class="about-container">
    <div class="author-box">
      <div class="author-tag-left">
        <span class="author-tag">🤖️ 数码科技爱好者</span
        ><span class="author-tag">🔍 分享与热心帮助</span
        ><span class="author-tag">🏠 智能家居小能手</span
        ><span class="author-tag">🔨 设计开发一条龙</span>
      </div>
      <div class="author-img">
        <img
          class="no-lightbox entered loaded"
          src="https://npm.elemecdn.com/anzhiyu-blog-static@1.0.4/img/avatar.jpg"
          onerror='this.onerror=null,this.src="https://bu.dusays.com/2023/03/03/6401a79030db5.png"'
          data-lazy-src="https://npm.elemecdn.com/anzhiyu-blog-static@1.0.4/img/avatar.jpg"
          alt="avatar"
          data-ll-status="loaded"
        />
      </div>
      <div class="author-tag-right">
        <span class="author-tag">专修交互与设计 🤝</span
        ><span class="author-tag">脚踏实地行动派 🏃</span
        ><span class="author-tag">团队小组发动机 🧱</span
        ><span class="author-tag">壮汉人狠话不多 💢</span>
      </div>
    </div>
    <div class="author-title">关于本站</div>

    <AuthorPageContent />
  </div>
</template>

<style lang="scss" scoped>
.about-container {
  animation: slide-in 0.6s 0.2s backwards;
  max-width: 1400px;
  padding: 1.5rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  .author-box {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 0 16px 0;
    .author-tag-left {
      display: flex;
      flex-direction: column;
      align-items: flex-end;

      .author-tag {
        &:first-child,
        &:last-child {
          margin-right: -16px;
        }
      }
    }
    .author-tag {
      transform: translate(0, -4px);
      padding: 1px 8px;
      background: var(--anzhiyu-card-bg);
      border: var(--style-border-always);
      border-radius: 40px;
      margin-top: 6px;
      font-size: 14px;
      font-weight: 700;
      box-shadow: var(--anzhiyu-shadow-lightblack);
      animation: 6s ease-in-out 0s infinite normal none running floating;

      &:nth-child(1) {
        animation-delay: 0s;
      }

      &:nth-child(2) {
        animation-delay: 0.6s;
      }

      &:nth-child(3) {
        animation-delay: 1.2s;
      }

      &:nth-child(4) {
        animation-delay: 1.8s;
      }
    }
    .author-img {
      margin: 0 30px;
      border-radius: 50%;
      width: 180px;
      height: 180px;
      position: relative;
      background: var(--anzhiyu-secondbg);
      user-select: none;
      transition: 0.3s;
      &:hover {
        transform: scale(1.1);
      }
      img {
        border-radius: 50%;
        overflow: hidden;
        width: 180px;
        height: 180px;
      }
      &::before {
        content: "";
        transition: 1s;
        width: 30px;
        height: 30px;
        background: var(--anzhiyu-green);
        position: absolute;
        border-radius: 50%;
        border: 5px solid var(--anzhiyu-background);
        bottom: 5px;
        right: 10px;
        z-index: 2;
        box-sizing: content-box;
      }
    }
    .author-tag-right {
      display: flex;
      flex-direction: column;
      align-items: flex-start;

      .author-tag {
        &:first-child,
        &:last-child {
          margin-left: -16px;
        }
      }
    }
  }
  .author-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0.625rem 0 1.25rem 0;
    line-height: 1;
  }
}
</style>
