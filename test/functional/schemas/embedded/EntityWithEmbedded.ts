import {And, Asc, Entity, Eq, From, Join, Key, Property, Schema, To, Value} from "../../../../src";
import {EmbeddedObject} from "./EmbeddedObject";


@Schema({name: 'embedded'})
@Entity()
export class EntityWithEmbedded {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type:EmbeddedObject})
  obj: EmbeddedObject;

}
