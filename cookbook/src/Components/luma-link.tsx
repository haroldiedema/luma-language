import { IWebComponent, VDom } from '@/IWebComponent';
import { Component, h, Prop }  from '@stencil/core';

void h;

@Component({
    tag:      'luma-link',
    styleUrl: 'luma-link.scss',
    shadow:   false,
})
export class LumaLink implements IWebComponent
{
    @Prop() public href: string = '/';

    /**
     * @inheritDoc
     */
    public render(): VDom
    {
        return (
            <a href={this.href} onClick={e => this.onClick(e)}>
                <slot></slot>
            </a>
        );
    }

    private onClick(evt: MouseEvent): void
    {
        if (evt.ctrlKey) {
            return;
        }

        evt.preventDefault();
        window.history.pushState({}, '', this.href);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }
}
