import { IComponentDidLoad, IWebComponent, VDom }     from '@/IWebComponent';
import { Component, Element, h, Host, Listen, State } from '@stencil/core';

void h;

@Component({
    tag:      'luma-dialogs',
    styleUrl: 'luma-dialogs.scss',
    shadow:   true,
})
export class LumaDialogs implements IWebComponent, IComponentDidLoad
{
    @Element() private readonly $host: HTMLElement;

    @State() private isActive: boolean = false;

    private _observer: MutationObserver;
    private _dialogs: Set<HTMLLumaDialogElement> = new Set();

    /**
     * @inheritDoc
     */
    public async componentDidLoad(): Promise<void>
    {
        this._observer = new MutationObserver(this.onMutate.bind(this));
        this._observer.observe(this.$host, {childList: true});
    }

    /**
     * @inheritDoc
     */
    public render(): VDom
    {
        return (
            <Host class={{active: this.isActive}}>
                <slot/>
            </Host>
        );
    }

    @Listen('keyup', {target: 'window'})
    private onKeyUp(event: KeyboardEvent): void
    {
        if (event.key === 'Escape' && this._dialogs.size > 0) {
            const dialogs = Array.from(this._dialogs);
            const topDialog = dialogs[dialogs.length - 1];

            void topDialog?.dispose();
        }
    }

    private onMutate(): void
    {
        const dialogs = Array.from(this.$host.querySelectorAll('luma-dialog'));

        for (const dialog of dialogs) {
            if (! this._dialogs.has(dialog)) {
                dialog.addEventListener('close', () => {
                    this._dialogs.delete(dialog);
                    dialog.remove();
                });
            }

            this._dialogs.add(dialog);
        }

        this.isActive = dialogs.length > 0;
    }
}
