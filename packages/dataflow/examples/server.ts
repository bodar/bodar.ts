import {HTMLTransformer} from "../src/HTMLTransformer.ts";

const PORT = 3000;
const EXAMPLES_DIR = import.meta.dir;

Bun.serve({
    port: PORT,
    async fetch(req) {
        const path = new URL(req.url).pathname
        const filePath = `${EXAMPLES_DIR}${path}`;
        const file = Bun.file(filePath);

        if (!(await file.exists())) {
            return new Response("Not Found", {status: 404});
        }

        // Transform HTML files with HTMLTransformer
        if (filePath.endsWith('.html')) {
            const html = await file.text();

            const transformer = new HTMLTransformer(new HTMLRewriter());
            const newHtml = transformer.transform(html);
            return new Response(newHtml, {
                headers: {'Content-Type': 'text/html'}
            });
        }

        // Serve other files as-is
        return new Response(file);
    },
});

console.log(`Server running at http://localhost:${PORT}`);
