import {PropertyRef} from '../../registry/PropertyRef';
import {XS_REL_SOURCE_PREFIX, XS_REL_TARGET_PREFIX} from '../../Constants';
import {INameResolver} from './../INameResolver';
import {NotSupportedError} from '@typexs/base';
import {capitalize, isString, snakeCase} from 'lodash';

export class NameResolver implements INameResolver {


  forTarget(property: PropertyRef | string, prefix: string = null): [string, string] {
    return this.for(XS_REL_TARGET_PREFIX, property);
  }


  forSource(property: PropertyRef | string, prefix: string = null): [string, string] {
    return this.for(XS_REL_SOURCE_PREFIX, property);
  }

  /**
   * Id is the key for an object, name is the storeage value
   */

  for(prefix: PropertyRef | string, property?: PropertyRef | string): [string, string] {
    let sourceId, sourceName;
    if (prefix && property) {
      if (isString(property)) {
        sourceId = prefix + capitalize(property);
        sourceName = prefix + '_' + snakeCase(property);
      } else {
        sourceId = prefix + capitalize(property.name);
        sourceName = prefix + '_' + property.machineName;
      }
      return [sourceId, sourceName];
    } else if (prefix && !property) {
      property = prefix;
      if (isString(property)) {
        sourceId = property;
        sourceName = snakeCase(property);
      } else {
        sourceId = property.name;
        sourceName = property.machineName;
      }
      return [sourceId, sourceName];
    }
    throw new NotSupportedError('other input combinations');
  }


}
