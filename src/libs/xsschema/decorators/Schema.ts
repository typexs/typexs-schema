import {XsRegistry} from '../XsRegistry';

import {IXsSchema} from '../IXsSchema';


export function Schema(options:IXsSchema) {
  return function (object: Function) {

    XsRegistry.createSchema(object,options);
    // XsRegistry.register(xsDef);

  };
}

