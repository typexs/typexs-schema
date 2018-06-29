import * as _ from 'lodash';

import {XsRegistry} from '../XsRegistry';
import {IXsProperty} from '../IXsProperty';


export function Property(typeOrOptions: IXsProperty | string = null) {
  return function (object: any, property: string, _options: any = {}) {
    let options:IXsProperty = {propertyName:property,sourceClass:null};

    if (_.isString(typeOrOptions)) {
      options.type = <string>typeOrOptions;
    } else  {
      options = <IXsProperty>typeOrOptions;
    }

    options.sourceClass = object;
    options.propertyName = property;


    let xsDef = XsRegistry.createProperty(options);
    XsRegistry.register(xsDef);
  };
}
