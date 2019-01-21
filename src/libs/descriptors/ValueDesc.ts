import {Selector} from "./Selector";

export class ValueDesc extends Selector {
  readonly type:string = 'value';
  readonly value: string | number;

  constructor(value: string | number) {
    super();
    this.value = value;
  }

  toJson(){
    return this.value;
  }

}


/**
 * Value
 *
 */
export function Value(v: string | number) {
  return new ValueDesc(v);
}

