import { Component, App, HoverPopover, MarkdownView } from "obsidian";
import type { PropertyWidget } from "./metadata-internals";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MetadataWidget { }

export interface PropertyEntryData<T> {
    key: string;
    type: string;
    value: T;
}

export interface MetadataEditorPropertyTypeInfo {
    expected: PropertyWidget;
    inferred: PropertyWidget;
}


export interface MetadataEditorProperty extends Component {
    /** Reference to the app. */
    app: App;

    /** Container element for the metadata editor property. */
    containerEl: HTMLElement;

    /** Entry information for the property. */
    entry: PropertyEntryData<unknown>;

    /** Icon element of the property. */
    iconEl: HTMLSpanElement;

    /** Key value of the property. */
    keyEl: HTMLElement;

    /** Input field for key value of the property. */
    keyInputEl: HTMLInputElement;

    /** Metadata editor the property is attached to. */
    metadataEditor: MetadataEditor;

    /** Widget that handles user input for this property widget type. */
    rendered: MetadataWidget | null;

    /** Info about the inferred and expected property widget given key-value pair. */
    typeInfo: MetadataEditorPropertyTypeInfo;

    /** Element that contains the value input or widget. */
    valueEl: HTMLElement;

    /** Element containing the displayed warning on malformed property field. */
    warningEl: HTMLElement;

    /** Focus on the key input element. */
    focusKey(): void;

    /** Focus on the property (container element). */
    focusProperty(): void;

    /** Focus on the value input element. */
    focusValue(mode?: 'both' | 'end' | 'start'): void;

    /** Reveal the property menu on click event. */
    handleItemClick(event: MouseEvent): void;

    /** Focus on property on blur event. */
    handlePropertyBlur(): void;

    /** Update key of property and saves, returns false if error. */
    handleUpdateKey(key: string): boolean;

    /** Update value of property and saves. */
    handleUpdateValue(value: unknown): void;

    /** Loads as draggable property element. */
    onload(): void;

    /** Render property widget based on type. */
    renderProperty(entry: PropertyEntryData<unknown>, check_errors?: boolean, use_expected_type?: boolean): void;

    /** Set the selected class of property. */
    setSelected(selected: boolean): void;

    /** Reveal property selection menu at mouse event. */
    showPropertyMenu(event: MouseEvent): void;
}

export interface MetadataEditor extends Component {
    /** Button element for adding a new property. */
    addPropertyButtonEl: HTMLButtonElement;

    /** Reference to the app. */
    app: App;

    /** Whether the frontmatter editor is collapsed. */
    collapsed: boolean;

    /** Container element for the metadata editor. */
    containerEl: HTMLElement;

    /** Element containing metadata table and addPropertyButton. */
    contentEl: HTMLElement;

    /** The currently focused property. */
    focusedLine: null | MetadataEditorProperty;

    /** Fold button for folding away the frontmatter editor on hovering over headingEl. */
    foldEl: HTMLElement;

    /** Heading element for the metadata editor. */
    headingEl: HTMLElement;

    /** Hover element container. */
    hoverPopover: null | HoverPopover;

    /** Owner of the metadata editor. */
    owner: MarkdownView;

    /** All properties existing in the metadata editor. */
    properties: PropertyEntryData<unknown>[];

    /** Element containing all property elements. */
    propertyListEl: HTMLElement;

    /** List of all property field editors. */
    rendered: MetadataEditorProperty[];

    /** Set of all selected property editors. */
    selectedLines: Set<MetadataEditorProperty>;

    /** Convert given properties to a serialized object and store in clipboard as obsidian/properties. */
    _copyToClipboard(event: ClipboardEvent, properties: MetadataEditorProperty[]): void;

    /** Uncollapse editor if collapsed and create a new property row. */
    addProperty(): void;

    /** Clear all properties. */
    clear(): void;

    /** Unselect all lines. */
    clearSelection(): void;

    /** Focus on property field with given key. */
    focusKey(key: string): void;

    /** Focus on property. */
    focusProperty(property: MetadataEditorProperty): void;

    /** Focus on property at specified index. */
    focusPropertyAtIndex(index: number): void;

