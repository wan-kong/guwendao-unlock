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
declare const playlist: GuwendaoTrack[] | undefined;
declare const track: GuwendaoTrack | undefined;

interface Window {
  /** 古文岛朗读付费校验，覆盖为 true 即可跳过 */
  getPlayShowPay(showType?: string): boolean;
  getUserInfo(): boolean;
  /** PDF 下载付费弹窗，覆盖为空函数即可跳过 */
  showlayuiPay(msg?: string): void;
  currentTrack: number;
  updatePlaylist(): void;
  playTrack(track: GuwendaoTrack): void;
  jspdf?: {
    jsPDF: new (options: JsPdfOptions) => JsPdfDocument;
  };
  html2canvas?: (
    element: HTMLElement,
    options?: Record<string, unknown>,
  ) => Promise<HTMLCanvasElement>;
}
