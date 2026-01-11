import { LumaEditor }                                                   from '@/Editor';
import { LumaWorkspace }                                                from '@/Editor/LumaWorkspace';
import { Inject }                                                       from '@/Framework/DI';
import { DialogManager }                                                from '@/Framework/Dialog/DialogManager';
import { IComponentDidLoad, IDisposableComponent, IWebComponent, VDom } from '@/IWebComponent';
import { EventSubscriber }                                              from '@byteshift/events';
import { Component, h, State, Watch }                                   from '@stencil/core';

void h;

@Component({
    tag:      'page-playground',
    styleUrl: 'page-playground.scss',
    shadow:   false,
})
export class PagePlayground implements IWebComponent, IComponentDidLoad, IDisposableComponent
{
    @Inject private readonly dm: DialogManager;

    @State() private activeTab: string               = 'bytecode';
    @State() private workspace: LumaWorkspace | null = null;
    @State() private workspaces: LumaWorkspace[]     = [];
    @State() private modules: string[]               = [];
    @State() private moduleName: string              = 'main';

    private readonly tabs: any[] = [
        {id: 'output', label: 'Output', icon: 'fa fa-terminal', component: 'luma-pg-output'},
        {id: 'bytecode', label: 'Bytecode', icon: 'fa fa-code', component: 'luma-pg-bytecode'},
    ];

    private element: HTMLElement | null = null;
    private editor: LumaEditor | null   = null;
    private wsEvents: EventSubscriber[] = [];

    public async componentDidLoad(): Promise<void>
    {
        this.editor     = await LumaEditor.create(this.element);
        this.workspace  = this.editor.createWorkspace('Playground Workspace');
        this.workspaces = [this.workspace];
        this.editor.on('workspace-created', (ws: LumaWorkspace) => this.workspaces = [...this.workspaces, ws]);
        this.editor.on('workspace-changed', (ws: LumaWorkspace) => this.workspace = ws);

        this.workspace.addModule('math', `// math utils\npublic fn add(a, b):\n    return a + b\n\npublic fn sub(a, b):\n    return a - b\n`);
        this.workspace.addModule('main', `import "math"\n\npublic fn main():\n    result = math.add(5, 3)\n    print(result)\n\nmain()\n`);
        this.workspace.open('main');
    }

    /**
     * @inheritDoc
     */
    public async connectedCallback(): Promise<void>
    {
    }

    /**
     * @inheritDoc
     */
    public disconnectedCallback(): void
    {
        this.editor?.dispose();
    }

    /**
     * @inheritDoc
     */
    public render(): VDom
    {
        return (
            <main id="playground-body">
                <main id="editor">
                    <nav class="menubar">
                        <section>
                            <luma-dropdown
                                placeholder="Select Workspace"
                                noOptionsText="No workspaces available"
                                items={this.workspacesOptions}
                                value={this.workspace?.name}
                                onItemChanged={e => this.onWorkspaceItemChanged(e.detail)}
                            />
                            <hr/>
                            {this.workspace && (
                                <luma-dropdown
                                    placeholder="Select Module"
                                    noOptionsText="No modules available"
                                    items={this.moduleItems}
                                    value={this.moduleName}
                                    onItemChanged={e => this.onModuleItemChanged(e.detail)}
                                />
                            )}
                        </section>
                        <section>
                            ...
                        </section>
                    </nav>
                    <div id="monaco-wrapper" ref={el => this.element = el}/>
                </main>
                <main id="sidebar">
                    <nav class="menubar">
                        {this.tabs.map(tab => (
                            <button
                                class={{tab: true, active: this.activeTab === tab.id}}
                                onClick={() => this.activeTab = tab.id}
                            >
                                <i class={tab.icon}/> {tab.label}
                            </button>
                        ))}
                    </nav>
                    <section class="tab-content">
                        {this.tabs.map(tab => (
                            <tab.component
                                style={{display: this.activeTab === tab.id ? 'block' : 'none'}}
                                editor={this.editor}
                                workspace={this.workspace!}
                            />
                        ))}
                    </section>
                </main>
            </main>
        );
    }

    private get workspacesOptions(): any[]
    {
        return [
            ...this.workspaces.map(w => ({type: 'button', label: w.name, value: w.name})),
            {type: 'divider'},
            {type: 'link', label: 'Create New Workspace', value: '__add_new__', icon: 'fa fa-plus'},
        ];
    }

    private async onWorkspaceItemChanged(item: string): Promise<void>
    {
        if (item === '__add_new__') {
            const name = await this.dm.prompt({title: 'Create Workspace', message: 'Enter new workspace name:'});
            if (! name || this.workspaces.find(w => w.name === name)) {
                return;
            }

            this.editor!.createWorkspace(name);
            return;
        }

        const workspace = this.workspaces.find(w => w.name === item) || null;

        if (workspace) {
            this.editor.openWorkspace(workspace);
            this.workspace = workspace;
        }
    }

    @Watch('workspace')
    private onWorkspaceChanged(): void
    {
        // Unsubscribe from previous workspace events
        this.wsEvents.forEach(sub => sub.unsubscribe());
        this.wsEvents = [];

        if (! this.workspace) {
            return;
        }

        // Subscribe to new workspace events
        this.wsEvents = [
            this.workspace.on('file-added', (moduleName: string) => {
                this.modules = this.workspace!.listModules();
            }),
            this.workspace.on('file-removed', (moduleName: string) => {
                this.modules = this.workspace!.listModules();
            }),
            this.workspace.on('file-changed', (moduleName: string) => {
                // Clear bytecode & output?
            }),
            this.workspace.on('file-opened', (moduleName: string) => {
                this.moduleName = moduleName;
            }),
        ];

        this.modules = this.workspace.listModules();
    }

    private get moduleItems(): any[]
    {
        return [
            ...this.modules.map(m => ({type: 'button', label: m, value: m, icon: m !== 'main' ? 'fa fa-cube' : 'fa fa-code'})),
            {type: 'divider'},
            {type: 'link', label: 'Add New Module', value: '__add_new__', icon: 'fa fa-plus'}
        ];
    }

    private async onModuleItemChanged(name: string): Promise<void>
    {
        if (name === '__add_new__') {
            const name = await this.dm.prompt({message: 'Enter new module name:', title: 'New Module'});
            if (! name || this.modules.includes(name)) {
                return;
            }

            // Make sure name conforms to module naming rules (a-z0-9_)
            if (! /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
                alert('Invalid module name. Use only letters, numbers, and underscores, and do not start with a number.');
                return;
            }

            const newModuleName = name;
            this.workspace?.addModule(newModuleName, `// Code for ${newModuleName}\n\n`);
            return;
        }

        if (! this.workspace) {
            return;
        }

        this.workspace.open(name);
    }
}
