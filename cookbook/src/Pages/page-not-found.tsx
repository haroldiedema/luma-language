import {VDom}               from '@/IWebComponent';
import {Component, h, Host} from '@stencil/core';

void h;

@Component({
    tag:      'page-not-found',
    styleUrl: 'page-not-found.scss',
    shadow:   false,
})
export class PageNotFound
{
    public render(): VDom
    {
        return (
            <Host>
                <h1>Not found.</h1>
            </Host>
        );
    }
}
