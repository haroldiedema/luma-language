import { TokenPosition } from './Tokenizer/index.js';

export class LumaError extends Error
{
    public readonly moduleName?: string;
    public readonly position?: TokenPosition;

    constructor(options: LumaErrorOptions)
    {
        super(options.message, {
            cause: options.cause,
        });

        this.moduleName = options.moduleName;
        this.position   = options.position;
    }
}

type LumaErrorOptions = {
    message: string;
    moduleName?: string;
    position?: TokenPosition;
    cause?: Error,
}
