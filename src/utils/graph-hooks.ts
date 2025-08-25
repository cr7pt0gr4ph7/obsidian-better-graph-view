import { GraphLeaf, GraphRenderer } from "./graph-internals";
import { HookForInstance, HookFunction } from "./hooks";

type SetDataFn = GraphRenderer["setData"];

export class SetDataHook implements HookForInstance<GraphLeaf> {
    constructor(public handlerFactory: HookFunction<SetDataFn>) { }

    install(on: GraphLeaf) {
        const graphLeaf = on;
        const r = graphLeaf.view.renderer;
        if (!r.__setData) {
            r.__setData = r.setData;
        }
        r.setData = this.handlerFactory(r.__setData);
    }

    uninstall(on: GraphLeaf) {
        const graphLeaf = on;
        const r = graphLeaf.view.renderer;
        if (r?.__setData) {
            r.setData = r.__setData;
            delete r.__setData;
        }
    }
}
