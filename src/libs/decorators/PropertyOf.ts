import './register';
import {IProperty} from '../registry/IProperty';
import {PropertyOf as _PropertyOf} from '@allgemein/schema-api';


/**
 * @deprecated
 *
 * @param propertyName
 * @param entityOrOptions
 * @param options
 * @constructor
 */
export function PropertyOf(propertyName: string, entityOrOptions: IProperty | string | Function, options: IProperty = null) {
  return function (object: any) {
    _PropertyOf(propertyName, entityOrOptions, options)(object);
    // if (!options) {
    //   options = {propertyName: null, sourceClass: null};
    // }
    //
    // if (isString(entityOrOptions) || isFunction(entityOrOptions)) {
    //   options.sourceClass = entityOrOptions;
    // } else {
    //   options = <IProperty>entityOrOptions;
    // }
    //
    // options.propertyClass = object;
    // if (propertyName) {
    //   options.propertyName = propertyName;
    // }
    //
    // const xsDef = EntityRegistry.createProperty(options);
    // EntityRegistry.register(xsDef);
  };
}
