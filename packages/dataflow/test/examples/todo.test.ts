import {describe, test} from "bun:test";
import {parseHTML} from "linkedom";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import html from "../../docs/examples/todo.html" with {type: "text"}
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {curry} from "@bodar/totallylazy/functions/curry.ts";
import {renderAndExecute} from "../../src/testing/renderAndExecute.ts";


const renderHTML = curry(renderAndExecute)(parseHTML)

describe("todo", async () => {
    test("can render the 3 built in todos", async () => {
        const {browser} = await renderHTML(html as any);
        assertThat(Array.from(browser.document.querySelectorAll<HTMLSpanElement>('.todo-item .todo-name')).map(s => s.innerText),
            equals(["Eat", "Sleep", "Repeat"]));
    });

    test("can add to new todo", async () => {
        const {browser, idle} = await renderHTML(html as any);

        browser.document.querySelector<HTMLInputElement>('#todo-name')!.value = 'Take over the world';
        const form = fixForm(browser.document.querySelector<HTMLFormElement>('.todo-form')!);
        form.submit();

        await idle.fired();
        assertThat(Array.from(browser.document.querySelectorAll<HTMLSpanElement>('.todo-item .todo-name')).map(s => s.innerText),
            equals(["Eat", "Sleep", "Repeat", 'Take over the world']));
    });

    test("can delete a todo", async () => {
        const {browser, idle} = await renderHTML(html as any);

        browser.document.querySelector<HTMLButtonElement>('.todo-item .delete')!.click();

        await idle.fired();
        assertThat(Array.from(browser.document.querySelectorAll<HTMLSpanElement>('.todo-item .todo-name')).map(s => s.innerText),
            equals(["Sleep", "Repeat"]));
    });

    test("can check a todo", async () => {
        const {browser, idle} = await renderHTML(html as any);

        assertThat(Array.from(browser.document.querySelectorAll<HTMLInputElement>('.todo-item input[type=checkbox]'))
            .filter(i => i.hasAttribute('checked')).length, is(1));

        browser.document.querySelector<HTMLInputElement>('.todo-item:nth-child(2) input[type=checkbox]')!.click();

        await idle.fired();
        assertThat(Array.from(browser.document.querySelectorAll<HTMLInputElement>('.todo-item input[type=checkbox]'))
            .filter(i => i.hasAttribute('checked')).length, is(2));
    });

    test("can edit a todo", async () => {
        const {browser, idle} = await renderHTML(html as any);

        const span = browser.document.querySelector<HTMLSpanElement>('.todo-item:nth-child(2) .todo-name')!;
        span.textContent = 'Sleep more';
        span.blur();

        await idle.fired();
        assertThat(Array.from(browser.document.querySelectorAll<HTMLSpanElement>('.todo-item .todo-name')).map(s => s.innerText),
            equals(["Eat", "Sleep more", "Repeat"]));
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
        };
    }
}