import {Selector} from "./Selector";
import {CondDesc} from "./CondDesc";


export class OpDesc extends CondDesc {

  readonly type: string = 'op';

  key: string;

  value: Selector;

  constructor(key: string, value: Selector) {
    super();
    this.key = key;
    this.value = value;
  }

  isOp(){
    return true;
  }

  isGroup(){
    return false;
  }


}
