import { State } from '../State.js';

/**
 * @opcode Opcode.CALL_PARENT
 */
export function callParent(state: State, arg: any): void
{
    const argCount: number = arg;
    const cls: any         = state.pop(); // Pop "Point"

    if (! cls || cls.type !== 'class') {
        throw new Error(`'super' call requires a class.`);
    }

    if (cls.isHostClass) {
        const hostArgs: any[] = [];

        for (let i = 0; i < argCount; i++) {
            hostArgs.unshift(state.pop());
        }

        const instance = state.pop();
        const hostInstance = new cls.constructor(...hostArgs);

        Object.defineProperty(instance, '__host_target__', {
            value:        hostInstance,
            enumerable:   false,
            writable:     false,
            configurable: false,
        });

        const allowedProperties = cls.properties ?? [];
        for (const prop of allowedProperties) {
            Object.defineProperty(instance, prop, {
                get: () => hostInstance[prop],
                set: (value) => { hostInstance[prop] = value; },
                enumerable:   true,
                configurable: true,
            });
        }

        const allowedMethods = cls.methods ?? [];
        for (const method of allowedMethods) {
            if (! instance?.__class?.methods[method]) {
                instance[method] = (...args: any[]) => hostInstance[method](...args);
            }
        }

        state.push(null);
        return;
    }

    if (argCount !== cls.paramCount) {
        throw new Error(`Class "${cls.name}" expects ${cls.paramCount} argument${cls.paramCount === 1 ? '' : 's'}, but got ${argCount}.`);
    }

    const thisIndex = state.stack.length - argCount - 1;
    const instance  = state.stack[thisIndex];

    state.stack.splice(thisIndex, 1); // Remove 'this' from the stack.

    const frame = state.pushFrame(state.ip, {
        name:    `super ${cls.name}`,
        program: cls.prog,
    });

    frame.locals['this'] = instance;
    state.ip             = cls.constructorAddr;
}
