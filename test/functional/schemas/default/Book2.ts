import {Author} from './Author';
import {Entity, Property} from '../../../../src';

@Entity()
export class Book2 {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string'})
  content: string;

  @Property({targetClass: Author, cardinality: 0})
  authors: Author[];

}
