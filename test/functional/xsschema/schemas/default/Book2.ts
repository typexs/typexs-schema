import {Entity} from '../../../../../src/libs/xsschema/decorators/Entity';
import {Property} from '../../../../../src/libs/xsschema/decorators/Property';
import {Author} from './Author';

@Entity()
export class Book2 {

  @Property({type: 'number', auto:true})
  id: number;

  @Property({type: 'string'})
  content: string;

  @Property({targetClass: Author,cardinality:0})
  authors: Author[];

}
