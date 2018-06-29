import {XsRegistry} from '../XsRegistry';
import {IXsEntity} from '../IXsEntity';


export function Entity(options:IXsEntity = {}) {
  return function (object: Function) {

    let xsDef = XsRegistry.createEntity(object,options);
    XsRegistry.register(xsDef);

  };
}

