import * as _ from 'lodash';
import {Registry} from '../Registry';
import {IProperty} from '../IProperty';



export function PropertyOf(propertyName:string , entityOrOptions: IProperty | string | Function, options:IProperty = null) {
  return function (object: any) {
    if(!options){
      options = {propertyName:null,sourceClass:null};
    }

    if(_.isString(entityOrOptions) || _.isFunction(entityOrOptions)){
      options.sourceClass = entityOrOptions;
    }else{
      options = <IProperty>entityOrOptions;
    }

    options.propertyClass = object;
    if(propertyName){
      options.propertyName = propertyName;
    }

    let xsDef = Registry.createProperty(options);
    Registry.register(xsDef);
  };
}
