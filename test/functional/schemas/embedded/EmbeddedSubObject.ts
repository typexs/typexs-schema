import {Property, Schema} from "../../../../src";


@Schema({name: 'embedded'})
export class EmbeddedSubObject {


  @Property({type: 'string'})
  subName: string;

  @Property({type: 'number'})
  SubOtherVar: number;

}
