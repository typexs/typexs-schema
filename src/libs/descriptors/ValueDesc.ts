import {Selector} from "./Selector";

export class ValueDesc extends Selector {
  readonly type:string = 'value';
  readonly value: string;

  constructor(value: string) {
    super();
    this.value = value;
  }
}


/**
 * Value
 *
 */
export function Value(v: string) {
  return new ValueDesc(v);
}

