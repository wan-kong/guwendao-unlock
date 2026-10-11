/**
 * 音频下载绕过模块
 * 跳过 /user/downloadMp3.aspx 鉴权请求，直接下载 url
 */
import { error, log, readStorageJson, sanitizeFilename } from '../utils';

const DOWNLOAD_BUTTON_ID = 'downloadButton';
let isClickListenerMounted = false;

interface CurrentAudioInfo {
  url: string;
  title: string;
  author?: string;
  langsongauthor?: string;
}

function isDownloadButtonClick(e: MouseEvent): boolean {
  return e.target instanceof Element && Boolean(e.target.closest(`#${DOWNLOAD_BUTTON_ID}`));
}

function resolveCurrentTrack(): CurrentAudioInfo | null {
  // 1. 尝试从原站全局变量读取（如果暴露在 window 上）
  try {
    const globalPlaylist = (window as unknown as { playlist?: Track[] }).playlist;
    const globalTrackIndex = (window as unknown as { currentTrack?: number }).currentTrack;
    if (globalPlaylist?.length && globalTrackIndex !== undefined && globalTrackIndex >= 0) {
      const track = globalPlaylist[globalTrackIndex];
      if (track?.url) {
        return {
          url: track.url,
          title: track.title,
          author: track.author,
          langsongauthor: track.langsongauthor,
        };
      }
    }
  } catch {
    // ignore
  }

  // 2. 从 DOM 元素获取当前播放器状态
  const audioElement = document.getElementById('audioPlayer') as HTMLAudioElement | null;
  const currentAudioSrc = audioElement?.currentSrc || audioElement?.src || '';

  const nameStrEl = document.getElementById('nameStr');
  const authorEl = document.getElementById('author');
  const langsongAuthorEl = document.getElementById('langsongauthor');

  const titleFromDom = nameStrEl?.textContent?.trim() || '';
  const authorFromDom = authorEl?.textContent?.trim() || '';
  const langsongFromDom = langsongAuthorEl?.textContent?.trim() || '';

  // 3. 从 localStorage 读取播放列表
  const storedPlaylist = readStorageJson<Track[]>('playlist', []);
  if (storedPlaylist.length > 0) {
    // 优先匹配当前 audioPlayer 的 src
    if (currentAudioSrc) {
      const matched = storedPlaylist.find((t) => t.url && currentAudioSrc.includes(t.url));
      if (matched) {
        return {
          url: matched.url,
          title: matched.title || titleFromDom,
          author: matched.author || authorFromDom,
          langsongauthor: matched.langsongauthor || langsongFromDom,
        };
      }
    }

    // 尝试匹配标题
    if (titleFromDom) {
      const matched = storedPlaylist.find((t) => t.title === titleFromDom);
      if (matched?.url) {
        return {
          url: matched.url,
          title: matched.title,
          author: matched.author || authorFromDom,
          langsongauthor: matched.langsongauthor || langsongFromDom,
        };
      }
    }

    // 回退到 localStorage 中的最后一项或第一项
    const fallbackTrack = storedPlaylist[0];
    if (fallbackTrack?.url) {
      return {
        url: fallbackTrack.url,
        title: fallbackTrack.title || titleFromDom,
        author: fallbackTrack.author || authorFromDom,
        langsongauthor: fallbackTrack.langsongauthor || langsongFromDom,
      };
    }
  }

  // 4. 若无法从列表匹配但 audioPlayer 有播放源
  if (currentAudioSrc && !currentAudioSrc.startsWith('blob:')) {
    return {
      url: currentAudioSrc,
      title: titleFromDom || document.title.split('_')[0] || '古诗文朗读',
      author: authorFromDom,
      langsongauthor: langsongFromDom,
    };
  }

  return null;
}

function downloadAudioUrl(url: string, filename: string): Promise<void> {
  return new Promise((resolve) => {
    const a = document.createElement('a');
    a.download = filename;
    a.href = url;
    a.target = '_blank';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    resolve();
  });
}

function handleClick(e: MouseEvent): void {
  if (!isDownloadButtonClick(e)) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const trackInfo = resolveCurrentTrack();
  if (!trackInfo || !trackInfo.url) {
    alert('未检测到可下载的音频，请先点击播放对应音频后再尝试下载！');
    return;
  }

  const filenameBase = [trackInfo.title, trackInfo.langsongauthor]
    .filter(Boolean)
    .join(' - ');
  const filename = sanitizeFilename(`${filenameBase || '古诗文朗读'}.mp3`);

  downloadAudioUrl(trackInfo.url, filename)
    .then(() => {
      log(`已唤起音频下载: ${filename}`);
    })
    .catch((err: Error) => {
      error('音频下载失败:', err);
      alert('音频下载失败：' + (err?.message || '未知错误'));
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
