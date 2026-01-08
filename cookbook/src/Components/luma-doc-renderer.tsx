import {docs}                                                         from '@/docs';
import {IComponentDidRender, IComponentWillLoad, IWebComponent, VDom} from '@/IWebComponent';
import {headingRenderer}                                              from '@/Marked/HeadingRenderer';
import {highlightLuma}                                                from '@/Marked/LumaHighlight';
import {Component, Element, h, Host, Prop, State, Watch}              from '@stencil/core';
import {marked}                                                       from 'marked';
import {markedHighlight}                                              from 'marked-highlight';

void h;

marked.use(headingRenderer);
marked.use(markedHighlight({
    async:          false,
    emptyLangClass: 'luma-code',
    langPrefix:     'luma-code-',
    highlight:      (code: string, lang: string) => {
        return lang === 'luma' ? highlightLuma(code) : code;
    },
}));

@Component({
    tag:      'luma-doc-renderer',
    styleUrl: 'luma-doc-renderer.scss',
    shadow:   true,
})
export class LumaDocRenderer implements IWebComponent, IComponentWillLoad, IComponentDidRender
{
    @Prop() public page: string    = '';
    @Prop() public section: string = '';

    @State() private html: string = 'Content here.';
    @Element() private readonly $host: HTMLElement;

    public async componentWillLoad(): Promise<void>
    {
        this.onPathChanged();
    }

    public render(): VDom
    {
        return (
            <Host>
                <main innerHTML={this.html}/>
            </Host>
        );
    }

    @Watch('path')
    @Watch('section')
    private onPathChanged(): void
    {
        const doc = docs.find(doc => doc.path === `/docs/${this.page}`);

        if (!doc) {
            this.html = `<h2>Document not found</h2><p>The requested document could not be found.</p>`;
            return;
        }

        this.html = marked(doc.content, {
            gfm:   true,
            async: false,
        });
    }

    public componentDidRender(): void
    {
        const anchor = [this.page, ...(this.section?.split('/') ?? [])].join('-');

        this.$host.shadowRoot.querySelector(`#${anchor}`)?.scrollIntoView({
            behavior: 'smooth',
            block:    'start',
        });
    }
}
