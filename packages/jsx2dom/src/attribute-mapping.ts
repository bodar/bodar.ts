/**
 * Maps HTML attribute names to DOM property names.
 * Single source of truth for both types and runtime.
 */
export const attributeToProperty = {
    'class': 'className',
    'for': 'htmlFor',
    'readonly': 'readOnly',
    'maxlength': 'maxLength',
    'minlength': 'minLength',
    'tabindex': 'tabIndex',
    'colspan': 'colSpan',
    'rowspan': 'rowSpan',
    'datetime': 'dateTime',
    'enctype': 'encType',
    'formaction': 'formAction',
    'formmethod': 'formMethod',
    'formtarget': 'formTarget',
    'formnovalidate': 'formNoValidate',
    'contenteditable': 'contentEditable',
    'accesskey': 'accessKey',
    'autocomplete': 'autoComplete',
    'autofocus': 'autoFocus',
    'autoplay': 'autoPlay',
    'cellpadding': 'cellPadding',
    'cellspacing': 'cellSpacing',
    'charset': 'charSet',
    'classname': 'className',
    'crossorigin': 'crossOrigin',
    'defaultchecked': 'defaultChecked',
    'defaultvalue': 'defaultValue',
    'frameborder': 'frameBorder',
    'hreflang': 'hrefLang',
    'htmlfor': 'htmlFor',
    'httpequiv': 'httpEquiv',
    'inputmode': 'inputMode',
    'novalidate': 'noValidate',
    'srcset': 'srcSet',
    'srclang': 'srcLang',
    'srcdoc': 'srcDoc',
    'usemap': 'useMap',
} as const;

export type AttributeToProperty = typeof attributeToProperty;
