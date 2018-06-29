import * as _ from 'lodash';
import {XsSchemaDef} from './XsSchemaDef';
import {XsEntityDef} from './XsEntityDef';

export class SchemaUtils {

  static get<X, Y>(property: string, objects: X[]): Y[] {
    let y: Y[] = [];
    for (let object of objects) {
      if (object) {
        let values = _.get(object, property, null);
        y.push(values);
      } else {
        y.push(null);
      }
    }

    return y;
  }

  static resolve(schemaDef: XsSchemaDef, entityName: string | XsEntityDef) {
    let entityDef: XsEntityDef = <XsEntityDef>entityName;
    if (_.isString(entityName))
      entityDef = schemaDef.getEntity(entityName);
    return entityDef;
  }


}