    /** Focus on property with value. */
    focusValue(value: string, mode: "start" | "end" | "both"): void;

    /** Handle copy event on selection and serialize properties. */
    handleCopy(event: ClipboardEvent): void;

    /** Handle cut event and serialize and remove properties. */
    handleCut(event: ClipboardEvent): void;

    /** Handle selection of item for drag handling. */
    handleItemSelection(event: PointerEvent, property: MetadataEditorProperty): boolean;

    /** Handle key press event for controlling selection or movement of property up/down. */
    handleKeypress(event: KeyboardEvent): void;

    /** Handle paste event of properties into metadata editor. */
    handlePaste(event: ClipboardEvent): void;

    /** Whether the editor has focus. */
    hasFocus(): boolean;

    /** Whether there is a property that is focused. */
    hasPropertyFocused(): boolean;

    /** Add new properties to the metadata editor and save. */
    insertProperties(properties: Record<string, any>): void;

    /** On loading of the metadata editor, register on metadata type change event. */
    onload(): void;

    /** On vault metadata update, update property render. */
    onMetadataTypeChange(property: MetadataEditorProperty): void;

    /** Remove specified properties from the metadata editor and save, and reset focus if specified. */
    removeProperties(properties: MetadataEditorProperty[], reset_focus?: boolean): unknown;

    /** Reorder the entry to specified index position and save. */
    reorderKey(entry: PropertyEntryData<unknown>, index: number): unknown;

    /** Serialize the properties and save frontmatter. */
    save(): void;

    /** Select all property fields. */
    selectAll(): void;

    /** Mark specified property as selected. */
    selectProperty(property: MetadataEditorProperty | undefined, select: boolean): void;

    /** Convert properties to a serialized object. */
    serialize(): Record<string, any>;

    /** Sets frontmatter as collapsed or uncollapsed. */
    setCollapse(collapsed: boolean, x: boolean): void;

    /** On context menu event on header element, show property menu. */
    showPropertiesMenu(event: MouseEvent): void;

    /** Synchronize data with given properties and re-render them. */
    synchronize(data: Record<string, any>): void;

    /** Toggle collapsed state of the metadata editor. */
    toggleCollapse(): void;
}

export interface MetadataEditorProperty extends Component {
    /** Reference to the app. */
    app: App;

    /** Container element for the metadata editor property. */
    containerEl: HTMLElement;

    /** Entry information for the property. */
    entry: PropertyEntryData<unknown>;

    /** Icon element of the property. */
    iconEl: HTMLSpanElement;

    /** Key value of the property. */
    keyEl: HTMLElement;

    /** Input field for key value of the property. */
    keyInputEl: HTMLInputElement;

    /** Metadata editor the property is attached to. */
    metadataEditor: MetadataEditor;

    /** Widget that handles user input for this property widget type. */
    rendered: MetadataWidget | null;

    /** Info about the inferred and expected property widget given key-value pair. */
    typeInfo: MetadataEditorPropertyTypeInfo;

    /** Element that contains the value input or widget. */
    valueEl: HTMLElement;

    /** Element containing the displayed warning on malformed property field. */
    warningEl: HTMLElement;

    /** Focus on the key input element. */
    focusKey(): void;

    /** Focus on the property (container element). */
    focusProperty(): void;

    /** Focus on the value input element. */
    focusValue(mode?: "start" | "end" | "both"): void;

    /** Reveal the property menu on click event. */
    handleItemClick(event: MouseEvent): void;

    /** Focus on property on blur event. */
    handlePropertyBlur(): void;

    /** Update key of property and saves, returns false if error. */
    handleUpdateKey(key: string): boolean;

    /** Update value of property and saves. */
    handleUpdateValue(value: unknown): void;

    /** Loads as draggable property element. */
    onload(): void;

    /** Render property widget based on type. */
    renderProperty(entry: PropertyEntryData<unknown>, check_errors?: boolean, use_expected_type?: boolean): void;

    /** Set the selected class of property. */
    setSelected(selected: boolean): void;

    /** Reveal property selection menu at mouse event. */
    showPropertyMenu(event: MouseEvent): void;
}
