import {EntityRegistry} from '../EntityRegistry';
import {IEntity} from '../IEntity';


export function Entity(options:IEntity = {}) {
  return function (object: Function) {

    let xsDef = EntityRegistry.createEntity(object,options);
    EntityRegistry.register(xsDef);

  };
}

