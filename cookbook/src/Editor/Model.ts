import { EventEmitter, EventSubscriber } from '@byteshift/events';
import { Compiler }                      from '@luma/Compiler';
import { LumaError }                     from '@luma/LumaError';
import { Program }                       from '@luma/Program';

export class Model extends EventEmitter
{
    private readonly name: string;
    private readonly uri: monaco.Uri;
    private readonly model: monaco.editor.ITextModel;

    private changeDebounceTimer: any              = null;
    private _program: Program | undefined         = undefined;
    private _markers: monaco.editor.IMarkerData[] = [];

    constructor(workspaceName: string, name: string, source: string)
    {
        super();

        this.name  = name;
        const slug = workspaceName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        this.uri   = monaco.Uri.parse(`file://luma-editor/${slug}/${name}.luma`);
        this.model = monaco.editor.createModel(source, 'luma', this.uri);

        this.model.onDidChangeContent(e => {
            clearTimeout(this.changeDebounceTimer);
            this.changeDebounceTimer = setTimeout(() => this.update(), 50);
        });

        this.changeDebounceTimer = setTimeout(() => this.update(), 50);
    }

    /**
     * Sets the content of the model.
     *
     * @param src
     */
    public setContent(src: string): void
    {
        this.model.setValue(src);
        this.update();
    }

    /**
     * Returns the current content of the model.
     */
    public getContent(): string
    {
        return this.model.getValue();
    }

    /**
     * Disposes the model and frees up resources.
     */
    public dispose(): void
    {
        this.emit('disposed');
    }

    /**
     * Returns the Monaco text model.
     */
    public get textModel(): monaco.editor.ITextModel
    {
        return this.model;
    }

    /**
     * Returns the compiled program or NULL if there are compilation errors.
     *
     * @return {Program | null}
     */
    public get program(): Program | null
    {
        return this._program;
    }

    /**
     * Compiles the model contents into a {@link Program}.
     *
     * @private
     */
    private update(): void
    {
        this._markers = [];
        monaco.editor.setModelMarkers(this.model, 'luma', this._markers);

        try {
            this._program = Compiler.compile(this.model.getValue(), this.name);
            this.emit('changed');
        } catch (e: any) {
            if (! e.position || !e.moduleName) {
                console.warn(`Could not parse model marker ${e}`);
                throw e;
            }

            this._program = undefined;
            this._markers = [
                {
                    startLineNumber: e.position.lineStart,
                    startColumn:     e.position.columnStart,
                    endLineNumber:   e.position.lineEnd,
                    endColumn:       e.position.columnEnd,
                    message:         e.message,
                    severity:        monaco.MarkerSeverity.Error,
                },
            ];

            monaco.editor.setModelMarkers(this.model, 'luma', this._markers);

            this.emit('changed');
            this.emit('error', e);
        }
    }
}

export interface Model
{
    on(event: 'changed', listener: () => void): EventSubscriber;

    on(event: 'error', listener: (error: LumaError) => void): EventSubscriber;

    on(event: 'disposed', listener: () => void): EventSubscriber;
}
