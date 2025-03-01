import { App, Modal, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { BreadcrumbGraphProvider } from './src/graph/breadcrumb-graph-provider';
import './src/utils/breadcrumbs-global-api';
import { GraphLeaf, GraphQuery } from './src/utils/graph-internals';

interface BetterGraphViewSettings {
    edgeFilter: string[];
}

const DEFAULT_SETTINGS: BetterGraphViewSettings = {
    edgeFilter: []
}

const EDGE_OPERATOR_REGEX = /(?<=^| )edge:([^ ]*)/gm;

export default class BetterGraphViewPlugin extends Plugin {
    settings: BetterGraphViewSettings;

    private getGraphLeaves(): GraphLeaf[] {
        return this.app.workspace.getLeavesOfType("graph") as GraphLeaf[];
    }

    private async setEdgeFilter(filterByType: string[]) {
        this.settings.edgeFilter = [...filterByType];
        await this.saveSettings();
        this.forceGraphUpdate();
    }

    private forceGraphUpdate() {
        BreadcrumbGraphProvider.askBreadcrumbsPluginToRefreshItsData();

        for (const leaf of this.getGraphLeaves()) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const metadataCache = leaf.view.dataEngine.app.metadataCache as any;
            if (metadataCache?.updateCustomCache) {
                metadataCache?.updateCustomCache();
            }
            leaf.view.update();
        }
    }

    inject_metadataResolver(graphLeaf: GraphLeaf) {
        const customCache = new BreadcrumbGraphProvider();
        let currentFilter: string | undefined | null = null;
        let currentFilterByType: string[] | undefined | null = null;
        const updateCustomCache = () => customCache.updateCache(currentFilterByType);

        const setEdgeFilter = (newFilter: string | undefined | null) => {
            if (currentFilter !== newFilter) {
                currentFilter = newFilter;
                currentFilterByType = newFilter?.split(",");
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
                    let edgeQuery: string | undefined | null = matchArray.last()?.at(1);
                    if (edgeQuery === "*") {
                        edgeQuery = null;
                    }
                    setEdgeFilter(edgeQuery)

                    // Strip the "edge:" operator from the query before passing
                    // it on to the built-in search query parser to avoid errors.
                    const modifiedQuery = originalQuery.replace(EDGE_OPERATOR_REGEX, "");
                    query[0].query = modifiedQuery;
                } else {
                    setEdgeFilter(null);
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

        this.addCommand({
            id: 'set-edge-filter',
            name: 'Set edge filter',
            callback: () => {
                new SetEdgeFilterModal(this.app, (result) => {
                    this.setEdgeFilter(result.split(" ").filter(x => x && x.length > 0));
                }).open();
            },
        });

        this.addCommand({
            id: 'force-graph-update',
            name: 'Force graph update',
            callback: () => {
                this.forceGraphUpdate();
            },
        });

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

        new Setting(containerEl)
            .setName('Edge Filter')
            .setDesc('The currently configured edge filter')
            .addText(text => text
                .setPlaceholder('Enter the edge filter')
                .setValue(this.plugin.settings.edgeFilter.join(' '))
                .onChange(async (value) => {
                    this.plugin.settings.edgeFilter = value.split(' ').filter(x => x && x.length > 0);
                    await this.plugin.saveSettings();
                }));
    }
}

class SetEdgeFilterModal extends Modal {
    constructor(app: App, onSubmit: (newFilter: string) => void) {
        super(app);
        this.setTitle('Enter the desired edge filters:');

        let edgeFilter = '';
        new Setting(this.contentEl)
            .setName('Edge Filters')
            .addText((text) =>
                text.onChange((value) => {
                    edgeFilter = value;
                }));

        new Setting(this.contentEl)
            .addButton(btn => btn
                .setButtonText('Apply')
                .setCta()
                .onClick(() => {
                    this.close();
                    onSubmit(edgeFilter);
                }));
    }
}
