import { Component } from "obsidian";
import { PropertyRenderContext, PropertyWidget } from "./metadata-internals";

// declare const i18next: { t: (key: string) => string };

class YamlPropertyWidgetComponent extends Component {
    constructor(public containerEl: HTMLElement, public data: unknown, public context: PropertyRenderContext) {
        super();
        this.render();
    }

    render() {
        this.containerEl.empty();
        const pre = this.containerEl.createEl("pre", { cls: "yaml-property-widget" });
        pre.textContent = typeof this.data === "string" ? this.data : JSON.stringify(this.data, null, 2);
    }
}

// function renderInstructions(instructionsContainerEl: HTMLElement, items: { command: string, purpose: string }[]) {
//     instructionsContainerEl.empty();
//     for (var i = 0; i < items.length; i++) {
//         var item = items[i];
//         instructionsContainerEl.createDiv("prompt-instruction", (e) => {
//             e.createSpan({
//                 cls: "prompt-instruction-command",
//                 text: item.command
//             });
//             e.createSpan({
//                 text: item.purpose
//             });
//         });
//     }
//     return instructionsContainerEl
// }

// abstract class BasePropertyWidgetComponent {
//     constructor(public containerEl: HTMLInputElement | HTMLDivElement) {
//     }

//     abstract onFocus(mode: "start" | "end" | "both"): void;

//     focus(mode: "start" | "end" | "both" = "both") {
//         this.onFocus(mode);
//     }
// }

// function onResizeOrTimeout(callback: () => void) {
//     var timeoutId: number | undefined;
//     var startTime = Date.now();
//     var f = function (resizeEvent?: UIEvent) {
//         resizeEvent && Date.now() - startTime < 100 || (window.clearTimeout(timeoutId),
//             window.removeEventListener("resize", f),
//             setTimeout(callback, 10))
//     };
//     window.addEventListener("resize", f),
//         timeoutId = window.setTimeout(f, 500)
// }

// function focusInputElement(element: HTMLElement, collapseRange: boolean | undefined = undefined) {
//     element.focus({ preventScroll: true });

//     var range = element.win.document.createRange();
//     range.selectNodeContents(element);

//     if (isBoolean(collapseRange)) {
//         range.collapse(collapseRange);
//     }

//     var selection = element.win.getSelection();
//     if (selection) {
//         selection.removeAllRanges();
//         selection.addRange(range);

//         if (Platform.isMobile) {
//             onResizeOrTimeout(() => {
//                 element.scrollIntoView({
//                     block: "nearest"
//                 });
//             });
//         }
//     }
// }

// class TextPropertyWidgetComponent extends BasePropertyWidgetComponent {
//     type: "text";
//     hoverPopover: null;
//     value: string;
//     ctx: PropertyRenderContext;
//     inputEl: HTMLDivElement;

//     constructor(context: PropertyRenderContext, containerEl: HTMLInputElement | HTMLDivElement) {
//         super(containerEl);
//         this.type = "text";
//         this.hoverPopover = null;
//         this.value = "";
//         this.ctx = context;
//         this.containerEl = containerEl;
//         var r = String((context.app.vault as any).getConfig("spellcheck"));

