import { State }             from '../State.js';
import { HostClassContract } from '../VirtualMachineOptions.js';

/**
 * @opcode Opcode.LOAD
 */
export function load(state: State, hostClasses: Map<string, HostClassContract>, arg: any): void
{
    if (hostClasses.has(arg)) {
        state.push({
            type:        'class',
            name:        arg,
            isHostClass: true,
            ...hostClasses.get(arg)!,
        });

        return;
    }

    state.push(state.getVar(arg));
}
