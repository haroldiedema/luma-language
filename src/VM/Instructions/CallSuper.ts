import { State } from '../State.js';

/**
 * @opcode Opcode.SUPER
 */
export function _super(state: State, arg: any): void
{
    const operand: { name: string, args: number, callee: string } = arg;
    const {name, args, callee}                                    = operand;

    const thisIndex = state.stack.length - args - 1;

    const instance = state.stack[thisIndex];
    if (! instance) {
        throw new Error(`Attempt to call parent method "${name}" on an undefined value.`);
    }

    const cls = instance.__class;
    if (! cls) {
        throw new Error(`Instance has no class to call super method "${name}" on.`);
    }

    const ownerClass = state.getVar(callee);
    const parent     = ownerClass.parent;

    if (! parent) {
        throw new Error(`Class "${cls.name}" has no parent to call "${name}" on.`);
    }

    if (parent.isHostClass) {
        if (! parent.methods.includes(name)) {
            throw new Error(`Method "${name}" not found in parent host class "${parent.name}".`);
        }

        const hostArgs: any[] = [];

        for (let i = 0; i < args; i++) {
            hostArgs.unshift(state.pop());
        }

        state.pop(); // Pop 'this'
        state.push(instance.__host_target__[name](...hostArgs));
        return;
    }

    const method = parent.methods[name];
    if (! method) {
        throw new Error(`Method "${name}" not found in parent class "${parent.name}".`);
    }

    const frame = state.pushFrame(state.ip, {
        program: method.prog,
        name:    `parent.${name}`,
    });

    frame.locals['this'] = instance;
    state.ip             = method.addr;
}
