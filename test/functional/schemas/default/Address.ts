import {Schema} from '../../../../src/libs/decorators/Schema';
import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';


@Entity()
export class Address {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  street: string;

  @Property({type: 'string'})
  postalcode: string;

}
