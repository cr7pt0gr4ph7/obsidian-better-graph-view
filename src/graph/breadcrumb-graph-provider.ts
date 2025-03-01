import { App } from 'obsidian';
import { BCEdge } from '../utils/breadcrumbs-api';
import '../utils/breadcrumbs-global-api';
import { GraphNodeId as NodeId } from 'src/utils/graph-internals';

type LinkCount = number;
type PageLinks = Record<NodeId, LinkCount>;
type PageToPageLinks = Record<NodeId, PageLinks>;

export class BreadcrumbGraphProvider {
    resolvedLinks: PageToPageLinks = {}
    unresolvedLinks: PageToPageLinks = {}
    private titleByPageId: Map<NodeId, string> = new Map();

    constructor(private app: App) {
    }

    /**
     * Refresh the underlying data being cached.
     */
    static askBreadcrumbsPluginToRefreshItsData() {
        window.BCAPI.refresh();
    }

    getNodeLabel(id: NodeId): string | undefined {
        return this.titleByPageId.get(id);
    }

    updateCache(filterByType: string[] | undefined | null, negate: boolean) {
        const graph = window.BCAPI.plugin.graph;
        const resolvedByPage: PageToPageLinks = {};
        const unresolvedByPage: PageToPageLinks = {};
        this.titleByPageId.clear();

        const edgeFilter = (edge: BCEdge) => {
            return !filterByType || (!!negate !== !!filterByType.some(x => x === edge.attr.field));
        };

        graph.nodes().forEach(source_id => {
            const resolved: PageLinks = {};
            const unresolved: PageLinks = {};

            const frontmatter = this.app.metadataCache.getCache(source_id)?.frontmatter;
            const titleFromFrontmatter = frontmatter?.node_title ?? frontmatter?.title;
            if (titleFromFrontmatter) {
                const title = typeof titleFromFrontmatter === "string" ? titleFromFrontmatter : `${titleFromFrontmatter}`;
                if (title.length > 0) {
                    this.titleByPageId.set(source_id, title);
                }
            }

            graph.get_out_edges(source_id).filter(edgeFilter).forEach(edge => {
                (edge.target_attr.resolved ? resolved : unresolved)[edge.target_id] = 1;
            });

            resolvedByPage[source_id] = resolved;
            unresolvedByPage[source_id] = unresolved;
        });

        this.resolvedLinks = resolvedByPage;
        this.unresolvedLinks = unresolvedByPage;
    }
}
