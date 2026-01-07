import { BinaryWriter } from './Binary/BinaryWriter.js';
import { ConstantPool } from './ConstantPool.js';
import { OpcodeBytes }  from './Opcodes.js';
import { Program }      from './Program.js';

export class Writer
{
    /**
     * Writes the given program to a binary format.
     *
     * Includes an option to add debug information such as source code and
     * instruction comments, as well as line/column positions. This may be
     * useful for debugging, but increases the size of the output binary.
     *
     * @param {Program} program
     * @param {boolean} withDebugInfo - Whether to include debug information.
     * @returns {Uint8Array}
     */
    public static write(program: Program, withDebugInfo: boolean): Uint8Array
    {
        return new Writer(program, withDebugInfo).write();
    }

    private readonly program: Program;
    private readonly writer: BinaryWriter;
    private readonly pool: ConstantPool;
    private readonly withDebugInfo: boolean;

    private constructor(program: Program, withDebugInfo: boolean = false)
    {
        this.program       = program;
        this.pool          = ConstantPool.fromProgram(program);
        this.writer        = new BinaryWriter();
        this.withDebugInfo = withDebugInfo;
    }

    private write(): Uint8Array
    {
        this.writeHeader();
        this.writeConstants();
        this.writeExports();
        this.writeReferences();
        this.writeInstructions();
        this.writeSource();

        return this.writer.toBuffer();
    }

    private writeHeader(): void
    {
        this.writer.writeUInt8(0x4C); // 'L'
        this.writer.writeUInt8(0x55); // 'U'
        this.writer.writeUInt8(0x58); // 'X'
        this.writer.writeUInt8(0x01); // '1' (version 1)
        this.writer.writeUInt8(this.withDebugInfo ? 1 : 0); // Debug info flag

        // Module name.
        this.writer.writeUInt8(this.program.moduleName?.length ?? 0);
        if (this.program.moduleName) {
            this.writer.writeString(this.program.moduleName);
        }

        // Module hash.
        this.writer.writeUInt8(this.program.hash.length);
        this.writer.writeString(this.program.hash);
    }

    private writeConstants(): void
    {
        const constants = this.pool.getAll();
        this.writer.writeUInt16(constants.length);

        for (const constant of constants) {
            switch (typeof constant) {
                case 'number':
                    this.writer.writeUInt8(0x01); // Type: Number
                    this.writer.writeFloat64(constant);
                    break;

                case 'string':
                    this.writer.writeUInt8(0x02); // Type: String
                    this.writer.writeString(constant);
                    break;

                default:
                    throw new Error(`Unsupported constant type: ${typeof constant}`);
            }
        }
    }

    private writeExports(): void
    {
        this.writer.writeUInt16(this.program.exported.functions.length);
        for (const funcName of this.program.exported.functions) {
            this.writer.writeUInt16(this.getPoolId(funcName));
        }

        this.writer.writeUInt16(this.program.exported.variables.length);
        for (const varName of this.program.exported.variables) {
            this.writer.writeUInt16(this.getPoolId(varName));
        }
    }

    private writeReferences(): void
    {
        // Functions.
        const funcNames = Object.keys(this.program.references.functions);
        this.writer.writeUInt16(funcNames.length);

        for (const funcName of funcNames) {
            const addr = this.program.references.functions[funcName];
            this.writer.writeUInt16(this.getPoolId(funcName));
            this.writer.writeUInt16(addr.address);
            this.writer.writeUInt8(addr.numArgs);
        }

        // Events.
        const eventNames = Object.keys(this.program.references.events);
        this.writer.writeUInt16(eventNames.length);

        for (const eventName of eventNames) {
            const addr = this.program.references.events[eventName];
            this.writer.writeUInt16(this.getPoolId(eventName));
            this.writer.writeUInt16(addr.address);
            this.writer.writeUInt8(addr.numArgs);
        }
    }

    private writeInstructions(): void
    {
        this.writer.writeUInt16(this.program.instructions.length);

        for (const instr of this.program.instructions) {
            this.writer.writeUInt8(OpcodeBytes[instr.op]);
            this.writeValueArg(instr.arg);

            if (this.withDebugInfo) {
                // Position info.
                if (instr.pos) {
                    this.writer.writeUInt8(1); // Has position info
                    this.writer.writeUInt16(instr.pos.lineStart);
                    this.writer.writeUInt16(instr.pos.columnStart);
                    this.writer.writeUInt16(instr.pos.lineEnd);
                    this.writer.writeUInt16(instr.pos.columnEnd);
                } else {
                    this.writer.writeUInt8(0); // No position info
                }

                // Comment.
                this.writer.writeUInt16(instr.comment?.length ?? 0);
                if (instr.comment) {
                    this.writer.writeString(instr.comment);
                }
            }
        }
    }

    private writeSource(): void
    {
        if (! this.withDebugInfo) {
            this.writer.writeUInt32(0);
            return;
        }

        this.writer.writeString(this.program.source);
    }

    private writeValueArg(value: any): void
    {
        if (value === undefined) {
            this.writer.writeUInt8(0); // Arg type: Undefined
            return;
        }

        if (value === null) {
            this.writer.writeUInt8(6); // Arg type: Null
            return;
        }

        if (typeof value === 'string') {
            this.writer.writeUInt8(1); // Arg type: String
            this.writer.writeUInt16(this.getPoolId(value));
            return;
        }

        if (typeof value === 'number') {
            this.writer.writeUInt8(2); // Arg type: Number
            this.writer.writeUInt16(this.getPoolId(value));
            return;
        }

        if (typeof value === 'boolean') {
            this.writer.writeUInt8(3); // Arg type: Boolean
            this.writer.writeUInt8(value ? 1 : 0);
            return;
        }

        if (Array.isArray(value)) {
            this.writer.writeUInt8(4); // Arg type: Array
            this.writer.writeUInt16(value.length);

            for (const item of value) {
                this.writeValueArg(item);
            }

            return;
        }

        if (typeof value === 'object') {
            this.writer.writeUInt8(5); // Arg type: Object
            const keys = Object.keys(value);
            this.writer.writeUInt16(keys.length);

            for (const key of keys) {
                this.writeValueArg(key);
                this.writeValueArg(value[key]);
            }

            return;
        }

        throw new Error(`Unsupported instruction argument type: ${typeof value}`);
    }

    private getPoolId(value: string | number): number
    {
        const id = this.pool.getId(value);

        if (id === null) {
            throw new Error(`Value "${value}" not found in constant pool.`);
        }

        return id;
    }
}
