import './register';
import {IProperty} from '../registry/IProperty';
import {Property as _Property} from '@allgemein/schema-api';
import {defaults, isFunction, isString} from 'lodash';
import {NAMESPACE_BUILT_ENTITY} from '../Constants';

/**
 * @deprecated
 *
 * @param typeOrOptions
 * @constructor
 */
export function Property(typeOrOptions: IProperty | Function | string = null) {
  return function (source: any, propertyName: string) {
    if (isString(typeOrOptions)) {
      typeOrOptions = {type: typeOrOptions};
    } else if (isFunction(typeOrOptions)) {
      typeOrOptions = {type: typeOrOptions};
    } else if (!typeOrOptions) {
      typeOrOptions = {};
    }
    _Property(typeOrOptions)(source, propertyName);

    // let options: IProperty = {};
    // // source = ClassUtils.getFunction(source);
    //
    // if (_.isString(typeOrOptions)) {
    //   options.type = <JS_DATA_TYPES>typeOrOptions;
    // } else if (_.isFunction(typeOrOptions)) {
    //   const name = ClassUtils.getClassName(typeOrOptions);
    //   if (name === '' || name === 'Function') {
    //     options.type = typeOrOptions();
    //   } else {
    //     options.type = typeOrOptions;
    //   }
    // } else if (!_.isEmpty(typeOrOptions)) {
    //   options = <IProperty>typeOrOptions;
    // }
    //
    // // deprecated
    // if (options.targetClass && !options.type) {
    //   options.type = options.targetClass;
    // }
    //
    // options.sourceClass = source.constructor;
    // options.propertyName = propertyName;
    //
    // if (!options.type || options.type === null || options.type === undefined) {
    //   const reflectMetadataType = Reflect && Reflect.getMetadata ? Reflect.getMetadata('design:type', source, propertyName) : undefined;
    //   if (reflectMetadataType) {
    //     const className = ClassUtils.getClassName(reflectMetadataType);
    //     if (!['object', 'array'].includes(className) && JS_PRIMATIVE_TYPES.includes(className.toLowerCase() as any)) {
    //       options.type = className.toLowerCase();
    //     } else if (className === 'Array') {
    //       options.type = reflectMetadataType;
    //       options.cardinality = 0;
    //     } else {
    //       options.type = reflectMetadataType;
    //     }
    //   } else {
    //     options.type = 'string';
    //   }
    // } else {
    //   const reflectMetadataType = Reflect && Reflect.getMetadata ? Reflect.getMetadata('design:type', source, propertyName) : undefined;
    //   if (reflectMetadataType) {
    //     const className = ClassUtils.getClassName(reflectMetadataType);
    //     // options.type = reflectMetadataType;
    //     if (className === 'Array') {
    //       options.cardinality = 0;
    //     }
    //   }
    // }
    //
    //
    // const xsDef = EntityRegistry.createProperty(options);
    // EntityRegistry.register(xsDef);
  };
}
