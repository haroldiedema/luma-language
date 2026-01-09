import { EventEmitter, EventSubscriber } from '@byteshift/events';

export class Model extends EventEmitter
{
    private readonly uri: monaco.Uri;
    private readonly model: monaco.editor.ITextModel;

    constructor(workspaceName: string, name: string, source: string)
    {
        super();

        const slug = workspaceName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        this.uri   = monaco.Uri.parse(`file://luma-editor/${slug}/${name}.luma`);
        this.model = monaco.editor.createModel(source, 'luma', this.uri);

        this.model.onDidChangeContent(e => {
            console.log(e.changes);
        });
    }

    public setContent(src: string): void
    {
        this.model.setValue(src);
        this.emit('changed');
    }

    public dispose(): void
    {
        this.model.dispose();
        console.log('Disposing model:', this.uri.toString());
        this.emit('disposed');
    }

    public get textModel(): monaco.editor.ITextModel
    {
        return this.model;
    }
}

export interface Model
{
    on(event: 'changed', listener: () => void): EventSubscriber;

    on(event: 'disposed', listener: () => void): EventSubscriber;
}
