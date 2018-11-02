import {PropertyDef} from '../../registry/PropertyDef';
import {XS_REL_SOURCE_PREFIX, XS_REL_TARGET_PREFIX} from '../../Constants';
import * as _ from '../../LoDash'
import {INameResolver} from "./../INameResolver";
import {NotSupportedError} from "typexs-base/libs/exceptions/NotSupportedError";

export class NameResolver implements INameResolver {


  forTarget(property: PropertyDef | string, prefix: string = null): [string, string] {
    return this.for(XS_REL_TARGET_PREFIX, property);
  }


  forSource(property: PropertyDef | string, prefix: string = null): [string, string] {
    return this.for(XS_REL_SOURCE_PREFIX, property);
  }

  /**
   * Id is the key for an object, name is the storeage value
   */

  for(prefix: PropertyDef | string, property?: PropertyDef | string): [string, string] {
    let sourceId, sourceName;
    if (prefix && property) {
      if (_.isString(property)) {
        sourceId = prefix + _.capitalize(property);
        sourceName = prefix + '_' + _.snakeCase(property);
      } else {
        sourceId = prefix + _.capitalize(property.name);
        sourceName = prefix + '_' + property.machineName;
      }
      return [sourceId, sourceName];
    } else if (prefix && !property) {
      property = prefix;
      if (_.isString(property)) {
        sourceId = property;
        sourceName = _.snakeCase(property);
      } else {
        sourceId = property.name;
        sourceName = property.machineName;
      }
      return [sourceId, sourceName];
    }
    throw new NotSupportedError('other input combinations');
  }


}