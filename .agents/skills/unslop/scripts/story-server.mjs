import { createServer } from "node:http";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";

const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".mp4": "video/mp4" };

/** Serve the generated stage and regular files confined to the story directory. */
export function createStoryServer(root, stage) {
  const base = realpathSync(root);
  return createServer((request, response) => {
    let path;
    try {
      path = decodeURIComponent(new URL(request.url, "http://local").pathname);
    } catch {
      response.writeHead(400);
      return response.end();
    }
    if (path === "/__stage.html") {
      response.writeHead(200, { "content-type": "text/html" });
      return response.end(stage);
    }
    try {
      const target = realpathSync(resolve(base, `.${path.replace(/^\/__story\//, "/")}`));
      const rel = relative(base, target);
      if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel) || !statSync(target).isFile()) {
        response.writeHead(404);
        return response.end();
      }
      const content = readFileSync(target);
      response.writeHead(200, { "content-type": types[extname(target).toLowerCase()] ?? "application/octet-stream" });
      response.end(content);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
}
