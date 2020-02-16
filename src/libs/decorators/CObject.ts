import {IObject} from '../registry/IObject';
import {ClassRef} from 'commons-schema-api/browser';
import {REGISTRY_TXS_SCHEMA} from '../Constants';


export function CObject(options: IObject = {}) {
  return function (object: Function) {
    ClassRef.get(object, REGISTRY_TXS_SCHEMA).setOptions(options);
  };
}

