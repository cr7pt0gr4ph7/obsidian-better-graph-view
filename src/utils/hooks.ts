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

class InstantiatedHook<T> implements Hook {
    constructor(private inner: HookForInstance<T>, private instance: T) { }

    load(): void {
        this.inner.install(this.instance);
    }

    unload(): void {
        this.inner.uninstall(this.instance);
    }
}

function getActualHook<T>(hook: Hook | HookForInstance<T>, instance?: T): Hook {
    if (instance === null || instance === undefined) {
        // Global hook
        if (!("load" in hook)) {
            throw new Error("Must be a Hook if no instance is provided.")
        }
        return hook;
    } else {
        // Instance hook
        if (!("install" in hook)) {
            throw new Error("Must be a HookForInstance if an instance is provided.")
        }
        return new InstantiatedHook(hook, instance);
    }
}

export class HookManager {
    hooks: Hook[] = [];

    register(hook: Hook): ThisType<HookManager>;
    register<T>(hook: HookForInstance<T>, instance: T): ThisType<HookManager>;
    register<T>(hook: Hook | HookForInstance<T>, instance?: T): ThisType<HookManager> {
        let actualHook = getActualHook(hook, instance);
        this.hooks.push(actualHook);
        return this;
    }

    registerAndEnable(hook: Hook): ThisType<HookManager>;
    registerAndEnable<T>(hook: HookForInstance<T>, instance: T): ThisType<HookManager>;
    registerAndEnable<T>(hook: Hook | HookForInstance<T>, instance?: T): ThisType<HookManager> {
        let actualHook = getActualHook(hook, instance);
        this.hooks.push(actualHook);
        actualHook.load();
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
