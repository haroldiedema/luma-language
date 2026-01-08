import {ClassConstructor}   from './ClassConstructor';
import {getDependencySetOf} from './Inject';

export const ServiceContainer = new class
{
    private services: Map<ClassConstructor, any> = new Map();
    private definitions: Set<ClassConstructor>   = new Set();
    private circularRefs: ClassConstructor[]     = [];

    public register(...classDefinitions: ClassConstructor[]): this
    {
        classDefinitions.forEach(c => this.definitions.add(c));

        return this;
    }

    public set<T>(service: ClassConstructor, instance: T): void
    {
        this.services.set(service, instance);
    }

    public get<T extends ClassConstructor>(service: T): InstanceType<T>
    {
        const instance = this.services.get(service);
        if (!instance) {
            throw new Error(`Service ${service.name} not found in container.`);
        }

        return instance;
    }

    public has(service: ClassConstructor): boolean
    {
        return this.services.has(service);
    }

    public async compile(): Promise<void>
    {
        for (const ctor of this.definitions) {
            await this.compileDefinition(ctor);
        }
    }

    private async compileDefinition(ctor: ClassConstructor): Promise<any>
    {
        if (this.services.has(ctor)) {
            return this.services.get(ctor);
        }

        if (this.circularRefs.includes(ctor)) {
            throw new Error(`Circular reference detected: ${[
                ...this.circularRefs,
                ctor,
            ].map(c => c.name).join(' -> ')} -> ${ctor.name}`);
        }
        this.circularRefs.push(ctor);

        const dependencies: any[] = [];

        for (const paramType of getDependencySetOf(ctor)) {
            if (!this.definitions.has(paramType)) {
                throw new Error(`Cannot resolve dependency ${paramType.name} for service ${ctor.name}: not registered in container.`);
            }

            const dependency = await this.compileDefinition(paramType);
            dependencies.push(dependency);
        }

        const instance = new ctor(...dependencies);

        if (typeof (instance as any).initialize === 'function') {
            await (instance as any).initialize();
        }

        this.services.set(ctor, instance);
        this.circularRefs.pop();

        return instance;
    }
};
