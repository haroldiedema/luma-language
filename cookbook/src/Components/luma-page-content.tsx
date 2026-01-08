import {IWebComponent, VDom} from '@/IWebComponent';
import {Component, h}           from '@stencil/core';

void h;

@Component({
    tag:      'luma-page-content',
    styleUrl: 'luma-page-content.scss',
    shadow:   false,
})
export class LumaPageContent implements IWebComponent
{
    /**
     * @inheritDoc
     */
    public render(): VDom
    {
        return (
            <slot/>
        );
    }
}
