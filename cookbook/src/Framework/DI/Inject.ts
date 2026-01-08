import {ClassConstructor} from './ClassConstructor';
import {ServiceContainer} from './ServiceContainer';

export function Inject(target: any, propertyKey: string | symbol)
{
    const type = Reflect.getMetadata('design:type', target, propertyKey);

    if (!type) {
        throw new Error(`Cannot resolve type for property "${String(propertyKey)}". Make sure to enable "emitDecoratorMetadata" in tsconfig.json.`);
    }

    getDependencySetOf(target.constructor).add(type);

    Object.defineProperty(target, propertyKey, {
        enumerable:   false,
        configurable: false,
        get:          () => ServiceContainer.get(type),
    });
}

export function getDependencySetOf(target: any): Set<ClassConstructor>
{
    if (!target.hasOwnProperty('__dependencies__')) {
        Object.defineProperty(target, '__dependencies__', {
            value:      new Set<ClassConstructor>(),
            enumerable: false,
            writable:   false,
        });
    }

    return target.__dependencies__;
}
