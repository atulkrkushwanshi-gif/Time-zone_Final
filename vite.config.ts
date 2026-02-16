import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This is CRITICAL: It tells the app to look for files relative to where it sits,
  // not from the root of the domain. This allows it to work in website.com/schedule
  base: './', 
});