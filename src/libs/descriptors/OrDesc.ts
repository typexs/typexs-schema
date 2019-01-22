import * as _ from "lodash";
import {GroupDesc} from "./GroupDesc";
import {ExprDesc} from "./ExprDesc";



export class OrDesc extends GroupDesc {
  readonly type:string = 'or';
  constructor(...values: ExprDesc[]) {
    super(...values);
  }

  lookup(source: any): (target: any) => boolean {
    const checks = _.map(this.values, v => v.lookup(source));
    return function (target: any): boolean {
      for (let fn of checks) {
        if (fn(target)) {
          return true;
        }
      }
      return false;
    }
  }

  for(source: any, keyMap: any = {}): any {
    const checks = _.map(this.values, v => v.for(source, keyMap));
    let c: any = {};
    c['$or'] = checks;
    return c;
  }

}

export function Or(...values: ExprDesc[]) {
  return new OrDesc(...values);
}
