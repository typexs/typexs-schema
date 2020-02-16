import {ClassRef, LookupRegistry} from 'commons-schema-api/browser';
import {REGISTRY_TXS_SCHEMA} from './Constants';

export function classRefGet(name: string | Function) {
  return ClassRef.get(name, REGISTRY_TXS_SCHEMA);
}

export function lookupRegistry() {
  return LookupRegistry.$(REGISTRY_TXS_SCHEMA);
}
