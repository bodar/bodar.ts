import type { AttributeToProperty } from './attribute-mapping.js';

// =============================================================================
// Type Utilities
// =============================================================================

/** Remap property names using a mapping object, extracting types from DOM element */
type Remap<T, M extends Record<string, string>> = {
    [K in keyof M as M[K] extends keyof T ? K : never]?:
        M[K] extends keyof T ? T[M[K]] : never
};

/** Pick all properties starting with a prefix */
type PickStartingWith<T, S extends string> = {
    [K in keyof T as K extends `${S}${string}` ? K : never]?: T[K]
};

/** Filter out methods (functions) from a type */
type NonMethods<T> = {
    [K in keyof T as T[K] extends Function ? never : K]: T[K]
};

/** Filter out UPPER_CASE constants */
type NonConstants<T> = {
    [K in keyof T as Uppercase<string & K> extends K ? never : K]: T[K]
};

/** Unwrap SVG animated types to their base value types */
type UnwrapAnimated<T> =
    T extends SVGAnimatedLength ? number | string :
    T extends SVGAnimatedNumber ? number :
    T extends SVGAnimatedString ? string :
    T extends SVGAnimatedBoolean ? boolean :
    T extends SVGAnimatedEnumeration ? number :
    T extends SVGAnimatedInteger ? number :
    T extends SVGAnimatedRect ? string :
    T extends SVGAnimatedLengthList ? string :
    T extends SVGAnimatedNumberList ? string :
    T extends SVGAnimatedPreserveAspectRatio ? string :
    T extends SVGAnimatedTransformList ? string :
    T;

// =============================================================================
// HTML Exclusion Lists
// =============================================================================

/** Readonly/internal properties to exclude from all HTML elements */
type BaseExclusions =
    // Node readonly
    | 'baseURI' | 'childNodes' | 'firstChild' | 'isConnected' | 'lastChild'
    | 'nextSibling' | 'nodeName' | 'nodeType' | 'nodeValue' | 'ownerDocument'
    | 'parentElement' | 'parentNode' | 'previousSibling' | 'textContent'
    // Element readonly
    | 'attributes' | 'classList' | 'clientHeight' | 'clientLeft' | 'clientTop'
    | 'clientWidth' | 'innerHTML' | 'localName' | 'namespaceURI' | 'outerHTML'
    | 'scrollHeight' | 'scrollWidth' | 'shadowRoot' | 'tagName' | 'prefix'
    | 'scrollLeft' | 'scrollTop' | 'slot' | 'assignedSlot'
    // HTMLElement readonly
    | 'accessKeyLabel' | 'offsetHeight' | 'offsetLeft' | 'offsetParent'
    | 'offsetTop' | 'offsetWidth' | 'innerText' | 'outerText'
    // Other internal
    | 'dataset' | 'style' | 'part' | 'attributeStyleMap' | 'isContentEditable';

/** Element-specific exclusions */
type InputExclusions = 'files' | 'form' | 'labels' | 'list' | 'validity' | 'validationMessage' | 'willValidate'
    | 'selectionStart' | 'selectionEnd' | 'selectionDirection' | 'valueAsDate' | 'valueAsNumber';
type ButtonExclusions = 'form' | 'labels' | 'validity' | 'validationMessage' | 'willValidate';
type SelectExclusions = 'form' | 'labels' | 'options' | 'selectedOptions' | 'validity' | 'validationMessage' | 'willValidate';
type TextAreaExclusions = 'form' | 'labels' | 'validity' | 'validationMessage' | 'willValidate'
    | 'selectionStart' | 'selectionEnd' | 'selectionDirection' | 'textLength';
type FormExclusions = 'elements' | 'length';
type AnchorExclusions = 'origin' | 'relList' | 'hash' | 'host' | 'hostname' | 'password' | 'pathname' | 'port' | 'protocol' | 'search' | 'username';
type ImageExclusions = 'complete' | 'currentSrc' | 'naturalHeight' | 'naturalWidth' | 'x' | 'y';
type TableExclusions = 'caption' | 'rows' | 'tBodies' | 'tFoot' | 'tHead';
type TableRowExclusions = 'cells' | 'rowIndex' | 'sectionRowIndex';
type TableCellExclusions = 'cellIndex';

