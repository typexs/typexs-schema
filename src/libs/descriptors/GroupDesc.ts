import {ExprDesc} from "./ExprDesc";

export class GroupDesc extends ExprDesc {

  readonly type:string = 'group';

  values: ExprDesc[] = [];

  id?:number;

  constructor(...values: ExprDesc[]) {
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
