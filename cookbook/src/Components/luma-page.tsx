import { Inject }                                  from '@/Framework/DI';
import { Router }                                  from '@/Framework/Router';
import {IDisposableComponent, IWebComponent, VDom} from '@/IWebComponent';
import { EventSubscriber }                         from '@byteshift/events';
import {Component, Element, h, Host, Prop, State}  from '@stencil/core';

void h;

@Component({
    tag:      'luma-page',
    styleUrl: 'luma-page.scss',
    shadow:   false,
})
export class LumaPage implements IWebComponent, IDisposableComponent
{
    @Prop() public label: string = 'Untitled Page';

    @Element() private readonly $host: HTMLElement;

    @State() private items: PageNavigationItem[] = [];
    @State() private navOpen: boolean            = false;

    @Inject private readonly router: Router;

    private routeEvent: EventSubscriber;

    /**
     * @inheritDoc
     */
    public connectedCallback(): void
    {
        this.routeEvent = this.router.on('changed', () => this.navOpen = false);

        const nav: HTMLLumaPageNavElement | null = this.$host.querySelector('luma-page-nav');

        if (nav) {
            this.items = nav.items;
            nav.addEventListener('itemsChanged', evt => {
                this.items = evt.detail;
            });
        }
    }

    /**
     * @inheritDoc
     */
    public disconnectedCallback(): void
    {
        this.routeEvent?.unsubscribe();
    }

    public render(): VDom
    {
        return (
            <Host>
                <header class="page-header">
                    <div class="container">
                        <section>
                            {this.hasNavigation && (
                                <button
                                    id="mobile-nav-button"
                                    onClick={() => this.navOpen = !this.navOpen}
                                    class={{active: this.navOpen}}
                                >
                                    <i class={`fa ${this.navOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}/>
                                </button>
                            )}
                            <h1 class="comfortaa">
                                {this.navOpen ? 'Navigation' : this.label}
                            </h1>
                        </section>
                        <section>
                            <h1 class="comfortaa">
                                {this.navOpen ? 'Navigation' : this.label}
                            </h1>
                        </section>
                    </div>
                </header>
                <main class="page-body">
                    <div class="container">
                        {this.hasNavigation && (
                            <nav class={{'page-nav': true, show: this.navOpen}}>
                                {this.renderNavigationList(this.items)}
                            </nav>
                        )}
                        <section class={{'page-content': true, hide: this.navOpen}}>
                            <slot/>
                        </section>
                    </div>
                </main>
            </Host>
        );
    }

    private get hasNavigation(): boolean
    {
        return this.items && this.items.length > 0;
    }

    private renderNavigationList(items: PageNavigationItem[]): VDom
    {
        return items.map(item => {
            switch (item.type) {
                case 'link':
                    return (
                        <luma-link href={item.href} class={{'nav-link': true, active: item.active}}>
                            {item.name}
                        </luma-link>
                    );
                case 'group':
                    return (
                        <div class="nav-group">
                            {item.href ? (
                                <luma-link href={item.href} class={{'nav-group-label': true, active: item.active}}>
                                    {item.name}
                                </luma-link>
                            ) : (
                                <div class={{'nav-group-label': true, active: item.active}}>
                                    {item.name}
                                </div>
                            )}
                            <div class="nav-group-items">
                                {this.renderNavigationList(item.items)}
                            </div>
                        </div>
                    );
            }
        });
    }
}
