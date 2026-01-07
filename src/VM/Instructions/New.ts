import { State }             from '../State.js';
import { HostClassContract } from '../VirtualMachineOptions.js';

/**
 * @opcode Opcode.NEW
 */
export function _new(state: State, hostClasses: Map<string, HostClassContract>, arg: any): void
{
    const cls: any        = state.pop();
    const numArgs: number = arg;

    if (! cls || cls.type !== 'class') {
        throw new Error('\'new\' requires a class.');
    }

    if (cls.isHostClass) {
        const hostArgs: any[] = [];

        for (let i = 0; i < numArgs; i++) {
            hostArgs.unshift(state.pop());
        }

        const allowedProperties = cls.properties ?? [];
        const allowedMethods    = cls.methods ?? [];
        const hostInstance      = new cls.constructor(...hostArgs);
        const instance: any     = {};

        // Add live bindings for allowed properties and methods.
        for (const prop of allowedProperties) {
            Object.defineProperty(instance, prop, {
                get:          () => hostInstance[prop],
                set:          (value) => {
                    hostInstance[prop] = value;
                },
                enumerable:   true,
                configurable: false,
            });
        }

        for (const method of allowedMethods) {
            if (typeof hostInstance[method] === 'function') {
                instance[method] = (...args: any[]) => hostInstance[method](...args);
            }
        }

        instance.__class = cls;
        state.push(instance);
        return;
    }

    const instance: any = Object.create(cls.methods);
    instance.__class    = cls;

    // Mark this object as a VM object with a hidden property
    Object.defineProperty(instance, '__is_vm_object__', {
        value:        true,
        enumerable:   false,
        writable:     false,
        configurable: false,
    });

    const frame = state.pushFrame(state.ip, {
        program: cls.prog,
        name:    `new ${cls.name}`,
    });

    frame.locals['this'] = instance;
    state.ip             = cls.constructorAddr;
}
