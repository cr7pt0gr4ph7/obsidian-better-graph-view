// Partial type definitions for the internal implementation details
// of the built-in Graph plugin that we need to access. Not complete
// by any means (and not intended to be) but complete enough *for us*.

import { App, View, WorkspaceLeaf } from "obsidian";

export type GraphNodeId = string;
export type GraphLinkCount = number;
export type GraphData = {
    nodes: Record<GraphNodeId, Record<GraphNodeId, GraphLinkCount>>;
}

export type GraphLeaf  = {
    view: GraphView;
} & WorkspaceLeaf;

export type GraphView = {
    dataEngine: GraphDataEngine;
    renderer: GraphRenderer;
    update(): void;
} & View;

export interface GraphDataEngine {
    app: App;
    _app?: App;
    render(): void;
}

export interface GraphRenderer {
    setData(data: GraphData): void;
    _setData?: (data: GraphData) => void;
}
