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
        expect(svg.tagName.toLowerCase()).toEqual('svg');
    });

    it("creates nested SVG elements with correct namespace", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        const svg = <svg viewBox="0 0 100 100">
            <g>
                <circle cx={50} cy={50} r={40}/>
                <rect x={10} y={10} width={80} height={80}/>
            </g>
        </svg>;
        const circle = svg.querySelector('circle');
        const rect = svg.querySelector('rect');
        expect(circle?.namespaceURI).toEqual('http://www.w3.org/2000/svg');
        expect(rect?.namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });

    it("sets SVG attributes correctly", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        const circle = <circle cx={50} cy={50} r={40} fill="red"/>;
        expect(circle.getAttribute('cx')).toEqual('50');
        expect(circle.getAttribute('cy')).toEqual('50');
        expect(circle.getAttribute('r')).toEqual('40');
        expect(circle.getAttribute('fill')).toEqual('red');
    });

    it("handles kebab-case presentation attributes", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        const path = <path d="M0 0 L10 10" stroke-width={2} stroke-linecap="round"/>;
        expect(path.getAttribute('stroke-width')).toEqual('2');
        expect(path.getAttribute('stroke-linecap')).toEqual('round');
    });

    it("converts camelCase presentation attributes to kebab-case", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        const path = <path d="M0 0 L10 10" strokeWidth={3} strokeLinecap="square"/>;
        expect(path.getAttribute('stroke-width')).toEqual('3');
        expect(path.getAttribute('stroke-linecap')).toEqual('square');
    });

    it("handles SVG viewBox attribute", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        const svg = <svg viewBox="0 0 200 200" width={100} height={100}/>;
        expect(svg.getAttribute('viewBox')).toEqual('0 0 200 200');
        expect(svg.getAttribute('width')).toEqual('100');
        expect(svg.getAttribute('height')).toEqual('100');
    });

    it("handles path d attribute", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        const path = <path d="M10 10 H 90 V 90 H 10 Z" fill="none" stroke="black"/>;
        expect(path.getAttribute('d')).toEqual('M10 10 H 90 V 90 H 10 Z');
    });

    it("handles SVG text elements", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        const text = <text x={10} y={20} font-size={14}>Hello SVG</text>;
        expect(text.getAttribute('x')).toEqual('10');
        expect(text.getAttribute('y')).toEqual('20');
        expect(text.getAttribute('font-size')).toEqual('14');
        expect(text.textContent).toEqual('Hello SVG');
    });

    it("handles gradient elements", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        const gradient = <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="red"/>
            <stop offset="100%" stop-color="blue"/>
        </linearGradient>;
        expect(gradient.getAttribute('id')).toEqual('grad1');
        const stops = gradient.querySelectorAll('stop');
        expect(stops.length).toEqual(2);
        expect(stops[0].getAttribute('stop-color')).toEqual('red');
    });

    it("handles filter elements", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        const filter = <filter id="blur">
            <feGaussianBlur stdDeviation={5}/>
        </filter>;
        expect(filter.getAttribute('id')).toEqual('blur');
        const blur = filter.querySelector('feGaussianBlur');
        expect(blur?.getAttribute('stdDeviation')).toEqual('5');
    });

    it("can embed SVG in HTML document", async () => {
        const html = parseHTML('...');
        const jsx = new JSX2DOM(html);
        html.document.body.appendChild(
            <div>
                <svg viewBox="0 0 100 100">
                    <circle cx={50} cy={50} r={40} fill="blue"/>
                </svg>
            </div>
        );
        const svg = html.document.body.querySelector('svg');
        expect(svg?.namespaceURI).toEqual('http://www.w3.org/2000/svg');
    });
});