import * as _ from "lodash";


import {Selector} from "./Selector";
import {KeyDesc} from "./KeyDesc";
import {ValueDesc} from "./ValueDesc";
import {OpDesc} from "./OpDesc";


export class EqDesc extends OpDesc {
  readonly type:string = 'eq';
  constructor(key: string, value: Selector) {
    super(key, value);
  }

  lookup(source: any): (target: any) => boolean {
    const value = this.value instanceof KeyDesc ? source[this.value.key] : _.clone((<ValueDesc>this.value).value);
    const key = this.key;
    return function (target: any) {
      return target[key] == value;
    }
  }

  for(source: any, keyMap: any = {}): any {
    const value = this.value instanceof KeyDesc ? source[this.value.key] : _.clone((<ValueDesc>this.value).value);
    const key = _.get(keyMap, this.key, this.key);
    let c: any = {};
    c[key] = value;
    return c;
  }

}

export function Eq(key: string, value: Selector) {
  return new EqDesc(key, value);
}
