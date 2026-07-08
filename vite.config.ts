import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: '古文岛助手',
        namespace: 'guwendao-helper',
        version: '0.1.0',
        description: '解锁古文岛(guwendao.net)的登录限制 & 无限朗读 & PDF免验证下载',
        author: 'wankong',
        icon: 'https://www.guwendao.net/favicon.ico',
        match: [
          'https://www.guwendao.net/*',
          'https://guwendao.net/*',
        ],
        grant: "none",
        'run-at': 'document-end',
      },
    }),
  ],
});
