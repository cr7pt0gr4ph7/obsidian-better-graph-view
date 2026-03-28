import { Component } from "obsidian";
import { PropertyRenderContext, PropertyWidget } from "./metadata-internals";

type MultiObjectData = Record<string, unknown>[];

class MultiObjectPropertyWidgetComponent extends Component {
    constructor(public containerEl: HTMLElement, public data: MultiObjectData, public context: PropertyRenderContext) {
        super();
        this.render();
    }

    render() {
        this.containerEl.empty();
        const propertiesContainer = this.containerEl.createEl("div");

        for (const item of this.data) {
            for (const key in item) {
                if (!Object.prototype.hasOwnProperty.call(item, key)) {
                    continue;
                }

                const value = item[key];
                const propertyEl = propertiesContainer.createEl("div", { cls: "multi-object-property" });
                propertyEl.createEl("span", { text: `${key}: `, cls: "multi-object-property-key" });
                propertyEl.createEl("span", { text: String(value), cls: "multi-object-property-value" });
            }
        }
    }
}

export const MultiObjectPropertyWidgetRegistration: PropertyWidget<MultiObjectData> = {
    icon: "braces",
    type: "multiobject",
    name(): string { return "Multi Object"; },
    render(containerEl: HTMLElement, data: MultiObjectData, context: PropertyRenderContext): Component {
        return new MultiObjectPropertyWidgetComponent(containerEl, data, context);
    },
    validate(value: unknown): boolean {
        return true;
    }
};
