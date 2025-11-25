import {HTMLTransformer} from "@bodar/dataflow/html/HTMLTransformer.ts";

const PORT = 3000;
const ROOT = import.meta.dir;

Bun.serve({
    port: PORT,
    async fetch(req) {
        let path = new URL(req.url).pathname
        if (path.startsWith('/dataflow/')) path = path.replace('/dataflow/', '/src/');
        if (path.startsWith('/totallylazy/')) path = path.replace('/totallylazy/', '/../totallylazy/src/');
        if (path.startsWith('/jsx2dom/')) path = path.replace('/jsx2dom/', '/../jsx2dom/src/');
        const filePath = `${ROOT}${path}`;
        const file = Bun.file(filePath);

        if (!(await file.exists())) {
            return new Response(`Not Found ${filePath} ${file.name}`, {status: 404});
        }

        if (filePath.endsWith('.html')) {
            const transformer = new HTMLTransformer(new HTMLRewriter());
            return new Response(transformer.transform(await file.text()), {
                headers: {'Content-Type': 'text/html'}
            });
        } else if (filePath.endsWith('.ts')) {
            const result = await Bun.build({
                entrypoints: [filePath],
                outdir: `${ROOT}/out`
            });
            let bundled: string | undefined;
            for (const output of result.outputs) {
                bundled = await output.text();
                break;
            }
            return new Response(bundled, {
                headers: {'Content-Type': 'application/javascript'}
            });
        }

        return new Response(file);
    },
});

console.log(`Server running at http://localhost:${PORT}`);
