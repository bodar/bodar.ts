import {createBrotliCompress, createDeflate, createGzip} from "node:zlib";
import {Duplex, Transform} from "node:stream";

interface HttpHandler {
    (request: Request): Promise<Response>;
}

type Encoding = "br" | "gzip" | "deflate";

function selectCompression(acceptEncoding: string): { encoding: Encoding, transform: Transform } | undefined {
    if (acceptEncoding.includes("br")) {
        return { encoding: "br", transform: createBrotliCompress() };
    } else if (acceptEncoding.includes("gzip")) {
        return { encoding: "gzip", transform: createGzip() };
    } else if (acceptEncoding.includes("deflate")) {
        return { encoding: "deflate", transform: createDeflate() };
    }
    return undefined;
}

export function CompressionHandler(http: HttpHandler) {
    return async (request: Request) => {
        const response = await http(request);

        if (!response.body) return response;
        if (response.headers.get("Content-Encoding")) return response;

        const compression = selectCompression(request.headers.get("Accept-Encoding") ?? "");
        if (!compression) return response;

        const stream = response.body.pipeThrough(Duplex.toWeb(compression.transform) as any);

        const compressed = new Response(stream, {
            status: response.status,
            statusText: response.statusText,
            headers: new Headers(response.headers),
        });

        compressed.headers.set("Content-Encoding", compression.encoding);
        compressed.headers.delete("Content-Length"); // size changes
        compressed.headers.append("Vary", "Accept-Encoding");

        return compressed;
    }
}
