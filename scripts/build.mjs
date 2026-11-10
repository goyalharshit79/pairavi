// Builds Pairavi into single self-contained HTML files:
//   dist/index.html     a normal web page (open it, host it anywhere)
//   dist/artifact.html  the same content without the document wrapper,
//                       for publishing as a claude.ai artifact
import { build } from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const root = new URL("..", import.meta.url).pathname;

const js = await build({
  entryPoints: [root + "src/ui/app.js"],
  bundle: true,
  format: "iife",
  minify: true,
  target: ["es2020", "safari14"],
  write: false,
  legalComments: "none",
});
const code = js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const css = await readFile(root + "src/ui/style.css", "utf8");
const shell = await readFile(root + "src/ui/shell.html", "utf8");

const fragment = shell.replace("/*__CSS__*/", () => css).replace("/*__JS__*/", () => code);
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${fragment}
</body>
</html>
`;

await mkdir(root + "dist", { recursive: true });
await writeFile(root + "dist/artifact.html", fragment);
await writeFile(root + "dist/index.html", page);
console.log(`Built dist/index.html (${(page.length / 1024).toFixed(1)} KB) and dist/artifact.html`);
