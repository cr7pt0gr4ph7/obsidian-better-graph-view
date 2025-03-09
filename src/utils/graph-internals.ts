// Partial type definitions for the internal implementation details
// of the built-in Graph plugin that we need to access. Not complete
// by any means (and not intended to be) but complete enough *for us*.

import { App, View, WorkspaceLeaf } from "obsidian";
import { BreadcrumbGraphProvider } from "src/graph/breadcrumb-graph-provider";

export type GraphNodeId = string;
export type GraphLinkCount = number;
export type GraphData = {
    nodes: Record<GraphNodeId, Record<GraphNodeId, GraphLinkCount>>;
}

export type GraphLeaf = {
    view: GraphView;
} & WorkspaceLeaf;

export type GraphView = {
    dataEngine: GraphDataEngine;
    renderer: GraphRenderer;
    update(): void;
} & View;

export type GraphQuery = {
    query: string;
    color?: { a: number; rgb: number } | null;
}

export interface GraphDataEngine {
    app: App;
    _app?: App;
    setQuery(query: GraphQuery[]): void;
    _setQuery?: (query: GraphQuery[]) => void;
    render(): void;
}

export interface GraphRenderer {
    setData(data: GraphData): void;
    __setData?: (data: GraphData) => void;

    nodeLookup: Record<string, GraphNodeComponent>;
    nodes: GraphNodeComponent[];
    links: GraphLinkComponent[];
    customGraphProvider?: BreadcrumbGraphProvider;

    setPan(x: number, y: number): void;
    changed(): void;

    scale: number;
    width: number;
    height: number;
    panX: number;
    panY: number;
}

export interface GraphLinkComponent {
    renderer: GraphRenderer;
    rendered: boolean;
}

export interface GraphNodeComponent {
    x: number;
    y: number;
    id: string;
    renderer: GraphRenderer;
    text?: PixiText;
    rendered: boolean;
    getDisplayText(): string;
    _getDisplayText?: () => string;
}

export interface PixiText {
    text: string;
}
