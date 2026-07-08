/**
 * 音频下载绕过模块
 * 跳过 /user/downloadMp3.aspx 鉴权请求，直接下载url
 */
import { error, log, sanitizeFilename } from '../utils';

const DOWNLOAD_BUTTON_ID = 'downloadButton';
let isClickListenerMounted = false;



function isDownloadButtonClick(e: MouseEvent): boolean {
  return e.target instanceof Element && Boolean(e.target.closest(`#${DOWNLOAD_BUTTON_ID}`));
}


function requestCurrentTrack(): Promise<Track> {
  return new Promise((resolve, reject) => {
    if (playlist?.length && currentTrack !== undefined && currentTrack >= 0) {
      resolve(playlist[currentTrack])
    }
    reject(null)
  })

}

function downloadTrack(track: Track, filename: string): Promise<void> {
  return new Promise((resolve) => {
    const a = document.createElement("a")
    a.download = filename
    a.href = track.url
    a.target = "_blank"
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
    resolve()
  })
}

function handleClick(e: MouseEvent): void {
  if (!isDownloadButtonClick(e)) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  void requestCurrentTrack()
    .then((track) => {
      const filenameBase = [track.title, track.langsongauthor].filter(Boolean).join(' - ');
      const filename = sanitizeFilename(`${filenameBase || '古文岛朗读'}.mp3`);
      return downloadTrack(track, filename).then(() => filename);
    })
    .then(() => {
      log('已唤起音频下载');
    })
    .catch((err: Error) => {
      error('音频下载失败:', err);
      alert('音频下载失败：' + err.message);
    });
}

/**
 * 使用 document 捕获阶段代理，避免按钮动态替换后监听器丢失。
 */
export function bypassDownloadAudio(): void {
  if (isClickListenerMounted) return;

  document.addEventListener('click', handleClick, true);
  isClickListenerMounted = true;
  log('音频下载拦截已就绪');
}
