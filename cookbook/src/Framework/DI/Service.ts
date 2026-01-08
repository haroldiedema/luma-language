import 'reflect-metadata';
import {ClassConstructor} from './ClassConstructor';
import {ServiceContainer} from './ServiceContainer';

export function Service(target: ClassConstructor)
{
    ServiceContainer.register(target);
}
