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

// =============================================================================
// Exclusion Lists
// =============================================================================

/** Readonly/internal properties to exclude from all elements */
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
// Base Element Attributes (derived from HTMLElement)
// =============================================================================

type ElementProps<T extends HTMLElement, E extends string = never> =
    & Partial<Omit<NonMethods<NonConstants<T>>, BaseExclusions | E | keyof AttributeToProperty>>
    & Remap<T, AttributeToProperty>
    & Partial<PickStartingWith<T, 'on'>>
    & { style?: Partial<CSSStyleDeclaration> | string };

// =============================================================================
// Element-Specific Interfaces
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
// JSX Namespace
// =============================================================================

declare global {
    namespace JSX {
        type Element = HTMLElement;

        interface IntrinsicElements {
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
        }
    }
}

export {};
