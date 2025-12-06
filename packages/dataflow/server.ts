import {HTMLTransformer} from "@bodar/dataflow/html/HTMLTransformer.ts";
import {bundleFile} from "./src/bundling/bundle.ts";
import {HTMLHandler} from "./src/http/HTMLHandler.ts";
import {CompressionHandler} from "./src/http/CompressionHandler.ts";

const PORT = 3000;
const ROOT = import.meta.dir;

const router = async (request: Request) => {
    let path = new URL(request.url).pathname
    if (path.startsWith('/dataflow/')) path = path.replace('/dataflow/', '/src/');
    if (path.startsWith('/totallylazy/')) path = path.replace('/totallylazy/', '/../totallylazy/src/');
    if (path.startsWith('/jsx2dom/')) path = path.replace('/jsx2dom/', '/../jsx2dom/src/');
    if (path.endsWith('/')) path = `${path}/index.html`;
    const filePath = `${ROOT}${path}`;
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
        return new Response(`Not Found ${filePath} ${file.name}`, {status: 404});
    }

    if (filePath.endsWith('.ts')) {
        let bundled = await bundleFile(filePath);
        return new Response(bundled, {
            headers: {'Content-Type': 'application/javascript'}
        });
    }

    return new Response(await file.arrayBuffer(), {headers: {'content-type': mimeTypeFor(filePath) }});
}

function mimeTypeFor(path: string): string {
    const extension = path.split('.').at(-1);
    switch (extension) {
        case 'css': return 'text/css';
        case 'html': return 'text/html';
        default: return 'text/plain';
    }
}

const app = CompressionHandler(HTMLHandler(() => new HTMLTransformer(new HTMLRewriter()), router));

Bun.serve({
    port: PORT,
    async fetch(req) {
        return app(req);
    },
});

console.log(`Server running at http://localhost:${PORT}`);
