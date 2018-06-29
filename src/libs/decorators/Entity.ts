import {Registry} from '../Registry';
import {IEntity} from '../IEntity';


export function Entity(options:IEntity = {}) {
  return function (object: Function) {

    let xsDef = Registry.createEntity(object,options);
    Registry.register(xsDef);

  };
}

