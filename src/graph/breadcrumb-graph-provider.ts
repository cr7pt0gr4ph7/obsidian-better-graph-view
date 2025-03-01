import { MetadataCache } from 'obsidian';
import { BCEdge } from '../utils/breadcrumbs-api';
import '../utils/breadcrumbs-global-api';

export class BreadcrumbGraphProvider {
    resolvedLinks: MetadataCache["resolvedLinks"] = {}
    unresolvedLinks: MetadataCache["unresolvedLinks"] = {}

    /**
     * Refresh the underlying data being cached.
     */
    static askBreadcrumbsPluginToRefreshItsData() {
        window.BCAPI.refresh();
    }

    updateCache(filterByType?: string[]) {
        const graph = window.BCAPI.plugin.graph;
        const resolvedByPage: typeof this.resolvedLinks = {};
        const unresolvedByPage: typeof this.unresolvedLinks = {};

        const edgeFilter = (edge: BCEdge) => {
            return !filterByType || filterByType.length == 0 || filterByType.some(x => x === edge.attr.field);
        };

        graph.nodes().forEach(source_id => {
            const resolved: typeof resolvedByPage[string] = {};
            const unresolved: typeof unresolvedByPage[string] = {};

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
