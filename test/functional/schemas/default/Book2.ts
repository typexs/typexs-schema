import {Author} from './Author';
import {Property} from '../../../../src/libs/decorators/Property';
import {Entity} from '../../../../src/libs/decorators/Entity';


@Entity()
export class Book2 {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  content: string;

  @Property({type: Author, cardinality: 0})
  authors: Author[];

}
