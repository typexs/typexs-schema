
import {SchemaDef} from './SchemaDef';
import {EntityDef} from './EntityDef';
import * as _ from './LoDash'
import {PropertyDef} from "./PropertyDef";

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


  static extractPropertyObjects(propertyDef: PropertyDef, objects: any[], prefixed: string = null): [number[][], any[]] {
    let innerObjects: any[] = SchemaUtils.get(prefixed ? [prefixed, propertyDef.name].join('__') : propertyDef.name, objects);

    let map: number[][] = [];
    let flattenObjects: any[] = [];
    for (let i = 0; i < innerObjects.length; i++) {
      let obj = innerObjects[i];
      if (obj) {
        // ignoring null and undefined values
        if (_.isArray(obj)) {
          for (let j = 0; j < obj.length; j++) {
            map.push([i, j]);
            flattenObjects.push(obj[j]);
          }
        } else {
          map.push([i]);
          flattenObjects.push(obj);
        }
      }
    }
    return [map, flattenObjects];
  }

  static remap(propertyDef: PropertyDef, flattenObjects: any[], map: number[][], objects: any[], prefixed: string = null) {
    let propName = prefixed ? [prefixed,propertyDef.name].join('__') : propertyDef.name;

    for (let i = 0; i < flattenObjects.length; i++) {
      let mapping = map[i];
      let sourceIdx = mapping[0];

      if (propertyDef.isCollection()) {
        if (!objects[sourceIdx][propName]) {
          objects[sourceIdx][propName] = [];
        }
        let posIdx = mapping[1];
        _.set(<any>objects[sourceIdx], propName + '[' + posIdx + ']', flattenObjects[i]);
      } else {
        _.set(<any>objects[sourceIdx], propName, flattenObjects[i]);
      }

    }
  }

  static clazz(str: string) {
    function X() {
    }

    Object.defineProperty(X, 'name', {value: str});
    return X;
  }
}
