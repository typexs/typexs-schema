import {Entity, Property} from "../../../../src";
import {EDR_Object_DR} from "./EDR_Object_DR";

@Entity({name: 'level_one'})
export class EDR {


  @Property({type: 'number', auto: true})
  id: number;


  @Property({type: EDR_Object_DR, embed: true})
  object: EDR_Object_DR;

}
