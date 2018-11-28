import {Entity, Property} from "../../../../src";
import {PersonData} from "./PersonData";

@Entity()
export class Training {
  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  type: string;

  @Property({type: PersonData})
  trainer: PersonData;

}
