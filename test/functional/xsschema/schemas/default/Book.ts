import {Entity} from '../../../../../src/libs/xsschema/decorators/Entity';
import {Property} from '../../../../../src/libs/xsschema/decorators/Property';
import {Author} from './Author';

@Entity()
export class Book {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', nullable: true})
  label: string;

  @Property({type: 'string', nullable: true})
  content: string;

  @Property({targetClass: Author, nullable: true})
  author: Author;

}
