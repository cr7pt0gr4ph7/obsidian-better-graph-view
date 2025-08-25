
export interface BCAPI {
    plugin: BreadcrumbsPlugin;
    refresh(): void;
    get_neighbours(filePath: string[]): string;
}

export interface BreadcrumbsPlugin {
    graph: BCGraph;
}

export type BCNodeData = {
    path: string;
    /** .md file exists  */
    resolved: boolean;
    aliases?: string[];

    // TODO: All a narrower ignore filter, to ignore only edges from certain sources, for example
    // 	source=list-note
    // The syntax can allow multiple values: source=list-note source=dataview (parse as URLSearchParams)

    /** If true, don't add any edges _to_ this node */
    ignore_in_edges?: true;

    /** If true, don't add any edges _from_ this node */
    ignore_out_edges?: true;
};

export const EXPLICIT_EDGE_SOURCES = [
    "typed_link",
    "tag_note",
    "list_note",
    "dendron_note",
    "johnny_decimal_note",
    "dataview_note",
    "date_note",
    "folder_note",
    "regex_note",
    // TODO: "zetel_note", // Can date_notes do this already?
] as const;

export type ExplicitEdgeSource = (typeof EXPLICIT_EDGE_SOURCES)[number];

export const EDGE_ATTRIBUTES = [
    "field",
    "explicit",
    "source",
    "implied_kind",
    "round",
] as const;

export type EdgeAttribute = (typeof EDGE_ATTRIBUTES)[number];

export type BCEdgeAttributes = {
    field: string;
} & (
        | {
            explicit: true;
            source: ExplicitEdgeSource;
        }
        | {
            explicit: false;
            implied_kind: `transitive:${string}`;
            /** Which round of implied_building this edge got added in.
             * Starts at 1 - you can think of real edges as being added in round 0.
             * The way {@link BCGraph.safe_add_directed_edge} works, currently only the first instance of an edge will be added.
             *   If the same edge tries again in a future round, _that_ one will be blocked.
             */
            round: number;
        }
    );

export type BCEdgeData = {
    edge_source: string;
    edge_type: string;
    explicit: boolean;
    round: number;
    toString(): string;
};

export type BCNodeStringifyOptions = unknown;

export interface BCEdgeStruct {
    edge_type: string;

    source_data(graph: BCGraph): BCNodeData;
    target_data(graph: BCGraph): BCNodeData;

    source_path(graph: BCGraph): string;
    target_path(graph: BCGraph): string;

    source_resolved(graph: BCGraph): boolean;
    target_resolved(graph: BCGraph): boolean;

    stringify_target(graph: BCGraph,options: BCNodeStringifyOptions,): string;
    stringify_source(graph: BCGraph,options: BCNodeStringifyOptions): string;

    edge_data(graph: BCGraph): BCEdgeData;
    edge_source(graph: BCGraph): string;
    explicit(graph: BCGraph) : boolean;

    round(graph: BCGraph): number;

    get_attribute_label(graph: BCGraph,attributes: string[]): string;

    matches_edge_filter(graph: BCGraph,edge_types: string[]): boolean;

    is_self_loop(): boolean;

    toString(): string;
}

export interface BCEdgeList {
    /** Returns a clone of the edges. */
    get_edges(): BCEdgeStruct[];

    /** Consumes the `EdgeList`` and returns the edges as an array. */
    to_array(): BCEdgeStruct[];

    /** Returns a sorted clone of the edges. */
    // get_sorted_edges(graph: BCGraph, sorter: BCEdgeSorter): BCEdgeStruct[];

    /** Returns the edges in this list grouped by type. */
    group_by_type(): BCGroupedEdgeList;

    /** Returns the first edge in this list, if any. */
    first(): BCEdgeStruct | undefined;

    /** Returns the last edge in this list, if any. */
    last(): BCEdgeStruct | undefined;

    /** Returns a string representation of this object. */
    toString(): string;
};

export interface BCGroupedEdgeList {
    /** Returns a clone of the edges. */
    get_edges(edge_type: string): BCEdgeStruct[] | undefined;

    /** Returns a sorted clone of the edges. */
    // get_sorted_edges(edge_type: string, graph: BCGraph, sorter: BCEdgeSorter): BCEdgeStruct[];

    /** Returns a string representation of this object. */
    toString(): string;
}

export type BCTransitiveGraphRule = unknown;

export interface BCGraph {
    /** Iterate all nodes in the graph and call the provided function with each `NodeData`. */
    iterate_nodes(f: (node: BCNodeData) => void): void;

    /** Iterate all edges in the graph and call the provided function with each `EdgeData`. */
    iterate_edges(f: (edge: BCEdgeData) => void): void;

    /** Get all outgoing edges from a node. */
    get_outgoing_edges(path: String): BCEdgeList;

    /** Get all outgoing edges from a node, filtered by edge type. */
    get_filtered_outgoing_edges(path: String, edge_types: string[] | null): BCEdgeList;

    /** Get all outgoing edges from a node, filtered and grouped by edge type. */
    get_filtered_grouped_outgoing_edges(path: String, edge_types: string[] | null): BCGroupedEdgeList;

    /*** Get all incoming edges to a node. */
    get_incoming_edges(path: String): BCEdgeList;

    /** Checks if a node exists in the graph. */
    has_node(path: String): boolean;

    /** Checks if a node is resolved. Returns `false` if the node is not found. */
    is_node_resolved(path: String): boolean;

    /** Gets the data for the specified node. */
    get_node(path: String): BCNodeData | null;

    /** Returns all edge types that are present in the graph. */
    edge_types(): string[];

    /** Set the update callback. This will be called after every update to the graph. */
    set_update_callback(callback: () => void): void;

    /** Notify the JS side that the graph has been updated. */
    notify_update(): void;

    /**
     * Builds the graph from a list of nodes, edges, and transitive rules.
     * All existing data in the graph is removed.
     */
    // build_graph(nodes: BCNodeData[], edges: BCEdgeData[], transitive_rules: BCTransitiveGraphRule[]): void;

    /**
     * Applies a batch update to the graph. Throws an error if the update fails,
     * and leaves the graph in an inconsistent state.
     *
     * TODO: some security against errors leaving the graph in an inconsistent state.
     * Maybe safely clear the entire graph.
     */
    // apply_update( update: BatchGraphUpdate): void;
}
