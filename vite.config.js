import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const pagesBasePath = "/ControleFinanceiro/";

export default defineConfig(({ command }) => ({
  base: command === "build" ? pagesBasePath : "/",
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        index: "index.html",
        app: "src/main.js"
      },
      output: {
        entryFileNames: chunkInfo => (
          chunkInfo.name === "app" ? "assets/app.js" : "assets/[name].js"
        ),
        chunkFileNames: "assets/[name].js",
        assetFileNames: assetInfo => {
          if (assetInfo.name?.endsWith(".css")) {
            return "assets/app.css";
          }

          return "assets/[name][extname]";
        }
      }
    }
  }
}));
