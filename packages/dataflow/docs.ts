import {file, Glob, write} from "bun";
import {join} from "path";
import {HTMLTransformer} from "./src/html/HTMLTransformer.ts";

const ROOT = import.meta.dir;
const docsDir = join(ROOT, "docs");
const outDir = join(ROOT, "out");

for await (const htmlFile of new Glob("*.html").scan(docsDir)) {
    const content = await file(join(docsDir, htmlFile)).text();
    const transformer = new HTMLTransformer(new HTMLRewriter());
    const output = transformer.transform(content);
    await write(join(outDir, htmlFile), output);
    console.log(`Generated ${htmlFile}`);
}
