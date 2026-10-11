/**
 * 古文岛 (guwendao.net) & 古诗文网 (gushiwen.cn) 解锁油猴脚本
 *
 * 功能：
 * - 解除登录限制
 * - 无限朗读操作（解除 15 秒试听时长与每日次数限制）
 * - PDF 下载免验证
 * - 音频下载 MP3
 */
import { log } from './utils';
import { bypassLogin } from './modules/login-bypass';
import { enableInfiniteRead } from './modules/infinite-read';
import { bypassPdfDownload } from './modules/pdf-download-bypass';
import { bypassDownloadAudio } from './modules/audio-download-bypass';

log('脚本已加载，开始初始化...');

// 1. 跳过登录
bypassLogin();

// 2. 无限朗读
enableInfiniteRead();

// 3. PDF 下载免验证
bypassPdfDownload();

// 4. 展示底部播放栏
bypassDownloadAudio();

log('初始化完成');
