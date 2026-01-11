import { LumaWorkspace }                           from '@/Editor/LumaWorkspace';
import { IComponentWillLoad, IWebComponent, VDom } from '@/IWebComponent';
import { EventSubscriber }                         from '@byteshift/events';
import { Program }                                 from '@luma/Program';
import { Component, h, Prop, Watch }               from '@stencil/core';

void h;

@Component({
    tag:      'luma-pg-bytecode',
    styleUrl: 'luma-pg-bytecode.scss',
    shadow:   true,
})
export class LumaPgBytecode implements IWebComponent, IComponentWillLoad
{
    @Prop() public workspace: LumaWorkspace;

    private subscriptions: EventSubscriber[] = [];
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
                this.outputElement.innerHTML = '';
                for (const program of this.workspace.programList) {
                    this.renderBytecode(program);
                }
            }),
        ];
    }

    private renderBytecode(program: Program): void
    {
        const src: string[] = [];

        src.push(`<header>${program.moduleName}</header>`, `<table>`);
        program.instructions.forEach((i, addr) => {
            src.push(
                '<tr>',
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
