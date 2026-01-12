import { Model }                         from '@/Editor/Model';
import { EventEmitter, EventSubscriber } from '@byteshift/events';
import { LumaError }                     from '@luma/LumaError';
import { LumaRuntimeError }              from '@luma/LumaRuntimeError';
import { Program }                       from '@luma/Program';
import { VirtualMachine }                from '@luma/VM';

export class LumaWorkspace extends EventEmitter
{
    public readonly name: string;

    private readonly modules: Map<string, Model>                   = new Map();
    private readonly subscriptions: Map<string, EventSubscriber[]> = new Map();

    private _vm: VirtualMachine | null = null;
    private _debounceTimer: any        = null;

    constructor(name: string)
    {
        super();

        this.name = name;
        this.addModule('main', `// Welcome to Luma!\n\n// Start coding here...`);
    }

    public dispose(): void
    {
        this._vm = null;

        this.modules.forEach((module, name) => {
            this.subscriptions.get(name)?.forEach(s => s.unsubscribe());
            this.subscriptions.delete(name);
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
                this.scheduleUpdate();
            }),
            model.on('disposed', () => {
                this.removeModule(name);
                this.scheduleUpdate();
            }),
            model.on('error', (e: LumaError) => {
                this.emit('vm-error', e);
            }),
        ]);

        this.modules.set(name, model);
        this.emit('file-added', name);
        this.scheduleUpdate();
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
        this.scheduleUpdate();
    }

    /**
     * Get the compiled programs for all modules in the workspace.
     */
    public get programList(): Program[]
    {
        return Array.from(this.modules.values()).map(m => m.program).filter(p => !!p);
    }

    public toJSON(): any
    {
        return {
            name:    this.name,
            modules: Array.from(this.modules.entries()).reduce((obj, [name, model]) => {
                obj[name] = model.getContent();
                return obj;
            }, {} as any),
        }
    }

    public tick(deltaTime: number): void
    {
        if (! this._vm) {
            return;
        }

        try {
            this._vm?.run(deltaTime);
        } catch (e: any) {
            this.emit('vm-error', e);
            this.emit('vm-runtime-error', e);

            if (e.program) {
                this.modules.get(e.program.moduleName)?.setRuntimeError(e);
            }
        }
    }

    public update(): void
    {
        const program = this.modules.get('main')!.program;
        if (! program) {
            return;
        }

        this._vm = new VirtualMachine(program, {
            budget:        250,
            functions:     {
                print: (...args: any[]) => this.emit('vm-output', ...args),
            },
            resolveModule: (moduleName: string): Program => {
                if (moduleName !== 'main') {
                    return this.modules.get(moduleName)?.program;
                }

                return undefined;
            },
        });

        this.emit('vm-created', this._vm);
    }

    public scheduleUpdate(): void
    {
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => this.update(), 250);
    }
}

export interface LumaWorkspace
{
    on(event: 'file-added', listener: (name: string) => void): EventSubscriber;

    on(event: 'file-removed', listener: (name: string) => void): EventSubscriber;

    on(event: 'file-changed', listener: (name: string) => void): EventSubscriber;

    on(event: 'file-opened', listener: (name: string) => void): EventSubscriber;

    on(event: 'vm-created', listener: (vm: VirtualMachine) => void): EventSubscriber;

    on(event: 'vm-output', listener: (...args: any[]) => void): EventSubscriber;

    on(event: 'vm-error', listener: (error: LumaError) => void): EventSubscriber;

    on(event: 'vm-runtime-error', listener: (error: LumaRuntimeError) => void): EventSubscriber;
}
