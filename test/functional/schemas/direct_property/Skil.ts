
import {Entity, Property,Schema} from "../../../../src";

@Schema({name:'direct_property'})
@Entity()
export class Skil {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  label: string;

  @Property({type: 'number'})
  quality: number;

}
