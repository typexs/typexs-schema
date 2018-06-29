import * as _ from 'lodash';

import {Registry} from '../Registry';
import {IProperty} from '../IProperty';


export function Property(typeOrOptions: IProperty | string = null) {
  return function (object: any, property: string, _options: any = {}) {
    let options:IProperty = {propertyName:property,sourceClass:null};

    if (_.isString(typeOrOptions)) {
      options.type = <string>typeOrOptions;
    } else  {
      options = <IProperty>typeOrOptions;
    }

    options.sourceClass = object;
    options.propertyName = property;


    let xsDef = Registry.createProperty(options);
    Registry.register(xsDef);
  };
}
