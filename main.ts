import { App, Plugin, PluginSettingTab } from 'obsidian';
import { BreadcrumbGraphProvider } from './src/graph/breadcrumb-graph-provider';
import './src/utils/breadcrumbs-global-api';
import { GraphLeaf, GraphQuery } from './src/utils/graph-internals';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BetterGraphViewSettings {
}

const DEFAULT_SETTINGS: BetterGraphViewSettings = {
}

const EDGE_OPERATOR_REGEX = /(?<=^| )-?edge:([^ ]*)/gm;

export default class BetterGraphViewPlugin extends Plugin {
    settings: BetterGraphViewSettings;

    private getGraphLeaves(): GraphLeaf[] {
        return this.app.workspace.getLeavesOfType("graph") as GraphLeaf[];
    }

    inject_metadataResolver(graphLeaf: GraphLeaf) {
        const customCache = new BreadcrumbGraphProvider();
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

        // Intercept search queries
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
