import type {SupportedElement} from "./JSX2DOM.ts";

/**
 * Set of SVG element names for runtime detection.
 * Used to determine when to use createElementNS with SVG namespace.
 */
export const SVG_ELEMENTS = new Set([
    // Shapes
    'svg', 'circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect',
    // Container/structure
    'g', 'defs', 'symbol', 'use', 'clipPath', 'mask', 'marker', 'pattern',
    // Text
    'text', 'tspan', 'textPath',
    // Gradients
    'linearGradient', 'radialGradient', 'stop',
    // Filters
    'filter', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite',
    'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight',
    'feDropShadow', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
    'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode', 'feMorphology',
    'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence',
    // Other
    'image', 'foreignObject', 'switch', 'title', 'desc', 'metadata', 'view',
    // Animation
    'animate', 'animateMotion', 'animateTransform', 'mpath', 'set',
]);

export function isSVG(tag: string | SupportedElement) {
    return SVG_ELEMENTS.has(typeof tag === 'string' ? tag : tag.tagName);
}
