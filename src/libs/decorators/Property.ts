import {EntityRegistry} from '../EntityRegistry';
import {IProperty} from '../registry/IProperty';
import * as _ from '../LoDash'

export function Property(typeOrOptions: IProperty | string = null) {
  return function (object: any, property: string, _options: any = {}) {
    let options: IProperty = {propertyName: property, sourceClass: null};

    if (_.isString(typeOrOptions)) {
      options.type = <string>typeOrOptions;
    } else {
      options = <IProperty>typeOrOptions;
    }

    options.sourceClass = object;
    options.propertyName = property;


    let xsDef = EntityRegistry.createProperty(options);
    EntityRegistry.register(xsDef);
  };
}
