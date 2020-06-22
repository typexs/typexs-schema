import {EntityRegistry} from '../EntityRegistry';
import {ISchema} from '../registry/ISchema';


export function Schema(options: ISchema) {
  return function (object: Function) {

    EntityRegistry.createSchema(object, options);
    // Registry.register(xsDef);

  };
}

