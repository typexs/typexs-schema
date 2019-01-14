
import {Property, Schema} from "../../../../src";

@Schema({name:'conditions'})
export class CondObjectContent {

  @Property({type: 'number',id:true})
  somenr: number;

  @Property({type: 'number',id:true})
  subnr: number;

  @Property({type: 'string'})
  nickname: string;


}
