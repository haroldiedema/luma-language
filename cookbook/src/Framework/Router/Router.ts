import {Service}                       from '@/Framework/DI';
import {Route}                         from '@/Framework/Router/Route';
import {RouteOptions}                  from '@/Framework/Router/RouteOptions';
import {EventEmitter, EventSubscriber} from '@byteshift/events';
import {Listen}                        from '@stencil/core';

@Service
export class Router extends EventEmitter
{
    private readonly _routes: Map<string, Route> = new Map();

    private _currentRoute?: Route;

    constructor()
    {
        super();
    }

    public get routes(): Route[]
    {
        return Array.from(this._routes.values());
    }

    public get currentRoute(): Route
    {
        return this._currentRoute!;
    }

    public get path(): string
    {
        return window.location.pathname;
    }

    /**
     * Initializes the router.
     *
     * Reads the current URL and emits the 'changed' event for the matching route.
     */
    public init(): void
    {
        if (! this.defaultRoute) {
            console.warn('No default route set in Router');
            return;
        }

        this.onPopState();
    }

    /**
     * Adds a new route to the router.
     */
    public add(options: RouteOptions): this
    {
        const route = new Route(options);
        this._routes.set(options.id, route);

        return this;
    }

    public set404Component(component: string): this
    {
        const route = new Route({id: '404', path: '/404', name: '404', tag: component, is404: true});
        this._routes.set('404', route);

        return this;
    }

    private get defaultRoute(): Route | undefined
    {
        for (const route of this._routes.values()) {
            if (route.isDefault) {
                return route;
            }
        }

        return undefined;
    }

    private get notFoundRoute(): Route | undefined
    {
        for (const route of this._routes.values()) {
            if (route.is404) {
                return route;
            }
        }

        return undefined;
    }

    @Listen('popstate', {target: 'window'})
    private onPopState(): void
    {
        const path = window.location.pathname;

        for (const route of this._routes.values()) {
            if (route.matches(path)) {
                this._currentRoute = route;
                this.emit('changed', route);
                return;
            }
        }

        const defaultRoute = this.defaultRoute;
        if (path === '/' && defaultRoute) {
            this._currentRoute = defaultRoute;
            return this.emit('changed', defaultRoute);
        }

        const notFoundRoute = this.notFoundRoute;
        if (notFoundRoute) {
            this._currentRoute = notFoundRoute;
            return this.emit('changed', notFoundRoute);
        }

        console.warn(`No route found for path: ${path} and no 404-route set.`);
    }
}

export interface Router
{
    on(event: 'changed', listener: (route: Route) => any): EventSubscriber;
}
