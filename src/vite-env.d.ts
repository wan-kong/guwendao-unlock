/// <reference types="vite/client" />
/// <reference types="vite-plugin-monkey/client" />
//// <reference types="vite-plugin-monkey/global" />
/// <reference types="vite-plugin-monkey/style" />

interface Track {
  idStr: string;
  id: number;
  type: string;
  url: string;
  langsongauthor: string;
  title: string;
  author: string;
  duration: string;
}

interface JsPdfOptions {
  orientation: 'portrait' | 'landscape';
  unit: 'px' | 'pt' | 'mm' | 'cm' | 'in';
  format: [number, number] | string;
}

interface JsPdfDocument {
  internal: {
    pageSize: {
      getWidth(): number;
      getHeight(): number;
    };
  };
  addPage(): void;
  setPage(pageNumber: number): void;
  addImage(
    imageData: string,
    format: 'JPEG' | 'PNG',
    x: number,
    y: number,
    width: number,
    height: number,
  ): void;
  save(filename: string): void;
}

declare const currentTrack: number | undefined;
declare const playlist: Track[] | undefined;
declare const track: Track | undefined;
declare const unsafeWindow: (Window & typeof globalThis) | undefined;

interface Window {
  /** 古文岛/古诗文网朗读付费校验，覆盖为 true 即可跳过 */
  getPlayShowPay(showType?: string): boolean;
  /** 获取用户信息，覆盖为 true 跳过未登录重定向 */
  getUserInfo(): boolean;
  /** VIP/SVIP 校验，覆盖为 true 跳过 15 秒试听截断与弹窗 */
  checkSvip(): boolean;
  /** 下载币付费弹窗，覆盖为空函数即可跳过 */
  showlayuiPay(msg?: string): void;
  /** VIP 付费弹窗，覆盖为空函数即可跳过 */
  showlayuiPayVip(msg?: string): void;
  currentTrack: number;
  updatePlaylist(): void;
  playTrack(track: Track): void;
  jspdf?: {
    jsPDF: new (options: JsPdfOptions) => JsPdfDocument;
  };
  html2canvas?: (
    element: HTMLElement,
    options?: Record<string, unknown>,
  ) => Promise<HTMLCanvasElement>;
}
