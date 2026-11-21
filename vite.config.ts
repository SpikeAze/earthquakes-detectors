import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Security: validate ALLOWED_HOSTS — reject wildcards, empty, overly broad entries
function getAllowedHosts(): string[] {
  const raw = process.env.ALLOWED_HOSTS?.split(',').map((h) => h.trim()).filter(Boolean) ?? [];
  const blocked = ['*', 'localhost', '127.0.0.1', '0.0.0.0', '[::]'];
  return raw.filter((h) => !blocked.includes(h) && h.length > 0 && !h.includes('*'));
}

// Security headers plugin for production builds
function securityHeadersPlugin() {
  return {
    name: 'security-headers',
    apply: 'build' as const,
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use((_req: import('http').IncomingMessage, res: import('http').ServerResponse, next: () => void) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    securityHeadersPlugin(),
  ],
  server: {
    allowedHosts: getAllowedHosts(),
  },
  build: {
    // Ensure sourcemaps not exposed in production
    sourcemap: false,
  },
})
