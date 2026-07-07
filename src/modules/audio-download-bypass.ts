/**
 * 音频下载绕过模块
 * 跳过 /user/downloadMp3.aspx 鉴权请求，直接下载url
 */
import { GM_download } from '$';
import { error, log, sanitizeFilename } from '../utils';

const DOWNLOAD_BUTTON_ID = 'downloadButton';
const REQUEST_TRACK_MESSAGE = 'guwendao-helper:request-current-track';
const RESPONSE_TRACK_MESSAGE = 'guwendao-helper:current-track';
const TRACK_REQUEST_TIMEOUT = 3000;
let isClickListenerMounted = false;

interface TrackMessage {
  type: typeof RESPONSE_TRACK_MESSAGE;
  requestId: string;
  track?: GuwendaoTrack;
  error?: string;
}

function isDownloadButtonClick(e: MouseEvent): boolean {
  return e.target instanceof Element && Boolean(e.target.closest(`#${DOWNLOAD_BUTTON_ID}`));
}

function createRequestId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function injectTrackReader(): void {
  if (document.getElementById('guwendao-helper-track-reader')) return;

  const script = document.createElement('script');
  script.id = 'guwendao-helper-track-reader';
  /**
   * 这里的playlist是在别的脚本中使用 let 声明的全局变量，并没有挂在 window 上，所以需要注入脚本来读取。
   */
  script.textContent = `
    (() => {
      const REQUEST = ${JSON.stringify(REQUEST_TRACK_MESSAGE)};
      const RESPONSE = ${JSON.stringify(RESPONSE_TRACK_MESSAGE)};
      window.addEventListener('message', (event) => {
        if (event.source !== window || event.data?.type !== REQUEST) return;

        try {
          const readStoragePlaylist = () => {
            try {
              const value = window.localStorage.getItem('playlist');
              const parsed = value ? JSON.parse(value) : [];
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          };

          const pagePlaylist = typeof playlist !== 'undefined' && Array.isArray(playlist)
            ? playlist
            : readStoragePlaylist();
          const pageTrackIndex = (() => {
            if (typeof currentTrack !== 'undefined' && Number.isInteger(currentTrack)) {
              return currentTrack;
            }
            if (typeof currentTrackIndex !== 'undefined' && Number.isInteger(currentTrackIndex)) {
              return currentTrackIndex;
            }

            const storedIndex = Number.parseInt(
              window.localStorage.getItem('currentTrackIndex') || '',
              10,
            );
            return Number.isInteger(storedIndex) ? storedIndex : -1;
          })();
          const track = Number.isInteger(pageTrackIndex) && pageTrackIndex >= 0
            ? pagePlaylist[pageTrackIndex]
            : undefined;

          window.postMessage({
            type: RESPONSE,
            requestId: event.data.requestId,
            track: track
              ? {
                idStr: track.idStr,
                id: track.id,
                type: track.type,
                url: track.url,
                langsongauthor: track.langsongauthor,
                title: track.title,
                author: track.author,
                duration: track.duration,
              }
              : undefined,
          }, '*');
        } catch (err) {
          window.postMessage({
            type: RESPONSE,
            requestId: event.data.requestId,
            error: err instanceof Error ? err.message : String(err),
          }, '*');
        }
      });
    })();
  `;
  document.documentElement.appendChild(script);
  script.remove();
}

function requestCurrentTrack(): Promise<GuwendaoTrack> {
  const requestId = createRequestId();

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      reject(new Error('读取当前音频超时'));
    }, TRACK_REQUEST_TIMEOUT);

    function handleMessage(event: MessageEvent<TrackMessage>): void {
      if (event.source !== window || event.data?.type !== RESPONSE_TRACK_MESSAGE) return;
      if (event.data.requestId !== requestId) return;

      window.clearTimeout(timer);
      window.removeEventListener('message', handleMessage);

      if (event.data.error) {
        reject(new Error(event.data.error));
        return;
      }
      if (!event.data.track?.url) {
        reject(new Error('未找到 track.url，无法下载'));
        return;
      }

      resolve(event.data.track);
    }

    window.addEventListener('message', handleMessage);
    window.postMessage({ type: REQUEST_TRACK_MESSAGE, requestId }, '*');
  });
}

function downloadTrack(track: GuwendaoTrack, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    GM_download({
      url: track.url,
      name: filename,
      saveAs: false,
      conflictAction: 'uniquify',
      onload: () => resolve(),
      onerror: (err) => {
        reject(new Error(err.details || err.error));
      },
      ontimeout: () => {
        reject(new Error('音频下载超时'));
      },
    });
  });
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
export function bypassAudioDownload(): void {
  if (isClickListenerMounted) return;

  injectTrackReader();
  document.addEventListener('click', handleClick, true);
  isClickListenerMounted = true;
  log('音频下载拦截已就绪');
}
