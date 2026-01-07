import { State } from '../State.js';

/**
 * @opcode Opcode.MAKE_CLASS
 */
export function makeClass(state: State, arg: any): void
{
    const [name, addr, paramCount] = arg;

    const parent = state.pop();

    if (parent !== null && parent.type !== 'class') {
        throw new Error(`Runtime Error: Class '${name}' extends a non-class value (${parent?.type || 'null'}).`);
    }

    const cls = {
        type:            'class',
        name:            name,
        constructorAddr: addr,
        paramCount:      paramCount || 0,
        methods:         {},
        prog:            state.currentProgram,
        parent:          undefined,
    };

    if (parent) {
        Object.setPrototypeOf(cls.methods, parent.methods);
        cls.parent = parent;
    }

    state.push(cls);
}
