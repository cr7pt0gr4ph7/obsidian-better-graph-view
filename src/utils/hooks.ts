// eslint-disable-next-line @typescript-eslint/ban-types
export type HookFunction<TTargetFunction extends Function> =
    (original: TTargetFunction) => TTargetFunction;

export interface Hook {
    load(): void;
    unload(): void;
}

export interface HookForInstance<in T> {
    install(on: T): void;
    uninstall(on: T): void;
}

export class HookManager {
    hooks: Hook[] = [];

    register(hook: Hook): ThisType<HookManager> {
        this.hooks.push(hook);
        return this;
    }

    registerAndEnable(hook: Hook): ThisType<HookManager> {
        this.hooks.push(hook);
        hook.load();
        return this;
    }

    /** Removes all registered hooks. */
    destroy(): void {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const hook = this.hooks.pop();
            if (!hook) {
                break;
            }
            hook.unload();
        }
    }
}
