// Turns preview/dist/index.html into an artifact page body (the artifact host
// supplies <html>/<head>/<body>): title, inlined CSS, root element, inlined JS.
import fs from "node:fs";

const html = fs.readFileSync(new URL("./dist/index.html", import.meta.url), "utf8");
const styles = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]);
const scripts = [...html.matchAll(/<script type="module"[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0].replace(/ crossorigin/, ""));
if (!styles.length || scripts.length !== 1) throw new Error(`Unexpected build output (${styles.length} styles, ${scripts.length} scripts)`);

const page = [
  "<title>Producer Network</title>",
  '<meta name="description" content="Prototype: the professional home of the insurance and financial services industry. All content is fictional.">',
  ...styles,
  '<div id="root"></div>',
  ...scripts,
].join("\n");

fs.writeFileSync(new URL("./dist/producer-network.html", import.meta.url), page);
console.log(`preview/dist/producer-network.html  ${(page.length / 1024 / 1024).toFixed(2)} MB`);
