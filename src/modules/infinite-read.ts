/**
 * 无限朗读模块
 * 覆盖 getPlayShowPay() 使其始终返回 true，绕过付费限制
 */
import { log, pageWindow } from '../utils';

/**
 * 覆盖页面原有的 getPlayShowPay 函数
 * 使朗读功能无需付费即可无限使用
 */
export function enableInfiniteRead(): void {
  const reapply = () => {
    pageWindow.getPlayShowPay = () => true;
  };

  reapply();
  window.addEventListener('DOMContentLoaded', reapply);
  window.addEventListener('load', reapply);
  [0, 100, 500, 1500].forEach((delay) => window.setTimeout(reapply, delay));
  log('已启用无限朗读');
}
