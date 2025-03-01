import { App, Plugin, PluginSettingTab } from 'obsidian';
import { BreadcrumbGraphProvider } from './src/graph/breadcrumb-graph-provider';
import './src/utils/breadcrumbs-global-api';
import { GraphLeaf, GraphLinkComponent, GraphNodeComponent, GraphQuery } from './src/utils/graph-internals';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BetterGraphViewSettings {
}

const DEFAULT_SETTINGS: BetterGraphViewSettings = {
}

const EDGE_OPERATOR_REGEX = /(?<=^| )-?edge:([^ ]*)/gm;

export default class BetterGraphViewPlugin extends Plugin {
    settings: BetterGraphViewSettings;
    hasPatchedGraphObjects = false;
    hasPatchedLink = false;
    hasPatchedNode = false;
    nodePrototype?: GraphNodeComponent;
    linkPrototype?: GraphLinkComponent;

    private getGraphLeaves(): GraphLeaf[] {
        return this.app.workspace.getLeavesOfType("graph") as GraphLeaf[];
    }

    inject_graphComponentRendering(graphLeaf: GraphLeaf) {
        // Make sure that we patch the prototype objects only once
        if (this.hasPatchedGraphObjects) {
            return;
        }

        // We can only access the prototypes we are interested in
        // in a very roundabout way, and only when there are already
        // nodes and/or links in the graph view.
        const graphView = graphLeaf.view;
        const renderer = graphView.renderer;
        if (!this.hasPatchedNode && renderer.nodes && renderer.nodes.length >= 1) {
            const proto = Object.getPrototypeOf(renderer.nodes[0]) as GraphNodeComponent;
            if (proto) {
                proto._getDisplayText || (proto._getDisplayText = proto.getDisplayText);
                proto.getDisplayText = function (this: GraphNodeComponent) {
                    // NOTE: Intentionally not an arrow function,
                    // so "this" points to the GraphNodeComponent
                    return this.renderer.customGraphProvider?.getNodeLabel(this.id)
                        ?? this._getDisplayText?.()
                        ?? this.id;
                };
                this.nodePrototype = proto;
                this.hasPatchedNode = true;
            }
        }

        if (!this.hasPatchedLink && renderer.links && renderer.links.length >= 1) {
            const proto = Object.getPrototypeOf(renderer.links[0]) as GraphLinkComponent;
            if (proto) {
                this.linkPrototype = proto;
                this.hasPatchedLink = true;
            }
        }

        this.hasPatchedGraphObjects = this.hasPatchedNode && this.hasPatchedLink;
    }

