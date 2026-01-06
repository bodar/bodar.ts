/**
 * Complete set of HTML boolean attributes.
 * When true: setAttribute(name, '')
 * When false: don't set at all
 *
 * Source: https://html.spec.whatwg.org/multipage/indices.html#attributes-3
 */
export const BOOLEAN_ATTRIBUTES = new Set([
    'allowfullscreen',
    'async',
    'autofocus',
    'autoplay',
    'checked',
    'controls',
    'default',
    'defer',
    'disabled',
    'formnovalidate',
    'hidden',
    'inert',
    'ismap',
    'itemscope',
    'loop',
    'multiple',
    'muted',
    'nomodule',
    'novalidate',
    'open',
    'playsinline',
    'readonly',
    'required',
    'reversed',
    'selected',
]);
