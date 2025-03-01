# Better Graph View Plugin for Obsidian

The integrated [Graph plugin](https://help.obsidian.md/plugins/graph) for [Obsidian](https://obsidian.md) is great,
but is missing a few important features for working with highly interconnected graphs.

🛠️: Currently in development | 🚧: Planned

- Force-directed interactive graph layout (like the official Graph plugin) based on the [`force-graph`](https://github.com/vasturiano/force-graph) library.

- Data Sources
  - 🚧: Works with plain Obsidian installation (but does not provide edge annotation or filtering in that case).
  - 🚧: Integration with the [Dataview]() plugin to annotate edges with attribute names.
  - 🚧: Integration with the [Breadcrumbs]() plugin to derive implicit edges for a more complete graph.
  - 🚧: Provides a JavaScript API usable from other plugins.

- Labeling of nodes
  - 🚧: Displaying labels on nodes based on file names or custom frontmatter attributes.
  - 🚧: Visibility of node labels can be toggled.
  - 🚧: Customizable node size via frontmatter attributes
  - 🚧: Customizable node colors via customizable rules

- Labeling of edges
  - 🚧: Display labels on edges based on the relationship source (e.g. the frontmatter attribute name).
  - 🚧: Customizable edge thickness.
  - 🚧: Customizable edge colors.

- Filtering
  - 🚧: Filtering of edges based on Dataview queries.

- Views
  - 🚧: View configurations can be saved and restored.
  - 🚧: Integrate interactive views directly into your pages via `better-graph` codeblocks.

## Related Plugins

The following Obsidian plugins also provide graph views, but didn't provide _exactly_ what I needed.
Depending on your requirements, these may or may not fit your use case better:

- [Juggl](https://github.com/HEmile/juggl)
