import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    // itda-backend에는 CORS 설정이 없으므로, 개발 중에는 /api 요청을 백엔드로 프록시해
    // 브라우저에서 same-origin으로 보이게 한다.
    // 기본 대상은 로컬 백엔드(localhost:8080)지만, 로컬 백엔드 없이 UI만 확인하고 싶을 때는
    // VITE_PROXY_TARGET로 운영 API를 가리킬 수 있다.
    //   예) VITE_PROXY_TARGET=https://api.itda-travel.com npm run dev
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
