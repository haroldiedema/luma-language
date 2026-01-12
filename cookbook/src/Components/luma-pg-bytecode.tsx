import { LumaEditor }                              from '@/Editor';
import { LumaWorkspace }                           from '@/Editor/LumaWorkspace';
import { IComponentWillLoad, IWebComponent, VDom } from '@/IWebComponent';
import { EventSubscriber }                         from '@byteshift/events';
import { LumaRuntimeError }                        from '@luma/LumaRuntimeError';
import { Program }                                 from '@luma/Program';
import { Component, h, Prop, State, Watch }        from '@stencil/core';

void h;

@Component({
    tag:      'luma-pg-bytecode',
    styleUrl: 'luma-pg-bytecode.scss',
    shadow:   true,
})
export class LumaPgBytecode implements IWebComponent, IComponentWillLoad
{
    @Prop() public workspace: LumaWorkspace;

    @State() private error: LumaRuntimeError | null = null;

    private subscriptions: EventSubscriber[]    = [];
    private outputElement: HTMLElement;

    public async componentWillLoad(): Promise<void>
    {
        if (this.workspace) {
            this.onEditorChanged();
        }
    }

    render(): VDom
    {
        return (
            <main ref={el => this.outputElement = el}>
                Output will be displayed here.
            </main>
        );
    }

    @Watch('workspace')
    private onEditorChanged(): void
    {
        this.subscriptions.forEach(s => s.unsubscribe());
        this.subscriptions = [
            this.workspace.on('vm-created', () => {
                this.error = null;
                this.renderAll()
            }),
            this.workspace.on('vm-runtime-error', (err: LumaRuntimeError) => {
                this.error = err;
                this.renderAll();
            }),
        ];
    }

    private renderAll(): void
    {
        this.outputElement.innerHTML = '';

        for (const program of this.workspace.programList) {
            this.renderBytecode(program);
        }
    }

    private renderBytecode(program: Program): void
    {
        const src: string[] = [];
        const err: LumaRuntimeError | null = program === this.error?.program ? this.error : null;

        if (err) {
            console.log('Found error:', err);
        }

        src.push(`<header>${program.moduleName}</header>`, `<table>`);
        program.instructions.forEach((i, addr) => {
            src.push(
                `<tr id="addr-${addr}" class="${err?.address === addr ? 'halted' : ''}">`,
                '<td class="addr">',
                addr.toString(10).padStart(8, '0'),
                '</td>',
                '<td class="opcode">',
                i.op,
                '</td>',
                '<td class="args">',
                this.formatArgs(i.arg),
                '</td>',
                '<td class="comment">',
                i.comment ? `// ${i.comment}` : '',
                '</td>',
                '</tr>',
            );
        });
        src.push(`</table>`);

        this.outputElement.innerHTML += src.join('\n');
    }

    private formatArgs(arg: any): string
    {
        if (arg === null || arg === undefined) {
            return '<span class="null">null</span>';
        }

        if (typeof arg === 'string') {
            return '<span class="string">"' + arg + '"</span>';
        }

        if (typeof arg === 'number') {
            return '<span class="number">' + arg.toString() + '</span>';
        }

        if (typeof arg === 'boolean') {
            return '<span class="boolean">' + arg.toString() + '</span>';
        }

        if (Array.isArray(arg)) {
            return arg.map(a => this.formatArgs(a)).join(', ');
        }

        const values: any[] = Object.values(arg);
        return values.map(v => this.formatArgs(v)).join(', ');
    }
}
