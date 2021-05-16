import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';

@Entity()
export class Author {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  firstName: string;

  @Property({type: 'string'})
  lastName: string;

}
