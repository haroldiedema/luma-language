import { LumaEditor }                                                   from '@/Editor';
import { LumaWorkspace }                                                from '@/Editor/LumaWorkspace';
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
    @State() private activeTab: string               = 'workspace';
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
            {type: 'link', label: 'Create New Workspace', value: '__create_new__', icon: 'fa fa-plus'},
        ];
    }

    private onWorkspaceItemChanged(item: string): void
    {
        console.log(item);
    }

    @Watch('workspace')
    private onWorkspaceChanged(): void
    {
        console.log('Workspace changed:', this.workspace?.name);

        // Unsubscribe from previous workspace events
        this.wsEvents.forEach(sub => sub.unsubscribe());
        this.wsEvents = [];

        if (! this.workspace) {
            return;
        }

        // Subscribe to new workspace events
        this.wsEvents = [
            this.workspace.on('file-added', (moduleName: string) => {
                console.log(`Module added: ${moduleName}`);
                this.modules = this.workspace!.listModules();
            }),
            this.workspace.on('file-removed', (moduleName: string) => {
                console.log(`Module removed: ${moduleName}`);
                this.modules = this.workspace!.listModules();
            }),
            this.workspace.on('file-changed', (moduleName: string) => {
                console.log(`Module changed: ${moduleName}`);
            }),
            this.workspace.on('file-opened', (moduleName: string) => {
                console.log(`Module opened: ${moduleName}`);
                this.moduleName = moduleName;
            }),
        ];

        this.modules = this.workspace.listModules();
    }

    private get moduleItems(): any[]
    {
        return [
            ...this.modules.map(m => ({type: 'button', label: m, value: m})),
            {type: 'divider'},
            {type: 'link', label: 'Add New Module', value: '__add_new__', icon: 'fa fa-plus'}
        ];
    }

    private onModuleItemChanged(name: string): void
    {
        if (name === '__add_new__') {
            const newModuleName = `module_${this.modules.length + 1}`;
            this.workspace?.addModule(newModuleName, `// Code for ${newModuleName}\n\n`);
            return;
        }

        if (! this.workspace) {
            return;
        }

        this.workspace.open(name);
    }
}
