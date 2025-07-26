/*
 * @Description:
 * @Author: 安知鱼
 * @Date: 2025-07-26 13:14:40
 * @LastEditTime: 2025-07-26 13:14:44
 * @LastEditors: 安知鱼
 */
import gsap from "gsap";

// 定义 GSAP 的进入动画
export const onEnter = (el: Element, done: () => void) => {
  gsap.fromTo(
    el,
    { opacity: 0, y: 10, scale: 0.9 }, // 从：透明、下方10px、略微缩小
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
      onComplete: done // 动画结束后调用 done()，告知 Vue 过渡已完成
    }
  );
};

// 定义 GSAP 的离开动画
export const onLeave = (el: Element, done: () => void) => {
  gsap.to(el, {
    opacity: 0,
    y: 10,
    scale: 0.9,
    duration: 0.2,
    ease: "power2.in",
    onComplete: done
  });
};
