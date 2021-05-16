// import {EntityRegistry} from '../EntityRegistry';
import './register';
import {ISchema} from '../registry/ISchema';
import {Schema as _Schema} from '@allgemein/schema-api';
import {defaults, isString} from 'lodash';
import {NAMESPACE_BUILT_ENTITY} from '../Constants';


/**
 * @deprecated
 *
 * @param options
 * @constructor
 */
export function Schema(options: string | ISchema) {
  return function (object: Function) {
    if (isString(options)) {
      options = {name: options};
    }
    _Schema(defaults(options, {namespace: NAMESPACE_BUILT_ENTITY}))(object);
    // EntityRegistry.createSchema(object, options);
  };
}

