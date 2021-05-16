import {RegistryFactory} from '@allgemein/schema-api';
import {NAMESPACE_BUILT_ENTITY} from '../Constants';
import {EntityRegistry} from '../EntityRegistry';

RegistryFactory.register(NAMESPACE_BUILT_ENTITY, EntityRegistry);
RegistryFactory.register(new RegExp('^' + NAMESPACE_BUILT_ENTITY + '\.'), EntityRegistry);
