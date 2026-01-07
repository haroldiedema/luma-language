import { BinaryReader } from './Binary/BinaryReader.js';
import { ConstantPool }         from './ConstantPool.js';
import { Opcode, OpcodeBytes } from './Opcodes.js';
import { Instruction, Program } from './Program.js';

export class Reader
{
    /**
     * Reads a Luma program from a binary Uint8Array.
     *
     * @param {Uint8Array} data
     * @returns {Program}
     */
    public static read(data: Uint8Array): Program
    {
        return new Reader(data).read();
    }

    private readonly reader: BinaryReader;
    private pool!: ConstantPool;
    private withDebugInfo: boolean = false;

    private constructor(data: Uint8Array)
    {
        this.reader = new BinaryReader(data);
    }

    private read(): Program
    {
        const { hash, moduleName } = this.readHeader();
        this.readConstants();
        const exported = this.readExports();
        const references = this.readReferences();
        const instructions = this.readInstructions();
        const source = this.readSource();

        return {
            hash,
            source: source,
            moduleName: moduleName,
            instructions: instructions,
            references: references,
            exported: exported
        };
    }

    private readHeader(): { hash: string, moduleName?: string }
    {
        const magic = [
            this.reader.readUInt8(),
            this.reader.readUInt8(),
            this.reader.readUInt8()
        ];

        if (magic[0] !== 0x4C || magic[1] !== 0x55 || magic[2] !== 0x58) {
            throw new Error("Invalid file format.");
        }

        const version = this.reader.readUInt8();
        if (version !== 1) {
            throw new Error(`Unsupported version ${version}. Expected 1.`);
        }

        this.withDebugInfo = this.reader.readUInt8() === 1;

        // Module Name
        const nameLen = this.reader.readUInt8();
        const moduleName = nameLen > 0 ? this.reader.readString() : undefined;

        // Module Hash
        const hashLen = this.reader.readUInt8();
        const hash = hashLen > 0 ? this.reader.readString() : '';

        return { hash, moduleName };
    }

    private readConstants(): void
    {
        this.pool = new ConstantPool();
        const count = this.reader.readUInt16();

        for (let i = 0; i < count; i++) {
            const type = this.reader.readUInt8();

            if (type === 0x01) {
                this.pool.add(this.reader.readFloat64(), true); // true = force add
            } else if (type === 0x02) {
                this.pool.add(this.reader.readString(), true);
            } else {
                throw new Error(`Corrupt binary: Unknown constant type tag ${type} at offset ${this.reader.position}`);
            }
        }
    }

    private readExports(): Program['exported']
    {
        const functions: string[] = [];
        const variables: string[] = [];

        // Functions
        const funcCount = this.reader.readUInt16();
        for (let i = 0; i < funcCount; i++) {
            functions.push(this.getPoolString(this.reader.readUInt16()));
        }

        // Variables
        const varCount = this.reader.readUInt16();
        for (let i = 0; i < varCount; i++) {
            variables.push(this.getPoolString(this.reader.readUInt16()));
        }

        return { functions, variables };
    }

    private readReferences(): Program['references']
    {
        const functions: Record<string, { address: number, numArgs: number }> = {};
        const events: Record<string, { address: number, numArgs: number }> = {};

        // Function References
        const funcCount = this.reader.readUInt16();
        for (let i = 0; i < funcCount; i++) {
            const name = this.getPoolString(this.reader.readUInt16());
            const address = this.reader.readUInt16();
            const numArgs = this.reader.readUInt8();
            functions[name] = { address, numArgs };
        }

        // Event References
        const eventCount = this.reader.readUInt16();
        for (let i = 0; i < eventCount; i++) {
            const name = this.getPoolString(this.reader.readUInt16());
            const address = this.reader.readUInt16();
            const numArgs = this.reader.readUInt8();
            events[name] = { address, numArgs };
        }

        return { functions, events };
    }

    private readInstructions(): Instruction[]
    {
        const count = this.reader.readUInt16();
        const instructions: Instruction[] = [];

        for (let i = 0; i < count; i++) {
            const instr: Instruction = {
                op: OpcodeBytes[this.reader.readUInt8()] as Opcode,
            };

            const arg = this.readValueArg();
            if (arg !== undefined) {
                instr.arg = arg;
            }

            if (this.withDebugInfo) {
                // Position
                const hasPos = this.reader.readUInt8() === 1;
                if (hasPos) {
                    instr.pos = {
                        lineStart: this.reader.readUInt16(),
                        columnStart: this.reader.readUInt16(),
                        lineEnd: this.reader.readUInt16(),
                        columnEnd: this.reader.readUInt16(),
                    };
                }

                // Comment
                const commentLen = this.reader.readUInt16();
                if (commentLen > 0) {
                    instr.comment = this.reader.readString();
                }
            }

            instructions.push(instr);
        }

        return instructions;
    }

    private readSource(): string
    {
        if (!this.withDebugInfo) {
            this.reader.readUInt32();
            return "";
        }

        return this.reader.readString();
    }

    private readValueArg(): any
    {
        const type = this.reader.readUInt8();

        switch (type) {
            case 0: return undefined; // Null/Undefined
            case 1: // String
                return this.getPoolString(this.reader.readUInt16());
            case 2: // Number
                const id = this.reader.readUInt16();
                return this.pool.getValue(id);
            case 3: // Boolean
                return this.reader.readUInt8() === 1;
            case 4: // Array
            {
                const len = this.reader.readUInt16();
                const arr: any[] = [];
                for (let i = 0; i < len; i++) arr.push(this.readValueArg());
                return arr;
            }
            case 5: // Object
            {
                const keysLen = this.reader.readUInt16();
                const obj: any = {};
                for (let i = 0; i < keysLen; i++) {
                    obj[this.readValueArg()] = this.readValueArg();
                }
                return obj;
            }
            case 6: // null
                return null;
            default:
                throw new Error(`Unknown argument type tag: ${type} at offset ${this.reader.position}`);
        }
    }

    private getPoolString(id: number): string
    {
        const val = this.pool.getValue(id);
        if (typeof val !== 'string') {
            throw new Error(`Expected string constant at pool ID ${id}, got ${typeof val}`);
        }
        return val;
    }
}
