
import {IsDefined} from 'class-validator';
import {Entity, Property} from "../../../../../../src";

@Entity()
export class Personnn {

  @Property({type: 'number', form: 'readonly', auto: true})
  id: number;

  @IsDefined()
  @Property({type: 'string', form: 'text'})
  firstName: string;

  @Property({type: 'string', form: 'text'})
  lastName: string;

  label(){
    return this.lastName + ', ' + this.firstName;
  }
}
