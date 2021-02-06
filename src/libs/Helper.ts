import {ClassRef, LookupRegistry} from 'commons-schema-api/browser';
import {REGISTRY_TXS_SCHEMA} from './Constants';
import {getMetadataStorage as _getMetadataStorage} from 'class-validator';

export function classRefGet(name: string | Function) {
  return ClassRef.get(name, REGISTRY_TXS_SCHEMA);
}

export function lookupRegistry() {
  return LookupRegistry.$(REGISTRY_TXS_SCHEMA);
}


export function getMetadataStorage() {
  // return Injector.get(MetadataStorage); on class-validator v0.10.1
  return _getMetadataStorage();
}
