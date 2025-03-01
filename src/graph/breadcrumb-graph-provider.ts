import { BCEdge } from '../utils/breadcrumbs-api';
import '../utils/breadcrumbs-global-api';
import { GraphNodeId as NodeId } from 'src/utils/graph-internals';

type LinkCount = number;
type PageLinks = Record<NodeId, LinkCount>;
type PageToPageLinks = Record<NodeId, PageLinks>;

export class BreadcrumbGraphProvider {
    resolvedLinks: PageToPageLinks = {}
    unresolvedLinks: PageToPageLinks = {}

    /**
     * Refresh the underlying data being cached.
     */
    static askBreadcrumbsPluginToRefreshItsData() {
        window.BCAPI.refresh();
    }

    updateCache(filterByType: string[] | undefined | null, negate: boolean) {
        const graph = window.BCAPI.plugin.graph;
        const resolvedByPage: PageToPageLinks = {};
        const unresolvedByPage: PageToPageLinks = {};

        const edgeFilter = (edge: BCEdge) => {
            return !filterByType || (!!negate !== !!filterByType.some(x => x === edge.attr.field));
        };

        graph.nodes().forEach(source_id => {
            const resolved: PageLinks = {};
            const unresolved: PageLinks = {};

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
