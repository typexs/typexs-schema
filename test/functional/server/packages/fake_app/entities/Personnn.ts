import {Entity} from '../../../../../../src/libs/decorators/Entity';
import {Property} from '../../../../../../src/libs/decorators/Property';
import {Required} from '@allgemein/schema-api';

@Entity()
export class Personnn {

  @Property({type: 'number', auto: true})
  id: number;

  @Required()
  @Property({type: 'string'})
  firstName: string;

  @Property({type: 'string'})
  lastName: string;

  label() {
    return this.lastName + ', ' + this.firstName;
  }
}
