import { Opcode } from './Opcodes.js';

export type Program = {
    hash: string;
    source: string;
    moduleName?: string;
    instructions: Instruction[];
    references: {
        functions: Record<string, CallableAddress>;
        events: Record<string, CallableAddress>;
    };
    exported: {
        functions: string[];
        variables: string[];
    };
}

export type CallableAddress = {
    address: number;
    numArgs: number;
}

export interface Instruction
{
    op: Opcode;
    arg?: any;        // The payload (e.g., the number 5, the string "x", or a jump address)
    comment?: string; // Helper for readability when printing ASM
    pos?: {
        lineStart: number;
        lineEnd: number;
        columnStart: number;
        columnEnd: number;
    };
}
