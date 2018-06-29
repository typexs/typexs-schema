import * as _ from 'lodash';
import {PropertyDef} from '../PropertyDef';
import {XS_REL_SOURCE_PREFIX, XS_REL_TARGET_PREFIX} from '../Constants';


export class TypeOrmNameResolver {


  forTarget(property: PropertyDef | string, prefix:string = null): [string, string] {
    return this.for(XS_REL_TARGET_PREFIX, property);
  }


  forSource(property: PropertyDef | string, prefix:string = null): [string, string] {
    return this.for(XS_REL_SOURCE_PREFIX, property);
  }


  for(prefix: string, property: PropertyDef | string): [string, string] {

    let sourceId, sourceName;
    if (_.isString(property)) {
      sourceId = prefix + _.capitalize(property);
      sourceName = prefix + '_' + _.snakeCase(property);
    } else {
      sourceId = prefix + _.capitalize(property.name);
      sourceName = prefix + '_' + property.machineName();
    }
    return [sourceId, sourceName];
  }

}
