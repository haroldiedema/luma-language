import { BinaryReader } from './Binary/BinaryReader.js';
import { Program }      from './Program.js';

export class ConstantPool
{
    public static fromProgram(program: Program): ConstantPool
    {
        const pool = new ConstantPool();

        for (const instr of program.instructions) {
            ConstantPool._add(pool, instr.arg);
        }

        for (const funcName of program.exported.functions) {
            pool.add(funcName);
        }

        for (const varName of program.exported.variables) {
            pool.add(varName);
        }

        return pool;
    }

    public static fromBinary(data: Uint8Array | BinaryReader): ConstantPool
    {
        const pool: ConstantPool   = new ConstantPool();
        const reader: BinaryReader = data instanceof BinaryReader ? data : new BinaryReader(data);
        const count: number        = reader.readUInt32();

        for (let i = 0; i < count; i++) {
            const type = reader.readUInt8(); // 0 = String, 1 = Number

            if (type === 0) {
                pool.add(reader.readString(), true);
            } else if (type === 1) {
                pool.add(reader.readFloat64(), true);
            } else {
                throw new Error(`Corrupt binary: Unknown constant type tag ${type} at offset ${reader.position}`);
            }
        }

        return pool;
    }

    private static _add(pool: ConstantPool, value: any): void
    {
        if (value === null || value === undefined) {
            return;
        }

        if (typeof value === 'string' || typeof value === 'number') {
            pool.add(value);
            return;
        }

        if (Array.isArray(value)) {
            for (const item of value) {
                ConstantPool._add(pool, item);
            }

            return;
        }

        if (typeof value === 'object') {
            for (const key of Object.keys(value)) {
                if (typeof key === 'string' || typeof key === 'number') {
                    pool.add(key);
                    ConstantPool._add(pool, value[key]);
                }
            }
        }
    }

    private readonly valueToId: Map<string | number, number> = new Map();
    private readonly idToValue: Map<number, string | number> = new Map();

    /**
     * Get constant pool ID by its value.
     *
     * @param {string | number} value
     * @returns {number | null}
     */
    public getId(value: string | number): number | null
    {
        return this.valueToId.get(value) ?? null;
    }

    /**
     * Get constant pool value by its ID.
     *
     * @param {number} id
     * @returns {string | number | null}
     */
    public getValue(id: number): string | number | null
    {
        return this.idToValue.get(id) ?? null;
    }

    /**
     * Get all constant pool values in order of their IDs.
     */
    public getAll(): (string | number | boolean)[]
    {
        return Array.from(this.idToValue.values());
    }

    public add(value: string | number, force: boolean = false): number
    {
        if (force) {
            const id = this.valueToId.size;

            this.valueToId.set(value, id);
            this.idToValue.set(id, value);

            return id;
        }

        if (this.valueToId.has(value)) {
            return this.valueToId.get(value)!;
        }

        const id = this.valueToId.size;
        this.valueToId.set(value, id);
        this.idToValue.set(id, value);

        return id;
    }
}
