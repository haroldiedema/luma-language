import { docs }                                                         from '@/docs';
import { Inject }                                                       from '@/Framework/DI';
import { Router }                                                       from '@/Framework/Router';
import { IComponentDidRender, IComponentWillLoad, IWebComponent, VDom } from '@/IWebComponent';
import { blockquoteRenderer }                                           from '@/Marked/BlockquoteRenderer';
import { headingRenderer }                                              from '@/Marked/HeadingRenderer';
import { highlightLuma }                                                from '@/Marked/LumaHighlight';
import { highlightTypeScript }                                          from '@/Marked/TsHighlight';
import { Component, Element, h, Host, Prop, State, Watch }              from '@stencil/core';
import { marked }                                                       from 'marked';
import { markedHighlight }                                              from 'marked-highlight';

void h;

marked.use(
    headingRenderer,
    blockquoteRenderer,
    markedHighlight({
        async:          false,
        emptyLangClass: 'luma-code',
        langPrefix:     'luma-code-',
        highlight:      (code: string, lang: string) => {
            switch (lang) {
                case 'luma': return highlightLuma(code);
                case 'ts': return highlightTypeScript(code);
            }
            return code;
        },
    }),
);

@Component({
    tag:      'luma-doc-renderer',
    styleUrl: 'luma-doc-renderer.scss',
    shadow:   false,
})
export class LumaDocRenderer implements IWebComponent, IComponentWillLoad, IComponentDidRender
{
    @Prop() public page: string    = '';
    @Prop() public section: string = '';

    @State() private html: string = 'Content here.';
    @Element() private readonly $host: HTMLElement;

    @Inject private readonly router: Router;

    private observer?: IntersectionObserver   = null;
    private headings: Set<HTMLElement>        = new Set();
    private visibleHeadings: Set<HTMLElement> = new Set();
    private isInitialRender: boolean          = true;
    private isInTransientNav: boolean         = false;
    private debounceTimer: any                = null;

    /**
     * @inheritDoc
     */
    public async componentWillLoad(): Promise<void>
    {
        this.router.on('changed', (route, isTransient) => {
            if (route.id !== 'docs') {
                return;
            }

            if (! isTransient) {
                clearTimeout(this.debounceTimer);
                this.isInTransientNav = true;
                this.debounceTimer    = setTimeout(() => {
                    this.isInTransientNav = false;
                }, 500);
            }
        });

        this.onPathChanged();
        setTimeout(() => this.isInitialRender = false, 500);
    }

    /**
     * @inheritDoc
     */
    public render(): VDom
    {
        return (
            <Host>
                <main id="doc-content" innerHTML={this.html}/>
            </Host>
        );
    }

    /**
     * @inheritDoc
     */
    public componentDidRender(): void
    {
        this.trackHeadings(Array.from(this.$host.querySelectorAll('h1, h2, h3, h4, h5, h6')));

        const anchor = [this.page, ...(this.section?.split('/') ?? [])].join('-');
        if (! this.isInitialRender && ! this.isInTransientNav || ! anchor || anchor === '-') {
            return;
        }

        this.$host.querySelector(`#${anchor}`)?.scrollIntoView({
            behavior: 'smooth',
            block:    'start',
            inline:   'start',
        });
    }

    private trackHeadings(elements: HTMLElement[]): void
    {
        if (! this.observer) {
            this.observer = new IntersectionObserver((entries) => {
                if (this.isInitialRender) {
                    return;
                }

                entries.forEach(entry => {
                    const target = entry.target as HTMLElement;
                    if (entry.isIntersecting) {
                        this.visibleHeadings.add(target);
                    } else {
                        this.visibleHeadings.delete(target);
                    }
                });

                const visibleList = Array.from(this.visibleHeadings);

                if (visibleList.length > 0) {
                    visibleList.sort((a, b) => {
                        // Faster than getBoundingClientRect...
                        return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1;
                    });

                    const topHeading = visibleList[0];

                    const path = topHeading.getAttribute('data-path');
                    if (path && ! this.isInTransientNav) {
                        window.history.pushState({}, '', path);
                        window.dispatchEvent(new PopStateEvent('popstate', {state: {transient: true}}));
                    }
                }
            }, {
                root:       this.$host.parentElement.parentElement.parentElement.parentElement, // eww...
                rootMargin: '0px 0px -80% 0px',
                threshold:  0,
            });
        }

        const usedHeadings = new Set<HTMLElement>();

        for (const el of elements) {
            if (this.headings.has(el)) {
                usedHeadings.add(el);
                continue;
            }

            this.observer.observe(el);
            this.headings.add(el);
            usedHeadings.add(el);
        }

        for (const el of this.headings) {
            if (! usedHeadings.has(el)) {
                this.observer.unobserve(el);
                this.headings.delete(el);
                this.visibleHeadings.delete(el);
            }
        }
    }

    @Watch('path')
    @Watch('section')
    private onPathChanged(): void
    {
        const doc = docs.find(doc => doc.path === `/docs/${this.page}`);

        if (! doc) {
            this.html = `<h2>Document not found</h2><p>The requested document could not be found.</p>`;
            return;
        }

        this.html = marked(doc.content, {
            gfm:   true,
            async: false,
        });
    }
}
