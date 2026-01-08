import {IWebComponent, VDom} from '@/IWebComponent';
import {Component, h, Host}  from '@stencil/core';

void h;

@Component({
    tag:      'page-playground',
    styleUrl: 'page-playground.scss',
    shadow:   false,
})
export class PagePlayground implements IWebComponent
{
    public render(): VDom
    {
        return (
            <luma-page label="Playground">
                <luma-page-content>
                    Content komt hier.
                </luma-page-content>
            </luma-page>
        );
    }
}
