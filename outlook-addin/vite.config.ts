import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Check if SSL certificates exist (development environment)
const certKeyPath = './certs/localhost-key.pem';
const certPath = './certs/localhost.pem';
const certsExist = fs.existsSync(certKeyPath) && fs.existsSync(certPath);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Only enable HTTPS in development when certificates exist
    https: certsExist ? {
      key: fs.readFileSync(certKeyPath),
      cert: fs.readFileSync(certPath),
    } : undefined,
    port: 5173,
    host: true, // Allow external access for testing
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
