/**
 * PDF 下载绕过模块
 * 移除下载按钮的权限校验，直接触发 PDF 导出
 */
import { error, log, pageWindow, sanitizeFilename, waitForElement } from '../utils';

const PDF_PAGE_PATH = '/pdf/viewPdf.aspx';
const PDF_DOWNLOAD_BUTTON_ID = 'xiazaiPdf';
const PDF_WIDTH = 816;
const PDF_HEIGHT = 1123;
const WATERMARK_CHECKBOX_ID = 'chk_watermark';
const WATERMARK_SELECTOR = '.watermark';
const SOURCE_CONTENT_SELECTOR = '.sourceContent';
const SOURCE_CONTENT_ORIGINAL_ATTR = 'data-guwendao-original-source-content';
let showWatermark = true;
let watermarkObserver: MutationObserver | undefined;
let isPdfClickListenerMounted = false;

function extractSourceTitle(text: string): string {
  const title = text.replace(/PDF来自古文岛.*/g, '').trim();
  return title || text.trim();
}

function getPdfTitle(): string {
  const sourceTitle = document.querySelector('.sourceContent')?.textContent;
  const title = sourceTitle?.replace(/《|》|PDF来自古文岛.*/g, '').trim()
    || document.title?.replace('PDF预览 - ', '')?.trim()
    || '古诗文';

  return sanitizeFilename(title);
}

async function exportPdf(pdf: JsPdfDocument, pages: NodeListOf<Element>, title: string): Promise<void> {
  const html2canvasFn = pageWindow.html2canvas;
  if (!html2canvasFn) {
    throw new Error('html2canvas 未加载，请刷新重试');
  }

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];
    if (!(page instanceof HTMLElement)) continue;

    const canvas = await html2canvasFn(page, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      width: PDF_WIDTH,
      height: PDF_HEIGHT,
      windowWidth: PDF_WIDTH,
      windowHeight: PDF_HEIGHT,
    });
    const imgData = canvas.toDataURL('image/jpeg', 1);
    if (pageIndex !== 0) pdf.addPage();

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pdfWidth / PDF_WIDTH, pdfHeight / PDF_HEIGHT);
    const imgWidth = PDF_WIDTH * ratio;
    const imgHeight = PDF_HEIGHT * ratio;
    const offsetX = (pdfWidth - imgWidth) / 2;
    const offsetY = (pdfHeight - imgHeight) / 2;

    pdf.setPage(pageIndex + 1);
    pdf.addImage(imgData, 'JPEG', offsetX, offsetY, imgWidth, imgHeight);
  }

  pdf.save(`${title}.pdf`);
  log(`PDF 已导出: ${title}.pdf, 共 ${pages.length} 页`);
}

function updateSourceContentVisibility(): void {
  document.querySelectorAll<HTMLElement>(SOURCE_CONTENT_SELECTOR).forEach((sourceContent) => {
    const original = sourceContent.getAttribute(SOURCE_CONTENT_ORIGINAL_ATTR)
      || sourceContent.textContent
      || '';
    if (!sourceContent.hasAttribute(SOURCE_CONTENT_ORIGINAL_ATTR)) {
      sourceContent.setAttribute(SOURCE_CONTENT_ORIGINAL_ATTR, original);
    }

    const text = showWatermark ? original : extractSourceTitle(original);
    if (sourceContent.textContent !== text) {
      sourceContent.textContent = text;
    }
    sourceContent.style.display = '';
  });
}

function updateWatermarkVisibility(): void {
  document.querySelectorAll<HTMLElement>(WATERMARK_SELECTOR).forEach((watermark) => {
    watermark.style.display = showWatermark ? '' : 'none';
  });
  updateSourceContentVisibility();
}

function watchWatermarkChanges(): void {
  if (watermarkObserver) return;

  watermarkObserver = new MutationObserver(updateWatermarkVisibility);
  watermarkObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function createWatermarkToggle(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'setting-item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = WATERMARK_CHECKBOX_ID;
  checkbox.value = 'watermark';
  checkbox.checked = showWatermark;

  const label = document.createElement('label');
  label.htmlFor = WATERMARK_CHECKBOX_ID;
  label.textContent = '展示水印';

  checkbox.addEventListener('change', () => {
    showWatermark = checkbox.checked;
    updateWatermarkVisibility();
  });

  wrapper.append(checkbox, label);
  return wrapper;
}

async function enableWatermarkToggle(): Promise<void> {
  const settings = await waitForElement('#pdf-settings');
  if (!(settings instanceof HTMLElement) || document.getElementById(WATERMARK_CHECKBOX_ID)) {
    return;
  }

  settings.appendChild(createWatermarkToggle());
  updateWatermarkVisibility();
  watchWatermarkChanges();
  log('PDF 水印开关已添加');
}

function isPdfDownloadClick(e: MouseEvent): boolean {
  return e.target instanceof Element && Boolean(e.target.closest(`#${PDF_DOWNLOAD_BUTTON_ID}`));
}

function downloadPdf(): void {
  const jsPDF = pageWindow.jspdf?.jsPDF;
  if (!jsPDF) {
    alert('PDF 插件未加载，请刷新重试');
    return;
  }

  const pages = document.querySelectorAll('.page-container');
  if (pages.length === 0) {
    alert('没有可导出的内容');
    return;
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [PDF_WIDTH, PDF_HEIGHT],
  });

  void exportPdf(pdf, pages, getPdfTitle()).catch((err: Error) => {
    error('PDF 生成失败:', err);
    alert('PDF 生成失败：' + err.message);
  });
}

function handlePdfDownloadClick(e: MouseEvent): void {
  if (!isPdfDownloadClick(e)) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  downloadPdf();
}

function mountPdfDownloadBypass(): void {
  if (isPdfClickListenerMounted) return;

  document.addEventListener('click', handlePdfDownloadClick, true);
  isPdfClickListenerMounted = true;
  log('PDF 下载点击拦截已就绪');
}

/**
 * 跳过 PDF 下载的权限验证，直接执行前端导出
 * 仅在 PDF 预览页生效
 */
export function bypassPdfDownload(): void {
  // 仅 PDF 预览页生效
  if (!window.location.pathname.endsWith(PDF_PAGE_PATH)) {
    return;
  }

  // 1. 干掉 showlayuiPay 付费弹窗
  pageWindow.showlayuiPay = (msg?: string) => {
    log(`已拦截付费弹窗: ${msg}`);
  };

  void enableWatermarkToggle().catch((err: Error) => {
    error('PDF 水印开关添加失败:', err);
  });

  // 2. 捕获阶段代理点击，避免被原站 window.onload 里的 onclick 覆盖。
  mountPdfDownloadBypass();
  void waitForElement(`#${PDF_DOWNLOAD_BUTTON_ID}`)
    .then(() => {
      log('PDF 下载按钮已发现');
    })
    .catch((err: Error) => {
      error('PDF 下载按钮未找到:', err);
    });
}
