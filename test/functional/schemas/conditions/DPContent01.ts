
import {Property, Schema} from "../../../../src";

@Schema({name:'conditions'})
export class DPContent01 {

  @Property({type: 'number',id:true})
  somenr: number;

  @Property({type: 'number',id:true})
  subnr: number;

  @Property({type: 'string'})
  nickname: string;


}
