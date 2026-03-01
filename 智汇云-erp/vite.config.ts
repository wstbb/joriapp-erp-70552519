
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 修正: 移除了不必要且与当前项目结构冲突的 resolve.alias 配置。
  // 在当前非 src 布局的项目中，所有导入都应使用相对路径，以确保解析的确定性。
});
