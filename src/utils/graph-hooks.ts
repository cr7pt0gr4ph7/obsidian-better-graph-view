import { GraphLeaf, GraphRenderer } from "./graph-internals";
import { HookForInstance, HookFunction } from "./hooks";

type SetDataFn = GraphRenderer["setData"];

export class SetDataHook implements HookForInstance<GraphLeaf> {
    constructor(public handlerFactory: HookFunction<SetDataFn>) { }

    install(on: GraphLeaf) {
        const graphLeaf = on;
        const r = graphLeaf.view.renderer;
        if (!r._setData) {
            r._setData = r.setData;
        }
        r.setData = this.handlerFactory(r._setData);
    }

    uninstall(on: GraphLeaf) {
        const graphLeaf = on;
        const r = graphLeaf.view.renderer;
        if (r?._setData) {
            r.setData = r._setData;
            delete r._setData;
        }
    }
}
