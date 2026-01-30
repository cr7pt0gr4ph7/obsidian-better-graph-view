import { App } from 'obsidian';
import { BCEdgeStruct } from '../utils/breadcrumbs-api';
import '../utils/breadcrumbs-global-api';
import { GraphNodeId as NodeId } from 'src/utils/graph-internals';
import { GraphProvider, PageLinks, PageToPageLinks } from './graph-provider';

export class BreadcrumbGraphProvider implements GraphProvider {
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

        const edgeFilter = (edge: BCEdgeStruct) => {
            return !filterByType || (!!negate !== !!filterByType.some(x => x === edge.edge_type));
        };

        graph.iterate_nodes(node => {
            const resolved: PageLinks = {};
            const unresolved: PageLinks = {};
            const source_id = node.path;

            const frontmatter = this.app.metadataCache.getCache(source_id)?.frontmatter;
            const titleFromFrontmatter = frontmatter?.node_title ?? frontmatter?.title;
            if (titleFromFrontmatter) {
                const title = typeof titleFromFrontmatter === "string" ? titleFromFrontmatter : `${titleFromFrontmatter}`;
                if (title.length > 0) {
                    this.titleByPageId.set(source_id, title);
                }
            }

            graph.get_outgoing_edges(source_id).to_array().filter(edgeFilter).forEach(edge => {
                (edge.target_resolved(graph) ? resolved : unresolved)[edge.target_path(graph)] = 1;
            });

            resolvedByPage[source_id] = resolved;
            unresolvedByPage[source_id] = unresolved;
        });

        this.resolvedLinks = resolvedByPage;
        this.unresolvedLinks = unresolvedByPage;
    }
}
