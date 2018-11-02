import * as _ from "lodash";
import {NotYetImplementedError} from "typexs-base";


export class Sql {

  static conditionsToString(condition: any, k: string = null, map: any = {}): string {
    if (_.isEmpty(condition)) {
      return null;
    }
    let control: any = Object.keys(condition).filter(k => k.startsWith('$'));
    if (!_.isEmpty(control)) {
      control = control.shift();
      if (this[control]) {
        return this[control](condition, k, map);
      } else {
        throw new NotYetImplementedError()
      }
    } else if (_.isArray(condition)) {
      return this.$or({'$or': condition}, k, map);
    } else {

      return Object.keys(condition).map(k => {
        if (_.isPlainObject(condition[k])) {
          return this.conditionsToString(condition[k], k, map);
        }
        let key = _.get(map, k, k);
        return `${key} = '${condition[k]}'`
      }).join(' AND ');
    }
  }

  static $like(condition: any, key: string = null, map: any) {
    let _key = _.get(map, key, key);
    return `${_key} LIKE '${condition['$like']}'`
  }

  static $in(condition: any, key: string = null, map: any) {
    let _key = _.get(map, key, key);
    return `${_key} IN (${condition['$in'].join(',')})`
  }

  static $and(condition: any, key: string = null, map: any) {
    return '(' + _.map(condition['$and'], c => this.conditionsToString(c, null, map)).join(') AND (') + ')';
  }

  static $or(condition: any, key: string = null, map: any) {
    return '(' + _.map(condition['$or'], c => this.conditionsToString(c, null, map)).join(') OR (') + ')';
  }
}
