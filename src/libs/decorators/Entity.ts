import './register';
import {IEntity} from '../registry/IEntity';
import {Entity as _Entity} from '@allgemein/schema-api';
import {defaults} from 'lodash';
import {NAMESPACE_BUILT_ENTITY} from '../Constants';


/**
 * @deprecated
 *
 * @param options
 * @constructor
 */
export function Entity(options: IEntity = {}) {
  return function (object: Function) {

    // const xsDef = EntityRegistry.createEntity(object, options);
    // EntityRegistry.register(xsDef);
    _Entity(defaults(options, {namespace: NAMESPACE_BUILT_ENTITY}))(object);
  };
}

