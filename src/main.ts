/**
 * 古文岛 (guwendao.net) 解锁油猴脚本
 *
 * 功能：
 * - 解除登录限制
 * - 无限朗读操作
 * - PDF 下载免验证
 * - 音频直接下载
 */
import { log } from './utils';
import { bypassLogin } from './modules/login-bypass';
import { enableInfiniteRead } from './modules/infinite-read';
import { bypassPdfDownload } from './modules/pdf-download-bypass';
import { bypassAudioDownload } from './modules/audio-download-bypass';

log('脚本已加载，开始初始化...');

// 1. 跳过登录
bypassLogin();

// 2. 无限朗读
enableInfiniteRead();

// 3. PDF 下载免验证
bypassPdfDownload();

// 4. 展示底部播放栏
// autoShowPlayer();

// 5. 音频直接下载
bypassAudioDownload();

log('初始化完成');