// =============================================================================
// HTML Element Attributes (derived from HTMLElement)
// =============================================================================

type ElementProps<T extends HTMLElement, E extends string = never> =
    & Partial<Omit<NonMethods<NonConstants<T>>, BaseExclusions | E | keyof AttributeToProperty>>
    & Remap<T, AttributeToProperty>
    & Partial<PickStartingWith<T, 'on'>>
    & { style?: Partial<CSSStyleDeclaration> | string };

// =============================================================================
// HTML Element-Specific Interfaces
// =============================================================================

interface HtmlTag extends ElementProps<HTMLElement> {}
interface HtmlAnchorTag extends ElementProps<HTMLAnchorElement, AnchorExclusions> {}
interface HtmlAreaTag extends ElementProps<HTMLAreaElement> {}
interface HtmlAudioTag extends ElementProps<HTMLAudioElement> {}
interface HtmlBaseTag extends ElementProps<HTMLBaseElement> {}
interface HtmlQuoteTag extends ElementProps<HTMLQuoteElement> {}
interface HtmlBodyTag extends ElementProps<HTMLBodyElement> {}
interface HtmlBRTag extends ElementProps<HTMLBRElement> {}
interface HtmlButtonTag extends ElementProps<HTMLButtonElement, ButtonExclusions> {}
interface HtmlCanvasTag extends ElementProps<HTMLCanvasElement> {}
interface HtmlTableCaptionTag extends ElementProps<HTMLTableCaptionElement> {}
interface HtmlTableColTag extends ElementProps<HTMLTableColElement> {}
interface HtmlDataTag extends ElementProps<HTMLDataElement> {}
interface HtmlDataListTag extends ElementProps<HTMLDataListElement> {}
interface HtmlModTag extends ElementProps<HTMLModElement> {}
interface HtmlDetailsTag extends ElementProps<HTMLDetailsElement> {}
interface HtmlDialogTag extends ElementProps<HTMLDialogElement> {}
interface HtmlDivTag extends ElementProps<HTMLDivElement> {}
interface HtmlDListTag extends ElementProps<HTMLDListElement> {}
interface HtmlEmbedTag extends ElementProps<HTMLEmbedElement> {}
interface HtmlFieldSetTag extends ElementProps<HTMLFieldSetElement> {}
interface HtmlFormTag extends ElementProps<HTMLFormElement, FormExclusions> {}
interface HtmlHeadingTag extends ElementProps<HTMLHeadingElement> {}
interface HtmlHeadTag extends ElementProps<HTMLHeadElement> {}
interface HtmlHRTag extends ElementProps<HTMLHRElement> {}
interface HtmlHtmlTag extends ElementProps<HTMLHtmlElement> {}
interface HtmlIFrameTag extends ElementProps<HTMLIFrameElement> {}
interface HtmlImageTag extends ElementProps<HTMLImageElement, ImageExclusions> {}
interface HtmlInputTag extends ElementProps<HTMLInputElement, InputExclusions> {}
interface HtmlLabelTag extends ElementProps<HTMLLabelElement> {}
interface HtmlLegendTag extends ElementProps<HTMLLegendElement> {}
interface HtmlLITag extends ElementProps<HTMLLIElement> {}
interface HtmlLinkTag extends ElementProps<HTMLLinkElement> {}
interface HtmlMapTag extends ElementProps<HTMLMapElement> {}
interface HtmlMenuTag extends ElementProps<HTMLMenuElement> {}
interface HtmlMetaTag extends ElementProps<HTMLMetaElement> {}
interface HtmlMeterTag extends ElementProps<HTMLMeterElement> {}
interface HtmlObjectTag extends ElementProps<HTMLObjectElement> {}
interface HtmlOListTag extends ElementProps<HTMLOListElement> {}
interface HtmlOptGroupTag extends ElementProps<HTMLOptGroupElement> {}
interface HtmlOptionTag extends ElementProps<HTMLOptionElement> {}
interface HtmlOutputTag extends ElementProps<HTMLOutputElement> {}
interface HtmlParagraphTag extends ElementProps<HTMLParagraphElement> {}
interface HtmlPictureTag extends ElementProps<HTMLPictureElement> {}
interface HtmlPreTag extends ElementProps<HTMLPreElement> {}
interface HtmlProgressTag extends ElementProps<HTMLProgressElement> {}
interface HtmlScriptTag extends ElementProps<HTMLScriptElement> {}
interface HtmlSelectTag extends ElementProps<HTMLSelectElement, SelectExclusions> {}
interface HtmlSlotTag extends ElementProps<HTMLSlotElement> {}
interface HtmlSourceTag extends ElementProps<HTMLSourceElement> {}
interface HtmlSpanTag extends ElementProps<HTMLSpanElement> {}
interface HtmlStyleTag extends ElementProps<HTMLStyleElement> {}
interface HtmlTableTag extends ElementProps<HTMLTableElement, TableExclusions> {}
interface HtmlTableSectionTag extends ElementProps<HTMLTableSectionElement> {}
interface HtmlTableCellTag extends ElementProps<HTMLTableCellElement, TableCellExclusions> {}
interface HtmlTemplateTag extends ElementProps<HTMLTemplateElement> {}
interface HtmlTextAreaTag extends ElementProps<HTMLTextAreaElement, TextAreaExclusions> {}
interface HtmlTimeTag extends ElementProps<HTMLTimeElement> {}
interface HtmlTitleTag extends ElementProps<HTMLTitleElement> {}
interface HtmlTableRowTag extends ElementProps<HTMLTableRowElement, TableRowExclusions> {}
interface HtmlTrackTag extends ElementProps<HTMLTrackElement> {}
interface HtmlUListTag extends ElementProps<HTMLUListElement> {}
interface HtmlVideoTag extends ElementProps<HTMLVideoElement> {}

