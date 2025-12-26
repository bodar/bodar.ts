import {describe, expect, it} from "bun:test";
import {parseHTML} from "linkedom";
import {JSX2DOM} from "../src/JSX2DOM.ts";

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

    // Linkedom does not implement checked properties in HTMLInputElement
    it.skip("can set a boolean HTML attributes", async () => {
        const html = parseHTML('...'); // creates html, head, body
        const jsx = new JSX2DOM(html)
        html.document.body.appendChild(<form><input checked={true}/><input checked={false}/></form>);
        expect(html.document.body.innerHTML).toEqual('<form><input checked/><input/></form>');
    });

    it("maps 'class' attribute to className property", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        const div = <div class="test-class"/>;
        expect(div.className).toEqual('test-class');
    });

    // Linkedom doesn't implement htmlFor, but it will just fall back to setAttribute
    it("maps 'for' attribute to htmlFor property on labels", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<label for="input-id">Label</label>);
        expect(html.document.body.innerHTML).toEqual('<label for="input-id">Label</label>');
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

    it("maps tabindex attribute to tabIndex property", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        const div = <div tabindex={5}>Focusable</div>;
        expect((div as HTMLElement).tabIndex).toEqual(5);
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

    it("converts camelCase presentation attributes to kebab-case", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<path d="M0 0" strokeWidth={3} strokeLinecap="square"/>);
        expect(html.document.body.innerHTML).toEqual('<path stroke-linecap="square" stroke-width="3" d="M0 0" />');
    });

    it("handles SVG text elements", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(<text x={10} y={20} font-size={14}>Hello</text>);
        expect(html.document.body.innerHTML).toEqual('<text font-size="14" y="20" x="10">Hello</text>');
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
});