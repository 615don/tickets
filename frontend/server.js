import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  secure: false,
  cookieDomainRewrite: '',
  onProxyReq: (proxyReq, req) => {
    // Forward original host
    if (req.headers.origin) {
      proxyReq.setHeader('origin', API_URL);
    }
  },
  onProxyRes: (proxyRes) => {
    // Ensure cookies are set correctly
    const setCookie = proxyRes.headers['set-cookie'];
    if (setCookie) {
      proxyRes.headers['set-cookie'] = setCookie.map(cookie => {
        // Remove domain restrictions to allow same-origin cookies
        return cookie.replace(/; domain=[^;]+/gi, '');
      });
    }
  },
}));

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Proxying API requests to ${API_URL}`);
});
