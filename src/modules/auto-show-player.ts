/**
 * 自动展示播放器模块
 * 初始化时检测 playlist 有内容则自动显示音频播放器
 */
import { error, log, readStorageJson } from '../utils';

const AUTO_SHOW_RESPONSE_MESSAGE = 'guwendao-helper:auto-show-player-done';
const PLAYER_API_TIMEOUT = 10000;
const DISABLED_PAGE_PATHS = [
  '/user/login.aspx',
  '/user/register.aspx',
  '/user/findpwd.aspx',
];

interface AutoShowMessage {
  type: typeof AUTO_SHOW_RESPONSE_MESSAGE;
  requestId: string;
  error?: string;
}

function createRequestId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function runAutoShowInPage(): Promise<void> {
  const requestId = createRequestId();

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      reject(new Error('等待播放器 API 超时'));
    }, PLAYER_API_TIMEOUT + 1000);

    function handleMessage(event: MessageEvent<AutoShowMessage>): void {
      if (event.source !== window || event.data?.type !== AUTO_SHOW_RESPONSE_MESSAGE) return;
      if (event.data.requestId !== requestId) return;

      window.clearTimeout(timer);
      window.removeEventListener('message', handleMessage);

      if (event.data.error) {
        reject(new Error(event.data.error));
        return;
      }

      resolve();
    }

    window.addEventListener('message', handleMessage);

    const script = document.createElement('script');
    script.textContent = `
      (() => {
        const RESPONSE = ${JSON.stringify(AUTO_SHOW_RESPONSE_MESSAGE)};
        const requestId = ${JSON.stringify(requestId)};
        const startedAt = Date.now();
        const timeout = ${PLAYER_API_TIMEOUT};

        const readStoragePlaylist = () => {
          try {
            const value = window.localStorage.getItem('playlist');
            const parsed = value ? JSON.parse(value) : [];
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        };

        const postResult = (error) => {
          window.postMessage({ type: RESPONSE, requestId, error }, '*');
        };

        const tryShowPlayer = () => {
          try {
            const container = document.getElementById('container');
            const pagePlaylist = typeof playlist !== 'undefined' && Array.isArray(playlist)
              ? playlist
              : readStoragePlaylist();

            if (
              !container
              || typeof updatePlaylist !== 'function'
              || typeof playTrack !== 'function'
            ) {
              if (Date.now() - startedAt >= timeout) {
                postResult('播放器 API 未就绪');
                return;
              }
              window.setTimeout(tryShowPlayer, 100);
              return;
            }

            if (pagePlaylist.length === 0) {
              postResult('播放列表为空');
              return;
            }

            container.style.display = 'inline-block';
            window.localStorage.setItem('playerDisplayState', 'visible');
            window.localStorage.setItem('currentTrackIndex', '0');
            updatePlaylist();
            playTrack(pagePlaylist[0]);
            postResult();
          } catch (err) {
            postResult(err instanceof Error ? err.message : String(err));
          }
        };

        tryShowPlayer();
      })();
    `;
    document.documentElement.appendChild(script);
    script.remove();
  });
}

export function autoShowPlayer(): void {
  if (DISABLED_PAGE_PATHS.some((path) => window.location.pathname.endsWith(path))) {
    return;
  }

  const list = readStorageJson<GuwendaoTrack[]>('playlist', []);
  if (list.length === 0) return;

  void runAutoShowInPage()
    .then(() => {
      log('获取到播放列表存在数据，自动显示播放器');
    })
    .catch((err: Error) => {
      error('播放器自动显示加载失败:', err);
    });
}
