import * as _ from "lodash";


import {Selector} from "./Selector";
import {ValueDesc} from "./ValueDesc";
import {KeyDesc} from "./KeyDesc";
import {OpDesc} from "./OpDesc";


export class LtDesc extends OpDesc {
  readonly type: string = 'lt';

  constructor(key: string | KeyDesc, value: Selector) {
    super(key, value);
  }

  lookup(source: any): (target: any) => boolean {
    const value = this.value instanceof KeyDesc ? source[this.value.key] : _.clone((<ValueDesc>this.value).value);
    const key = this.key;
    return function (target: any) {
      return target[key] < value;
    }
  }
}

export function Lt(key: string | KeyDesc, value: Selector) {
  return new LtDesc(key, value);
}
