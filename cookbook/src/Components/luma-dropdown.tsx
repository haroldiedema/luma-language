import { IComponentWillLoad, IWebComponent, VDom }                                      from '@/IWebComponent';
import { Component, Element, Event, EventEmitter, h, Host, Listen, Prop, State, Watch } from '@stencil/core';

void h;

@Component({
    tag:      'luma-dropdown',
    styleUrl: 'luma-dropdown.scss',
    shadow:   false,
})
export class LumaDropdown implements IWebComponent, IComponentWillLoad
{
    @Event() public itemChanged: EventEmitter<string>;

    @Prop() public items: any[]                                = [];
    @Prop({mutable: true, reflect: true}) public value: string = '';
    @Prop() public placeholder: string                         = 'Select an option';
    @Prop() public noOptionsText: string                       = 'No options available';

    @State() private selectedItem: any = null;
    @State() private isOpen: boolean   = false;

    @Element() private hostElement: HTMLElement;

    public async componentWillLoad(): Promise<void>
    {
        this.updateSelectedItem();
    }

    /**
     * @inheritDoc
     */
    public render(): VDom
    {
        return (
            <Host>
                <button onClick={() => this.isOpen = !this.isOpen}>
                    <div class="wrap">
                        {this.selectedItem?.icon && (
                            <i class={this.selectedItem.icon}/>
                        )}

                        {this.items.length === 0 ? (
                            <span class="placeholder">{this.noOptionsText}</span>
                        ) : this.selectedItem ? (
                            <span class="label">{this.selectedItem.label}</span>
                        ) : (
                            <span class="placeholder">{this.placeholder}</span>
                        )}
                    </div>
                    <div class="wrap">
                        {this.items.length > 0 && (
                            <i class="fa fa-caret-down dropdown-icon"/>
                        )}
                    </div>
                </button>
                <div class={{menu: true, open: this.isOpen}}>
                    {this.items.length === 0 ? (
                        <div class="no-options">
                            {this.noOptionsText}
                        </div>
                    ) : this.items.map(item => {
                        switch (item.type) {
                            case 'divider':
                                return (
                                    <div class="divider"/>
                                );
                            default:
                                return (
                                    <button
                                        class={{
                                            item:       true,
                                            selected:   this.selectedItem?.value === item.value,
                                            'has-icon': !! item.icon,
                                        }}
                                        onClick={() => {
                                            this.value = item.type === 'link' ? this.value : item.value;
                                            this.itemChanged.emit(item.value);
                                            this.isOpen = false;
                                        }}
                                    >
                                        {item.icon && (
                                            <i class={item.icon}/>
                                        )}
                                        <span class="label">{item.label}</span>
                                    </button>
                                );
                        }
                    })}
                </div>
            </Host>
        );
    }

    @Watch('value')
    @Watch('items')
    private updateSelectedItem(): void
    {
        this.selectedItem = this.items.find(item => item.value === this.value) || null;
    }

    @Listen('pointerdown', {target: 'window'})
    @Listen('mousedown', {target: 'window'})
    private onWindowPointerDown(event: PointerEvent): void
    {
        const path = event.composedPath();

        if (! path.includes(this.hostElement)) {
            this.isOpen = false;
        }
    }
}
