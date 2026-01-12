import { LumaError, LumaErrorOptions } from './LumaError.js';
import { Program }                     from './Program/index.js';

export class LumaRuntimeError extends LumaError
{
    public readonly address: number;
    public readonly program: Program;

    constructor(options: LumaRuntimeErrorOptions)
    {
        super(options);

        this.address = options.address;
        this.program = options.program;
    }
}

export type LumaRuntimeErrorOptions = LumaErrorOptions & {
    address: number;
    program: Program;
}
