import {Inject}                                  from '@/Framework/DI';
import {Router}                                  from '@/Framework/Router';
import {IComponentWillLoad, IWebComponent, VDom} from '@/IWebComponent';
import {Component, h, State}                     from '@stencil/core';
import {docs}                                    from '@/docs';

void h;

@Component({
    tag:      'page-docs',
    styleUrl: 'page-docs.scss',
    shadow:   false,
})
export class PageDocs implements IWebComponent, IComponentWillLoad
{
    @Inject private readonly router: Router;

    @State() private links: PageNavigationItem[] = [];
    @State() private page: string                = null;
    @State() private section: string[]           = [];
    @State() private title: string               = 'Documentation';

    /**
     * @inheritDoc
     */
    public async componentWillLoad(): Promise<void>
    {
        this.router.on('changed', () => this.onRouteChanged());
        this.onRouteChanged();
    }

    /**
     * @inheritDoc
     */
    public render(): VDom
    {
        return (
            <luma-page label={this.title}>
                <luma-page-nav>
                    {this.links.map(link => this.renderNavLink(link))}
                </luma-page-nav>
                <luma-page-content>
                    <luma-doc-renderer page={this.page} section={this.section.join('/')}/>
                </luma-page-content>
            </luma-page>
        );
    }

    private onRouteChanged(): void
    {
        const route = this.router.currentRoute;
        if (!route || route.id !== 'docs') {
            return;
        }

        const page    = route.parameters.get('page') || '';
        const section = route.parameters.get('section') || '';
        const sub1    = route.parameters.get('sub1') || '';
        const sub2    = route.parameters.get('sub2') || '';
        const sub3    = route.parameters.get('sub3') || '';

        if (!page) {
            this.generateDocs();
            location.href = this.links[0].href;
            return;
        }

        this.page    = page ?? this.links[0].href;
        this.section = [section, sub1, sub2, sub3].filter(s => s);

        this.generateDocs();
    }

    private generateDocs(): void
    {
        const links: PageNavigationItem[] = [];

        for (const doc of docs) {
            links.push({
                type:   'group',
                name:   doc.title,
                href:   doc.path,
                items:  this.generateLinks(doc.path, doc.links),
                active: doc.path === `/luma-language/docs/${this.page}`,
            });

            if (doc.path === `/luma-language/docs/${this.page}`) {
                this.title = doc.title;
            }
        }

        this.links = links;
    }

    private generateLinks(basePath: string, items: any[], depth: number = 0): PageNavigationItem[]
    {
        return items.map(item => {
            if (item.children) {
                return {
                    type:   'group',
                    name:   item.text,
                    href:   `${basePath}${item.link}`,
                    active: `${basePath}${item.link}` === this.router.path,
                    items:  this.generateLinks(basePath, item.children, depth + 1),
                };
            }

            return {
                type:   'link',
                name:   item.text,
                href:   `${basePath}${item.link}`,
                active: `${basePath}${item.link}` === this.router.path,
            };
        });
    }

    private renderNavLink(item: PageNavigationItem): VDom
    {
        if (item.type === 'link') {
            return (<luma-page-nav-link href={item.href} label={item.name} active={item.active}/>);
        }

        return (
            <luma-page-nav-group label={item.name} href={item.href} active={item.active}>
                {item.items.map(subItem => this.renderNavLink(subItem))}
            </luma-page-nav-group>
        );
    }
}
