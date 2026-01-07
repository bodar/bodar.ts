import {describe, expect, it} from "bun:test";
import {parseHTML} from "linkedom";
import {autoKeyEvents, JSX2DOM} from "../src/JSX2DOM.ts";
import {chain} from "@bodar/yadic/chain.ts";

describe("JSX2DOM", () => {
    it("enables JSX and Linkedom to work together without global pollution", async () => {
        const html = parseHTML('...'); // creates html, head, body
        const jsx = new JSX2DOM(html)
        html.document.body.appendChild(<div class="Foo"><input/>Test</div>);
        expect(html.document.body.toString()).toEqual('<body><div class="Foo"><input>Test</div></body>');
    });

    it("can create a document from scratch", async () => {
        const html = parseHTML('');
        const jsx = new JSX2DOM(html)
        html.document.appendChild(<html lang="en">
        <head>
            <title>Test</title>
        </head>
        <body>
        <div>Hello</div>
        </body>
        </html>);
        expect(html.document.toString()).toEqual(`<html lang="en"><head><title>Test</title></head><body><div>Hello</div></body></html>`);
    });

    it("can pass an array of jsx through", async () => {
        const html = parseHTML('');
        const jsx = new JSX2DOM(html)
        html.document.appendChild(<html lang="en">
        <head>
            {
                [
                    <title>Test</title>,
                    <link rel="stylesheet"/>
                ]
            }
        </head>
        <body>
        </body>
        </html>);
        expect(html.document.head.toString()).toEqual(`<head><title>Test</title><link rel="stylesheet"></head>`);
    });

    it("can attach an event", async () => {
        const html = parseHTML('');
        const jsx = new JSX2DOM(html)
        let count = 0;
        html.document.appendChild(<html lang="en">
        <head>
            {
                [
                    <title>Test</title>,
                    <link rel="stylesheet"/>
                ]
            }
        </head>
        <body onclick={() => count++}>
        </body>
        </html>);
        expect(count).toEqual(0);
        html.document.body.click();
        expect(count).toEqual(1);
    });

    it("autoKeyEvents adds data-key to elements with event handlers", async () => {
        const html = parseHTML('<html><head></head><body></body></html>');
        const jsx = new JSX2DOM(chain({onEventListener: autoKeyEvents()}, html));
        const div1 = <div onclick={() => {}}/>;
        const div2 = <div onmouseover={() => {}}/>;
        const div3 = <div class="no-events"/>;
        expect(div1.getAttribute('data-key')).toBe('0');
        expect(div2.getAttribute('data-key')).toBe('1');
        expect(div3.getAttribute('data-key')).toBeNull();
    });

    it("handles style as a string", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<div style="color: red; font-size: 14px">Styled</div>);
        expect(html.document.body.innerHTML).toEqual('<div style="color: red; font-size: 14px">Styled</div>')
    });

    it("handles style as an object", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<div style={{ color: 'blue', fontSize: '16px' }}>Styled</div>);
        expect(html.document.body.innerHTML).toEqual('<div style="color:blue;font-size:16px">Styled</div>')
    });
});

describe("JSX2DOM HTML Attributes", () => {
    it("uses setAttribute for all attributes (isEqualNode compatible)", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        const div1 = <div class="test" id="foo" tabindex={5}/>;
        const div2 = html.document.createElement('div');
        div2.setAttribute('class', 'test');
        div2.setAttribute('id', 'foo');
        div2.setAttribute('tabindex', '5');
        expect(div1.isEqualNode(div2)).toBe(true);
    });

    it("sets 'class' attribute directly", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<div class="test-class"/>);
        expect(html.document.body.innerHTML).toEqual('<div class="test-class"></div>');
    });

    it("sets 'for' attribute on labels", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<label for="input-id">Label</label>);
        expect(html.document.body.innerHTML).toEqual('<label for="input-id">Label</label>');
    });

    it("sets 'tabindex' attribute (lowercase)", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<div tabindex={5}/>);
        expect(html.document.body.innerHTML).toEqual('<div tabindex="5"></div>');
    });

    it("sets 'colspan' attribute on table cells", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<td colspan={2}>Cell</td>);
        expect(html.document.body.innerHTML).toEqual('<td colspan="2">Cell</td>');
    });

    it("sets 'rowspan' attribute on table cells", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<td rowspan={3}>Cell</td>);
        expect(html.document.body.innerHTML).toEqual('<td rowspan="3">Cell</td>');
    });

    it("sets 'maxlength' attribute on inputs", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<input maxlength={100}/>);
        expect(html.document.body.innerHTML).toEqual('<input maxlength="100">');
    });

    it("supports data-* attributes", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<div data-testid="my-element" data-value={42}/>);
        expect(html.document.body.innerHTML).toContain('data-testid="my-element"');
        expect(html.document.body.innerHTML).toContain('data-value="42"');
    });

    it("supports aria-* attributes", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<button aria-label="Close" aria-hidden={false}/>);
        expect(html.document.body.innerHTML).toContain('aria-label="Close"');
        expect(html.document.body.innerHTML).toContain('aria-hidden="false"');
    });
});

