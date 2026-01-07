import { State } from '../State.js';

/**
 * @opcode Opcode.MAKE_METHOD
 */
export function makeMethod(state: State): void
{
    const methodFunc = state.pop(); // The ScriptFunction object
    const cls        = state.pop(); // The Class object

    if (! cls || ! cls.methods) {
        throw new Error('Runtime Error: Cannot add method to non-class.');
    }

    cls.methods[methodFunc.name] = methodFunc;
}
