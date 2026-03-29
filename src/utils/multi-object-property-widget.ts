import { Component, Keymap, Menu, setIcon } from "obsidian";
import { PropertyRenderContext, PropertyWidget } from "./metadata-internals";

type MultiObjectData = Record<string, unknown>[];

const MarkdownLinkRegex = /^(!?\[)(.*?)(]\(\s*)((<[^>]*?>|[^ "]+?)(\s+([^ ]+|"[^"]+"|'[^']+'|\([^']+\)))?)?(\s*\))$/;

function normalizeSpaces(text: string): string {
    return text.replace(/\u00A0/g, " ").trim().normalize("NFC");
}

function extractSectionFromLink(e: string): string {
    return e.split("#").filter(part => !!part).join(" > ").trim()
}

function isUrl(text: string): boolean {
    if (!text)
        return false;
    try {
        new URL(text)
    } catch (e) {
        return false;
    }
    return true;
}

function isExternalUrl(text: string): boolean {
    return !text.contains(" ") && isUrl(text)
}

function isInternalLink(text: string): boolean {
    return !(!text.startsWith("./") && !text.startsWith("../")) || -1 === text.indexOf(":")
}

// eslint-disable-next-line no-useless-escape
const SimpleMailAddressRegex = /^(([^<>()[\]\\.,;:\s@\"`]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))\b/;
function isSimpleMailAddress(text: string): boolean {
    return SimpleMailAddressRegex.test(text)
}

function parseWikiLinkContent(text: string): { href: string; title: string; isAlias: boolean } {
    let title = "";

    const indexOfAliasSeparator = text.indexOf("|");
    const isAlias = indexOfAliasSeparator > 0;
    if (isAlias) {
        title = text.substring(indexOfAliasSeparator + 1).trim();
        text = text.substring(0, indexOfAliasSeparator).trim();
    } else {
        title = extractSectionFromLink(text = text.trim());
    }

    if (text.endsWith("\\")) {
        text = text.substring(0, text.length - 1);
    }

    return {
        href: normalizeSpaces(text),
        title: title,
        isAlias: isAlias
    }
}

function stripSectionFragment(text: string): string {
    const indexOfFragmentSeparator = text.indexOf("#");
    return -1 === indexOfFragmentSeparator ? text : text.substring(0, indexOfFragmentSeparator)
}

function renderLink(value: string, innerEl: HTMLDivElement, context: PropertyRenderContext, hoverParent: Component) {
    const app = context.app;
    const sourcePath = context.sourcePath;
    let isWikiLink = false;
    let isExternalLink = false;
    let href = "";
    let title = "";

    if (value.startsWith("[[") && value.endsWith("]]")) {
        isWikiLink = true;
        const wikiLink = parseWikiLinkContent(value.slice(2, -2));
        href = wikiLink.href;
        title = wikiLink.title;
    } else if (value.startsWith("[") && value.endsWith(")")) {
        const m = value.match(MarkdownLinkRegex);
        if (m) {
            title = m[2];
            href = m[5];

            if (href.startsWith("<") && href.endsWith(">")) {
                href = href.slice(1, -1);
            }

            if (isInternalLink(href)) {
                isWikiLink = true;
                try {
                    href = decodeURI(href)
                } catch (error) {
                    // Ignore URI parsing errors and use the raw string as href instead
                }
            } else {
                isExternalLink = true;
            }
        }
    } else if (isExternalUrl(value)) {
        isExternalLink = true;
        href = value;
        title = value;
    } else if (isSimpleMailAddress(value)) {
        isExternalLink = true;
        href = "mailto:" + value;
        title = value;
    }

    if (isWikiLink || isExternalLink) {
        innerEl.setText(title);
        innerEl.setAttr("data-href", href);
        innerEl.toggleClass("internal-link", isWikiLink);
        innerEl.toggleClass("external-link", isExternalLink);
        isWikiLink && innerEl.toggleClass("is-unresolved", (app.metadataCache as any).isUnresolved(stripSectionFragment(href), sourcePath));
        innerEl.onClickEvent(function (e) {
            e.defaultPrevented || 0 !== e.button && 1 !== e.button || (e.preventDefault(),
                isWikiLink ? app.workspace.openLinkText(href, sourcePath, Keymap.isModEvent(e)) : isExternalLink && window.open(href, "_blank"))
        });
        innerEl.addEventListener("open-link", function (e) {
            e.preventDefault();
            if (isWikiLink) {
                app.workspace.openLinkText(href, sourcePath, (e as any).detail.paneType);
            } else if (isExternalLink) {
                window.open(href, "_blank");
            }
        });
        innerEl.addEventListener("contextmenu", function (e) {
            const t = (Menu as any).forEvent(e).addSections(["title", "open", "action", "view", "info", "info.copy", "", "danger"]);
            if (isWikiLink)
                (app.workspace as any).handleLinkContextMenu(t, href, sourcePath);
            else {
                if (!isExternalLink)
                    return;
                (app.workspace as any).handleExternalLinkContextMenu(t, href)
            }
        });
        if (isWikiLink) {
            (app as any).dragManager.handleDrag(innerEl, (event: DragEvent) => {
                return (app as any).dragManager.dragLink(event, href, sourcePath)
            });
        }
        innerEl.addEventListener("mouseover", (event: MouseEvent) => {
            app.workspace.trigger("hover-link", {
                event: event,
                source: (context as any).hoverSource,
                hoverParent: hoverParent,
                targetEl: innerEl,
                linktext: href
            });
        })
    }
    return true;
}

class MultiObjectPropertyWidgetComponent extends Component {
    constructor(public containerEl: HTMLElement, public data: MultiObjectData, public context: PropertyRenderContext) {
        super();
        this.render();
    }

    render() {
        this.containerEl.empty();
        const listEl = this.containerEl.createEl("div", { cls: "multi-object-list" });

        for (const item of this.data) {
            const objectEl = listEl.createEl("div", { cls: "multi-object-item" });
            const propertiesEl = objectEl.createEl("div", { cls: "multi-object-properties" });

            for (const key in item) {
                if (!Object.prototype.hasOwnProperty.call(item, key)) {
                    continue;
                }

                const value = item[key];
                const propertyEl = propertiesEl.createEl("div", { cls: "multi-object-property" });
                propertyEl.createEl("span", { text: key, cls: "multi-object-property-key" });
                const valueEl = propertyEl.createEl("div", { cls: "multi-object-property-value" });

                if (value instanceof Array) {
                    const arrayEl = valueEl.createEl("div", { cls: "multi-object-property-value-array" });
                    value.forEach((entry, index) => {
                        const entryEl = arrayEl.createEl("div", { cls: "multi-object-property-array-entry" });
                        this.renderSingleValue(entry, entryEl);
                    });
                } else {
                    this.renderSingleValue(value, valueEl);
                }
            }
        }
    }

    private renderSingleValue(value: unknown, valueEl: HTMLDivElement) {
        const innerLinkDiv = createDiv("metadata-link-inner");
        if (renderLink(String(value), innerLinkDiv, this.context, this)) {
            const linkDiv = createDiv("metadata-link");
            linkDiv.appendChild(innerLinkDiv);
            // linkDiv.createDiv("metadata-link-flair", (elem) => setIcon(elem, "lucide-pencil"));
            // linkDiv.addEventListener("click", (event: PointerEvent) => {
            //     event.defaultPrevented || this.onFocus();
            // });
            valueEl.appendChild(linkDiv);
        } else {
            valueEl.createEl("span", { text: String(value), cls: "multi-object-property-value-text" });
        }
    }
}

export const MultiObjectPropertyWidgetRegistration: PropertyWidget<MultiObjectData> = {
    icon: "list-tree",
    type: "multiobject",
    name(): string { return "Multi Object"; },
    render(containerEl: HTMLElement, data: MultiObjectData, context: PropertyRenderContext): Component {
        return new MultiObjectPropertyWidgetComponent(containerEl, data, context);
    },
    validate(value: unknown): boolean {
        return true;
    }
};