// =============================================================================
// SVG Exclusion Lists
// =============================================================================

/** Readonly/internal properties to exclude from all SVG elements */
type SvgBaseExclusions =
    // Node readonly (same as HTML)
    | 'baseURI' | 'childNodes' | 'firstChild' | 'isConnected' | 'lastChild'
    | 'nextSibling' | 'nodeName' | 'nodeType' | 'nodeValue' | 'ownerDocument'
    | 'parentElement' | 'parentNode' | 'previousSibling' | 'textContent'
    // Element readonly
    | 'attributes' | 'classList' | 'clientHeight' | 'clientLeft' | 'clientTop'
    | 'clientWidth' | 'innerHTML' | 'localName' | 'namespaceURI' | 'outerHTML'
    | 'scrollHeight' | 'scrollWidth' | 'shadowRoot' | 'tagName' | 'prefix'
    | 'scrollLeft' | 'scrollTop' | 'slot' | 'assignedSlot'
    // SVG specific readonly
    | 'ownerSVGElement' | 'viewportElement' | 'correspondingElement' | 'correspondingUseElement'
    // Other internal
    | 'dataset' | 'style' | 'part' | 'attributeStyleMap';

// =============================================================================
// SVG Presentation Attributes
// =============================================================================

/** camelCase presentation attributes with corrected types for SVG */
interface SvgPresentationCamel {
    fill?: string;
    fillOpacity?: string | number;
    fillRule?: string;
    stroke?: string;
    strokeWidth?: string | number;
    strokeLinecap?: string;
    strokeLinejoin?: string;
    strokeDasharray?: string;
    strokeDashoffset?: string | number;
    strokeMiterlimit?: string | number;
    strokeOpacity?: string | number;
    opacity?: string | number;
    clipPath?: string;
    clipRule?: string;
    mask?: string;
    filter?: string;
    transform?: string;
    transformOrigin?: string;
    visibility?: string;
    display?: string;
    overflow?: string;
    cursor?: string;
}

