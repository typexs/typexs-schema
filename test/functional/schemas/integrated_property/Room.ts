
import {Entity, Property,Schema} from "../../../../src";

@Schema({name:'integrated_property'})
@Entity()
export class Room {

  @Property({type: 'number', auto: true})
  id: number;

}
