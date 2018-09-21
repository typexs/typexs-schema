import {Skil} from './Skil';
import {Property, Schema} from "../../../../src";

@Schema({name:'direct_property'})
export class Driver {

  @Property({type: 'number'})
  age: number;

  @Property({type: 'string'})
  nickName: string;

  @Property({targetClass: Skil})
  skill: Skil;


}
