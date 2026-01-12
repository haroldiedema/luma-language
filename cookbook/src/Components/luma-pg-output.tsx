import { LumaEditor }                              from '@/Editor';
import { LumaWorkspace }                           from '@/Editor/LumaWorkspace';
import { IComponentWillLoad, IWebComponent, VDom } from '@/IWebComponent';
import { EventSubscriber }                         from '@byteshift/events';
import { LumaError }                               from '@luma/LumaError';
import { Component, h, Prop, State, Watch }        from '@stencil/core';

void h;

@Component({
    tag:      'luma-pg-output',
    styleUrl: 'luma-pg-output.scss',
    shadow:   true,
})
export class LumaPgOutput implements IWebComponent, IComponentWillLoad
{
    @Prop() public workspace: LumaWorkspace;
    @Prop() public editor: LumaEditor;

    private wSubscriptions: EventSubscriber[] = [];
    private eSubscriptions: EventSubscriber[] = [];
    private outputElement: HTMLElement;

    public async componentWillLoad(): Promise<void>
    {
        if (this.workspace) {
            this.onWorkspaceChanged();
        }

        if (this.editor) {
            this.onEditorChanged();
        }
    }

    render(): VDom
    {
        return (
            <pre ref={el => this.outputElement = el}/>
        );
    }

    @Watch('editor')
    private onEditorChanged(): void
    {
        this.eSubscriptions.forEach(s => s.unsubscribe());
        this.eSubscriptions = [
            this.editor.on('workspace-changed', () => this.outputElement.innerHTML = ''),
        ];
    }

    @Watch('workspace')
    private onWorkspaceChanged(): void
    {
        this.wSubscriptions.forEach(s => s.unsubscribe());
        this.wSubscriptions = [
            this.workspace.on('vm-created', () => {
                this.outputElement.innerHTML = '';
            }),
            this.workspace.on('vm-output', (...args: any[]) => {
                const output = document.createElement('div');
                args.forEach(arg => {
                    output.appendChild(this.formatOutput(arg));
                });

                this.outputElement.appendChild(output);
                this.outputElement.scrollTop = this.outputElement.scrollHeight;
            }),
            this.workspace.on('vm-error', this.onRuntimeError.bind(this)),
            this.workspace.on('file-changed', () => {
                this.outputElement.innerHTML = '';
            }),
        ];
    }

    private formatOutput(arg: any): HTMLElement
    {
        if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
            const el = document.createElement('span');
            switch (typeof arg) {
                case 'string':
                    el.className = 'string';
                    el.textContent = arg;
                    break;
                case 'number':
                    el.className = 'number';
                    el.textContent = arg.toString();
                    break;
                case 'boolean':
                    el.className = 'boolean';
                    el.textContent = arg.toString();
                    break;
            }

            return el;
        }

        if (arg === undefined || arg === null) {
            const el = document.createElement('span');
            el.className = 'null-undefined';
            el.textContent = String(arg);
            return el;
        }

        if (Array.isArray(arg)) {
            const el = document.createElement('div');
            el.className = 'array';
            el.innerHTML = '<span class="punctuation">[</span>';
            const items = document.createElement('div');
            items.className = 'items';
            arg.forEach((item, index) => {
                const itemEl = document.createElement('div');
                itemEl.className = 'item';
                itemEl.appendChild(this.formatOutput(item));
                if (index < arg.length - 1) {
                    itemEl.innerHTML += '<span class="punctuation">,</span>';
                }
                items.appendChild(itemEl);
            });
            el.appendChild(items);
            el.innerHTML += '<span class="punctuation">]</span>';
            return el;
        }

        if (typeof arg === 'object') {
            const el = document.createElement('div');
            el.className = 'object';
            el.innerHTML = '<span class="punctuation">{</span>';
            const items = document.createElement('div');
            items.className = 'items';
            const entries = Object.entries(arg);
            entries.forEach(([key, value], index) => {
                const itemEl = document.createElement('div');
                itemEl.className = 'item';
                const keyEl = document.createElement('span');
                keyEl.className = 'key';
                keyEl.textContent = key;
                itemEl.appendChild(keyEl);
                itemEl.innerHTML += '<span class="punctuation">: </span>';
                itemEl.appendChild(this.formatOutput(value));
                // if (index < entries.length - 1) {
                //     itemEl.innerHTML += '<span class="punctuation">,</span>';
                // }
                items.appendChild(itemEl);
            });
            el.appendChild(items);
            el.innerHTML += '<span class="punctuation">}</span>';
            return el;
        }
    }

    private onRuntimeError(error: LumaError): void
    {
        const errorElement = document.createElement('div');
        errorElement.className = 'error';

        const messageParts: string[] = [];

        if (error?.moduleName) {
            messageParts.push(`Error in module "${error.moduleName}"`);
        }

        if (error?.position) {
            messageParts.push(`at line ${error.position.lineStart}, column ${error.position.columnStart}`);
        }

        messageParts.length > 0
            ? messageParts.push(':')
            : void 0;

        messageParts.push(error.message);
        errorElement.textContent = messageParts.join(' ');

        this.outputElement.appendChild(errorElement);
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }
}
