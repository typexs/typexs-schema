import {IDesc} from "./IDesc";
import {KeyDesc} from "./KeyDesc";

export class OrderDesc implements IDesc {
  readonly type:string = 'order';
  readonly key: KeyDesc;
  readonly asc: boolean;

  constructor(key: KeyDesc, direction: boolean = true) {
    this.key = key
    this.asc = direction;
  }
}

/**
 * Asc
 */
export function Asc(k: KeyDesc) {
  return new OrderDesc(k, true)
}

/**
 * Asc
 */
export function Desc(k: KeyDesc) {
  return new OrderDesc(k, false)
}
