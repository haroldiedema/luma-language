import { Model }                         from '@/Editor/Model';
import { EventEmitter, EventSubscriber } from '@byteshift/events';

export class LumaWorkspace extends EventEmitter
{
    public readonly name: string;

    private readonly modules: Map<string, Model>                   = new Map();
    private readonly subscriptions: Map<string, EventSubscriber[]> = new Map();

    constructor(name: string)
    {
        super();

        this.name = name;
        this.addModule('main', `// Welcome to Luma!\n\n// Start coding here...`);
    }

    public dispose(): void
    {
        this.modules.forEach((module, name) => {
            this.subscriptions.get(name)?.forEach(s => s.unsubscribe());
            module.dispose();
        });
    }

    public open(name: string): void
    {
        if (! this.modules.has(name)) {
            throw new Error(`Module with name "${name}" does not exist in the workspace.`);
        }

        this.emit('file-opened', name);
    }

    public addModule(name: string, src: string = `// Your code goes here...`): void
    {
        if (this.modules.has(name)) {
            this.modules.get(name).setContent(src);
            return;
        }

        const model = new Model(this.name, name, src);
        this.subscriptions.set(name, [
            model.on('changed', () => {
                this.emit('file-changed', name);
            }),
            model.on('disposed', () => {
                this.removeModule(name);
            }),
        ]);

        this.modules.set(name, model);
        this.emit('file-added', name);
    }

    public listModules(): string[]
    {
        return Array.from(this.modules.keys());
    }

    public getModule(name: string): Model
    {
        const file = this.modules.get(name);

        if (! file) {
            throw new Error(`Module with name "${name}" does not exist in the workspace.`);
        }

        return file;
    }

    public removeModule(name: string): void
    {
        if (name === 'main') {
            throw new Error(`Module "main" cannot be removed from the workspace.`);
        }

        if (! this.modules.has(name)) {
            throw new Error(`Module with name "${name}" does not exist in the workspace.`);
        }

        this.modules.delete(name);

        this.subscriptions.get(name)?.forEach(s => s.unsubscribe());
        this.subscriptions.delete(name);

        this.emit('file-removed', name);
    }
}

export interface LumaWorkspace
{
    on(event: 'file-added', listener: (name: string) => void): EventSubscriber;

    on(event: 'file-removed', listener: (name: string) => void): EventSubscriber;

    on(event: 'file-changed', listener: (name: string) => void): EventSubscriber;

    on(event: 'file-opened', listener: (name: string) => void): EventSubscriber;
}
