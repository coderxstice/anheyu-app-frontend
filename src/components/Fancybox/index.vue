<script>
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

export default {
  props: {
    options: Object
  },
  mounted() {
    // 初始化
    Fancybox.bind(this.$refs.container, "[data-fancybox]", {
      ...(this.options || {})
    });
  },
  updated() {
    Fancybox.unbind(this.$refs.container);
    Fancybox.close();

    Fancybox.bind(this.$refs.container, "[data-fancybox]", {
      ...(this.options || {})
    });
  },
  unmounted() {
    // 组件卸载时清理
    Fancybox.unbind(this.$refs.container);
    Fancybox.close();
  }
};
</script>

<template>
  <div ref="container">
    <slot />
  </div>
</template>