/** kebab-case presentation attributes */
interface SvgPresentationKebab {
    'fill-opacity'?: string | number;
    'fill-rule'?: string;
    'stroke-width'?: string | number;
    'stroke-linecap'?: string;
    'stroke-linejoin'?: string;
    'stroke-dasharray'?: string;
    'stroke-dashoffset'?: string | number;
    'stroke-miterlimit'?: string | number;
    'stroke-opacity'?: string | number;
    'clip-path'?: string;
    'clip-rule'?: string;
    'transform-origin'?: string;
    // Text presentation
    'dominant-baseline'?: string;
    'text-anchor'?: string;
    'text-decoration'?: string;
    'font-family'?: string;
    'font-size'?: string | number;
    'font-style'?: string;
    'font-weight'?: string | number;
    'letter-spacing'?: string | number;
    'word-spacing'?: string | number;
    // Other presentation
    'color-interpolation'?: string;
    'color-interpolation-filters'?: string;
    'flood-color'?: string;
    'flood-opacity'?: string | number;
    'lighting-color'?: string;
    'stop-color'?: string;
    'stop-opacity'?: string | number;
    'shape-rendering'?: string;
    'text-rendering'?: string;
    'image-rendering'?: string;
    'pointer-events'?: string;
    'marker-start'?: string;
    'marker-mid'?: string;
    'marker-end'?: string;
}

/** Combined presentation attributes (both camelCase and kebab-case) */
type SvgPresentationAttributes = SvgPresentationCamel & SvgPresentationKebab;

// =============================================================================
// SVG Core Attributes (not in DOM but needed for JSX)
// =============================================================================

/** Common SVG attributes available on all elements */
interface SvgCoreAttributes {
    id?: string;
    class?: string;
    style?: Partial<CSSStyleDeclaration> | string;
    tabindex?: number;
}

/** Positional attributes for elements that support x/y */
interface SvgPositionalAttributes {
    x?: number | string;
    y?: number | string;
}

/** Dimensional attributes */
interface SvgDimensionalAttributes {
    width?: number | string;
    height?: number | string;
}

// =============================================================================
// SVG Element Attributes (derived from SVGElement with unwrapping)
// =============================================================================

type SvgElementProps<T extends SVGElement, E extends string = never> =
    & { [K in keyof NonMethods<NonConstants<T>> as K extends (SvgBaseExclusions | E) ? never : K]?: UnwrapAnimated<T[K]> }
    & SvgPresentationAttributes
    & SvgCoreAttributes
    & Partial<PickStartingWith<T, 'on'>>;

// =============================================================================
// SVG Element-Specific Interfaces
// =============================================================================

// Container elements
interface SvgSvgTag extends SvgElementProps<SVGSVGElement>, SvgPositionalAttributes, SvgDimensionalAttributes {
    viewBox?: string;
    preserveAspectRatio?: string;
    xmlns?: string;
}
interface SvgGTag extends SvgElementProps<SVGGElement> {}
interface SvgDefsTag extends SvgElementProps<SVGDefsElement> {}
interface SvgSymbolTag extends SvgElementProps<SVGSymbolElement> {
    viewBox?: string;
    preserveAspectRatio?: string;
}
interface SvgUseTag extends SvgElementProps<SVGUseElement>, SvgPositionalAttributes, SvgDimensionalAttributes {
    href?: string;
}
interface SvgSwitchTag extends SvgElementProps<SVGSwitchElement> {}

// Shape elements
interface SvgCircleTag extends SvgElementProps<SVGCircleElement> {}
interface SvgEllipseTag extends SvgElementProps<SVGEllipseElement> {}
interface SvgLineTag extends SvgElementProps<SVGLineElement> {}
interface SvgPathTag extends SvgElementProps<SVGPathElement> {
    d?: string;
}
interface SvgPolygonTag extends SvgElementProps<SVGPolygonElement> {
    points?: string;
}
interface SvgPolylineTag extends SvgElementProps<SVGPolylineElement> {
    points?: string;
}
interface SvgRectTag extends SvgElementProps<SVGRectElement> {}

