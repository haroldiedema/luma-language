import {Inject, ServiceContainer}                from '@/Framework/DI';
import {Router}                                  from '@/Framework/Router/Router';
import {IComponentWillLoad, IWebComponent, VDom} from '@/IWebComponent';
import {Component, h, Host, State}               from '@stencil/core';

void h;

@Component({
    tag:      'luma-app',
    styleUrl: 'luma-app.scss',
    shadow:   false,
})
export class LumaApp implements IWebComponent, IComponentWillLoad
{
    @Inject private readonly router: Router;

    @State() private pageTag: string = 'page-playground';

    public async componentWillLoad(): Promise<void>
    {
        await ServiceContainer.compile();

        this.router
            .add({id: 'docs', name: 'Docs', path: '/docs/:page/:section/:sub3', tag: 'page-docs', isDefault: true})
            .add({id: 'playground', name: 'Playground', path: '/playground', tag: 'page-playground'})
            .add({id: 'not-found', name: 'Not Found', path: '/not-found', tag: 'page-not-found', is404: true})
            .on('changed', r => this.pageTag = r.tag);

        this.router.init();
    }

    /**
     * @inheritDoc
     */
    public render(): VDom
    {
        return (
            <Host>
                <nav id="main-nav">
                    <div class="container">
                        <section>
                            <a class="logo" href="/">
                                <div class="logo-icon"/>
                                <div class="logo-name comfortaa">Luma</div>
                            </a>
                        </section>
                        <section>
                            {this.router.routes.filter(route => !route.is404).map(route => (
                                <luma-link
                                    href={route.href}
                                    class={{
                                        link:   true,
                                        active: this.router.currentRoute?.id === route.id,
                                    }}
                                >
                                    {route.name}
                                </luma-link>
                            ))}
                            <div class="divider"/>
                            <a class="link" href="https://www.npmjs.com/package/luma-lang" target="_blank">
                                <i class="fa-brands fa-npm"/>
                            </a>
                            <a class="link" href="https://github.com/haroldiedema/luma-language" target="_blank">
                                <i class="fa-brands fa-github"/>
                            </a>
                        </section>
                    </div>
                </nav>
                <main id="main-body">
                    <this.pageTag/>
                </main>
            </Host>
        );
    }
}
