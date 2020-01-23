import {EntityRegistry} from '../EntityRegistry';
import {IEntity} from '../registry/IEntity';


export function Entity(options: IEntity = {}) {
  return function (object: Function) {

    const xsDef = EntityRegistry.createEntity(object, options);
    EntityRegistry.register(xsDef);

  };
}

