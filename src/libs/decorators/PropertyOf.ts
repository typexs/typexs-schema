import {EntityRegistry} from '../EntityRegistry';
import {IProperty} from '../registry/IProperty';

import * as _ from '../LoDash';

export function PropertyOf(propertyName: string, entityOrOptions: IProperty | string | Function, options: IProperty = null) {
  return function (object: any) {
    if (!options) {
      options = {propertyName: null, sourceClass: null};
    }

    if (_.isString(entityOrOptions) || _.isFunction(entityOrOptions)) {
      options.sourceClass = entityOrOptions;
    } else {
      options = <IProperty>entityOrOptions;
    }

    options.propertyClass = object;
    if (propertyName) {
      options.propertyName = propertyName;
    }

    const xsDef = EntityRegistry.createProperty(options);
    EntityRegistry.register(xsDef);
  };
}
