
import {SchemaDef} from './SchemaDef';
import {EntityDef} from './EntityDef';
import * as _ from './LoDash'

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

  static resolve(schemaDef: SchemaDef, entityName: string | EntityDef) {
    let entityDef: EntityDef = <EntityDef>entityName;
    if (_.isString(entityName))
      entityDef = schemaDef.getEntity(entityName);
    return entityDef;
  }


}
