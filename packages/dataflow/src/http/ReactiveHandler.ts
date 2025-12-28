/** @module */

import {HTMLTransformer} from "../html/HTMLTransformer.ts";

/** HTTP request handler function type */
interface HttpHandler {
    (request: Request): Promise<Response>;
}

/** Middleware that transforms HTML responses using the provided transformer */
export function ReactiveHandler(transformer: () => HTMLTransformer, http: HttpHandler): HttpHandler {
    return async (request: Request) => {
        const response = await http(request);

        if (response.status === 200 && response.headers.get("content-type")?.includes('html')) {
            return transformer().transform(response)
        }
        return response
    }
}
