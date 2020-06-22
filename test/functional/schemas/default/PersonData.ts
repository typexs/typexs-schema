import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';
import {Address} from './Address';

@Entity()
export class PersonData {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  lastName:string;

  @Property({type: Address})
  address:Address;

}
