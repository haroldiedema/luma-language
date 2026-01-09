import 'reflect-metadata';
import { ClassConstructor } from './ClassConstructor';
import { ServiceContainer } from './ServiceContainer';

export function Service(id: string)
{
    return function (target: ClassConstructor) {
        Object.defineProperty(target, '__id__', {
            value:        id,
            writable:     false,
            enumerable:   false,
            configurable: false,
        });

        ServiceContainer.register(id, target);
    };
}
