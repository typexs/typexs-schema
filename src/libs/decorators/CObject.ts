import {IObject} from '../registry/IObject';
import {ClassRef} from 'commons-schema-api/browser';


export function CObject(options: IObject = {}) {
  return function (object: Function) {
    ClassRef.get(object).setOptions(options);
  };
}

