import { ClassConstructor }   from './ClassConstructor';
import { getDependencySetOf } from './Inject';

class ServiceContainerImpl
{
    private services: Map<ClassConstructor, any>       = new Map();
    private definitions: Map<string, ClassConstructor> = new Map();
    private circularRefs: ClassConstructor[]           = [];

    public register(id: string, constructor: ClassConstructor): this
    {
        if (! this.definitions.has(id)) {
            this.definitions.set(id, constructor);
        }

        return this;
    }

    public set<T>(service: ClassConstructor, instance: T): void
    {
        this.services.set(service, instance);
    }

    public get<T extends ClassConstructor>(service: T): InstanceType<T>
    {
        if (! (service as any).__id__) {
            throw new Error(`Class ${service.name} is not a service.`);
        }

        const instance = this.services.get((service as any).__id__);
        if (! instance) {
            throw new Error(`Service ${service.name} not found in container.`);
        }

        return instance;
    }

    public has(service: ClassConstructor): boolean
    {
        if (! (service as any).__id__) {
            throw new Error(`Class ${service.name} is not a service.`);
        }

        return this.services.has((service as any).__id__);
    }

    public async compile(): Promise<void>
    {
        for (const ctor of this.definitions.values()) {
            await this.compileDefinition(ctor);
        }
    }

    private async compileDefinition(ctor: ClassConstructor): Promise<any>
    {
        const id = (ctor as any).__id__;
        if (! id) {
            throw new Error(`Compilation of "${ctor.name}" failed. Class is not registered as a service.`);
        }

        if (this.services.has(id)) {
            return this.services.get(id);
        }

        if (this.circularRefs.includes(id)) {
            throw new Error(`Circular reference detected: ${[
                ...this.circularRefs,
                id,
            ].map(c => c.name).join(' -> ')} -> ${id}`);
        }
        this.circularRefs.push(id);

        const dependencies: any[] = [];

        for (const paramType of getDependencySetOf(ctor)) {
            const childId = (paramType as any).__id__;
            if (! childId) {
                throw new Error(`Cannot resolve dependency ${paramType.name} for service ${ctor.name}: not registered as a service.`);
            }

            if (! this.definitions.has(childId)) {
                throw new Error(`Cannot resolve dependency ${paramType.name} for service ${ctor.name}: not registered in container.`);
            }

            const dependency = await this.compileDefinition(paramType);
            dependencies.push(dependency);
        }

        const instance = new ctor(...dependencies);

        if (typeof (instance as any).initialize === 'function') {
            await (instance as any).initialize();
        }

        this.services.set(id, instance);
        this.circularRefs.pop();

        return instance;
    }
}

// Singleton Service Container
export const ServiceContainer = (window as any).__SC__ ??= new ServiceContainerImpl();
