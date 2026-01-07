import { TokenPosition } from '../Tokenizer/index.js';

export enum Opcode
{
    HALT          = 'HALT',   // Stop execution
    CONST         = 'CONST',  // Push a value onto the stack
    SWAP          = 'SWAP',   // Swap top two values on the stack
    EXPORT        = 'EXPORT', // Mark top of stack for export (2 values: name, value)
    IMPORT        = 'IMPORT', // Import a module (arg: module name)
    WAIT          = 'WAIT',   // Pause execution for X milliseconds (stack: [duration])
    NEW           = 'NEW',    // Stack: [arg1, arg2..., class] -> Instance
    SUPER         = 'SUPER',  // Invoke parent method ({name: string, args: number})

    // Arithmetic
    ADD           = 'ADD',
    SUB           = 'SUB',
    MUL           = 'MUL',
    DIV           = 'DIV',
    MOD           = 'MOD',
    EXP           = 'EXP',
    NEG           = 'NEG',

    // Comparison
    EQ            = 'EQ',
    NEQ           = 'NEQ',
    GT            = 'GT',
    GTE           = 'GTE',
    LT            = 'LT',
    LTE           = 'LTE',
    IN            = 'IN',
    IS            = 'IS',

    // Logical
    NOT           = 'NOT',

    // Logic
    JMP           = 'JMP',          // Unconditional Jump
    JMP_IF_FALSE  = 'JMP_IF_FALSE', // Jump if top of stack is false
    JMP_IF_TRUE   = 'JMP_IF_TRUE',   // Jump if top is true (pops value)
    DUP           = 'DUP',           // Duplicate top value (A -> A, A)
    POP           = 'POP',           // Discard top value (A -> )

    // Variables
    LOAD          = 'LOAD',   // Load variable value onto stack
    STORE         = 'STORE',  // Store top of stack into variable

    // Functions
    CALL          = 'CALL',   // { name: string, addr: number, args: number }
    CALL_METHOD   = 'CALL_METHOD', // { name: string, args: number }
    CALL_PARENT   = 'CALL_PARENT', // arg: number of args
    RET           = 'RET',

    // Collections
    MAKE_ARRAY    = 'MAKE_ARRAY',    // Stack: [arg1, arg2...] -> Array
    MAKE_RANGE    = 'MAKE_RANGE',    // Stack: [start, end] -> Range
    MAKE_OBJECT   = 'MAKE_OBJECT',   // Stack: [key1, val1...] -> Object
    MAKE_FUNCTION = 'MAKE_FUNCTION', // { name: string, addr: number, args: number }
    MAKE_CLASS    = 'MAKE_CLASS',    // [ name, startIndex ]
    MAKE_METHOD   = 'MAKE_METHOD',   // Stack: [{ ... MAKE_FUNCTION result ... }]

    // Property Access
    GET_PROP      = 'GET_PROP',    // Stack: [Object, Key] -> [Value]
    SET_PROP      = 'SET_PROP',    // Stack: [Object, Key, Value] -> [Value]

    // Iteration
    ITER_INIT     = 'ITER_INIT',   // Stack: [Array] -> [Iterator]
    ITER_NEXT     = 'ITER_NEXT',   // Stack: [Iterator] -> [Value] (or Jump if done)
    ARRAY_PUSH    = 'ARRAY_PUSH',  // Stack: [Array, Value] -> []
}

export enum OpcodeBytes
{
    HALT          = 0x00,
    CONST         = 0x01,
    SWAP          = 0x02,
    EXPORT        = 0x03,
    IMPORT        = 0x04,
    WAIT          = 0x05,
    NEW           = 0x06,
    SUPER         = 0x07,
    ADD           = 0x10,
    SUB           = 0x11,
    MUL           = 0x12,
    DIV           = 0x13,
    MOD           = 0x14,
    EXP           = 0x15,
    NEG           = 0x16,
    EQ            = 0x20,
    NEQ           = 0x21,
    GT            = 0x22,
    GTE           = 0x23,
    LT            = 0x24,
    LTE           = 0x25,
    IN            = 0x26,
    IS            = 0x27,
    NOT           = 0x30,
    JMP           = 0x40,
    JMP_IF_FALSE  = 0x41,
    JMP_IF_TRUE   = 0x42,
    DUP           = 0x43,
    POP           = 0x44,
    LOAD          = 0x50,
    STORE         = 0x51,
    CALL          = 0x60,
    CALL_METHOD   = 0x61,
    CALL_PARENT   = 0x62,
    RET           = 0x63,
    MAKE_ARRAY    = 0x70,
    MAKE_RANGE    = 0x71,
    MAKE_OBJECT   = 0x72,
    MAKE_FUNCTION = 0x73,
    MAKE_CLASS    = 0x74,
    MAKE_METHOD   = 0x75,
    GET_PROP      = 0x80,
    SET_PROP      = 0x81,
    ITER_INIT     = 0x90,
    ITER_NEXT     = 0x91,
    ARRAY_PUSH    = 0x92,
}
