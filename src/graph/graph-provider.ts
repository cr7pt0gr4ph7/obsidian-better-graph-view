import { GraphNodeId as NodeId } from "src/utils/graph-internals";

export type LinkCount = number;
export type PageLinks = Record<NodeId, LinkCount>;
export type PageToPageLinks = Record<NodeId, PageLinks>;

export interface GraphProvider {
    resolvedLinks: PageToPageLinks
    unresolvedLinks: PageToPageLinks
    getNodeLabel(id: NodeId): string | undefined;
    updateCache(filterByType: string[] | undefined | null, negate: boolean): void;
}
