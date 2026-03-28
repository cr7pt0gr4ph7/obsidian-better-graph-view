import { App, Component, Events } from "obsidian";
import type { MetadataEditor } from "./metadata-editor-internals";

export interface AppInternals extends App {
    metadataTypeManager: MetadataTypeManager;
}

export type PropertyWidgetType =
    | 'aliases'
    | 'checkbox'
    | 'date'
    | 'datetime'
    | 'multitext'
    | 'number'
    | 'tags'
    | 'text'
    | string;

export type PropertyInfo = {
    name: string;
} & ({
    type: PropertyWidgetType | null;
    widget?: undefined;
} | {
    type?: undefined;
    widget: PropertyWidgetType | null;
});

export interface PropertyRenderContext {
    /** Reference to the app. */
    app: App;

    /** Key of the property field. */
    key: string;

    /** Reference to the metadata editor. */
    metadataEditor: MetadataEditor;

    /** Determine the source path of current context. */
    sourcePath: string;

    /** Callback called on property field unfocus. */
    blur(): void;

    /** Callback called on property value change. */
    onChange(value: unknown): void;
}

export interface PropertyWidget<Value = unknown, ComponentType extends Component = Component> {
    /** The name of the associated lucide-dev icon. */
    icon: string;

    /** Metadata property keys that are reserved for this property widget type. */
    reservedKeys?: string[];

    /** The name of the widget type. */
    type: string;

    /** Returns the localized name of the widget. */
    name(): string;

    /** Render function for the widget on field container given context and data. */
    render(containerEl: HTMLElement, data: Value, context: PropertyRenderContext): ComponentType;

    /** Validate whether the input value to the widget is correct. */
    validate(value: unknown): boolean;
}

export interface MetadataTypeManager extends Events {
    /** Record of registered property widget types by name. */
    registeredTypeWidgets: Record<PropertyWidgetType, PropertyWidget<unknown>>;

    /** Get all registered properties. */
    getAllProperties(): Record<string, PropertyInfo>;

    /** Get info for property. */
    getPropertyInfo(property: string): PropertyInfo;

    /** Get assigned widget type for property. */
    getAssignedType(property: string): PropertyWidgetType | null;

    /** Get expected widget type for property and the one inferred from the property value. */
    getTypeInfo(options: { key: string, type: string, value: unknown }): { expected: PropertyWidget, inferred: PropertyWidget };

    /** Set widget type for property. */
    setType(property: string, type: PropertyWidgetType): Promise<void>;

    /** Unset widget type for property. */
    unsetType(property: string): Promise<void>;
}
