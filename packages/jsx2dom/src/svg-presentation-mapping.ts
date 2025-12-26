/**
 * Maps camelCase SVG presentation attribute names to kebab-case.
 * Used at runtime to convert JSX camelCase attributes to proper SVG attribute names.
 */
export const svgPresentationToKebab: Record<string, string> = {
    // Fill
    fillOpacity: 'fill-opacity',
    fillRule: 'fill-rule',
    // Stroke
    strokeWidth: 'stroke-width',
    strokeLinecap: 'stroke-linecap',
    strokeLinejoin: 'stroke-linejoin',
    strokeDasharray: 'stroke-dasharray',
    strokeDashoffset: 'stroke-dashoffset',
    strokeMiterlimit: 'stroke-miterlimit',
    strokeOpacity: 'stroke-opacity',
    // Clip/Mask
    clipPath: 'clip-path',
    clipRule: 'clip-rule',
    // Transform
    transformOrigin: 'transform-origin',
    // Text
    dominantBaseline: 'dominant-baseline',
    textAnchor: 'text-anchor',
    textDecoration: 'text-decoration',
    fontFamily: 'font-family',
    fontSize: 'font-size',
    fontStyle: 'font-style',
    fontWeight: 'font-weight',
    letterSpacing: 'letter-spacing',
    wordSpacing: 'word-spacing',
    // Other presentation attributes
    colorInterpolation: 'color-interpolation',
    colorInterpolationFilters: 'color-interpolation-filters',
    floodColor: 'flood-color',
    floodOpacity: 'flood-opacity',
    lightingColor: 'lighting-color',
    stopColor: 'stop-color',
    stopOpacity: 'stop-opacity',
    shapeRendering: 'shape-rendering',
    textRendering: 'text-rendering',
    imageRendering: 'image-rendering',
    pointerEvents: 'pointer-events',
    markerStart: 'marker-start',
    markerMid: 'marker-mid',
    markerEnd: 'marker-end',
};
