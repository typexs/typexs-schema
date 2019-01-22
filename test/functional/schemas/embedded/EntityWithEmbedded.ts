import {Entity, Property, Schema} from "../../../../src";
import {EmbeddedObject} from "./EmbeddedObject";


@Schema({name: 'embedded'})
@Entity()
export class EntityWithEmbedded {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type:EmbeddedObject})
  obj: EmbeddedObject;

}
