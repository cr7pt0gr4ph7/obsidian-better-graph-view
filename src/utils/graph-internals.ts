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

    nodes: GraphNodeComponent[];
    links: GraphLinkComponent[];
    customGraphProvider?: BreadcrumbGraphProvider;
}

export interface GraphLinkComponent {
    renderer: GraphRenderer;
}

export interface GraphNodeComponent {
    id: string;
    renderer: GraphRenderer;
    text: PixiText;
    getDisplayText(): string;
    _getDisplayText?: () => string;
}

export interface PixiText {
    text: string;
}
