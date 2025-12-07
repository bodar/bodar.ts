import {HTMLTransformer} from "../html/HTMLTransformer.ts";

interface HttpHandler {
    (request: Request): Promise<Response>;
}

export function ReactiveHandler(transformer: () => HTMLTransformer, http: HttpHandler): HttpHandler {
    return async (request: Request) => {
        const response = await http(request);

        if (response.status === 200 && response.headers.get("content-type")?.includes('html')) {
            return transformer().transform(response)
        }
        return response
    }
}
