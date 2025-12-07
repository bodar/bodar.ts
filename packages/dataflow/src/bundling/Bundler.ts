export interface Bundler {
    transform(javascript: string): Promise<string>;
}

export class Bundler {
    static noOp: Bundler = {
        async transform(javascript: string): Promise<string> {
            return javascript;
        }
    };
}