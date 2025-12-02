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
});