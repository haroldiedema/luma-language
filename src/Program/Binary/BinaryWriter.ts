export class BinaryWriter
{
    private buffer: Uint8Array;
    private view: DataView;
    private offset: number;

    constructor(initialSize: number = 1024)
    {
        this.buffer = new Uint8Array(initialSize);
        this.view   = new DataView(this.buffer.buffer);
        this.offset = 0;
    }

    public writeUInt8(value: number): void
    {
        this.ensureCapacity(1);
        this.view.setUint8(this.offset, value);
        this.offset += 1;
    }

    public writeUInt16(value: number): void
    {
        this.ensureCapacity(2);
        this.view.setUint16(this.offset, value, true); // true = Little Endian
        this.offset += 2;
    }

    public writeUInt32(value: number): void
    {
        this.ensureCapacity(4);
        this.view.setUint32(this.offset, value, true);
        this.offset += 4;
    }

    public writeFloat64(value: number): void
    {
        this.ensureCapacity(8);
        this.view.setFloat64(this.offset, value, true);
        this.offset += 8;
    }

    public writeString(value: string): void
    {
        // We use TextEncoder, which is standard in Browsers and Node 11+
        const encoder = new TextEncoder();
        const bytes   = encoder.encode(value);

        // Write length prefix (assume u32 for safety, or u16 if strings are short)
        this.writeUInt32(bytes.length);

        this.ensureCapacity(bytes.length);
        this.buffer.set(bytes, this.offset);
        this.offset += bytes.length;
    }

    public toBuffer(): Uint8Array
    {
        // Return only the used portion of the buffer
        return this.buffer.slice(0, this.offset);
    }

    private ensureCapacity(bytesNeeded: number): void
    {
        if (this.offset + bytesNeeded > this.buffer.length) {
            const newSize   = Math.max(this.buffer.length * 2, this.offset + bytesNeeded);
            const newBuffer = new Uint8Array(newSize);
            newBuffer.set(this.buffer);

            this.buffer = newBuffer;
            this.view   = new DataView(this.buffer.buffer);
        }
    }
}