    inject_metadataResolver(graphLeaf: GraphLeaf) {
        const customCache = new BreadcrumbGraphProvider(this.app);
        let currentFilter: {
            queryText?: string | null,
            edgeTypes?: string[] | null,
            negate: boolean,
        } = {
            queryText: null,
            edgeTypes: null,
            negate: false,
        };
        const updateCustomCache = () => customCache.updateCache(currentFilter.edgeTypes, currentFilter.negate);

        const setEdgeFilter = (newFilter: string | undefined | null, negate: boolean) => {
            if (currentFilter.queryText !== newFilter || currentFilter.negate !== negate) {
                currentFilter = {
                    queryText: newFilter,
                    edgeTypes: newFilter?.split(","),
                    negate
                };
                updateCustomCache();
            }
        };

        const graphView = graphLeaf.view;
        const dataEngine = graphView.dataEngine;
        const renderer = graphView.renderer;

        //
        // Custom node labels
        //

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const plugin = this;

        // Provide the patched prototypes of GraphNodeComponent and GraphLinkComonent
        // with access to our custom metdata by exposing it on GraphRenderer.

        renderer.customGraphProvider = customCache;
        renderer.__setData || (renderer.__setData = renderer.setData);
        renderer.setData = function (data) {
            this.__setData(data);
            plugin.inject_graphComponentRendering(graphLeaf);
        };

        //
        // Provide the "edge:" operator for search queries
        //

        // Intercept search queries and modify them
        const _setQuery = dataEngine._setQuery || (dataEngine._setQuery = dataEngine.setQuery);
        const setQuery = (query: GraphQuery[]) => {
            // The first entry contains the user's search query
            if (query.length >= 1) {
                const originalQuery = query[0].query;
                const match = originalQuery.matchAll(EDGE_OPERATOR_REGEX);
                if (match) {
                    const matchArray = Array.from(match);
                    const lastMatch = matchArray.last();
                    let edgeQuery: string | undefined | null = lastMatch?.at(1);
                    if (edgeQuery === "*") {
                        edgeQuery = null;
                    }
                    setEdgeFilter(edgeQuery, lastMatch?.at(0)?.startsWith("-") || false)

                    // Strip the "edge:" operator from the query before passing
                    // it on to the built-in search query parser to avoid errors.
                    const modifiedQuery = originalQuery.replace(EDGE_OPERATOR_REGEX, "");
                    query[0].query = modifiedQuery;
                } else {
                    setEdgeFilter(null, false);
                }
            }
            _setQuery.call(dataEngine, query);
        };
        dataEngine.setQuery = setQuery;

        //
        // Filter edges by edge type
        //

        // Intercept metadata retrieval
        const _app = dataEngine._app || (dataEngine._app = dataEngine.app);
        const _metadataCache = _app.metadataCache;

        const metadataProxy = new Proxy(_metadataCache, {
            get(target, propertyKey, _receiver) {
                if (propertyKey === "updateCustomCache") {
                    return updateCustomCache;
                }
                if (propertyKey === "resolvedLinks") {
                    return customCache.resolvedLinks;
                }
                if (propertyKey === "unresolvedLinks") {
                    return customCache.unresolvedLinks;
                }
                return Reflect.get(target, propertyKey);
            }
        });

        const appProxy = new Proxy(_app, {
            get(target, propertyKey, _receiver) {
                if (propertyKey === "metadataCache") {
                    return metadataProxy;
                }
                return Reflect.get(target, propertyKey);
            }
        });

        dataEngine.app = appProxy;
        return graphLeaf;
    }

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new BetterGraphViewSettingsTab(this.app, this));

        this.registerEvent(
            this.app.workspace.on("layout-change", () => {
                for (const leaf of this.getGraphLeaves()) {
                    if (leaf.view.dataEngine._app === void 0) {
                        this.inject_metadataResolver(leaf);
                    }
                }
            })
        );
        this.app.workspace.trigger("layout-change");
        for (const leaf of this.getGraphLeaves()) {
            leaf.view.unload();
            leaf.view.load();
        }
    }

    onunload() {
        // Uninstall the patches to the node and link graph components
        if (this.nodePrototype) {
            const proto = this.nodePrototype;
            if (proto?._getDisplayText) {
                proto.getDisplayText = proto._getDisplayText;
                delete proto._getDisplayText;
            }
            delete this.nodePrototype;
        }

        if (this.linkPrototype) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const proto = this.linkPrototype;
            delete this.linkPrototype;
        }

        this.hasPatchedNode = false;
        this.hasPatchedLink = false;
        this.hasPatchedGraphObjects = false;

        for (const leaf of this.getGraphLeaves()) {
            // Uninstall the proxy from the GraphDataEngine instances
            const d = leaf.view.dataEngine;
            if (d._app) {
                d.app = d._app;
                delete d._app;
            }

            if (d._setQuery) {
                d.setQuery = d._setQuery;
                delete d._setQuery;
            }

            // Uninstall the prototype installation hooks from the renderer
            const r = leaf.view.renderer;
            if (r?.__setData) {
                r.setData = r.__setData;
                delete r.__setData;
            }

            // Reload the graph view to ensure its information is accurate
            leaf.view.unload();
            leaf.view.load();
        }
    }
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class BetterGraphViewSettingsTab extends PluginSettingTab {
    plugin: BetterGraphViewPlugin;

    constructor(app: App, plugin: BetterGraphViewPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
    }
}
