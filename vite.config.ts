import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import pkg from './package.json'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: '古文岛助手',
        namespace: 'guwendao-unlock',
        version: pkg.version,
        description: '解锁古文岛(guwendao.net)的登录限制 & 无限朗读 & PDF免验证下载',
        author: 'wankong',
        icon: 'https://www.guwendao.net/favicon.ico',
        match: [
          'https://www.guwendao.net/*',
          'https://guwendao.net/*',
        ],
        grant: "none",
        license: "MIT",
        'run-at': 'document-end',
      },
    }),
  ],
});
