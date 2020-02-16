import {SchemaRef} from './registry/SchemaRef';
import {EntityRef} from './registry/EntityRef';
import * as _ from './LoDash';
import {PropertyRef} from './registry/PropertyRef';

export class SchemaUtils {

  static get<X, Y>(property: string, objects: X[]): Y[] {
    const y: Y[] = [];
    for (const object of objects) {
      if (object) {
        const values = _.get(object, property, null);
        y.push(values);
      } else {
        y.push(null);
      }
    }
    return y;
  }

  static resolve(schemaDef: SchemaRef, entityName: string | EntityRef) {
    let entityDef: EntityRef = <EntityRef>entityName;
    if (_.isString(entityName)) {
      entityDef = schemaDef.getEntity(entityName);
    }
    return entityDef;
  }


  static extractPropertyObjects(propertyDef: PropertyRef, objects: any[], prefixed: string = null): [number[][], any[]] {
    const innerObjects: any[] = SchemaUtils.get(prefixed ? [prefixed, propertyDef.name].join('__') : propertyDef.name, objects);

    const map: number[][] = [];
    const flattenObjects: any[] = [];
    for (let i = 0; i < innerObjects.length; i++) {
      const obj = innerObjects[i];
      if (!_.isUndefined(obj) && !_.isNull(obj)) {
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


  static remap(propertyDef: PropertyRef, flattenObjects: any[], map: number[][], objects: any[], prefixed: string = null) {
    const propName = prefixed ? [prefixed, propertyDef.name].join('__') : propertyDef.name;

    for (let i = 0; i < flattenObjects.length; i++) {
      const mapping = map[i];
      const sourceIdx = mapping[0];

      if (propertyDef.isCollection()) {
        if (!objects[sourceIdx][propName]) {
          objects[sourceIdx][propName] = [];
        }
        const posIdx = mapping[1];
        _.set(<any>objects[sourceIdx], propName + '[' + posIdx + ']', flattenObjects[i]);
      } else {
        _.set(<any>objects[sourceIdx], propName, flattenObjects[i]);
      }

    }
  }


  static clazz(str: string): Function {
    function X() {
    }

    Object.defineProperty(X, 'name', {value: str});
    return X;
  }
}
