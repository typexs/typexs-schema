import * as _ from 'lodash';
import {Selector} from "./Selector";

import {ExprDesc} from "./ExprDesc";
import {KeyDesc} from "./KeyDesc";


export class OpDesc extends ExprDesc {

  readonly type: string = 'op';

  _key: string | KeyDesc;

  value: Selector;

  constructor(key: string | KeyDesc, value: Selector) {
    super();
    this._key = key;
    this.value = value;
  }

  get key(){
    return _.isString(this._key) ? this._key : this._key.key;
  }

  isOp(){
    return true;
  }

  isGroup(){
    return false;
  }


}
