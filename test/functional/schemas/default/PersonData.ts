import {Entity, Property} from "../../../../src";
import {Address} from "./Address";

@Entity()
export class PersonData {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  lastName:string;

  @Property({type: Address})
  address:Address;

}