// Text elements (exclude x, y, dx, dy from derived - they're SVGAnimatedLengthList which maps to string)
interface SvgTextTag extends SvgElementProps<SVGTextElement, 'x' | 'y' | 'dx' | 'dy'> {
    x?: number | string;
    y?: number | string;
    dx?: number | string;
    dy?: number | string;
}
interface SvgTspanTag extends SvgElementProps<SVGTSpanElement, 'x' | 'y' | 'dx' | 'dy'> {
    x?: number | string;
    y?: number | string;
    dx?: number | string;
    dy?: number | string;
}
interface SvgTextPathTag extends SvgElementProps<SVGTextPathElement> {
    href?: string;
    startOffset?: number | string;
}

// Gradient elements
interface SvgLinearGradientTag extends SvgElementProps<SVGLinearGradientElement> {
    x1?: number | string;
    y1?: number | string;
    x2?: number | string;
    y2?: number | string;
    gradientUnits?: string;
    gradientTransform?: string;
}
interface SvgRadialGradientTag extends SvgElementProps<SVGRadialGradientElement> {
    cx?: number | string;
    cy?: number | string;
    r?: number | string;
    fx?: number | string;
    fy?: number | string;
    gradientUnits?: string;
    gradientTransform?: string;
}
interface SvgStopTag extends SvgElementProps<SVGStopElement> {
    offset?: number | string;
}

// Clipping/masking
interface SvgClipPathTag extends SvgElementProps<SVGClipPathElement> {}
interface SvgMaskTag extends SvgElementProps<SVGMaskElement> {}

// Markers/patterns
interface SvgMarkerTag extends SvgElementProps<SVGMarkerElement> {}
interface SvgPatternTag extends SvgElementProps<SVGPatternElement> {}

// Filter elements
interface SvgFilterTag extends SvgElementProps<SVGFilterElement> {}
interface SvgFeBlendTag extends SvgElementProps<SVGFEBlendElement> {}
interface SvgFeColorMatrixTag extends SvgElementProps<SVGFEColorMatrixElement> {}
interface SvgFeComponentTransferTag extends SvgElementProps<SVGFEComponentTransferElement> {}
interface SvgFeCompositeTag extends SvgElementProps<SVGFECompositeElement> {}
interface SvgFeConvolveMatrixTag extends SvgElementProps<SVGFEConvolveMatrixElement> {}
interface SvgFeDiffuseLightingTag extends SvgElementProps<SVGFEDiffuseLightingElement> {}
interface SvgFeDisplacementMapTag extends SvgElementProps<SVGFEDisplacementMapElement> {}
interface SvgFeDistantLightTag extends SvgElementProps<SVGFEDistantLightElement> {}
interface SvgFeDropShadowTag extends SvgElementProps<SVGFEDropShadowElement> {}
interface SvgFeFloodTag extends SvgElementProps<SVGFEFloodElement> {}
interface SvgFeFuncATag extends SvgElementProps<SVGFEFuncAElement> {}
interface SvgFeFuncBTag extends SvgElementProps<SVGFEFuncBElement> {}
interface SvgFeFuncGTag extends SvgElementProps<SVGFEFuncGElement> {}
interface SvgFeFuncRTag extends SvgElementProps<SVGFEFuncRElement> {}
interface SvgFeGaussianBlurTag extends SvgElementProps<SVGFEGaussianBlurElement> {
    stdDeviation?: number | string;
}
interface SvgFeImageTag extends SvgElementProps<SVGFEImageElement> {}
interface SvgFeMergeTag extends SvgElementProps<SVGFEMergeElement> {}
interface SvgFeMergeNodeTag extends SvgElementProps<SVGFEMergeNodeElement> {}
interface SvgFeMorphologyTag extends SvgElementProps<SVGFEMorphologyElement> {}
interface SvgFeOffsetTag extends SvgElementProps<SVGFEOffsetElement> {}
interface SvgFePointLightTag extends SvgElementProps<SVGFEPointLightElement> {}
interface SvgFeSpecularLightingTag extends SvgElementProps<SVGFESpecularLightingElement> {}
interface SvgFeSpotLightTag extends SvgElementProps<SVGFESpotLightElement> {}
interface SvgFeTileTag extends SvgElementProps<SVGFETileElement> {}
interface SvgFeTurbulenceTag extends SvgElementProps<SVGFETurbulenceElement> {}

