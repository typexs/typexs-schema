import {Property, Schema} from "../../../../src";
import {Language} from "./Language";

@Schema({name: 'complex_entity'})
export class Job{

  @Property({type: 'string'})
  position:string;

  @Property({targetClass: Language, cardinality: 0})
  languages: Language[]

}
