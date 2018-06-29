import {Registry} from '../Registry';

import {ISchema} from '../ISchema';


export function Schema(options:ISchema) {
  return function (object: Function) {

    Registry.createSchema(object,options);
    // Registry.register(xsDef);

  };
}

