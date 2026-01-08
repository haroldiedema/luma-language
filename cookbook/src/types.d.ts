type PageNavigationItem = PageNavigationGroup | PageNavigationLink;

type PageNavigationGroup = {
    type: 'group';
    href?: string;
    name: string;
    items: PageNavigationItem[];
    active?: boolean;
}

type PageNavigationLink = {
    type: 'link';
    name: string;
    href: string;
    active?: boolean;
}
