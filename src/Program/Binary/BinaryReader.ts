export class BinaryReader
{
    private buffer: Uint8Array;
    private view: DataView;
    private offset: number;
    private decoder: TextDecoder;

    constructor(buffer: Uint8Array)
    {
        this.buffer  = buffer;
        this.view    = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        this.offset  = 0;
        this.decoder = new TextDecoder('utf-8');
    }

    public readUInt8(): number
    {
        const value = this.view.getUint8(this.offset);
        this.offset += 1;
        return value;
    }

    public readUInt16(): number
    {
        const value = this.view.getUint16(this.offset, true);
        this.offset += 2;
        return value;
    }

    public readUInt32(): number
    {
        const value = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return value;
    }

    public readFloat64(): number
    {
        const value = this.view.getFloat64(this.offset, true);
        this.offset += 8;
        return value;
    }

    public readString(): string
    {
        // 1. Read the length prefix
        const length = this.readUInt32();

        if (length === 0) {
            return '';
        }

        // 2. Slice the byte range directly
        // We use subarray to avoid copying memory
        const bytes = this.buffer.subarray(this.offset, this.offset + length);
        this.offset += length;

        // 3. Decode utf-8 bytes to string
        return this.decoder.decode(bytes);
    }

    /**
     * Peek at the current offset without advancing it.
     */
    public get position(): number
    {
        return this.offset;
    }

    /**
     * Check if we have reached the end of the buffer.
     */
    public get isEof(): boolean
    {
        return this.offset >= this.buffer.byteLength;
    }
}
