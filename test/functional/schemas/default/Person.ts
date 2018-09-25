



import {Entity, Property} from "../../../../src";

@Entity()
export class Periode {

  @Property({type: 'number', auto: true})
  id: number;


}
