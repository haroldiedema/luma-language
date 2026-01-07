import { ANSI } from './ANSI.js';

export class HexViewer
{
    public static toHex(data: Uint8Array): string
    {
        const hexLines: string[] = [];
        const bytesPerLine = 16;

        for (let i = 0; i < data.length; i += bytesPerLine)
        {
            const lineBytes = data.slice(i, i + bytesPerLine);
            const hexParts: string[] = [];
            const asciiParts: string[] = [];

            for (let j = 0; j < lineBytes.length; j++)
            {
                const byte = lineBytes[j];
                hexParts.push(ANSI.format(`<gray>${byte.toString(16).padStart(2, '0').toUpperCase()}</gray>`));
                asciiParts.push(byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.');
            }

            // Pad hex parts if line is shorter than bytesPerLine
            while (hexParts.length < bytesPerLine)
            {
                hexParts.push('  ');
            }

            const hexString = hexParts.join(' ');
            const asciiString = asciiParts.join('').padEnd(16, ' ');
            const offsetString = i.toString(16).padStart(8, '0').toUpperCase();

            hexLines.push(`${offsetString}  ${hexString.padEnd(bytesPerLine * 3 - 1)}  ${ANSI.format('<gray>|</gray>')} ${asciiString} ${ANSI.format('<gray>|</gray>')}`);
        }

        return hexLines.join('\n');
    }
}
