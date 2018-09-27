import * as _ from "lodash";
import {NotYetImplementedError} from "typexs-base";


export class Sql {

  static conditionsToString(condition: any, k: string = null): string {
    if (_.isEmpty(condition)) {
      return null;
    }
    let control: any = Object.keys(condition).filter(k => k.startsWith('$'));
    if (!_.isEmpty(control)) {
      control = control.shift();
      if (this[control]) {
        return this[control](condition);
      } else {
        throw new NotYetImplementedError()
      }
    } else if (_.isArray(condition)) {
      return this.$or({'$or': condition});
    } else {

      return Object.keys(condition).map(k => {
        if (_.isPlainObject(condition[k])) {
          return this.conditionsToString(condition[k], k);
        }
        return `${k} = '${condition[k]}'`
      }).join(' AND ');
    }
  }

  static $and(condition: any) {
    return '(' + _.map(condition['$and'], c => this.conditionsToString(c)).join(') AND (') + ')';
  }

  static $or(condition: any) {
    return '(' + _.map(condition['$or'], c => this.conditionsToString(c)).join(') OR (') + ')';
  }
}
