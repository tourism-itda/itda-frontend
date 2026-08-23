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
    // itda-backend에는 CORS 설정이 없으므로, 개발 중에는 /api 요청을 백엔드(8080)로 프록시해
    // 브라우저에서 same-origin으로 보이게 한다.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // explore(나라별/인물별 탐색) 도메인은 KingdomController/PersonController가
      // "/api" 없이 "/explore/**"로 매핑돼 있다(다른 도메인과 다른 컨벤션, 실제 소스로 확인함).
      // 그대로 두면 이 라우트만 프록시가 안 돼 404가 나서 별도 규칙을 추가한다.
      '/explore': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
