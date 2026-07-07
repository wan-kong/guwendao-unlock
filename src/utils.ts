/**
 * 工具函数
 */
import { unsafeWindow } from '$';

const TAG = '[古文岛助手]';
export const pageWindow = unsafeWindow as Window & typeof globalThis;

/** 带前缀的 console.log */
export function log(...args: unknown[]): void {
  console.log(TAG, ...args);
}

/** 带前缀的 console.warn */
export function warn(...args: unknown[]): void {
  console.warn(TAG, ...args);
}

/** 带前缀的 console.error */
export function error(...args: unknown[]): void {
  console.error(TAG, ...args);
}

export function readStorageJson<T>(key: string, fallback: T): T {
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch (err) {
    warn(`localStorage.${key} 解析失败，已使用默认值`, err);
    return fallback;
  }
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[\\/:*?"<>|]/g, '_').trim() || 'download';
}

/**
 * 等待 DOM 中出现匹配选择器的元素
 * @param selector CSS 选择器
 * @param timeout 超时毫秒数，默认 10000
 * @returns Promise<Element>
 */
export function waitForElement(
  selector: string,
  timeout = 10000,
): Promise<Element> {
  return new Promise((resolve, reject) => {
    // 先检查是否已存在
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });

    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`等待元素 "${selector}" 超时 (${timeout}ms)`));
    }, timeout);
  });
}
