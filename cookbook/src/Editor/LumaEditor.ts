import { LanguageProvider }              from '@/Editor/LanguageProvider';
import { LumaWorkspace }                 from '@/Editor/LumaWorkspace';
import { EventEmitter, EventSubscriber } from '@byteshift/events';

export class LumaEditor extends EventEmitter
{
    public static async create(target: HTMLElement): Promise<LumaEditor>
    {
        const awaitMonaco = new Promise<void>((resolve) => {
            const checkInterval = setInterval(() => {
                if ((window as any).monaco) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 50);
        });

        await awaitMonaco;
        new LanguageProvider().setup();

        return new LumaEditor(target);
    }

    private readonly _targetElement: HTMLElement;
    private readonly _editor: monaco.editor.IStandaloneCodeEditor;
    private readonly _observer: ResizeObserver;

    private _workspaceSubscriptions: EventSubscriber[];
    private _workspaceModuleNames: string[];
    private _workspace: LumaWorkspace;

    private constructor(target: HTMLElement)
    {
        super();

        this._targetElement = target;
        this._editor        = this.createEditor();
        this._observer      = new ResizeObserver(this.onResize.bind(this));
        this._observer.observe(this._targetElement);

        this.createWorkspace('Playground');
    }

    /**
     * Disposes the editor instance and associated resources.
     */
    public dispose(): void
    {
        this._editor.dispose();
        this._observer.disconnect();
        this._workspace?.dispose();
    }

    public openWorkspace(workspace: LumaWorkspace): void
    {
        if (this._workspace) {
            this._workspace.dispose();
            this._workspaceSubscriptions.forEach(s => s.unsubscribe());
            this._workspaceSubscriptions = [];
        }

        this._workspaceModuleNames   = [];
        this._workspaceSubscriptions = [
            workspace.on('file-opened', (moduleName: string) => {
                this._editor.setModel(workspace.getModule(moduleName).textModel);
                const prevModuleIndex = this._workspaceModuleNames.indexOf(moduleName);
                if (prevModuleIndex !== this._workspaceModuleNames.length - 1) {
                    this._workspaceModuleNames.splice(prevModuleIndex, 1);
                    this._workspaceModuleNames.push(moduleName);
                }
            }),
            workspace.on('file-added', (moduleName: string) => {
                workspace.open(moduleName);
            }),
            workspace.on('file-removed', (moduleName: string) => {
                this._workspaceModuleNames.splice(this._workspaceModuleNames.indexOf(moduleName), 1);
                const lastModule = this._workspaceModuleNames[this._workspaceModuleNames.length - 1];
                if (lastModule) {
                    workspace.open(lastModule);
                } else {
                    workspace.open('main'); // Fallback to 'main' if no modules left
                }
            }),
            workspace.on('file-changed', (moduleName: string) => {
                // console.log(`Module changed: ${moduleName}`);
            }),
        ];

        this._workspace = workspace;
        this.emit('workspace-changed', workspace);
        this._workspace.open('main');
        this._workspace.activate();
    }

    public createWorkspace(name: string, modules: Record<string, string> = {}): LumaWorkspace
    {
        const workspace = new LumaWorkspace(name);

        if (! modules['main']) {
            modules['main'] = 'print("Hello, World!")\n\n';
        }

        for (const [moduleName, moduleSource] of Object.entries(modules)) {
            workspace.addModule(moduleName, moduleSource);
        }

        this.emit('workspace-created', workspace);
        this.openWorkspace(workspace);

        return workspace;
    }

    /**
     * Creates the Monaco editor instance.
     *
     * @private
     */
    private createEditor(): monaco.editor.IStandaloneCodeEditor
    {
        return monaco.editor.create(this._targetElement, {
            automaticLayout:      false,
            theme:                'vs-dark',
            language:             'lux',
            wordBasedSuggestions: 'off',
            minimap:              {enabled: false},
            renderWhitespace:     'selection',
            tabSize:              4,
            insertSpaces:         true,
        });
    }

    private onResize(): void
    {
        requestAnimationFrame(() => {
            this._editor?.layout();
        });
    }
}

export interface LumaEditor
{
    on(event: 'workspace-created', listener: (workspace: LumaWorkspace) => void): EventSubscriber;

    on(event: 'workspace-changed', listener: (workspace: LumaWorkspace) => void): EventSubscriber;
}
