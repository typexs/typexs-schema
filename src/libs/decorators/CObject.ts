import {IObject} from '../registry/IObject';
import {ClassRef} from 'commons-schema-api/browser';
import {REGISTRY_TXS_SCHEMA} from '../Constants';
import {classRefGet} from '../Helper';


export function CObject(options: IObject = {}) {
  return function (object: Function) {
    classRefGet(object).setOptions(options);
  };
}

