import * as _ from "lodash";

import {Selector} from "./Selector";
import {KeyDesc} from "./KeyDesc";
import {ValueDesc} from "./ValueDesc";
import {OpDesc} from "./OpDesc";




export class GeDesc extends OpDesc {
  readonly type:string = 'ge';
  constructor(key: string, value: Selector) {
    super(key, value);
  }

  lookup(source: any): (target: any) => boolean {
    const value = this.value instanceof KeyDesc ? source[this.value.key] : _.clone((<ValueDesc>this.value).value);
    const key = this.key;
    return function (target: any) {
      return target[key] >= value;
    }
  }
}





export function Ge(key: string, value: Selector) {
  return new GeDesc(key, value);
}

