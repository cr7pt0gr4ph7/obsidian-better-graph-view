
export interface BCAPI {
    plugin: BreadcrumbsPlugin;
    refresh(): void;
    get_neighbours(filePath: string[]): string;
}

export interface BreadcrumbsPlugin {
    graph: BCGraph;
}

export type BCNodeAttributes = {
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

export type BCEdge = {
    id: string;
    attr: BCEdgeAttributes;
    source_id: string;
    target_id: string;
    source_attr: BCNodeAttributes;
    target_attr: BCNodeAttributes;
    undirected: boolean;
};

export interface BCGraph {
    nodes(): string[];

    /*** Safely returns [] if node_id and !hasNode(node_id) */
    get_in_edges(node_id?: string): BCEdge[];

    /*** Safely returns [] if node_id and !hasNode(node_id) */
    get_out_edges(node_id?: string): BCEdge[];
}
