import {RouteOptions} from '@/Framework/Router/RouteOptions';

export class Route
{
    public readonly id: string;
    public readonly name: string;
    public readonly path: string;
    public readonly tag: string;
    public readonly icon?: string;
    public readonly isDefault: boolean;
    public readonly is404: boolean;
    public readonly parameters: Map<string, string> = new Map();

    constructor(options: RouteOptions)
    {
        this.id        = options.id;
        this.name      = options.name;
        this.path      = options.path;
        this.tag       = options.tag;
        this.icon      = options.icon;
        this.isDefault = options.isDefault ?? false;
        this.is404     = options.is404 ?? false;
    }

    public get href(): string
    {
        const parts: string[]  = this.path.split('/').filter(part => part.length > 0);
        const result: string[] = [];

        for (const part of parts) {
            if (part.startsWith(':')) {
                return `/${result.join('/')}`;
            }

            result.push(part);
        }

        return `/${result.join('/')}`;
    }

    /**
     * Match the given path against this route.
     * A route may contain parameters (e.g. /user/:id).
     * If a route ends with multiple placeholders, all placeholders are optional.
     *
     * @param {string} path
     * @returns {boolean}
     */
    public matches(path: string): boolean
    {
        const routeParts = this.path.split('/').filter(part => part.length > 0);
        const pathParts  = path.split('/').filter(part => part.length > 0);

        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                this.parameters.set(routeParts[i].substring(1), pathParts[i]);
                continue; // Parameter, always matches
            }

            if (routeParts[i] !== pathParts[i]) {
                return false; // Mismatch
            }
        }

        return true;
    }
}
