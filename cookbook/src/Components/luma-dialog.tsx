import { IWebComponent, VDom }                                   from '@/IWebComponent';
import { Component, Event, EventEmitter, h, Host, Method, Prop } from '@stencil/core';

void h;

@Component({
    tag:      'luma-dialog',
    styleUrl: 'luma-dialog.scss',
    shadow:   true,
})
export class LumaDialog implements IWebComponent
{
    @Event() public close: EventEmitter<void>;

    @Prop() public label: string           = 'Untitled Dialog';
    @Prop() public buttons: DialogButton[] = [];

    private dialogElement: HTMLDialogElement;

    public render(): VDom
    {
        return (
            <Host onPointerDown={(e: MouseEvent) => this.onHostClicked(e)}>
                <dialog ref={el => this.dialogElement = el}>
                    <header>
                        <div class="label">{this.label}</div>
                    </header>
                    <main>
                        <slot/>
                    </main>
                    <footer>
                        {this.buttons.map(button => (
                            <button
                                class={button.type}
                                onClick={() => {
                                    button.onClick();
                                    this.close.emit();
                                }}
                            >
                                {button.label}
                            </button>
                        ))}
                    </footer>
                </dialog>
            </Host>
        );
    }

    @Method()
    public async dispose(): Promise<void>
    {
        this.close.emit();
    }

    private onHostClicked(event: MouseEvent): void
    {
        if (! event.composedPath().includes(this.dialogElement)) {
            void this.dispose();
        }
    }
}

export type DialogButton = {
    type: 'primary' | 'secondary' | 'danger';
    label: string;
    onClick: () => void;
}
