import * as _ from "lodash";


import {Selector} from "./Selector";
import {ValueDesc} from "./ValueDesc";
import {KeyDesc} from "./KeyDesc";
import {OpDesc} from "./OpDesc";



export class LeDesc extends OpDesc {
  readonly type:string = 'le';
  constructor(key: string, value: Selector) {
    super(key, value);
  }

  lookup(source: any): (target: any) => boolean {
    const value = this.value instanceof KeyDesc ? source[this.value.key] : _.clone((<ValueDesc>this.value).value);
    const key = this.key;
    return function (target: any) {
      return target[key] <= value;
    }
  }
}

export function Le(key: string, value: Selector) {
  return new LeDesc(key, value);
}
