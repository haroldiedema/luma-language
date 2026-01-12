import { LumaEditor }                                                   from '@/Editor';
import { LumaWorkspace }                                                from '@/Editor/LumaWorkspace';
import { Inject }                                                       from '@/Framework/DI';
import { DialogManager }                                                from '@/Framework/Dialog/DialogManager';
import { IComponentDidLoad, IDisposableComponent, IWebComponent, VDom } from '@/IWebComponent';
import { EventSubscriber }                                              from '@byteshift/events';
import { Component, h, State, Watch }                                   from '@stencil/core';

void h;

const workspaces: any[] = [
    {
        'name':    'Hello World',
        'modules': {'main': '/*\n    This example demonstrates function hoisting. This means that you\'re free\n    to declare functions after they\'ve been invoked. In this example we\'re\n    calling the "greet" function first, then we declare it.  \n*/\n\n// Call the function "greet".\ngreet("World")\n\n// Declare the "greet" function.\nfn greet(name):\n    print("Hello, {name}!")\n'},
    },
    {
        'name':    'Loops',
        'modules': {'main': '/*\n    This example demonstrates loops.\n\n    Luma has three kinds of looping mechanisms:\n        - for-loops\n        - while-loops\n        - do-while-loops\n*/\n\nprint("A for-loop that prints 1..5")\n\nfor i in 1..6:\n    print(i)\n\nprint("\\n")\n\n// -------------------------------------------- //\n\nprint("A while-loop that continues while i is less or equal than 5")\n\ni = 1\nwhile i <= 5:\n    print(i)\n    i = i + 1\n\nprint("\\n")\n\n// -------------------------------------------- //\n\nprint("A while-loop that continues forever unless we break")\n\ni = 1\nwhile true:\n    print(i)\n\n    if i >= 5:\n        break // Exit the loop.\n\n    i = i + 1\n\nprint("\\n")\n\n// -------------------------------------------- //\n\nprint("A do-while loop with skips")\n\ni = 0\ndo:\n    i = i + 1\n    \n    if i % 2 == 0:\n        // Jump back to the start of the loop\n        continue\n\n    print(i)\nwhile i < 6\n'},
    },
    {
        'name':    'Classes',
        'modules': {'main': '/*\n    This example demonstrates classes with the following features:\n\n        - Inheritance (Animal <- Pet <- Cat/Dog)\n        - Overriding methods (speak)\n        - Primary vs Secondary constructors\n        - Empty class syntax\n        - Type checking\n*/\n\nclass Animal:\n    // Secondary constructor.\n    fn init(type):\n        this.type = type\n\n    // Base method to be overridden later.\n    fn speak():\n        print("I\'m a {this.type}.")\n\n// Primary constructor with argument passing to parent.\nclass Pet(type, this.name, this.sound) extends Animal(type):\n    // Override the speak method.\n    fn speak():\n        print("{this.sound}! My name is {this.name}.")\n        parent.speak()\n\n// Classes without body elements is fine too...\nclass Dog(name, sound) extends Pet("Dog", name, sound)\nclass Cat(name, sound) extends Pet("Cat", name, sound)\n\n// Instantiate both.\nmilou = new Cat("Milou", "Mew")\nbuddy = new Dog("Buddy", "Woof")\n\n// Invoke their methods.\nmilou.speak()\nbuddy.speak()\n\n// Type checking...\nif (buddy is Dog):\n    print("Buddy is indeed a dog.")\n\nif (milou is Dog):\n    print("You should never see this text.")\n'},
    },
    {
        'name':    'Modules',
        'modules': {
            'main':   '/*\n    This example demonstrates the use of modules.\n\n    A module is a separate script that can be imported in other\n    scripts. Scripts can access variables and methods from imported\n    scripts if they are declared with the "public" keyword.\n*/\nimport "Math"\nimport "Output"\n\nOutput.write("1 + 1 = " + Math.add(1, 1))\nOutput.write("The " + Math.PI + " is not a lie")\n\n',
            'Math':   '// This is the "Math" module.\n\npublic fn add(a, b):\n    return a + b\n\npublic fn sub(a, b):\n    return a - b\n\npublic PI = 3.14\n',
            'Output': '// Code for Output\n\npublic fn write(text):\n    print("Output: [{text}]")\n',
        },
    },
];

@Component({
    tag:      'page-playground',
    styleUrl: 'page-playground.scss',
    shadow:   false,
})
export class PagePlayground implements IWebComponent, IComponentDidLoad, IDisposableComponent
{
    @Inject private readonly dm: DialogManager;

    @State() private activeTab: string               = 'output';
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
        this.editor = await LumaEditor.create(this.element);

        this.editor.on('workspace-created', (ws: LumaWorkspace) => this.workspaces = [...this.workspaces, ws]);
        this.editor.on('workspace-changed', (ws: LumaWorkspace) => this.workspace = ws);

        const wsList: LumaWorkspace[] = [];

        // Load initial workspaces
        for (const wsData of workspaces) {
            wsList.push(this.editor.createWorkspace(wsData.name, wsData.modules, false));
        }

        this.workspaces = wsList;

        // Open the first workspace by default
        if (this.workspaces.length > 0) {
            this.editor.openWorkspace(this.workspaces[0]);
        }
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
                            <button class="small icon" onClick={() => this.exportWorkspace()}>
                                <i class="fa fa-save"/>
                            </button>
                            <button class="small icon">
                                <i class="fa fa-folder-open"/>
                            </button>
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
            ...this.modules.map(m => ({
                type:  'button',
                label: m,
                value: m,
                icon:  m !== 'main' ? 'fa fa-cube' : 'fa fa-code',
            })),
            {type: 'divider'},
            {type: 'link', label: 'Add New Module', value: '__add_new__', icon: 'fa fa-plus'},
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

    private exportWorkspace(): void
    {
        if (! this.workspace) {
            return;
        }

        const dataStr            = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.workspace.toJSON()));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', dataStr);
        downloadAnchorNode.setAttribute('download', `${this.workspace.name.replace(/\s+/g, '_').toLowerCase()}.luma`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
}
