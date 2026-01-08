import {IDisposableComponent, IWebComponent, VDom}     from '@/IWebComponent';
import {Component, Element, Event, EventEmitter, Prop} from '@stencil/core';

@Component({
    tag:    'luma-page-nav',
    shadow: false,
})
export class LumaPageNav implements IWebComponent, IDisposableComponent
{
    @Event() public itemsChanged: EventEmitter<PageNavigationItem[]>;

    @Prop({mutable: true}) public items: PageNavigationItem[] = [];

    @Element() private readonly $host: HTMLElement;

    private observer?: MutationObserver;

    /**
     * @inheritDoc
     */
    public connectedCallback(): void
    {
        this.observer = new MutationObserver(this.onMutate.bind(this));
        this.observer.observe(this.$host, {childList: true});
        this.onMutate();
    }

    /**
     * @inheritDoc
     */
    public disconnectedCallback(): void
    {
        this.observer?.disconnect();
    }

    /**
     * @inheritDoc
     */
    public render(): VDom
    {
        return null;
    }

    private onMutate(): void
    {
        this.items = this.collectNavigationNodes(this.$host);
        this.itemsChanged.emit(this.items);
    }

    private collectNavigationNodes(element: HTMLElement): PageNavigationItem[]
    {
        const result: PageNavigationItem[] = [];

        for (const el of Array.from(element.children)) {
            const tag = el.tagName.toLowerCase();

            switch (tag) {
                case 'luma-page-nav-link': {
                    result.push({
                        type: 'link',
                        name: el.getAttribute('label') || '',
                        href: el.getAttribute('href') || '',
                        active: el.hasAttribute('active') ? true : undefined,
                    });
                    break;
                }
                case 'luma-page-nav-group': {
                    const groupItem: PageNavigationItem = {
                        type:  'group',
                        name:  el.getAttribute('label') || '',
                        href:  el.getAttribute('href') || undefined,
                        active: el.hasAttribute('active') ? true : undefined,
                        items: this.collectNavigationNodes(el as HTMLElement),
                    };
                    result.push(groupItem);
                    break;
                }
            }
        }

        return result;
    }
}
