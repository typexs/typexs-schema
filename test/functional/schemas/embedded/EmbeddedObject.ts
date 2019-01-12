import {Entity, Property, Schema} from "../../../../src";
import {EmbeddedSubObject} from "./EmbeddedSubObject";


@Schema({name: 'embedded'})
export class EmbeddedObject {

  @Property({type:'string'})
  innerName:string;

  @Property({type:EmbeddedSubObject})
  inner: EmbeddedSubObject;

}
