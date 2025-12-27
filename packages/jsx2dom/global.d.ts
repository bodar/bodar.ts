// Global JSX namespace for local development
// This file is NOT published to JSR (only src/ is published)
import type { JSX as JSX2DOMJSX } from './src/types.js';

declare global {
    namespace JSX {
        type Element = JSX2DOMJSX.Element;
        interface IntrinsicElements extends JSX2DOMJSX.IntrinsicElements {}
    }
}
