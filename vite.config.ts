import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vite reads .env itself; copy values only into the server process for Drizzle/Better Auth.
  // No `define` is used, so these server-only values are not bundled into browser code.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return {
    plugins: [tanstackStart(), react({ compiler: true }), tailwindcss()],
    server: { allowedHosts: ['.manus.computer'] },
  }
})
