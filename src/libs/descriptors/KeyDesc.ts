import {Selector} from "./Selector";


export class KeyDesc extends Selector {
  readonly type: string = 'key';
  readonly key: string;

  constructor(key: string) {
    super();
    this.key = key
  }

  toJson() {
    return {$key: this.key};
  }

}

/**
 * Key
 */
export function Key(k: string) {
  return new KeyDesc(k);
}
