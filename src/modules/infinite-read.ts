/**
 * 无限朗读与权限解锁模块
 * 覆盖 getPlayShowPay() 与 checkSvip()，解除朗读次数与 15 秒试听时长限制
 * 拦截付费弹窗 showlayuiPay / showlayuiPayVip
 */
import { defineLockedProperty, getTargetWindows, log } from '../utils';

/**
 * 覆盖页面原有的付费与权限校验函数
 * 使朗读功能无需付费即可无限使用，且不会被 15 秒限时切断
 */
export function enableInfiniteRead(): void {
  const targets = getTargetWindows();

  // 1. 覆盖朗读次数限制校验
  defineLockedProperty(targets, 'getPlayShowPay', () => true);

  // 2. 覆盖 VIP/SVIP 校验（解除 15 秒播放时长限制及背诵/拓展限制）
  defineLockedProperty(targets, 'checkSvip', () => true);

  // 3. 全局拦截充值付费弹窗
  const interceptPay = (type?: string): void => {
    log(`已拦截付费弹窗: ${type || '未知类型'}`);
  };
  defineLockedProperty(targets, 'showlayuiPay', interceptPay);
  defineLockedProperty(targets, 'showlayuiPayVip', interceptPay);

  log('已启用无限朗读与 SVIP 权限模拟');
}
