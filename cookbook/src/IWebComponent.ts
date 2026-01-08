export interface IWebComponent
{
    render(): VDom;
}

export interface IComponentWillLoad
{
    componentWillLoad(): Promise<void>;
}

export interface IComponentDidLoad
{
    componentDidLoad(): void;
}

export interface IDisposableComponent
{
    connectedCallback(): void;
    disconnectedCallback(): void;
}

export interface IComponentDidRender
{
    componentDidRender(): void;
}

export type VDom = any;
