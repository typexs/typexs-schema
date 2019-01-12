import {And, Asc, Entity, Eq, From, Join, Key, Property, Schema, To, Value} from "../../../../src";


@Schema({name: 'embedded'})
export class EmbeddedSubObject {


  @Property({type: 'string'})
  subName: string;

  @Property({type: 'number'})
  SubOtherVar: number;

}
