import {Entity, Property} from "../../../../src";
import {Literatur} from "./Literatur";

@Entity()
export class Course2 {

  @Property({type: 'number', auto: true})
  id: number;

  
  @Property({type: Literatur, embed: true})
  literatur: Literatur;

}