// Other elements
interface SvgImageTag extends SvgElementProps<SVGImageElement> {}
interface SvgForeignObjectTag extends SvgElementProps<SVGForeignObjectElement> {}
interface SvgViewTag extends SvgElementProps<SVGViewElement> {}

// Descriptive elements (use base SVGElement)
interface SvgTitleTag extends SvgElementProps<SVGTitleElement> {}
interface SvgDescTag extends SvgElementProps<SVGDescElement> {}
interface SvgMetadataTag extends SvgElementProps<SVGMetadataElement> {}

// Animation elements
interface SvgAnimateTag extends SvgElementProps<SVGAnimateElement> {}
interface SvgAnimateMotionTag extends SvgElementProps<SVGAnimateMotionElement> {}
interface SvgAnimateTransformTag extends SvgElementProps<SVGAnimateTransformElement> {}
interface SvgMpathTag extends SvgElementProps<SVGMPathElement> {}
interface SvgSetTag extends SvgElementProps<SVGSetElement> {}

// =============================================================================
// JSX Namespace
// =============================================================================

declare global {
    namespace JSX {
        type Element = HTMLElement | SVGElement;

        interface IntrinsicElements {
            // HTML elements
            a: HtmlAnchorTag;
            abbr: HtmlTag;
            address: HtmlTag;
            area: HtmlAreaTag;
            article: HtmlTag;
            aside: HtmlTag;
            audio: HtmlAudioTag;
            b: HtmlTag;
            base: HtmlBaseTag;
            bdi: HtmlTag;
            bdo: HtmlTag;
            blockquote: HtmlQuoteTag;
            body: HtmlBodyTag;
            br: HtmlBRTag;
            button: HtmlButtonTag;
            canvas: HtmlCanvasTag;
            caption: HtmlTableCaptionTag;
            cite: HtmlTag;
            code: HtmlTag;
            col: HtmlTableColTag;
            colgroup: HtmlTableColTag;
            data: HtmlDataTag;
            datalist: HtmlDataListTag;
            dd: HtmlTag;
            del: HtmlModTag;
            details: HtmlDetailsTag;
            dfn: HtmlTag;
            dialog: HtmlDialogTag;
            div: HtmlDivTag;
            dl: HtmlDListTag;
            dt: HtmlTag;
            em: HtmlTag;
            embed: HtmlEmbedTag;
            fieldset: HtmlFieldSetTag;
            figcaption: HtmlTag;
            figure: HtmlTag;
            footer: HtmlTag;
            form: HtmlFormTag;
            h1: HtmlHeadingTag;
            h2: HtmlHeadingTag;
            h3: HtmlHeadingTag;
            h4: HtmlHeadingTag;
            h5: HtmlHeadingTag;
            h6: HtmlHeadingTag;
            head: HtmlHeadTag;
            header: HtmlTag;
            hgroup: HtmlTag;
            hr: HtmlHRTag;
            html: HtmlHtmlTag;
            i: HtmlTag;
            iframe: HtmlIFrameTag;
            img: HtmlImageTag;
            input: HtmlInputTag;
            ins: HtmlModTag;
            kbd: HtmlTag;
            label: HtmlLabelTag;
            legend: HtmlLegendTag;
            li: HtmlLITag;
            link: HtmlLinkTag;
            main: HtmlTag;
            map: HtmlMapTag;
            mark: HtmlTag;
            menu: HtmlMenuTag;
            meta: HtmlMetaTag;
            meter: HtmlMeterTag;
            nav: HtmlTag;
            noscript: HtmlTag;
            object: HtmlObjectTag;
            ol: HtmlOListTag;
            optgroup: HtmlOptGroupTag;
            option: HtmlOptionTag;
            output: HtmlOutputTag;
            p: HtmlParagraphTag;
            picture: HtmlPictureTag;
            pre: HtmlPreTag;
            progress: HtmlProgressTag;
            q: HtmlQuoteTag;
            rp: HtmlTag;
            rt: HtmlTag;
            ruby: HtmlTag;
            s: HtmlTag;
            samp: HtmlTag;
            script: HtmlScriptTag;
            search: HtmlTag;
            section: HtmlTag;
            select: HtmlSelectTag;
            slot: HtmlSlotTag;
            small: HtmlTag;
            source: HtmlSourceTag;
            span: HtmlSpanTag;
            strong: HtmlTag;
            style: HtmlStyleTag;
            sub: HtmlTag;
            summary: HtmlTag;
            sup: HtmlTag;
            table: HtmlTableTag;
            tbody: HtmlTableSectionTag;
            td: HtmlTableCellTag;
            template: HtmlTemplateTag;
            textarea: HtmlTextAreaTag;
            tfoot: HtmlTableSectionTag;
            th: HtmlTableCellTag;
            thead: HtmlTableSectionTag;
            time: HtmlTimeTag;
            title: HtmlTitleTag;
            tr: HtmlTableRowTag;
            track: HtmlTrackTag;
            u: HtmlTag;
            ul: HtmlUListTag;
            var: HtmlTag;
            video: HtmlVideoTag;
            wbr: HtmlTag;

            // SVG elements
            svg: SvgSvgTag;
            g: SvgGTag;
            defs: SvgDefsTag;
            symbol: SvgSymbolTag;
            use: SvgUseTag;
            switch: SvgSwitchTag;
            circle: SvgCircleTag;
            ellipse: SvgEllipseTag;
            line: SvgLineTag;
            path: SvgPathTag;
            polygon: SvgPolygonTag;
            polyline: SvgPolylineTag;
            rect: SvgRectTag;
            text: SvgTextTag;
            tspan: SvgTspanTag;
            textPath: SvgTextPathTag;
            linearGradient: SvgLinearGradientTag;
            radialGradient: SvgRadialGradientTag;
            stop: SvgStopTag;
            clipPath: SvgClipPathTag;
            mask: SvgMaskTag;
            marker: SvgMarkerTag;
            pattern: SvgPatternTag;
            filter: SvgFilterTag;
            feBlend: SvgFeBlendTag;
            feColorMatrix: SvgFeColorMatrixTag;
            feComponentTransfer: SvgFeComponentTransferTag;
            feComposite: SvgFeCompositeTag;
            feConvolveMatrix: SvgFeConvolveMatrixTag;
            feDiffuseLighting: SvgFeDiffuseLightingTag;
            feDisplacementMap: SvgFeDisplacementMapTag;
            feDistantLight: SvgFeDistantLightTag;
            feDropShadow: SvgFeDropShadowTag;
            feFlood: SvgFeFloodTag;
            feFuncA: SvgFeFuncATag;
            feFuncB: SvgFeFuncBTag;
            feFuncG: SvgFeFuncGTag;
            feFuncR: SvgFeFuncRTag;
            feGaussianBlur: SvgFeGaussianBlurTag;
            feImage: SvgFeImageTag;
            feMerge: SvgFeMergeTag;
            feMergeNode: SvgFeMergeNodeTag;
            feMorphology: SvgFeMorphologyTag;
            feOffset: SvgFeOffsetTag;
            fePointLight: SvgFePointLightTag;
            feSpecularLighting: SvgFeSpecularLightingTag;
            feSpotLight: SvgFeSpotLightTag;
            feTile: SvgFeTileTag;
            feTurbulence: SvgFeTurbulenceTag;
            image: SvgImageTag;
            foreignObject: SvgForeignObjectTag;
            view: SvgViewTag;
            desc: SvgDescTag;
            metadata: SvgMetadataTag;
            animate: SvgAnimateTag;
            animateMotion: SvgAnimateMotionTag;
            animateTransform: SvgAnimateTransformTag;
            mpath: SvgMpathTag;
            set: SvgSetTag;
        }
    }
}

export {};
