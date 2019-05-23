import * as _ from 'lodash';
import {Log, NotYetImplementedError} from '@typexs/base';


export class Sql {

  static conditionsToString(condition: any, k: string = null, map: any = {}): string {
    if (_.isEmpty(condition)) {
      return null;
    }
    let control: any = _.keys(condition).filter(k => k.startsWith('$'));
    if (!_.isEmpty(control)) {
      control = control.shift();
      if (this[control]) {
        return this[control](condition, k, map);
      } else {
        throw new NotYetImplementedError();
      }
    } else if (_.isArray(condition)) {
      return this.$or({'$or': condition}, k, map);
    } else {
      return _.keys(condition).map(k => {
        if (_.isPlainObject(condition[k])) {
          return this.conditionsToString(condition[k], k, map);
        }
        const key = _.get(map, k, k);
        const value = condition[k];
        if (_.isString(value) || _.isNumber(value) || _.isDate(value)) {
          return `${key} = '${value}'`;
        } else {
          Log.warn(`SQL.conditionToString not a plain type ${key} = ${JSON.stringify(value)} (${typeof value})`);
          return null;
        }

      }).filter(c => !_.isNull(c)).join(' AND ');
    }
  }

  static $like(condition: any, key: string = null, map: any) {
    const _key = _.get(map, key, key);
    return `${_key} LIKE '${condition['$like']}'`;
  }

  static $in(condition: any, key: string = null, map: any) {
    const _key = _.get(map, key, key);
    return `${_key} IN (${condition['$in'].join(',')})`;
  }

  static $and(condition: any, key: string = null, map: any) {
    return '(' + _.map(condition['$and'], c => this.conditionsToString(c, null, map)).join(') AND (') + ')';
  }

  static $or(condition: any, key: string = null, map: any) {
    return '(' + _.map(condition['$or'], c => this.conditionsToString(c, null, map)).join(') OR (') + ')';
  }
}