//         var o = this.inputEl = containerEl.createDiv({
//             cls: "metadata-input-longtext",
//             type: "text",
//             attr: {
//                 placeholder: i18next.t("properties.label-no-value"),
//                 contentEditable: !0,
//                 spellcheck: r,
//                 tabIndex: 0
//             }
//         });
//         var setValueAndNotify = (newValue: string) => {
//             this.setValue(newValue);
//             this.ctx.onChange(newValue);
//         };
//         // o.addEventListener("drop", (e) => {
//         //     var n = context.app.dragManager.draggable;
//         //     if (n) {
//         //         var i = TL(context.app, n, context.sourcePath);
//         //         i.length > 0 && (e.preventDefault(),
//         //             a(i[0]));
//         //     }
//         // });
//         o.addEventListener("keydown", (event: KeyboardEvent) => {
//             if (!event.isComposing)
//                 if ("Enter" === event.key) {
//                     if (event.shiftKey)
//                         return;
//                     if (event.defaultPrevented)
//                         return;
//                     event.preventDefault();
//                     setValueAndNotify(o.textContent);
//                     this.ctx.blur();
//                 }
//                 else if ("Escape" === event.key) {
//                     event.preventDefault();
//                     this.setValue(this.value);
//                     this.ctx.blur();
//                 };
//         });
//         // function mg(e, t) {
//         //     var n;
//         //     if (void 0 === t && (t = !1),
//         //     e.normalize(),
//         //     1 !== e.childNodes.length || (null === (n = e.firstChild) || void 0 === n ? void 0 : n.nodeType) !== Node.TEXT_NODE) {
//         //         var i = t ? function(e) {
//         //             for (var t = [], n = 0; n < e.childNodes.length; n++) {
//         //                 var i = e.childNodes[n];
//         //                 i.nodeType === Node.TEXT_NODE ? t.push(i.textContent || "") : i instanceof HTMLBRElement ? t.push("\n") : i instanceof HTMLElement && (n > 0 && t.push("\n"),
//         //                 t.push(i.textContent || ""))
//         //             }
//         //             return t.join("")
//         //         }(e) : e.getText();
//         //         e.textContent = i,
//         //         e.isActiveElement() && focusInputElement(e, !1)
//         //     }
//         // }
//         // o.addEventListener("input", (evt: InputEvent) => {
//         //     evt.isComposing || mg(o, !0);
//         // });
//         // function vg(e, t) {
//         //     var n, i;
//         //     t.preventDefault();
//         //     var r = null !== (i = null === (n = t.clipboardData) || void 0 === n ? void 0 : n.getData("text/plain")) && void 0 !== i ? i : ""
//         //         , o = e.doc;
//         //     if (o.queryCommandSupported("insertText"))
//         //         o.execCommand("insertText", !1, r);
//         //     else {
//         //         var a = window.getSelection();
//         //         if (!a)
//         //             return;
//         //         var s = a.getRangeAt(0);
//         //         if (!e.contains(s.commonAncestorContainer))
//         //             return;
//         //         s.deleteContents();
//         //         var l = document.createTextNode(r);
//         //         s.insertNode(l),
//         //             s.selectNodeContents(l),
//         //             s.collapse(!1),
//         //             a.removeAllRanges(),
//         //             a.addRange(s)
//         //     }
//         //     e.normalize()
//         // }
//         // o.addEventListener("paste", evt => {
//         //     vg(o, evt);
//         // });
//         o.addEventListener("blur", (event: FocusEvent) => {
//             event.defaultPrevented || setValueAndNotify(o.textContent.trimEnd());
//         });
//     }
//     render() {
//         var inputEl = this.inputEl;
//         // var linkDiv = createDiv("metadata-link-inner");
//         // if (renderLink(this.value, linkDiv, this.ctx, this)) {
//         //     ((inputEl = createDiv("metadata-link")).appendChild(linkDiv),
//         //         inputEl.createDiv("metadata-link-flair", (e) => {
//         //             return setIcon(e, "lucide-pencil");
//         //         }),
//         //         inputEl.addEventListener("click", (event: PointerEvent) => {
//         //             event.defaultPrevented || this.onFocus();
//         //         }))
//         // } else {
//         inputEl = this.inputEl;
//         this.containerEl.setChildrenInPlace([inputEl]);
//         // }
//     }
//     setValue(value: string) {
//         if (!value) {
//             value = "";
//         }
//         this.value = String(value);
//         this.inputEl.textContent = value;
//         this.render();
//     }

//     onFocus(mode: "start" | "end" | "both" = "both") {
//         var inputEl = this.inputEl;
//         this.containerEl.setChildrenInPlace([inputEl]);
//         if (Platform.isPhone) {
//             inputEl.focus();
//         } else {
//             focusInputElement(inputEl, "start" === mode || "end" !== mode && undefined);
//         }
//     }
// };

export const YamlPropertyWidgetRegistration: PropertyWidget<unknown> = {
    icon: "braces",
    type: "yaml",
    name(): string { return "YAML"; },
    render(containerEl: HTMLElement, data: unknown, context: PropertyRenderContext): Component {
        return new YamlPropertyWidgetComponent(containerEl, data, context);
    },
    validate(value: unknown): boolean {
        return true;
    }
}
