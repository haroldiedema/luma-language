import { State } from '../State.js';

/**
 * @opcode Opcode.IS
 */
export function is(state: State): void
{
    const targetClass = state.pop(); // The Class (RHS)
    const instance    = state.pop(); // The Object (LHS)

    // 1. Safety Check: If LHS is null/undefined, it is not an instance of anything.
    if (instance === null || instance === undefined) {
        state.push(false);
        return;
    }

    // 2. Validation: RHS must be a Class (Luma or Host)
    if (!targetClass || (targetClass.type !== 'class' && targetClass.type !== 'Blueprint')) {
        // Optional: Support "is String" / "is Number" if you expose those as globals later.
        throw new Error("Right-hand side of 'is' must be a Class.");
    }

    // --- CASE A: Host Class Check ---
    if (targetClass.isHostClass) {
        // 1. Is the instance a raw JS object?
        if (instance instanceof targetClass.constructor) {
            state.push(true);
            return;
        }

        // 2. Is it a Luma Wrapper around a Host Object? (created via new HostClass)
        if (instance.__host_target__ && instance.__host_target__ instanceof targetClass.constructor) {
            state.push(true);
            return;
        }

        state.push(false);
        return;
    }

    // --- CASE B: Luma Class Check (Walk the Chain) ---

    // Get the class of the instance
    // Note: Adjust property name based on your exact object structure (__class vs __blueprint)
    let currentClass = instance.__class || instance.__blueprint;

    while (currentClass) {
        // Found a match?
        // We compare references (memory addresses) of the class objects.
        if (currentClass === targetClass) {
            state.push(true);
            return;
        }

        // Move up the chain
        currentClass = currentClass.parent;
    }

    state.push(false);
}
