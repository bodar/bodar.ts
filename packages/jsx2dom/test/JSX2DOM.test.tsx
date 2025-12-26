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