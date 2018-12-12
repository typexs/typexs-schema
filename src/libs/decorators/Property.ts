import {EntityRegistry} from '../EntityRegistry';
import {IProperty} from '../registry/IProperty';
import * as _ from '../LoDash'
import {JS_DATA_TYPES} from "@typexs/base/libs/Constants";

export function Property(typeOrOptions: IProperty | string = null) {
  return function (object: any, property: string, _options: any = {}) {
    let options: IProperty = {propertyName: property, sourceClass: null};

    if (_.isString(typeOrOptions)) {
      options.type = <JS_DATA_TYPES>typeOrOptions;
    } else {
      options = <IProperty>typeOrOptions;
    }

    options.sourceClass = object;
    options.propertyName = property;


    let xsDef = EntityRegistry.createProperty(options);
    EntityRegistry.register(xsDef);
  };
}
