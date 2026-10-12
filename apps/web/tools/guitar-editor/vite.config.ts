import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import { handleEditorRequest } from "./server";

const editorRoot = path.dirname(fileURLToPath(import.meta.url));

function localEditorApi(): Plugin {
  return {
    name: "local-guitar-editor-api",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        void handleEditorRequest(request, response).then((handled) => {
          if (!handled) next();
        }).catch(next);
      });
    },
  };
}

export default defineConfig({
  root: editorRoot,
  plugins: [localEditorApi()],
  resolve: { alias: { "@": path.resolve(editorRoot, "../../src") } },
  esbuild: { jsx: "automatic" },
  server: {
    host: "127.0.0.1",
    port: 4174,
    strictPort: true,
    fs: { allow: [editorRoot, path.resolve(editorRoot, "../../src")] },
  },
});
