import {CondDesc} from "./CondDesc";

export class GroupDesc extends CondDesc {

  readonly type:string = 'group';

  values: CondDesc[] = [];

  id?:number;

  constructor(...values: CondDesc[]) {
    super();
    this.values = values;
  }


  isOp(){
    return false;
  }

  isGroup(){
    return true;
  }

}
