import {IsDefined} from 'class-validator';
import {Entity, Property} from "../../../../../../src";

@Entity()
export class Personnn {

  @Property({type: 'number',  auto: true})
  id: number;

  @IsDefined()
  @Property({type: 'string'})
  firstName: string;

  @Property({type: 'string'})
  lastName: string;

  label(){
    return this.lastName + ', ' + this.firstName;
  }
}
