import {bundleFile} from "./src/bundling/bundle.ts";
import {ReactiveHandler} from "./src/http/ReactiveHandler.ts";
import {CompressionHandler} from "./src/http/CompressionHandler.ts";
import {HTMLTransformer} from "./src/html/HTMLTransformer.ts";
import {Bundler} from "./src/bundling/Bundler.ts";
import {BunBundler} from "./src/bundling/BunBundler.ts";

const PORT = 3000;
const ROOT = import.meta.dir;

const router = async (request: Request) => {
    let path = new URL(request.url).pathname
    if (path.startsWith('/dataflow/')) path = path.replace('/dataflow/', '/../src/');
    if (path.startsWith('/jsx2dom/')) path = path.replace('/jsx2dom/', '/../../jsx2dom/src/');
    if (path.startsWith('/totallylazy/')) path = path.replace('/totallylazy/', '/../../totallylazy/src/');
    if (path.endsWith('/')) path = `${path}index.html`;
    const filePath = `${ROOT}/docs/${path}`;
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
        return new Response(`Not Found ${filePath} ${file.name}`, {status: 404});
    }

    if (filePath.endsWith('.ts')) {
        let bundled = await bundleFile(filePath, false);
        return new Response(bundled, {
            headers: {'Content-Type': 'application/javascript'}
        });
    }

    return new Response(await file.arrayBuffer(), {headers: {'content-type': mimeTypeFor(filePath)}});
}

function mimeTypeFor(path: string): string {
    const extension = path.split('.').at(-1);
    switch (extension) {
        case 'css':
            return 'text/css';
        case 'html':
            return 'text/html';
        default:
            return 'text/plain';
    }
}

const app = CompressionHandler(ReactiveHandler(() => {
    switch (Bun.env.NODE_ENV) {
        case 'production': {
            return new HTMLTransformer({rewriter: new HTMLRewriter(), bundler: new BunBundler()});
        }
        case 'development':
        default: {
            const importMap = {
                imports: {
                    "@bodar/": "/",
                    "@observablehq/": "https://esm.run/@observablehq/"
                }
            };
            return new HTMLTransformer({rewriter: new HTMLRewriter(), bundler: Bundler.noOp, importMap});
        }
    }
}, router));

Bun.serve({
    port: PORT,
    fetch: app
});

console.log(`Server running at http://localhost:${PORT}`);