describe("JSX2DOM Boolean Attributes", () => {
    it("sets boolean attribute when true", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<input checked={true}/>);
        expect(html.document.body.innerHTML).toEqual('<input checked>');
    });

    it("omits boolean attribute when false", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<input checked={false}/>);
        expect(html.document.body.innerHTML).toEqual('<input>');
    });

    it("can set an attribute without a value", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<input checked/>);
        expect(html.document.body.innerHTML).toEqual('<input checked>');
    });

    it("handles disabled attribute", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<button disabled={true}>Click</button>);
        expect(html.document.body.innerHTML).toEqual('<button disabled>Click</button>');
    });

    it("handles required attribute", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<input required={true}/>);
        expect(html.document.body.innerHTML).toEqual('<input required>');
    });

    it("handles hidden attribute", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<div hidden={true}>Hidden</div>);
        expect(html.document.body.innerHTML).toEqual('<div hidden>Hidden</div>');
    });

    it("handles readonly attribute", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<input readonly={true}/>);
        expect(html.document.body.innerHTML).toEqual('<input readonly>');
    });

    it("handles multiple attribute on select", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<select multiple={true}/>);
        expect(html.document.body.innerHTML).toEqual('<select multiple></select>');
    });

    it("handles open attribute on details", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<details open={true}><summary>Title</summary></details>);
        expect(html.document.body.innerHTML).toContain('<details open>');
    });

    it("handles multiple boolean attributes together", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<input type="checkbox" checked={true} disabled={true} required={false}/>);
        const output = html.document.body.innerHTML;
        expect(output).toContain('checked');
        expect(output).toContain('disabled');
        expect(output).not.toContain('required');
    });
});

describe("JSX2DOM isEqualNode Compatibility", () => {
    it("produces equal nodes for same attributes", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);

        const jsx1 = <div class="test" id="foo" tabindex={5}/>;
        const jsx2 = <div class="test" id="foo" tabindex={5}/>;

        expect(jsx1.isEqualNode(jsx2)).toBe(true);
    });

    it("produces nodes equal to manually created ones", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);

        const jsxDiv = <div class="test" id="myid"/>;

        const manualDiv = html.document.createElement('div');
        manualDiv.setAttribute('class', 'test');
        manualDiv.setAttribute('id', 'myid');

        expect(jsxDiv.isEqualNode(manualDiv)).toBe(true);
    });

    it("detects differences in attributes", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);

        const div1 = <div class="foo"/>;
        const div2 = <div class="bar"/>;

        expect(div1.isEqualNode(div2)).toBe(false);
    });

    it("detects differences in styles", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);

        const div1 = <div style={{ color: 'blue' }}/>;
        const div2 = <div style={{ color: 'red' }}/>;

        expect(div1.isEqualNode(div2)).toBe(false);
    });
});

describe("JSX2DOM SVG Support", () => {
    it("creates SVG elements with correct namespace", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        const svg = <svg viewBox="0 0 100 100"><circle cx={50} cy={50} r={40}/></svg>;
        expect(svg.namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });

    it("sets SVG attributes via setAttribute", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<circle cx={50} cy={50} r={40} fill="red"/>);
        expect(html.document.body.innerHTML).toEqual('<circle fill="red" r="40" cy="50" cx="50" />');
    });

    it("handles kebab-case presentation attributes", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<path d="M0 0" stroke-width={2} stroke-linecap="round"/>);
        expect(html.document.body.innerHTML).toEqual('<path stroke-linecap="round" stroke-width="2" d="M0 0" />');
    });

    it("handles SVG text elements with kebab-case attributes", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<text x={10} y={20} font-size={14} text-anchor="middle">Hello</text>);
        expect(html.document.body.innerHTML).toContain('font-size="14"');
        expect(html.document.body.innerHTML).toContain('text-anchor="middle"');
    });

    it("handles gradient elements", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<linearGradient id="grad1"><stop offset="0%" stop-color="red"/></linearGradient>);
        expect(html.document.body.innerHTML).toEqual('<linearGradient id="grad1"><stop stop-color="red" offset="0%" /></linearGradient>');
    });

    it("handles filter elements", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<filter id="blur"><feGaussianBlur stdDeviation={5}/></filter>);
        expect(html.document.body.innerHTML).toEqual('<filter id="blur"><feGaussianBlur stdDeviation="5" /></filter>');
    });

    it("can embed SVG in HTML", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<svg viewBox="0 0 100 100"><circle cx={50} cy={50} r={40}/></svg>);
        expect(html.document.body.innerHTML).toEqual('<svg viewBox="0 0 100 100"><circle r="40" cy="50" cx="50" /></svg>');
    });

    it("handles fill-opacity and stroke-opacity", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<rect fill-opacity={0.5} stroke-opacity={0.8}/>);
        expect(html.document.body.innerHTML).toContain('fill-opacity="0.5"');
        expect(html.document.body.innerHTML).toContain('stroke-opacity="0.8"');
    });
});
