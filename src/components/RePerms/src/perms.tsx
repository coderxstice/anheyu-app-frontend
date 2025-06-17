/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-06-15 11:31:00
 * @LastEditTime: 2025-06-17 21:29:36
 * @LastEditors: 安知鱼
 */
import { defineComponent } from "vue";
// import { hasPerms } from "@/utils/auth";

export default defineComponent({
  name: "Perms",
  props: {
    value: {
      type: undefined,
      default: []
    }
  },
  setup(props, { slots }) {
    return () => {
      if (!slots) return null;
      // return hasPerms(props.value) ? (
      //   <Fragment>{slots.default?.()}</Fragment>
      // ) : null;
      return null;
    };
  }
});
