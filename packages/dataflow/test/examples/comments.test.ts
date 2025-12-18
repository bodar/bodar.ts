import {describe, test} from "bun:test";
import {parseHTML} from "linkedom";
import {HTMLTransformer} from "../../src/html/HTMLTransformer.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {NodeDefinition} from "../../src/html/NodeDefinition.ts";
import html from "../../docs/examples/comments.html" with {type: "text"}
import type {Renderer} from "../../src/html/Renderer.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import type {Idle} from "../../src/Idle.ts";
import type {BaseGraph} from "../../src/BaseGraph.ts";


async function renderHTML(html: string, global: any = globalThis): Promise<{
    browser: (Window & typeof globalThis),
    renderer: Renderer,
    idle: Idle,
    graph: BaseGraph
}> {
    const transformer = new HTMLTransformer({rewriter: new HTMLRewriter()});
    const reactive = transformer.transform(html);
    const browser = parseHTML(reactive);

    const module = browser.document.querySelector('script[type=module]')!;
    const definition = NodeDefinition.parse(module.textContent);
    const fun = new Function(...definition.inputs, `return (${definition.fun()})(${definition.inputs.join(',')});`);
    const {renderer, idle, graph} = await fun(...definition.inputs.map(i => {
        if (i === 'globalThis') return browser;
        return Reflect.get(browser, i) || Reflect.get(global, i);
    }));
    await new Promise(resolve => setTimeout(resolve, 0));
    return {browser, renderer, idle, graph};
}

describe("comments", async () => {
    test("can render the 2 built in comments", async () => {
        const {browser} = await renderHTML(html as any);
        assertThat(Array.from(browser.document.querySelectorAll<HTMLSpanElement>('.comment .comment-author')).map(s => s.innerText),
            equals(["Alice", "Bob"]));
    });

    test("can add a new comment", async () => {
        const {browser, idle} = await renderHTML(html as any);

        (browser.document.getElementById('comment-author') as HTMLInputElement).value = 'Charlie';
        (browser.document.getElementById('comment-text') as HTMLTextAreaElement).value = 'This is a test comment';
        const form = fixForm(browser.document.querySelector<HTMLFormElement>('.comment-form')!);
        form.submit();

        await idle.fired();
        assertThat(Array.from(browser.document.querySelectorAll<HTMLSpanElement>('.comment .comment-author')).map(s => s.innerText),
            equals(["Alice", "Bob", "Charlie"]));
    });

    test("can delete a comment", async () => {
        const {browser, idle} = await renderHTML(html as any);

        browser.document.querySelector<HTMLButtonElement>('.comment .delete-btn')!.click();

        await idle.fired();
        assertThat(Array.from(browser.document.querySelectorAll<HTMLSpanElement>('.comment .comment-author')).map(s => s.innerText),
            equals(["Bob"]));
    });

    test("shows correct comment count", async () => {
        const {browser} = await renderHTML(html as any);
        assertThat(browser.document.querySelector<HTMLParagraphElement>('.comment-count')!.innerText,
            is("2 comments"));
    });

    test("comment count updates when comments are added", async () => {
        const {browser, idle} = await renderHTML(html as any);

        (browser.document.getElementById('comment-text') as HTMLTextAreaElement).value = 'New comment';
        const form = fixForm(browser.document.querySelector<HTMLFormElement>('.comment-form')!);
        form.submit();

        await idle.fired();
        assertThat(browser.document.querySelector<HTMLParagraphElement>('.comment-count')!.innerText,
            is("3 comments"));
    });

    test("uses Anonymous when no author provided", async () => {
        const {browser, idle} = await renderHTML(html as any);

        (browser.document.getElementById('comment-author') as HTMLInputElement).value = '';
        (browser.document.getElementById('comment-text') as HTMLTextAreaElement).value = 'Anonymous comment';
        const form = fixForm(browser.document.querySelector<HTMLFormElement>('.comment-form')!);
        form.submit();

        await idle.fired();
        const authors = Array.from(browser.document.querySelectorAll<HTMLSpanElement>('.comment .comment-author')).map(s => s.innerText);
        assertThat(authors[authors.length - 1], is("Anonymous"));
    });
});

function fixForm(form: HTMLElement): HTMLFormElement {
    const global = form.ownerDocument.defaultView!;
    mixinForm(global)
    Object.setPrototypeOf(form, global.HTMLFormElement.prototype);
    return form as HTMLFormElement;
}

function mixinForm(global: any) {
    const {HTMLFormElement, Event} = global;
    if (!HTMLFormElement.prototype.submit) {
        HTMLFormElement.prototype.submit = function () {
            this.dispatchEvent(new Event("submit", {target: this} as any));
        };
    }
    if (!HTMLFormElement.prototype.reset) {
        HTMLFormElement.prototype.reset = function () {
            this.querySelectorAll('input').forEach((i: HTMLInputElement) => i.value = '');
            this.querySelectorAll('textarea').forEach((t: HTMLTextAreaElement) => t.value = '');
        };
    }
}
